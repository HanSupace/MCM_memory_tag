import { compare } from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";
import { getUserBySessionToken, SESSION_COOKIE_NAME } from "../../../../lib/auth";
import { getDb } from "../../../../lib/db";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const user = token ? await getUserBySessionToken(token) : null;
  if (!user) return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });

  try {
    const body = await request.json() as { password?: unknown };
    if (typeof body.password !== "string" || body.password.length < 8 || body.password.length > 72) {
      return NextResponse.json({ error: "비밀번호를 정확히 입력해 주세요." }, { status: 400 });
    }

    const result = await getDb().query<{ password_hash: string | null }>(
      "SELECT password_hash FROM app_users WHERE id = $1 LIMIT 1",
      [user.id],
    );
    const passwordHash = result.rows[0]?.password_hash;
    if (!passwordHash) {
      return NextResponse.json({ error: "카카오 계정은 비밀번호 확인을 지원하지 않습니다." }, { status: 409 });
    }
    if (!(await compare(body.password, passwordHash))) {
      return NextResponse.json({ error: "비밀번호가 올바르지 않습니다." }, { status: 401 });
    }

    return NextResponse.json({ verified: true }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("비밀번호 재확인 실패", error);
    return NextResponse.json({ error: "비밀번호를 확인하지 못했습니다." }, { status: 500 });
  }
}
