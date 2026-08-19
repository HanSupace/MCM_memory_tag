import { NextRequest, NextResponse } from "next/server";
import { getUserBySessionToken, SESSION_COOKIE_NAME } from "../../../lib/auth";
import { getDb } from "../../../lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type CountRow = { count: string };
type RecentExhibitionRow = {
  id: string;
  title: string;
  venue: string;
  hero_image_url: string | null;
  start_at: string;
  end_at: string;
  status: "upcoming" | "ongoing" | "ended";
};

export async function GET(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const user = token ? await getUserBySessionToken(token) : null;
  if (!user) return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });

  try {
    const db = getDb();
    const [visits, artworks, notes, recent] = await Promise.all([
      db.query<CountRow>("SELECT COUNT(DISTINCT exhibition_id)::text AS count FROM visits WHERE user_id = $1", [user.id]),
      db.query<CountRow>("SELECT COUNT(*)::text AS count FROM collections WHERE user_id = $1", [user.id]),
      db.query<CountRow>("SELECT COUNT(*)::text AS count FROM notes WHERE user_id = $1 AND BTRIM(content) <> ''", [user.id]),
      db.query<RecentExhibitionRow>(
        `SELECT e.id::text, e.title, e.venue, e.hero_image_url, e.start_at, e.end_at, e.status
         FROM visits v
         JOIN exhibitions e ON e.id = v.exhibition_id
         WHERE v.user_id = $1 AND e.published = true
         ORDER BY v.visited_at DESC
         LIMIT 1`,
        [user.id],
      ),
    ]);

    const recentRow = recent.rows[0];
    return NextResponse.json({
      counts: {
        exhibitions: Number(visits.rows[0]?.count ?? 0),
        artworks: Number(artworks.rows[0]?.count ?? 0),
        notes: Number(notes.rows[0]?.count ?? 0),
      },
      recentExhibition: recentRow ? {
        id: recentRow.id,
        title: recentRow.title,
        venue: recentRow.venue,
        heroImageUrl: recentRow.hero_image_url,
        startAt: recentRow.start_at,
        endAt: recentRow.end_at,
        status: recentRow.status,
      } : null,
    }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("홈 요약 조회 실패", error);
    return NextResponse.json({ error: "방문 기록을 불러오지 못했습니다." }, { status: 500 });
  }
}
