import { NextRequest, NextResponse } from "next/server";
import { getUserBySessionToken, SESSION_COOKIE_NAME } from "../../../lib/auth";
import { getDb } from "../../../lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ExhibitionEntryRow = {
  id: string;
  title: string;
  venue: string;
  hero_image_url: string | null;
  start_at: string;
  end_at: string;
  status: "upcoming" | "ongoing" | "ended";
  joined: boolean;
};

function normalizeEntryCode(value: unknown) {
  if (typeof value !== "string") return "";
  const trimmed = value.trim();
  if (!trimmed) return "";

  try {
    const url = new URL(trimmed);
    const queryCode = url.searchParams.get("code") ?? url.searchParams.get("visit");
    if (queryCode) return queryCode.trim().toLowerCase();
    const segments = url.pathname.split("/").filter(Boolean);
    return decodeURIComponent(segments.at(-1) ?? "").trim().toLowerCase();
  } catch {
    const segments = trimmed.split("/").filter(Boolean);
    return decodeURIComponent(segments.at(-1) ?? trimmed).trim().toLowerCase();
  }
}

async function getAuthenticatedUser(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  return token ? getUserBySessionToken(token) : null;
}

async function findExhibition(code: string, userId: string) {
  const result = await getDb().query<ExhibitionEntryRow>(
    `SELECT e.id::text, e.title, e.venue, e.hero_image_url, e.start_at, e.end_at, e.status,
            EXISTS (
              SELECT 1 FROM visits v WHERE v.user_id = $2 AND v.exhibition_id = e.id
            ) AS joined
     FROM exhibitions e
     WHERE lower(e.entry_code) = $1 AND e.published = true
     LIMIT 1`,
    [code, userId],
  );
  return result.rows[0] ?? null;
}

function serializeExhibition(row: ExhibitionEntryRow) {
  return {
    id: row.id,
    title: row.title,
    venue: row.venue,
    heroImageUrl: row.hero_image_url,
    startAt: row.start_at,
    endAt: row.end_at,
    status: row.status,
    joined: row.joined,
  };
}

export async function GET(request: NextRequest) {
  const user = await getAuthenticatedUser(request);
  if (!user) return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });

  const code = normalizeEntryCode(request.nextUrl.searchParams.get("code"));
  if (!code) return NextResponse.json({ error: "전시 코드를 입력해 주세요." }, { status: 400 });

  try {
    const exhibition = await findExhibition(code, user.id);
    if (!exhibition) return NextResponse.json({ error: "코드에 해당하는 전시를 찾을 수 없습니다." }, { status: 404 });
    return NextResponse.json({ exhibition: serializeExhibition(exhibition) }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("전시 참가 코드 확인 실패", error);
    return NextResponse.json({ error: "전시 코드를 확인하지 못했습니다." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const user = await getAuthenticatedUser(request);
  if (!user) return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });

  const body = await request.json().catch(() => null) as { code?: unknown } | null;
  const code = normalizeEntryCode(body?.code);
  if (!code) return NextResponse.json({ error: "전시 코드를 입력해 주세요." }, { status: 400 });

  try {
    const exhibition = await findExhibition(code, user.id);
    if (!exhibition) return NextResponse.json({ error: "코드에 해당하는 전시를 찾을 수 없습니다." }, { status: 404 });

    const inserted = await getDb().query(
      `INSERT INTO visits (user_id, exhibition_id)
       VALUES ($1, $2)
       ON CONFLICT (user_id, exhibition_id) DO NOTHING`,
      [user.id, exhibition.id],
    );

    return NextResponse.json({
      exhibition: { ...serializeExhibition(exhibition), joined: true },
      alreadyJoined: exhibition.joined || (inserted.rowCount ?? 0) === 0,
    });
  } catch (error) {
    console.error("전시 참가 처리 실패", error);
    return NextResponse.json({ error: "전시를 추가하지 못했습니다." }, { status: 500 });
  }
}
