import { hash } from "bcryptjs";
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

    const username = (body.username as string).trim();
    const passwordHash = await hash(body.password as string, 12);
    await ensureAuthSchema();

    const result = await getDb().query<{ id: string; username: string }>(
      `INSERT INTO app_users (username, password_hash)
       VALUES ($1, $2)
       RETURNING id::text, username`,
      [username, passwordHash],
    );
    const user = result.rows[0];
    const sessionToken = await createSession(user.id);
    const response = NextResponse.json({ user }, { status: 201 });
    response.cookies.set(SESSION_COOKIE_NAME, sessionToken, sessionCookieOptions());
    return response;
  } catch (error) {
    if ((error as { code?: string }).code === "23505") {
      return NextResponse.json({ error: "이미 사용 중인 아이디입니다." }, { status: 409 });
    }

    console.error("Signup failed", error);
    return NextResponse.json({ error: "회원가입을 처리하지 못했습니다." }, { status: 500 });
  }
}
