import { NextRequest, NextResponse } from "next/server";
import {
  createSession,
  exchangeOAuthCode,
  findOrCreateSocialUser,
  isOAuthProvider,
  OAUTH_STATE_COOKIE_NAME,
  sessionCookieOptions,
  SESSION_COOKIE_NAME,
  validateOAuthState,
} from "../../../../../../lib/auth";

export const runtime = "nodejs";

function redirectWithError(message: string) {
  const url = new URL("/", process.env.APP_BASE_URL ?? "http://localhost:3000");
  url.searchParams.set("authError", message);
  const response = NextResponse.redirect(url);
  response.cookies.set(OAUTH_STATE_COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/api/auth/oauth",
    maxAge: 0,
  });
  return response;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ provider: string }> },
) {
  const { provider } = await params;
  if (!isOAuthProvider(provider)) {
    return redirectWithError("지원하지 않는 소셜 로그인입니다.");
  }

  const providerError = request.nextUrl.searchParams.get("error");
  if (providerError) {
    return redirectWithError("소셜 로그인이 취소되었습니다.");
  }

  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");
  const savedState = validateOAuthState(
    request.cookies.get(OAUTH_STATE_COOKIE_NAME)?.value,
    provider,
    state,
  );

  if (!code || !savedState) {
    return redirectWithError("소셜 로그인 요청이 만료되었거나 올바르지 않습니다. 다시 시도해 주세요.");
  }

  try {
    const identity = await exchangeOAuthCode(provider, code, savedState.codeVerifier);
    const user = await findOrCreateSocialUser(identity, savedState.mode, savedState.consents);
    const sessionToken = await createSession(user.id);
    const response = NextResponse.redirect(new URL("/", process.env.APP_BASE_URL ?? "http://localhost:3000"));
    response.cookies.set(SESSION_COOKIE_NAME, sessionToken, sessionCookieOptions());
    response.cookies.set(OAUTH_STATE_COOKIE_NAME, "", {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/api/auth/oauth",
      maxAge: 0,
    });
    return response;
  } catch (error) {
    if ((error as Error).message === "SOCIAL_ACCOUNT_ALREADY_EXISTS") {
      return redirectWithError("이미 회원가입된 소셜 계정입니다. 로그인으로 진행해 주세요.");
    }
    if ((error as Error).message === "SOCIAL_ACCOUNT_NOT_FOUND") {
      return redirectWithError("연결된 계정이 없습니다. 회원가입 화면에서 필수 동의 후 다시 시도해 주세요.");
    }
    console.error("OAuth callback failed", error);
    return redirectWithError("소셜 로그인을 완료하지 못했습니다. 잠시 후 다시 시도해 주세요.");
  }
}
