import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { getUserBySessionToken, SESSION_COOKIE_NAME } from "../../../lib/auth";
import { getDb } from "../../../lib/db";
import { mcmProductCatalog } from "../../../lib/mcm-product-catalog";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type StoredRow = { product_ref: string; reason: string | null; created_at: string };
type EvidenceRow = { title: string; material: string | null; note: string | null; exhibition_title: string };
type QuestionRow = { content: string; artwork_title: string };

async function currentUser(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  return token ? getUserBySessionToken(token) : null;
}

async function storedRecommendations(userId: string) {
  const result = await getDb().query<StoredRow>(
    `SELECT product_ref, reason, created_at::text FROM product_recommendations
     WHERE user_id = $1 AND dismissed_at IS NULL ORDER BY created_at ASC`,
    [userId],
  );
  return result.rows.flatMap((row) => {
    const product = mcmProductCatalog.find((item) => item.id === row.product_ref);
    return product && row.reason ? [{ product, reason: row.reason, generatedAt: row.created_at }] : [];
  });
}

export async function GET(request: NextRequest) {
  const user = await currentUser(request);
  if (!user) return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  try {
    return NextResponse.json({ recommendations: await storedRecommendations(user.id) }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("MCM 맞춤 추천 조회 실패", error);
    return NextResponse.json({ error: "저장된 맞춤 추천을 불러오지 못했습니다." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const user = await currentUser(request);
  if (!user) return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  if (!process.env.OPEN_API) return NextResponse.json({ error: "AI 추천 설정이 완료되지 않았습니다." }, { status: 500 });

  try {
    const db = getDb();
    const [evidence, questions, taste, previousRecommendations] = await Promise.all([
      db.query<EvidenceRow>(
        `SELECT a.title, a.material, n.content AS note, e.title AS exhibition_title
         FROM collections c JOIN exhibition_artworks ea ON ea.id = c.exhibition_artwork_id
         JOIN artworks a ON a.id = ea.artwork_id JOIN exhibitions e ON e.id = ea.exhibition_id
         LEFT JOIN notes n ON n.user_id = c.user_id AND n.exhibition_artwork_id = ea.id
         WHERE c.user_id = $1 ORDER BY c.collected_at DESC LIMIT 40`,
        [user.id],
      ),
      db.query<QuestionRow>(
        `SELECT dc.content, a.title AS artwork_title FROM docent_conversations dc
         JOIN exhibition_artworks ea ON ea.id = dc.exhibition_artwork_id JOIN artworks a ON a.id = ea.artwork_id
         WHERE dc.user_id = $1 AND dc.role = 'user' AND dc.share_personalization = true
         ORDER BY dc.created_at DESC LIMIT 30`,
        [user.id],
      ),
      db.query<{ items: unknown }>("SELECT items FROM taste_profiles WHERE user_id = $1", [user.id]),
      storedRecommendations(user.id),
    ]);

    if (evidence.rows.length + questions.rows.length === 0 && !taste.rows[0]?.items) {
      return NextResponse.json({ error: "작품 수집, 감상 또는 취향 리포트 기록을 먼저 남겨주세요." }, { status: 422 });
    }

    const catalog = mcmProductCatalog.map(({ id, name, description, tags }) => ({ id, name, description, tags }));
    const response = await new OpenAI({ apiKey: process.env.OPEN_API, timeout: 60_000, maxRetries: 1 }).responses.create({
      model: process.env.OPENAI_RECOMMENDATION_MODEL || process.env.OPENAI_MODEL || "gpt-5-mini",
      store: false,
      reasoning: { effort: "low" },
      max_output_tokens: 900,
      instructions: [
        "당신은 MCM 전시 관람 기록을 MCM 공식 상품과 연결하는 큐레이터입니다.",
        "반드시 제공된 catalog의 id만 선택하고 다른 브랜드나 제품을 만들지 마세요.",
        "사용자의 실제 기록에서 확인되는 근거만 사용해 서로 다른 취향 신호를 반영한 상품 3개를 우선순위대로 선택하세요.",
        "previousProductIds에 직전 추천이 있으면, 카탈로그에 다른 후보가 3개 이상 있는 한 해당 ID는 하나도 다시 선택하지 마세요.",
        "reason은 사용자의 구체적인 색·소재·형태·주제와 상품을 연결하는 따뜻한 한국어 1~2문장으로 작성하세요.",
        "민감한 특성을 추론하지 마세요.",
      ].join("\n"),
      input: JSON.stringify({ collectedEvidence: evidence.rows, sharedDocentQuestions: questions.rows, tasteReport: taste.rows[0]?.items ?? null, previousProductIds: previousRecommendations.map((item) => item.product.id), catalog }),
      text: { format: { type: "json_schema", name: "mcm_product_recommendations", strict: true, schema: {
        type: "object", additionalProperties: false, required: ["recommendations"], properties: {
          recommendations: { type: "array", minItems: 3, maxItems: 3, items: { type: "object", additionalProperties: false, required: ["productId", "reason"], properties: {
            productId: { type: "string", enum: mcmProductCatalog.map((item) => item.id) }, reason: { type: "string" },
          } } },
        },
      } } },
    });

    const parsed = JSON.parse(response.output_text) as { recommendations: Array<{ productId: string; reason: string }> };
    const selected = parsed.recommendations.filter((item, index, all) => all.findIndex((other) => other.productId === item.productId) === index);
    if (selected.length !== 3) throw new Error("RECOMMENDATION_COUNT_INVALID");

    const client = await db.connect();
    try {
      await client.query("BEGIN");
      await client.query("DELETE FROM product_recommendations WHERE user_id = $1", [user.id]);
      for (const item of selected) {
        await client.query(
          "INSERT INTO product_recommendations (user_id, product_ref, reason, impressed_at) VALUES ($1, $2, $3, NOW())",
          [user.id, item.productId, item.reason],
        );
      }
      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }

    return NextResponse.json({ recommendations: await storedRecommendations(user.id) }, { status: 201 });
  } catch (error) {
    console.error("AI MCM 맞춤 추천 생성 실패", error);
    return NextResponse.json({ error: "AI 맞춤 추천을 만들지 못했습니다. 잠시 후 다시 시도해 주세요." }, { status: 500 });
  }
}
