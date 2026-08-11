import { NextRequest, NextResponse } from "next/server";
import { getUserBySessionToken, SESSION_COOKIE_NAME } from "../../../../lib/auth";
import { getDb } from "../../../../lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ExhibitionRow = {
  id: string;
  title: string;
  description: string | null;
  hero_image_url: string | null;
  venue: string;
  start_at: string;
  end_at: string;
  operating_hours: string | null;
  status: string;
};

type ArtistRow = {
  id: string;
  name: string;
};

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^\d+$/.test(id)) {
    return NextResponse.json({ error: "잘못된 전시 ID입니다." }, { status: 400 });
  }

  try {
    const db = getDb();

    const exhibitionResult = await db.query<ExhibitionRow>(
      `SELECT id::text, title, description, hero_image_url, venue, start_at, end_at, operating_hours, status
       FROM exhibitions
       WHERE id = $1 AND published = true`,
      [id],
    );
    const exhibition = exhibitionResult.rows[0];
    if (!exhibition) {
      return NextResponse.json({ error: "전시를 찾을 수 없습니다." }, { status: 404 });
    }

    const artistsResult = await db.query<ArtistRow>(
      `SELECT a.id::text, a.name
       FROM exhibition_artists ea
       JOIN artists a ON a.id = ea.artist_id
       WHERE ea.exhibition_id = $1
       ORDER BY a.name`,
      [id],
    );

    const totalArtworksResult = await db.query<{ count: string }>(
      `SELECT count(*)::text AS count FROM exhibition_artworks WHERE exhibition_id = $1 AND published = true`,
      [id],
    );
    const totalArtworks = Number(totalArtworksResult.rows[0]?.count ?? "0");

    let visited = false;
    let collectedCount = 0;

    const sessionToken = request.cookies.get(SESSION_COOKIE_NAME)?.value;
    if (sessionToken) {
      const user = await getUserBySessionToken(sessionToken);
      if (user) {
        const visitResult = await db.query(
          "SELECT 1 FROM visits WHERE user_id = $1 AND exhibition_id = $2 LIMIT 1",
          [user.id, id],
        );
        visited = (visitResult.rowCount ?? 0) > 0;

        const collectedResult = await db.query<{ count: string }>(
          `SELECT count(*)::text AS count
           FROM collections c
           JOIN exhibition_artworks ea ON ea.id = c.exhibition_artwork_id
           WHERE c.user_id = $1 AND ea.exhibition_id = $2`,
          [user.id, id],
        );
        collectedCount = Number(collectedResult.rows[0]?.count ?? "0");
      }
    }

    return NextResponse.json(
      {
        exhibition: {
          id: exhibition.id,
          title: exhibition.title,
          description: exhibition.description,
          heroImageUrl: exhibition.hero_image_url,
          venue: exhibition.venue,
          startAt: exhibition.start_at,
          endAt: exhibition.end_at,
          operatingHours: exhibition.operating_hours,
          status: exhibition.status,
          artists: artistsResult.rows.map((row) => ({ id: row.id, name: row.name })),
          totalArtworks,
          visited,
          collectedCount,
        },
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("전시 상세 조회 실패", error);
    return NextResponse.json({ error: "전시 정보를 불러오지 못했습니다." }, { status: 500 });
  }
}
