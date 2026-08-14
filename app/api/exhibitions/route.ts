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
};

export async function GET() {
  const typeScriptExhibitions = seedExhibitions.map((exhibition) => ({
    id: exhibition.id,
    title: exhibition.title,
    venue: exhibition.venue,
    heroImageUrl: null,
    startAt: exhibition.startDate,
    endAt: exhibition.endDate,
    status: exhibition.status,
  }));

  try {
    const result = await getDb().query<ExhibitionListRow>(
      `SELECT id::text, title, venue, hero_image_url, start_at, end_at, status
       FROM exhibitions
       WHERE published = true
       ORDER BY
         CASE status WHEN 'ongoing' THEN 0 WHEN 'upcoming' THEN 1 ELSE 2 END,
         start_at DESC`,
    );

    const databaseExhibitions = result.rows.map((row) => ({
      id: row.id,
      title: row.title,
      venue: row.venue,
      heroImageUrl: row.hero_image_url,
      startAt: row.start_at,
      endAt: row.end_at,
      status: row.status,
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
