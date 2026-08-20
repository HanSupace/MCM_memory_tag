import { NextRequest, NextResponse } from "next/server";
import { getUserBySessionToken, SESSION_COOKIE_NAME } from "../../../../lib/auth";
import { getDb } from "../../../../lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type CollectRow = {
  exhibition_artwork_id: string;
  artwork_id: string;
  exhibition_id: string;
  exhibition_title: string;
  title: string;
  artist_name: string | null;
  production_year: string | null;
  material: string | null;
  image_url: string | null;
  description: string | null;
  appreciation_points: string | null;
};

async function getAuthenticatedUser(request: NextRequest) {
  const sessionToken = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  return sessionToken ? getUserBySessionToken(sessionToken) : null;
}

// QR로 스캔한 값이 `{배포주소}/collect/{identifier}` 형태의 전체 URL일 수도 있어 마지막 경로 조각만 취한다.
function normalizeIdentifier(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  const withoutQuery = trimmed.split(/[?#]/)[0];
  const segments = withoutQuery.split("/").filter(Boolean);
  const identifier = segments[segments.length - 1] ?? trimmed;
  return identifier.length > 0 && identifier.length <= 120 ? identifier : null;
}

function toArtworkPayload(row: CollectRow) {
  return {
    artworkId: row.artwork_id,
    exhibitionArtworkId: row.exhibition_artwork_id,
    exhibitionId: row.exhibition_id,
    exhibitionTitle: row.exhibition_title,
    title: row.title,
    artistName: row.artist_name,
    productionYear: row.production_year,
    material: row.material,
    imageUrl: row.image_url,
    description: row.description,
    appreciationPoints: row.appreciation_points,
  };
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
    }

    const body = (await request.json()) as { identifier?: unknown };
    const identifier = normalizeIdentifier(body.identifier);
    if (!identifier) {
      return NextResponse.json({ error: "작품 코드 형식이 올바르지 않습니다." }, { status: 400 });
    }

    const db = getDb();

    const lookup = await db.query<CollectRow>(
      `SELECT ea.id::text AS exhibition_artwork_id,
              a.id::text AS artwork_id,
              e.id::text AS exhibition_id,
              e.title AS exhibition_title,
              a.title,
              ar.name AS artist_name,
              a.production_year,
              a.material,
              a.image_url,
              COALESCE(ea.exhibition_description, a.base_description) AS description,
              a.appreciation_points
       FROM exhibition_artworks ea
       JOIN artworks a ON a.id = ea.artwork_id
       JOIN exhibitions e ON e.id = ea.exhibition_id
       LEFT JOIN artists ar ON ar.id = a.artist_id
       WHERE ea.collect_identifier = $1 AND ea.published = true AND e.published = true
       LIMIT 1`,
      [identifier],
    );
    const artworkRow = lookup.rows[0];
    if (!artworkRow) {
      return NextResponse.json({ error: "작품을 찾을 수 없습니다. 코드를 다시 확인해 주세요." }, { status: 404 });
    }

    const joined = await db.query(
      "SELECT 1 FROM visits WHERE user_id = $1 AND exhibition_id = $2 LIMIT 1",
      [user.id, artworkRow.exhibition_id],
    );
    if ((joined.rowCount ?? 0) === 0) {
      return NextResponse.json({ error: "먼저 NFC/QR/코드로 해당 전시를 추가해 주세요." }, { status: 403 });
    }

    const existing = await db.query(
      "SELECT 1 FROM collections WHERE user_id = $1 AND exhibition_artwork_id = $2",
      [user.id, artworkRow.exhibition_artwork_id],
    );
    if ((existing.rowCount ?? 0) > 0) {
      return NextResponse.json({ collected: true, duplicate: true, artwork: toArtworkPayload(artworkRow) });
    }

    try {
      await db.query("INSERT INTO collections (user_id, exhibition_artwork_id) VALUES ($1, $2)", [
        user.id,
        artworkRow.exhibition_artwork_id,
      ]);
      return NextResponse.json({ collected: true, duplicate: false, artwork: toArtworkPayload(artworkRow) });
    } catch (error) {
      if ((error as { code?: string }).code === "23505") {
        return NextResponse.json({ collected: true, duplicate: true, artwork: toArtworkPayload(artworkRow) });
      }
      throw error;
    }
  } catch (error) {
    console.error("작품 수집 실패", error);
    return NextResponse.json({ error: "작품 수집을 처리하지 못했습니다." }, { status: 500 });
  }
}
