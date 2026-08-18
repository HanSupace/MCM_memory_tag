import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { getUserBySessionToken, SESSION_COOKIE_NAME } from "../../../../lib/auth";
import { getDb } from "../../../../lib/db";
import {
  artworks as seedArtworks,
  exhibitions as seedExhibitions,
  getDocentQuestionPresets,
} from "../../../../db/seeds";

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
    "옆에서 함께 작품을 보며 설명해주는 도슨트처럼, 자연스러운 대화체 한국어로 답변하세요.",
    "정보를 딱딱하게 나열하지 말고 2~4문장 정도의 자연스러운 흐름으로 풀어서 설명하세요.",
    "아래 작품 정보와 공식 근거 자료만을 근거로 답변하세요.",
    "질문과 정확히 일치하는 세부 정보가 없더라도 '확인된 자료가 없습니다' 같은 상투적인 문장으로 끝내지 마세요.",
    "대신 아래 근거에서 질문과 가장 가까운 작품의 의미, 재료, 감상 포인트나 전시 맥락을 골라 도움이 되도록 설명하세요.",
    "근거에 없는 인물, 수치, 연도, 제작 기법이나 사건은 지어내지 마세요.",
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
  const seedExhibition = seedExhibitions.find((exhibition) => exhibition.id === seedArtwork.exhibitionId);
  const recommendedQuestions = getDocentQuestionPresets(seedArtwork.id, seedArtwork.title).slice(0, 3);

  const sourceBody = [
    "[작품 기본 정보]",
    `작품명: ${seedArtwork.title}`,
    `작가·디자이너: ${seedArtwork.artistName}`,
    seedArtwork.collaborator ? `협업: ${seedArtwork.collaborator}` : null,
    seedArtwork.series ? `시리즈: ${seedArtwork.series}` : null,
    `작품 유형: ${seedArtwork.type}`,
    seedArtwork.form ? `형태: ${seedArtwork.form}` : null,
    seedArtwork.material ? `재료: ${seedArtwork.material}` : null,
    `전시 위치: ${seedArtwork.location}`,
    `핵심 요약: ${seedArtwork.summary}`,
    "[작품 해설]",
    seedArtwork.summary,
    seedArtwork.description,
    seedArtwork.titleMeaning,
    seedArtwork.interpretation,
    "[감상 포인트]",
    ...seedArtwork.viewingTips,
    "[확인된 사실과 비하인드]",
    ...seedArtwork.facts,
    ...seedArtwork.tmi,
    seedArtwork.contents?.length ? `[구성 요소]\n${seedArtwork.contents.join("\n")}` : null,
    `[핵심 키워드]\n${seedArtwork.keywords.join(", ")}`,
    seedExhibition ? "[전시 전체 맥락]" : null,
    seedExhibition ? `전시명: ${seedExhibition.title}` : null,
    seedExhibition ? `전시 주제: ${seedExhibition.theme}` : null,
    seedExhibition ? `전시 요약: ${seedExhibition.summary}` : null,
    seedExhibition ? `전시 설명: ${seedExhibition.description}` : null,
    seedExhibition ? `전시 성격: ${seedExhibition.nature}` : null,
    seedExhibition ? `전시 핵심 메시지: ${seedExhibition.keyMessage}` : null,
    seedExhibition?.featuredQuote ? `대표 문장: ${seedExhibition.featuredQuote}` : null,
    seedExhibition ? `전시 방향:\n${seedExhibition.directionPrinciples.join("\n")}` : null,
    seedExhibition ? `공간 구성:\n${seedExhibition.floorMap.map((item) => `${item.floor}: ${item.description}`).join("\n")}` : null,
    "[화면에 제시되는 추천 질문]",
    ...recommendedQuestions.map((item) => `${item.category}: ${item.question}`),
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
      model: process.env.OPENAI_MODEL || "gpt-5.6-terra",
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
