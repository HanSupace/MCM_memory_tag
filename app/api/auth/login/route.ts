import { compare } from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";
import { createSession, sessionCookieOptions, SESSION_COOKIE_NAME, validateCredentials } from "../../../../lib/auth";
import { ensureAuthSchema, getDb } from "../../../../lib/db";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as { username?: unknown; password?: unknown };
    const validationError = validateCredentials(body.username, body.password);

    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    await ensureAuthSchema();
    const result = await getDb().query<{ id: string; username: string; password_hash: string | null }>(
      `SELECT id::text, username, password_hash
       FROM app_users
       WHERE LOWER(username) = LOWER($1)
       LIMIT 1`,
      [(body.username as string).trim()],
    );
    const account = result.rows[0];

    if (!account?.password_hash || !(await compare(body.password as string, account.password_hash))) {
      return NextResponse.json({ error: "아이디 또는 비밀번호가 올바르지 않습니다." }, { status: 401 });
    }

    const user = { id: account.id, username: account.username };
    const sessionToken = await createSession(user.id);
    const response = NextResponse.json({ user });
    response.cookies.set(SESSION_COOKIE_NAME, sessionToken, sessionCookieOptions());
    return response;
  } catch (error) {
    console.error("Login failed", error);
    return NextResponse.json({ error: "로그인을 처리하지 못했습니다." }, { status: 500 });
  }
}
