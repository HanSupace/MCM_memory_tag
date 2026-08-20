import { NextRequest, NextResponse } from "next/server";
import { getUserBySessionToken, SESSION_COOKIE_NAME } from "../../../../lib/auth";
import { getDb } from "../../../../lib/db";
import { artworks as seedArtworks, exhibitions as seedExhibitions } from "../../../../db/seeds";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function displayExhibitionTitle(title: string) {
  return title.toUpperCase().includes("WEARABLE CASA") || title.includes("웨어러블 카사")
    ? "WEARABLE CASA"
    : title;
}

const productOnlyCollectIdentifiers = [
  "mcm-berbrick-ken-yashiki-100-400-set",
  "mcm-berbrick-inden-ya-400",
  "mcm-berbrick-karimoku-400",
];

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

type ArtworkRow = {
  id: string;
  exhibition_artwork_id: string;
  collect_identifier: string | null;
  title: string;
  artist_name: string | null;
  production_year: string | null;
  material: string | null;
  image_url: string | null;
  description: string | null;
  appreciation_points: string | null;
};

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const user = token ? await getUserBySessionToken(token) : null;
  if (!user) return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });

  try {
    const db = getDb();
    let databaseId = id;
    if (!/^\d+$/.test(databaseId)) {
      const legacySeed = seedExhibitions.find((item) => item.id === id);
      if (!legacySeed) return NextResponse.json({ error: "잘못된 전시 ID입니다." }, { status: 400 });
      const legacyResult = await db.query<{ id: string }>(
        "SELECT id::text FROM exhibitions WHERE title = $1 AND published = true LIMIT 1",
        [legacySeed.title],
      );
      databaseId = legacyResult.rows[0]?.id ?? "";
      if (!databaseId) return NextResponse.json({ error: "전시를 찾을 수 없습니다." }, { status: 404 });
    }

    const exhibitionResult = await db.query<ExhibitionRow>(
      `SELECT id::text, title, description, hero_image_url, venue, start_at, end_at, operating_hours, status
       FROM exhibitions
       WHERE id = $1 AND published = true`,
      [databaseId],
    );
    const exhibition = exhibitionResult.rows[0];
    if (!exhibition) {
      return NextResponse.json({ error: "전시를 찾을 수 없습니다." }, { status: 404 });
    }

    const visitResult = await db.query(
      "SELECT 1 FROM visits WHERE user_id = $1 AND exhibition_id = $2 LIMIT 1",
      [user.id, databaseId],
    );
    if ((visitResult.rowCount ?? 0) === 0) {
      return NextResponse.json({ error: "먼저 NFC/QR/코드로 이 전시를 추가해 주세요." }, { status: 403 });
    }

    const artistsResult = await db.query<ArtistRow>(
      `SELECT a.id::text, a.name
       FROM exhibition_artists ea
       JOIN artists a ON a.id = ea.artist_id
       WHERE ea.exhibition_id = $1
       ORDER BY a.name`,
      [databaseId],
    );

    const artworksResult = await db.query<ArtworkRow>(
      `SELECT artworks.id::text,
              exhibition_artworks.id::text AS exhibition_artwork_id,
              exhibition_artworks.collect_identifier,
              artworks.title,
              artists.name AS artist_name,
              artworks.production_year,
              artworks.material,
              artworks.image_url,
              COALESCE(exhibition_artworks.exhibition_description, artworks.base_description) AS description,
              artworks.appreciation_points
       FROM exhibition_artworks
       JOIN artworks ON artworks.id = exhibition_artworks.artwork_id
       LEFT JOIN artists ON artists.id = artworks.artist_id
       WHERE exhibition_artworks.exhibition_id = $1
         AND exhibition_artworks.published = true
         AND (
           exhibition_artworks.collect_identifier IS NULL
           OR exhibition_artworks.collect_identifier <> ALL($2::text[])
         )
       ORDER BY exhibition_artworks.id`,
      [databaseId, productOnlyCollectIdentifiers],
    );
    const databaseArtworks = artworksResult.rows.map((row) => ({
      id: row.id,
      exhibitionArtworkId: row.exhibition_artwork_id,
      collectIdentifier: row.collect_identifier,
      title: row.title,
      artistName: row.artist_name,
      productionYear: row.production_year,
      material: row.material,
      imageUrl: row.image_url,
      description: row.description,
      appreciationPoints: row.appreciation_points,
    }));
    const matchedSeedExhibition = seedExhibitions.find((seed) => seed.title === exhibition.title);
    const fallbackArtworks = matchedSeedExhibition
      ? seedArtworks
          .filter((artwork) => artwork.exhibitionId === matchedSeedExhibition.id)
          .sort((left, right) => left.displayOrder - right.displayOrder)
          .map((artwork) => ({
            id: artwork.id,
            exhibitionArtworkId: artwork.id,
            collectIdentifier: artwork.slug,
            title: artwork.title,
            artistName: artwork.artistName,
            productionYear: null,
            material: artwork.material ?? artwork.type,
            imageUrl: artwork.imageUrl ?? null,
            description: artwork.description,
            appreciationPoints: [artwork.interpretation, ...artwork.viewingTips].join("\n"),
          }))
      : [];
    const exhibitionArtworks = databaseArtworks.length > 0 ? databaseArtworks : fallbackArtworks;
    const totalArtworks = exhibitionArtworks.length;

    const collectedResult = await db.query<{ count: string }>(
      `SELECT count(*)::text AS count
       FROM collections c
       JOIN exhibition_artworks ea ON ea.id = c.exhibition_artwork_id
       WHERE c.user_id = $1
         AND ea.exhibition_id = $2
         AND (ea.collect_identifier IS NULL OR ea.collect_identifier <> ALL($3::text[]))`,
      [user.id, databaseId, productOnlyCollectIdentifiers],
    );
    const collectedCount = Number(collectedResult.rows[0]?.count ?? "0");

    return NextResponse.json(
      {
        exhibition: {
          id: exhibition.id,
          title: displayExhibitionTitle(exhibition.title),
          description: exhibition.description,
          heroImageUrl: exhibition.hero_image_url,
          venue: exhibition.venue,
          startAt: exhibition.start_at,
          endAt: exhibition.end_at,
          operatingHours: exhibition.operating_hours,
          status: exhibition.status,
          artists: artistsResult.rows.map((row) => ({ id: row.id, name: row.name })),
          artworks: exhibitionArtworks,
          totalArtworks,
          visited: true,
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
