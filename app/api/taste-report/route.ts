import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { getUserBySessionToken, SESSION_COOKIE_NAME } from "../../../lib/auth";
import { ensureGallerySchema, getDb } from "../../../lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type TasteReport = {
  exhibitionId?: string;
  title: string;
  summary: string;
  keywords: string[];
  evidence: string[];
  recommendations: string[];
  confidence: number;
  sourceCounts: { photos: number; artworks: number; notes: number; docentQuestions: number };
  generatedAt: string;
};

type ArtworkRow = { title: string; artist_name: string | null; material: string | null };
type NoteRow = { content: string; artwork_title: string };
type QuestionRow = { content: string; artwork_title: string };
type PhotoRow = { image_data: Buffer; mime_type: string | null; exhibition_title: string };

async function currentUser(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  return token ? getUserBySessionToken(token) : null;
}

async function hasPhotoAnalysisConsent(userId: string) {
  const result = await getDb().query<{ granted: boolean }>(
    "SELECT granted FROM consents WHERE user_id = $1 AND type = $2",
    [userId, "photo_analysis"],
  );
  return result.rows[0]?.granted === true;
}

function parseStoredReport(items: unknown): TasteReport | null {
  if (!items || typeof items !== "object" || Array.isArray(items)) return null;
  const candidate = items as Partial<TasteReport>;
  if (typeof candidate.title !== "string" || !Array.isArray(candidate.keywords)) return null;
  return candidate as TasteReport;
}

export async function GET(request: NextRequest) {
  const user = await currentUser(request);
  if (!user) return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });

  try {
    await ensureGallerySchema();
    const result = await getDb().query<{ items: unknown }>(
      "SELECT items FROM taste_profiles WHERE user_id = $1",
      [user.id],
    );
    const exhibitionId = request.nextUrl.searchParams.get("exhibitionId");
    const stored = parseStoredReport(result.rows[0]?.items ?? null);
    return NextResponse.json(
      { report: exhibitionId && stored?.exhibitionId !== exhibitionId ? null : stored },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("취향 리포트 조회 실패", error);
    return NextResponse.json({ error: "취향 리포트를 불러오지 못했습니다." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const user = await currentUser(request);
  if (!user) return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });

  try {
    await ensureGallerySchema();
    if (!process.env.OPEN_API) {
      return NextResponse.json({ error: "AI 취향 분석 설정이 완료되지 않았습니다." }, { status: 500 });
    }

    const inputBody = await request.json().catch(() => null) as { exhibitionId?: unknown } | null;
    const exhibitionId = typeof inputBody?.exhibitionId === "string" && /^\d+$/.test(inputBody.exhibitionId) ? inputBody.exhibitionId : null;
    const db = getDb();
    const [artworksResult, notesResult, questionsResult, photoConsent] = await Promise.all([
      db.query<ArtworkRow>(
        `SELECT a.title, ar.name AS artist_name, a.material
         FROM collections c
         JOIN exhibition_artworks ea ON ea.id = c.exhibition_artwork_id
         JOIN artworks a ON a.id = ea.artwork_id
         LEFT JOIN artists ar ON ar.id = a.artist_id
         WHERE c.user_id = $1 AND ($2::bigint IS NULL OR ea.exhibition_id = $2::bigint)
         ORDER BY c.collected_at DESC LIMIT 30`,
        [user.id, exhibitionId],
      ),
      db.query<NoteRow>(
        `SELECT n.content, a.title AS artwork_title
         FROM notes n
         JOIN exhibition_artworks ea ON ea.id = n.exhibition_artwork_id
         JOIN artworks a ON a.id = ea.artwork_id
         WHERE n.user_id = $1 AND ($2::bigint IS NULL OR ea.exhibition_id = $2::bigint)
         ORDER BY n.updated_at DESC LIMIT 30`,
        [user.id, exhibitionId],
      ),
      db.query<QuestionRow>(
        `SELECT dc.content, a.title AS artwork_title
         FROM docent_conversations dc
         JOIN exhibition_artworks ea ON ea.id = dc.exhibition_artwork_id
         JOIN artworks a ON a.id = ea.artwork_id
         WHERE dc.user_id = $1 AND ($2::bigint IS NULL OR ea.exhibition_id = $2::bigint)
           AND dc.role = 'user' AND dc.share_personalization = true
         ORDER BY dc.created_at DESC LIMIT 30`,
        [user.id, exhibitionId],
      ),
      hasPhotoAnalysisConsent(user.id),
    ]);

    const photos = photoConsent
      ? (await db.query<PhotoRow>(
          `SELECT gp.image_data, gp.mime_type, e.title AS exhibition_title
           FROM gallery_photos gp
           JOIN exhibitions e ON e.id = gp.exhibition_id
           WHERE gp.user_id = $1 AND ($2::bigint IS NULL OR gp.exhibition_id = $2::bigint) AND gp.image_data IS NOT NULL
           ORDER BY gp.created_at DESC LIMIT 4`,
          [user.id, exhibitionId],
        )).rows
      : [];

    const sourceCounts = {
      photos: photos.length,
      artworks: artworksResult.rows.length,
      notes: notesResult.rows.length,
      docentQuestions: questionsResult.rows.length,
    };
    const totalSources = Object.values(sourceCounts).reduce((sum, count) => sum + count, 0);
    if (totalSources === 0) {
      return NextResponse.json(
        { error: "사진, 수집 작품, 감상평 또는 개인화에 동의한 도슨트 질문을 먼저 남겨주세요." },
        { status: 422 },
      );
    }

    const content: Array<
      | { type: "input_text"; text: string }
      | { type: "input_image"; image_url: string; detail: "low" }
    > = [{
      type: "input_text",
      text: JSON.stringify({
        collectedArtworks: artworksResult.rows,
        notes: notesResult.rows,
        personalizationQuestions: questionsResult.rows,
        photoExhibitions: photos.map((photo) => photo.exhibition_title),
      }),
    }];
    for (const photo of photos) {
      const mimeType = photo.mime_type?.startsWith("image/") ? photo.mime_type : "image/jpeg";
      content.push({
        type: "input_image",
        image_url: `data:${mimeType};base64,${photo.image_data.toString("base64")}`,
        detail: "low",
      });
    }

    const model = process.env.OPENAI_TASTE_MODEL || process.env.OPENAI_MODEL || "gpt-5.6-terra";
    const response = await new OpenAI({ apiKey: process.env.OPEN_API }).responses.create({
      model,
      store: false,
      instructions: [
        "당신은 MCM 전시 관람 기록을 정리하는 미술·패션 취향 큐레이터입니다.",
        "반복되고 명확한 미적 신호를 우선하고 단일 기록만으로 사용자를 단정하지 마세요.",
        "사진에서는 색, 형태, 소재, 분위기처럼 관찰 가능한 요소만 분석하세요.",
        "성별, 인종, 건강, 종교, 정치 성향 등 민감한 특성을 추론하지 마세요.",
        "evidence에는 제공된 기록에서 직접 확인되는 근거만 짧은 한국어로 작성하세요.",
        "keywords는 영문 대문자로 작성하고 전체 리포트는 따뜻하고 간결한 한국어로 작성하세요.",
      ].join("\n"),
      input: [{ role: "user", content }],
      text: {
        format: {
          type: "json_schema",
          name: "mcm_taste_report",
          strict: true,
          schema: {
            type: "object",
            additionalProperties: false,
            required: ["title", "summary", "keywords", "evidence", "recommendations", "confidence"],
            properties: {
              title: { type: "string" },
              summary: { type: "string" },
              keywords: { type: "array", minItems: 3, maxItems: 5, items: { type: "string" } },
              evidence: { type: "array", minItems: 1, maxItems: 4, items: { type: "string" } },
              recommendations: { type: "array", minItems: 2, maxItems: 4, items: { type: "string" } },
              confidence: { type: "number", minimum: 0, maximum: 1 },
            },
          },
        },
      },
    });

    const generated = JSON.parse(response.output_text) as Omit<TasteReport, "sourceCounts" | "generatedAt">;
    const report: TasteReport = {
      ...generated,
      ...(exhibitionId ? { exhibitionId } : {}),
      confidence: Math.max(0, Math.min(1, generated.confidence)),
      sourceCounts,
      generatedAt: new Date().toISOString(),
    };
    await db.query(
      `INSERT INTO taste_profiles (user_id, items, updated_at)
       VALUES ($1, $2::jsonb, NOW())
       ON CONFLICT (user_id) DO UPDATE SET items = EXCLUDED.items, updated_at = NOW()`,
      [user.id, JSON.stringify(report)],
    );

    return NextResponse.json({ report }, { status: 201 });
  } catch (error) {
    console.error("AI 취향 리포트 생성 실패", error);
    return NextResponse.json({ error: "AI 취향 리포트를 만들지 못했습니다." }, { status: 500 });
  }
}
