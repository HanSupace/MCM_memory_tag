import { NextRequest, NextResponse } from "next/server";
import { getUserBySessionToken, SESSION_COOKIE_NAME } from "../../../lib/auth";
import { resolveExhibitionArtworkId, seedArtworkFor } from "../../../lib/catalog-db";
import { getDb } from "../../../lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type CollectionRow = {
  exhibition_artwork_id: string;
  exhibition_id: string;
  exhibition_title: string;
  artwork_id: string;
  artwork_title: string;
  artist_name: string | null;
  image_url: string | null;
  collect_identifier: string | null;
  description: string | null;
  review: string;
  created_at: string;
  updated_at: string;
};

async function currentUser(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  return token ? getUserBySessionToken(token) : null;
}

function serialize(row: CollectionRow) {
  const seedArtwork = seedArtworkFor(row.exhibition_title, row.collect_identifier);
  return {
    id: seedArtwork?.id ?? row.exhibition_artwork_id,
    exhibitionArtworkId: row.exhibition_artwork_id,
    exhibitionId: row.exhibition_id,
    exhibitionTitle: row.exhibition_title,
    artworkId: seedArtwork?.id ?? row.artwork_id,
    artworkTitle: row.artwork_title,
    artistName: row.artist_name ?? seedArtwork?.artistName ?? null,
    imageUrl: row.image_url ?? seedArtwork?.imageUrl ?? null,
    description: row.description ?? seedArtwork?.description ?? null,
    review: row.review,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

const collectionSelect = `
  SELECT ea.id::text AS exhibition_artwork_id,
         e.id::text AS exhibition_id,
         e.title AS exhibition_title,
         a.id::text AS artwork_id,
         a.title AS artwork_title,
         ar.name AS artist_name,
         a.image_url,
         ea.collect_identifier,
         COALESCE(a.base_description, ea.exhibition_description) AS description,
         COALESCE(n.content, '') AS review,
         c.collected_at AS created_at,
         COALESCE(n.updated_at, c.collected_at) AS updated_at
  FROM collections c
  JOIN exhibition_artworks ea ON ea.id = c.exhibition_artwork_id
  JOIN exhibitions e ON e.id = ea.exhibition_id
  JOIN artworks a ON a.id = ea.artwork_id
  LEFT JOIN artists ar ON ar.id = a.artist_id
  LEFT JOIN notes n ON n.user_id = c.user_id AND n.exhibition_artwork_id = c.exhibition_artwork_id`;

export async function GET(request: NextRequest) {
  const user = await currentUser(request);
  if (!user) return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });

  try {
    const result = await getDb().query<CollectionRow>(
      `${collectionSelect} WHERE c.user_id = $1 ORDER BY COALESCE(n.updated_at, c.collected_at) DESC`,
      [user.id],
    );
    return NextResponse.json({ items: result.rows.map(serialize) }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("컬렉션 조회 실패", error);
    return NextResponse.json({ error: "컬렉션을 불러오지 못했습니다." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const user = await currentUser(request);
  if (!user) return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });

  try {
    const body = await request.json() as { exhibitionArtworkId?: unknown; review?: unknown };
    const reference = typeof body.exhibitionArtworkId === "string" ? body.exhibitionArtworkId : "";
    const review = typeof body.review === "string" ? body.review.trim() : "";
    if (!reference || !review || review.length > 80) {
      return NextResponse.json({ error: "한줄평은 1~80자로 입력해 주세요." }, { status: 400 });
    }

    const db = getDb();
    const exhibitionArtworkId = await resolveExhibitionArtworkId(db, reference);
    if (!exhibitionArtworkId) {
      return NextResponse.json(
        { error: "DB에서 작품을 찾을 수 없습니다. 먼저 전시·작품 시드 데이터를 반영해 주세요." },
        { status: 409 },
      );
    }

    const client = await db.connect();
    try {
      await client.query("BEGIN");
      await client.query(
        `INSERT INTO collections (user_id, exhibition_artwork_id)
         VALUES ($1, $2)
         ON CONFLICT (user_id, exhibition_artwork_id) DO NOTHING`,
        [user.id, exhibitionArtworkId],
      );
      await client.query(
        `INSERT INTO notes (user_id, exhibition_artwork_id, content, visibility)
         VALUES ($1, $2, $3, 'private')
         ON CONFLICT (user_id, exhibition_artwork_id)
         DO UPDATE SET content = EXCLUDED.content, updated_at = NOW()`,
        [user.id, exhibitionArtworkId, review],
      );
      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }

    const result = await db.query<CollectionRow>(
      `${collectionSelect} WHERE c.user_id = $1 AND c.exhibition_artwork_id = $2`,
      [user.id, exhibitionArtworkId],
    );
    return NextResponse.json({ item: serialize(result.rows[0]) });
  } catch (error) {
    console.error("컬렉션 저장 실패", error);
    return NextResponse.json({ error: "컬렉션을 저장하지 못했습니다." }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const user = await currentUser(request);
  if (!user) return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });

  const reference = request.nextUrl.searchParams.get("exhibitionArtworkId")?.trim() ?? "";
  if (!reference) {
    return NextResponse.json({ error: "삭제할 소장 작품을 지정해 주세요." }, { status: 400 });
  }

  try {
    const db = getDb();
    const exhibitionArtworkId = await resolveExhibitionArtworkId(db, reference);
    if (!exhibitionArtworkId) {
      return NextResponse.json({ error: "DB에서 작품을 찾을 수 없습니다." }, { status: 404 });
    }

    const client = await db.connect();
    try {
      await client.query("BEGIN");
      const result = await client.query(
        `DELETE FROM collections
         WHERE user_id = $1 AND exhibition_artwork_id = $2
         RETURNING id`,
        [user.id, exhibitionArtworkId],
      );
      if ((result.rowCount ?? 0) === 0) {
        await client.query("ROLLBACK");
        return NextResponse.json({ error: "소장 목록에서 작품을 찾을 수 없습니다." }, { status: 404 });
      }
      await client.query(
        "DELETE FROM notes WHERE user_id = $1 AND exhibition_artwork_id = $2",
        [user.id, exhibitionArtworkId],
      );
      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }

    return NextResponse.json({ deleted: true });
  } catch (error) {
    console.error("컬렉션 삭제 실패", error);
    return NextResponse.json({ error: "소장 작품을 삭제하지 못했습니다." }, { status: 500 });
  }
}
