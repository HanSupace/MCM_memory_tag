import { NextRequest, NextResponse } from "next/server";
import { getUserBySessionToken, SESSION_COOKIE_NAME } from "../../../lib/auth";
import { ensureExhibitionVisit, resolveEntryToken } from "../../../lib/exhibition-access";
import { getDb } from "../../../lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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

    const db = getDb();
    const body = (await request.json()) as { entryToken?: unknown };
    const resolved = await resolveEntryToken(db, body.entryToken);
    if (!resolved) {
      return NextResponse.json(
        { error: "유효한 전시 입장 QR 또는 키링을 확인할 수 없습니다." },
        { status: 403 },
      );
    }

    const visit = await ensureExhibitionVisit(db, user.id, resolved.exhibitionId, resolved.source);
    return NextResponse.json({
      visited: true,
      visitedAt: visit.visitedAt,
      alreadyVisited: visit.alreadyVisited,
      exhibitionId: resolved.exhibitionId,
      accessSource: resolved.source,
    });
  } catch (error) {
    console.error("방문 인증 실패", error);
    return NextResponse.json({ error: "방문 인증을 처리하지 못했습니다." }, { status: 500 });
  }
}
