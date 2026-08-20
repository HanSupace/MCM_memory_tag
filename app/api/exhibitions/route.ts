import { NextRequest, NextResponse } from "next/server";
import { getUserBySessionToken, SESSION_COOKIE_NAME } from "../../../lib/auth";
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
  representative_artists: string[] | null;
};

function displayExhibitionTitle(title: string) {
  return title.toUpperCase().includes("WEARABLE CASA") || title.includes("웨어러블 카사")
    ? "WEARABLE CASA at MCM HAUS"
    : title;
}

export async function GET(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const user = token ? await getUserBySessionToken(token) : null;
  if (!user) return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });

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
       FROM visits v
       JOIN exhibitions e ON e.id = v.exhibition_id
       WHERE v.user_id = $1 AND e.published = true
       ORDER BY
         CASE e.status WHEN 'ongoing' THEN 0 WHEN 'upcoming' THEN 1 ELSE 2 END,
         v.visited_at DESC`,
      [user.id],
    );

    const exhibitions = result.rows.map((row) => ({
      id: row.id,
      title: displayExhibitionTitle(row.title),
      venue: row.venue,
      heroImageUrl: row.hero_image_url,
      startAt: row.start_at,
      endAt: row.end_at,
      status: row.status,
      representativeArtists: row.representative_artists ?? [],
    }));

    return NextResponse.json({ exhibitions }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("전시 목록 조회 실패", error);
    return NextResponse.json({ error: "전시 목록을 불러오지 못했습니다." }, { status: 500 });
  }
}
