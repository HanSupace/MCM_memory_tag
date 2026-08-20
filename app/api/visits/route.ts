import { NextRequest, NextResponse } from "next/server";
import { getUserBySessionToken, SESSION_COOKIE_NAME } from "../../../lib/auth";
import { getDb } from "../../../lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type VisitRow = {
  visited_at: string;
};

async function getAuthenticatedUser(request: NextRequest) {
  const sessionToken = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  return sessionToken ? getUserBySessionToken(sessionToken) : null;
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
    }

    const body = (await request.json()) as { exhibitionId?: unknown };
    const exhibitionId = typeof body.exhibitionId === "string" ? body.exhibitionId : null;
    if (!exhibitionId || !/^\d+$/.test(exhibitionId)) {
      return NextResponse.json({ error: "전시 정보가 올바르지 않습니다." }, { status: 400 });
    }

    const db = getDb();

    const exhibitionResult = await db.query("SELECT 1 FROM exhibitions WHERE id = $1 AND published = true", [
      exhibitionId,
    ]);
    if ((exhibitionResult.rowCount ?? 0) === 0) {
      return NextResponse.json({ error: "전시를 찾을 수 없습니다." }, { status: 404 });
    }

    const existing = await db.query<VisitRow>(
      "SELECT visited_at FROM visits WHERE user_id = $1 AND exhibition_id = $2",
      [user.id, exhibitionId],
    );
    const existingRow = existing.rows[0];
    if (existingRow) {
      return NextResponse.json({ visited: true, visitedAt: existingRow.visited_at, alreadyVisited: true });
    }
    return NextResponse.json(
      { error: "홈에서 NFC/QR/코드로 이 전시를 먼저 추가해 주세요." },
      { status: 403 },
    );
  } catch (error) {
    console.error("방문 인증 실패", error);
    return NextResponse.json({ error: "방문 인증을 처리하지 못했습니다." }, { status: 500 });
  }
}
