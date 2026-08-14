import { NextRequest, NextResponse } from "next/server";
import {
  getConsentPreferences,
  getUserBySessionToken,
  saveConsentPreferences,
  SESSION_COOKIE_NAME,
  validateConsentPreferences,
} from "../../../../lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function getAuthenticatedUser(request: NextRequest) {
  const sessionToken = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  return sessionToken ? getUserBySessionToken(sessionToken) : null;
}

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
    }

    const consents = await getConsentPreferences(user.id);
    return NextResponse.json({ consents }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Consent lookup failed", error);
    return NextResponse.json({ error: "동의 상태를 확인하지 못했습니다." }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
    }

    const body = await request.json() as { consents?: unknown };
    const validation = validateConsentPreferences(body.consents);
    if (!validation.ok) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    await saveConsentPreferences(user.id, validation.preferences);
    return NextResponse.json({ consents: validation.preferences });
  } catch (error) {
    console.error("Consent update failed", error);
    return NextResponse.json({ error: "동의 상태를 변경하지 못했습니다." }, { status: 500 });
  }
}
