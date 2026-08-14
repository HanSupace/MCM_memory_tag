import { NextResponse } from "next/server";
import { getDb } from "../../../lib/db";

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
  try {
    const result = await getDb().query<ExhibitionListRow>(
      `SELECT id::text, title, venue, hero_image_url, start_at, end_at, status
       FROM exhibitions
       WHERE published = true
       ORDER BY
         CASE status WHEN 'ongoing' THEN 0 WHEN 'upcoming' THEN 1 ELSE 2 END,
         start_at DESC`,
    );

    const exhibitions = result.rows.map((row) => ({
      id: row.id,
      title: row.title,
      venue: row.venue,
      heroImageUrl: row.hero_image_url,
      startAt: row.start_at,
      endAt: row.end_at,
      status: row.status,
    }));

    return NextResponse.json({ exhibitions }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("전시 목록 조회 실패", error);
    return NextResponse.json({ error: "전시 목록을 불러오지 못했습니다." }, { status: 500 });
  }
}
