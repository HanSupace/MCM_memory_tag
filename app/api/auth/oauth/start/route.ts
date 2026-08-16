import { NextRequest, NextResponse } from "next/server";
import {
  createOAuthAuthorization,
  isOAuthProvider,
  OAUTH_STATE_COOKIE_NAME,
  OAUTH_STATE_MAX_AGE_SECONDS,
  type OAuthMode,
  type UserRole,
  validateConsentPreferences,
} from "../../../../../lib/auth";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as { provider?: unknown; mode?: unknown; consents?: unknown; role?: unknown };
    if (!isOAuthProvider(body.provider)) {
      return NextResponse.json({ error: "지원하지 않는 소셜 로그인입니다." }, { status: 400 });
    }

    const mode: OAuthMode = body.mode === "signup" ? "signup" : "login";
    const role: UserRole = body.role === "exhibition_operator" ? "exhibition_operator" : "visitor";
    let consents;
    if (mode === "signup") {
      const validation = validateConsentPreferences(body.consents);
      if (!validation.ok) {
        return NextResponse.json({ error: validation.error }, { status: 400 });
      }
      consents = validation.preferences;
    }

    const authorization = await createOAuthAuthorization(body.provider, mode, consents, role);
    const response = NextResponse.json({ url: authorization.authorizationUrl });
    response.cookies.set(OAUTH_STATE_COOKIE_NAME, authorization.stateCookie, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/api/auth/oauth",
      maxAge: OAUTH_STATE_MAX_AGE_SECONDS,
    });
    return response;
  } catch (error) {
    console.error("OAuth start failed", error);
    return NextResponse.json({ error: "소셜 로그인을 시작하지 못했습니다. OAuth 설정을 확인해 주세요." }, { status: 500 });
  }
}
