import { NextRequest, NextResponse } from "next/server";
import OpenAI, { toFile } from "openai";
import { readFile } from "node:fs/promises";
import { basename, extname, resolve } from "node:path";
import { getUserBySessionToken, SESSION_COOKIE_NAME } from "../../../lib/auth";
import { getDb } from "../../../lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ContentType = "summary" | "stickers" | "invitation";
type TimelineExhibitionRow = {
  id: string; title: string; venue: string; hero_image_url: string | null; reference_at: string; reference_type: "visit" | "collection";
};
type StoredContentRow = { exhibition_id: string; content_type: ContentType; generated_content: unknown };
type VisitRow = {
  exhibition_id: string;
  title: string;
  description: string | null;
  venue: string;
  visited_at: string;
};
type ArtworkRow = {
  title: string;
  artist_name: string | null;
  material: string | null;
  image_url: string | null;
  exhibition_title: string;
  collected_at: string;
};
type NoteRow = { content: string; artwork_title: string; exhibition_title: string };
type QuestionRow = { content: string; artwork_title: string };
type ExhibitionRow = {
  title: string;
  description: string | null;
  venue: string;
  start_at: string;
  end_at: string;
};

async function currentUser(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  return token ? getUserBySessionToken(token) : null;
}

function isContentType(value: unknown): value is ContentType {
  return value === "summary" || value === "stickers" || value === "invitation";
}

export async function GET(request: NextRequest) {
  const user = await currentUser(request);
  if (!user) return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  try {
    const [result, storedResult] = await Promise.all([
      getDb().query<TimelineExhibitionRow>(
        `SELECT e.id::text, e.title, e.venue, e.hero_image_url,
              COALESCE(MIN(v.visited_at), MIN(c.collected_at))::text AS reference_at,
              CASE WHEN MIN(v.visited_at) IS NOT NULL THEN 'visit' ELSE 'collection' END AS reference_type
       FROM exhibitions e
       LEFT JOIN visits v ON v.exhibition_id = e.id AND v.user_id = $1
       LEFT JOIN exhibition_artworks ea ON ea.exhibition_id = e.id
       LEFT JOIN collections c ON c.exhibition_artwork_id = ea.id AND c.user_id = $1
       WHERE v.id IS NOT NULL OR c.id IS NOT NULL
       GROUP BY e.id, e.title, e.venue, e.hero_image_url
       ORDER BY COALESCE(MIN(v.visited_at), MIN(c.collected_at)) DESC`,
        [user.id],
      ),
      getDb().query<StoredContentRow>(
        `SELECT exhibition_id::text, content_type, generated_content
         FROM content_unlocks
         WHERE user_id = $1 AND generated_content IS NOT NULL`,
        [user.id],
      ),
    ]);
    const savedContent: Record<string, Record<string, unknown>> = {};
    for (const row of storedResult.rows) {
      const key = row.content_type === "stickers" ? "sticker" : row.content_type;
      savedContent[row.exhibition_id] = { ...savedContent[row.exhibition_id], [key]: row.generated_content };
    }
    return NextResponse.json({ exhibitions: result.rows, savedContent }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("시간차 콘텐츠 전시 목록 조회 실패", error);
    return NextResponse.json({ error: "기록이 있는 전시를 불러오지 못했습니다." }, { status: 500 });
  }
}

async function saveGeneratedContent(userId: string, exhibitionId: string, contentType: ContentType, content: unknown) {
  await getDb().query(
    `INSERT INTO content_unlocks
       (user_id, exhibition_id, content_type, unlock_at, viewed_at, generated_content, generated_at)
     VALUES ($1, $2, $3, NOW(), NOW(), $4::jsonb, NOW())
     ON CONFLICT (user_id, exhibition_id, content_type)
     DO UPDATE SET generated_content = EXCLUDED.generated_content,
                   generated_at = EXCLUDED.generated_at,
                   viewed_at = EXCLUDED.viewed_at`,
    [userId, exhibitionId, contentType, JSON.stringify(content)],
  );
}

const commonInstructions = [
  "당신은 MCM Memory Tag의 전시 관람 기록 큐레이터입니다.",
  "제공된 로그인 사용자의 실제 DB 기록만 근거로 사용하고 없는 사실은 만들지 마세요.",
  "성별, 인종, 건강, 종교, 정치 성향 등 민감한 특성을 추론하지 마세요.",
  "결과는 따뜻하고 간결한 한국어로 작성하세요.",
].join("\n");

async function artworkReferenceFiles(artworks: ArtworkRow[]) {
  const publicRoot = resolve(process.cwd(), "public");
  const files = [];
  for (const artwork of artworks.slice(0, 4)) {
    if (!artwork.image_url?.startsWith("/artworks/")) continue;
    const filePath = resolve(publicRoot, `.${artwork.image_url}`);
    if (!filePath.startsWith(`${publicRoot}/`)) continue;
    try {
      const extension = extname(filePath).toLowerCase();
      const mimeType = extension === ".jpg" || extension === ".jpeg" ? "image/jpeg" : extension === ".webp" ? "image/webp" : "image/png";
      files.push(await toFile(await readFile(filePath), basename(filePath), { type: mimeType }));
    } catch {
      // 이미지가 없으면 작품의 제목·소재·설명만으로 팔레트를 구성합니다.
    }
  }
  return files;
}

export async function POST(request: NextRequest) {
  const user = await currentUser(request);
  if (!user) return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });

  try {
    const body = await request.json().catch(() => null) as { type?: unknown; exhibitionId?: unknown } | null;
    if (!isContentType(body?.type)) {
      return NextResponse.json({ error: "지원하지 않는 콘텐츠입니다." }, { status: 400 });
    }
    if (!process.env.OPEN_API) {
      return NextResponse.json({ error: "AI 콘텐츠 생성 설정이 완료되지 않았습니다." }, { status: 500 });
    }
    const exhibitionId = typeof body?.exhibitionId === "string" && /^\d+$/.test(body.exhibitionId) ? body.exhibitionId : null;
    if (!exhibitionId) return NextResponse.json({ error: "전시회를 먼저 선택해 주세요." }, { status: 400 });

    const db = getDb();
    const [visitsResult, artworksResult, notesResult, questionsResult] = await Promise.all([
      db.query<VisitRow>(
        `SELECT e.id::text AS exhibition_id, e.title, e.description, e.venue, v.visited_at::text
         FROM visits v JOIN exhibitions e ON e.id = v.exhibition_id
         WHERE v.user_id = $1 AND e.id = $2 ORDER BY v.visited_at DESC LIMIT 1`,
        [user.id, exhibitionId],
      ),
      db.query<ArtworkRow>(
        `SELECT a.title, ar.name AS artist_name, a.material, a.image_url, e.title AS exhibition_title,
                c.collected_at::text
         FROM collections c
         JOIN exhibition_artworks ea ON ea.id = c.exhibition_artwork_id
         JOIN artworks a ON a.id = ea.artwork_id
         LEFT JOIN artists ar ON ar.id = a.artist_id
         JOIN exhibitions e ON e.id = ea.exhibition_id
         WHERE c.user_id = $1 AND e.id = $2 ORDER BY c.collected_at DESC LIMIT 40`,
        [user.id, exhibitionId],
      ),
      db.query<NoteRow>(
        `SELECT n.content, a.title AS artwork_title, e.title AS exhibition_title
         FROM notes n
         JOIN exhibition_artworks ea ON ea.id = n.exhibition_artwork_id
         JOIN artworks a ON a.id = ea.artwork_id
         JOIN exhibitions e ON e.id = ea.exhibition_id
         WHERE n.user_id = $1 AND e.id = $2 ORDER BY n.updated_at DESC LIMIT 40`,
        [user.id, exhibitionId],
      ),
      db.query<QuestionRow>(
        `SELECT dc.content, a.title AS artwork_title
         FROM docent_conversations dc
         JOIN exhibition_artworks ea ON ea.id = dc.exhibition_artwork_id
         JOIN artworks a ON a.id = ea.artwork_id
         WHERE dc.user_id = $1 AND ea.exhibition_id = $2 AND dc.role = 'user' AND dc.share_personalization = true
         ORDER BY dc.created_at DESC LIMIT 30`,
        [user.id, exhibitionId],
      ),
    ]);

    if (visitsResult.rows.length + artworksResult.rows.length + notesResult.rows.length + questionsResult.rows.length === 0) {
      return NextResponse.json(
        { error: "이 계정에 관람 기록이 아직 없습니다. 전시 방문 인증이나 작품 수집, 감상을 먼저 남겨주세요." },
        { status: 422 },
      );
    }

    const latestVisit = visitsResult.rows[0] ?? null;
    const context = {
      account: { displayName: user.displayName || user.username },
      visits: visitsResult.rows,
      collectedArtworks: artworksResult.rows,
      notes: notesResult.rows,
      sharedDocentQuestions: questionsResult.rows,
    };
    const client = new OpenAI({ apiKey: process.env.OPEN_API, timeout: 60_000, maxRetries: 1 });
    const model = process.env.OPENAI_CONTENT_MODEL || process.env.OPENAI_MODEL || "gpt-5.6-terra";

    if (body.type === "summary") {
      const response = await client.responses.create({
        model,
        store: false,
        reasoning: { effort: "low" },
        max_output_tokens: 1200,
        instructions: [
          commonInstructions,
          "전시 회고 매거진의 짧은 카피처럼 작성하세요. DB 로그나 타임스탬프를 그대로 나열하지 마세요.",
          "headline은 감각적인 한 문장, narrative는 최대 3문장으로 작성하세요.",
          "moodKeywords는 2~6자의 한국어 명사 3~4개로 작성하세요.",
          "artworkMoments는 실제 수집 작품 중 관람 경험을 가장 잘 보여주는 대표 작품을 최대 2개만 선택하고, reaction에는 사용자가 남긴 감상이 있으면 그대로 짧게 인용하세요.",
          "commonThread는 작품 사이에서 실제로 확인되는 공통점을, docentMessage는 따뜻한 도슨트 한마디를 작성하세요.",
        ].join("\n"),
        input: JSON.stringify(context),
        text: { format: { type: "json_schema", name: "visit_summary", strict: true, schema: {
          type: "object", additionalProperties: false,
          required: ["headline", "narrative", "moodKeywords", "artworkMoments", "commonThread", "docentMessage"],
          properties: {
            headline: { type: "string" },
            narrative: { type: "string" },
            moodKeywords: { type: "array", minItems: 3, maxItems: 4, items: { type: "string" } },
            artworkMoments: { type: "array", minItems: 1, maxItems: 2, items: {
              type: "object", additionalProperties: false,
              required: ["title", "reaction", "observation"],
              properties: { title: { type: "string" }, reaction: { type: "string" }, observation: { type: "string" } },
            } },
            commonThread: { type: "string" },
            docentMessage: { type: "string" },
          },
        } } },
      });
      const content = {
        ...JSON.parse(response.output_text),
        exhibition: latestVisit ? { title: latestVisit.title, venue: latestVisit.venue, visitedAt: latestVisit.visited_at } : null,
        counts: { exhibitions: 1, artworks: artworksResult.rows.length, notes: notesResult.rows.length },
        artworkImages: Object.fromEntries(artworksResult.rows.map((artwork) => [artwork.title, artwork.image_url])),
        artworkArtists: Object.fromEntries(artworksResult.rows.map((artwork) => [artwork.title, artwork.artist_name || "작가 미상"])),
      };
      await saveGeneratedContent(user.id, exhibitionId, body.type, content);
      return NextResponse.json({ content });
    }

    if (body.type === "stickers") {
      const artworkEvidence = artworksResult.rows.map((artwork) => ({
        title: artwork.title,
        artist: artwork.artist_name,
        material: artwork.material,
        exhibition: artwork.exhibition_title,
      }));
      const noteEvidence = notesResult.rows.map((note) => ({ artwork: note.artwork_title, note: note.content }));
      const referenceImages = await artworkReferenceFiles(artworksResult.rows);
      const stickerPrompt = [
          "Create one premium vertical collectible die-cut sticker sheet on a clean warm-white background.",
          "Arrange 12 to 16 separate realistic illustrated object stickers with generous spacing; every object must have a thick white vinyl cutline, subtle gray drop shadow, and no overlap.",
          "Visual direction: luxury fashion archive meets contemporary art exhibition souvenir; tactile leather, polished metal, textile, sculptural furniture, gallery ticket, camera, ribbon, luggage tag, architectural fragment, and small emblem motifs.",
          "COLOR IS CRITICAL: inspect the supplied collected-artwork reference images and extract their actual dominant, secondary, and accent colors. Build the entire sheet from that exhibition-specific palette using an approximately 60/30/10 color balance.",
          "Preserve distinctive artwork colors and material tones across several stickers. Do not fall back to generic burgundy, brown, gold, or brand colors unless those colors are visibly present in the supplied artworks.",
          "The warm-white page and white cutlines stay neutral; the sticker objects themselves should immediately feel like they belong to this specific exhibition.",
          "Translate the collected artworks, their materials, and the visitor's short reactions into visual motifs, not generic emoji or flat UI badges. Use visible shapes and textures from references as inspiration without reproducing a full artwork as a sticker.",
          "Include at most three short, clearly legible Korean or English label stickers. Do not invent brand logos, artist signatures, artwork titles, dates, or exhibition facts that are absent from the records.",
          "Do not render a mockup of loose stickers on a desk. The final output itself is a front-facing printable sticker sheet, no hands, no packaging, no border around the whole page.",
          `Collected artwork records: ${JSON.stringify(artworkEvidence)}`,
          `Visitor notes: ${JSON.stringify(noteEvidence)}`,
        ].join("\n");
      const imageOptions = {
        model: process.env.OPENAI_IMAGE_MODEL || "gpt-image-2",
        size: "1024x1536" as const,
        quality: "medium" as const,
        output_format: "jpeg" as const,
        output_compression: 82,
        background: "opaque" as const,
        user: user.id,
      };
      const imageResponse = referenceImages.length > 0
        ? await client.images.edit({ ...imageOptions, image: referenceImages, prompt: stickerPrompt }, { timeout: 120_000 })
        : await client.images.generate({ ...imageOptions, n: 1, prompt: stickerPrompt }, { timeout: 120_000 });
      const imageBase64 = imageResponse.data?.[0]?.b64_json;
      if (!imageBase64) throw new Error("IMAGE_DATA_MISSING");
      const content = {
        title: "나의 전시 기억 스티커",
        description: "수집 작품과 감상에서 발견한 사물·소재·분위기를 한 장의 다이컷 스티커 시트로 만들었어요.",
        imageDataUrl: `data:image/jpeg;base64,${imageBase64}`,
      };
      await saveGeneratedContent(user.id, exhibitionId, body.type, content);
      return NextResponse.json({ content });
    }

    const recommendationResult = await db.query<ExhibitionRow>(
      `SELECT title, description, venue, start_at::text, end_at::text
       FROM exhibitions
       WHERE published = true AND ($1::bigint IS NULL OR id <> $1::bigint)
       ORDER BY CASE WHEN status = 'ongoing' THEN 0 WHEN status = 'upcoming' THEN 1 ELSE 2 END, start_at ASC
       LIMIT 1`,
      [exhibitionId],
    );
    const recommendedExhibition = recommendationResult.rows[0] ?? null;
    const response = await client.responses.create({
      model,
      store: false,
      reasoning: { effort: "low" },
      max_output_tokens: 1200,
      instructions: `${commonInstructions}\n전시가 직접 보낸 편지처럼 쓰세요. 추천 전시가 있으면 사용자의 기록과 연결되는 실제 이유를 설명하되, 추천 전시에 없는 정보를 만들지 마세요.`,
      input: JSON.stringify({ ...context, recommendedExhibition }),
      text: { format: { type: "json_schema", name: "exhibition_letter", strict: true, schema: {
        type: "object", additionalProperties: false,
        required: ["eyebrow", "title", "greeting", "body", "reason", "closing"],
        properties: {
          eyebrow: { type: "string" }, title: { type: "string" }, greeting: { type: "string" },
          body: { type: "string" }, reason: { type: "string" }, closing: { type: "string" },
        },
      } } },
    });
    const content = {
      ...JSON.parse(response.output_text),
      recommendedExhibition,
    };
    await saveGeneratedContent(user.id, exhibitionId, body.type, content);
    return NextResponse.json({ content });
  } catch (error) {
    console.error("AI 시간차 콘텐츠 생성 실패", error);
    return NextResponse.json({ error: "AI 맞춤 콘텐츠를 만들지 못했습니다. 잠시 후 다시 시도해 주세요." }, { status: 500 });
  }
}
