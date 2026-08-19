import { NextResponse } from "next/server";
import { getDb } from "../../../lib/db";
import { exhibitions as seedExhibitions } from "../../../db/seeds";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ExhibitionListRow = {
  id: string;
  title: string;
  venue: string;
  hero_image_url: string | null;
  start_at: string;
  end_at: string;
  status: string;
  representative_artists: string[] | null;
};

function displayExhibitionTitle(title: string) {
  return title.toUpperCase().includes("WEARABLE CASA") || title.includes("웨어러블 카사")
    ? "WEARABLE CASA at MCM HAUS"
    : title;
}

export async function GET() {
  const typeScriptExhibitions = seedExhibitions.map((exhibition) => ({
    id: exhibition.id,
    title: displayExhibitionTitle(exhibition.title),
    venue: exhibition.venue,
    heroImageUrl: null,
    startAt: exhibition.startDate,
    endAt: exhibition.endDate,
    status: exhibition.status,
    representativeArtists: exhibition.artists,
  }));

  try {
    const result = await getDb().query<ExhibitionListRow>(
      `SELECT e.id::text, e.title, e.venue, e.hero_image_url, e.start_at, e.end_at, e.status,
              ARRAY(
                SELECT a.name
                FROM exhibition_artists ea
                JOIN artists a ON a.id = ea.artist_id
                WHERE ea.exhibition_id = e.id
                ORDER BY ea.artist_id
              ) AS representative_artists
       FROM exhibitions e
       WHERE e.published = true
       ORDER BY
         CASE e.status WHEN 'ongoing' THEN 0 WHEN 'upcoming' THEN 1 ELSE 2 END,
         e.start_at DESC`,
    );

    const databaseExhibitions = result.rows.map((row) => ({
      id: row.id,
      title: displayExhibitionTitle(row.title),
      venue: row.venue,
      heroImageUrl: row.hero_image_url,
      startAt: row.start_at,
      endAt: row.end_at,
      status: row.status,
      representativeArtists: row.representative_artists ?? [],
    }));
    const databaseTitles = new Set(databaseExhibitions.map((exhibition) => exhibition.title));
    const exhibitions = [
      ...typeScriptExhibitions.filter((exhibition) => !databaseTitles.has(exhibition.title)),
      ...databaseExhibitions,
    ];

    return NextResponse.json({ exhibitions }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("전시 목록 조회 실패", error);
    return NextResponse.json(
      { exhibitions: typeScriptExhibitions },
      { headers: { "Cache-Control": "no-store" } },
    );
  }
}
