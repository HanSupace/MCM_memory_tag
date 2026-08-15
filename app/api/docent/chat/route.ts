import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { getUserBySessionToken, SESSION_COOKIE_NAME } from "../../../../lib/auth";
import { getDb } from "../../../../lib/db";
import { artworks as seedArtworks } from "../../../../db/seeds";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const HISTORY_LIMIT = 10;

type ArtworkRow = {
  title: string;
  artist_name: string | null;
  production_year: string | null;
  material: string | null;
  description: string | null;
  appreciation_points: string | null;
};

type SourceRow = {
  source_type: string;
  source_info: string | null;
  body: string;
};

type ConversationRow = {
  role: string;
  content: string;
  created_at: string;
};

async function getAuthenticatedUser(request: NextRequest) {
  const sessionToken = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  return sessionToken ? getUserBySessionToken(sessionToken) : null;
}

function buildSystemPrompt(artwork: ArtworkRow, sources: SourceRow[]) {
  const sourceText = sources.length
    ? sources.map((source, index) => `[근거 ${index + 1} · ${source.source_type}] ${source.body}`).join("\n\n")
    : "등록된 공식 근거 자료가 없습니다.";

  return [
    "당신은 미술관 전시의 AI 도슨트입니다. 방문 고객이 지금 보고 있는 작품에 대해 질문합니다.",
    "아래 작품 정보와 공식 근거 자료만을 근거로 한국어로 답변하세요.",
    "근거 자료에 없는 내용은 추측하지 말고 '확인할 수 없습니다'라고 명확히 안내하세요.",
    "일반적인 미술 상담이나 근거 자료 범위를 벗어난 질문에는 답하지 마세요.",
    "",
    `작품명: ${artwork.title}`,
    `작가: ${artwork.artist_name ?? "작가 미상"}`,
    artwork.production_year ? `제작 연도: ${artwork.production_year}` : null,
    artwork.material ? `재료: ${artwork.material}` : null,
    artwork.description ? `기본 설명: ${artwork.description}` : null,
    artwork.appreciation_points ? `감상 포인트: ${artwork.appreciation_points}` : null,
    "",
    "공식 근거 자료:",
    sourceText,
  ]
    .filter((line) => line !== null)
    .join("\n");
}

function loadSeedArtworkContext(exhibitionArtworkId: string) {
  const seedArtwork = seedArtworks.find((artwork) => artwork.id === exhibitionArtworkId);
  if (!seedArtwork) return null;

  const sourceBody = [
    seedArtwork.summary,
    seedArtwork.description,
    seedArtwork.titleMeaning,
    seedArtwork.interpretation,
    ...seedArtwork.viewingTips,
    ...seedArtwork.facts,
    ...seedArtwork.tmi,
  ]
    .filter((value): value is string => Boolean(value))
    .join("\n");

  return {
    artwork: {
      title: seedArtwork.title,
      artist_name: seedArtwork.artistName,
      production_year: null,
      material: seedArtwork.material ?? seedArtwork.type,
      description: seedArtwork.description,
      appreciation_points: [seedArtwork.interpretation, ...seedArtwork.viewingTips].join("\n"),
    },
    sources: [{
      source_type: "official_seed",
      source_info: `${seedArtwork.source.label} (${seedArtwork.source.url})`,
      body: sourceBody,
    }],
    persistentExhibitionArtworkId: null,
  };
}

async function loadArtworkContext(exhibitionArtworkId: string) {
  const seedContext = loadSeedArtworkContext(exhibitionArtworkId);
  if (seedContext) return seedContext;
  if (!/^\d+$/.test(exhibitionArtworkId)) return null;

  const db = getDb();

  const artworkResult = await db.query<ArtworkRow & { artwork_id: string }>(
    `SELECT a.id::text AS artwork_id, a.title, ar.name AS artist_name, a.production_year, a.material,
            COALESCE(ea.exhibition_description, a.base_description) AS description,
            a.appreciation_points
     FROM exhibition_artworks ea
     JOIN artworks a ON a.id = ea.artwork_id
     LEFT JOIN artists ar ON ar.id = a.artist_id
     WHERE ea.id = $1 AND ea.published = true`,
    [exhibitionArtworkId],
  );
  const artwork = artworkResult.rows[0];
  if (!artwork) return null;

  const sourcesResult = await db.query<SourceRow>(
    `SELECT source_type, source_info, body
     FROM docent_sources
     WHERE artwork_id = $1 AND published = true AND review_status = 'approved'
     ORDER BY created_at`,
    [artwork.artwork_id],
  );

  return { artwork, sources: sourcesResult.rows, persistentExhibitionArtworkId: exhibitionArtworkId };
}

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
    }

    const exhibitionArtworkId = request.nextUrl.searchParams.get("exhibitionArtworkId");
    if (!exhibitionArtworkId || (!/^\d+$/.test(exhibitionArtworkId) && !loadSeedArtworkContext(exhibitionArtworkId))) {
      return NextResponse.json({ error: "작품 정보가 올바르지 않습니다." }, { status: 400 });
    }

    if (loadSeedArtworkContext(exhibitionArtworkId)) {
      return NextResponse.json({ messages: [] }, { headers: { "Cache-Control": "no-store" } });
    }

    const result = await getDb().query<ConversationRow>(
      `SELECT role, content, created_at
       FROM docent_conversations
       WHERE user_id = $1 AND exhibition_artwork_id = $2
       ORDER BY created_at`,
      [user.id, exhibitionArtworkId],
    );

    return NextResponse.json(
      {
        messages: result.rows.map((row) => ({
          role: row.role,
          content: row.content,
          createdAt: row.created_at,
        })),
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("도슨트 대화 기록 조회 실패", error);
    return NextResponse.json({ error: "대화 기록을 불러오지 못했습니다." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
    }

    const body = (await request.json()) as {
      exhibitionArtworkId?: unknown;
      question?: unknown;
      sharePersonalization?: unknown;
    };
    const exhibitionArtworkId = typeof body.exhibitionArtworkId === "string" ? body.exhibitionArtworkId : null;
    const question = typeof body.question === "string" ? body.question.trim() : "";
    const sharePersonalization = body.sharePersonalization === true;

    if (!exhibitionArtworkId || (!/^\d+$/.test(exhibitionArtworkId) && !loadSeedArtworkContext(exhibitionArtworkId))) {
      return NextResponse.json({ error: "작품 정보가 올바르지 않습니다." }, { status: 400 });
    }
    if (!question) {
      return NextResponse.json({ error: "질문을 입력해 주세요." }, { status: 400 });
    }

    const context = await loadArtworkContext(exhibitionArtworkId);
    if (!context) {
      return NextResponse.json({ error: "작품을 찾을 수 없습니다." }, { status: 404 });
    }

    const db = getDb();
    const history = context.persistentExhibitionArtworkId
      ? (await db.query<ConversationRow>(
          `SELECT role, content, created_at
           FROM docent_conversations
           WHERE user_id = $1 AND exhibition_artwork_id = $2
           ORDER BY created_at DESC
           LIMIT $3`,
          [user.id, context.persistentExhibitionArtworkId, HISTORY_LIMIT],
        )).rows.reverse()
      : [];

    if (!process.env.OPEN_API) {
      return NextResponse.json({ error: "AI 도슨트 설정이 완료되지 않았습니다." }, { status: 500 });
    }

    const openai = new OpenAI({ apiKey: process.env.OPEN_API });
    const completion = await openai.responses.create({
      model: process.env.OPENAI_MODEL || "gpt-5-mini",
      instructions: buildSystemPrompt(context.artwork, context.sources),
      input: [
        ...history.map((message) => ({
          role: message.role === "assistant" ? ("assistant" as const) : ("user" as const),
          content: message.content,
        })),
        { role: "user", content: question },
      ],
    });
    const answer = completion.output_text.trim();
    if (!answer) {
      return NextResponse.json({ error: "AI 도슨트 응답을 받지 못했습니다." }, { status: 502 });
    }

    if (context.persistentExhibitionArtworkId) {
      await db.query(
        `INSERT INTO docent_conversations (user_id, exhibition_artwork_id, role, content, share_personalization)
         VALUES ($1, $2, 'user', $3, $4), ($1, $2, 'assistant', $5, $4)`,
        [user.id, context.persistentExhibitionArtworkId, question, sharePersonalization, answer],
      );
    }

    return NextResponse.json({ answer, sharePersonalization });
  } catch (error) {
    console.error("도슨트 질의 처리 실패", error);
    return NextResponse.json({ error: "AI 도슨트 응답을 처리하지 못했습니다." }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
    }

    const exhibitionArtworkId = request.nextUrl.searchParams.get("exhibitionArtworkId");
    if (!exhibitionArtworkId || (!/^\d+$/.test(exhibitionArtworkId) && !loadSeedArtworkContext(exhibitionArtworkId))) {
      return NextResponse.json({ error: "작품 정보가 올바르지 않습니다." }, { status: 400 });
    }

    if (loadSeedArtworkContext(exhibitionArtworkId)) {
      return NextResponse.json({ ok: true });
    }

    await getDb().query("DELETE FROM docent_conversations WHERE user_id = $1 AND exhibition_artwork_id = $2", [
      user.id,
      exhibitionArtworkId,
    ]);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("도슨트 대화 기록 삭제 실패", error);
    return NextResponse.json({ error: "대화 기록을 삭제하지 못했습니다." }, { status: 500 });
  }
}
