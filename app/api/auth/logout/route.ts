import { NextRequest, NextResponse } from "next/server";
import { revokeSession, SESSION_COOKIE_NAME } from "../../../../lib/auth";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const sessionToken = request.cookies.get(SESSION_COOKIE_NAME)?.value;

  if (sessionToken) {
    try {
      await revokeSession(sessionToken);
    } catch (error) {
      console.error("Logout failed", error);
    }
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
  return response;
}
