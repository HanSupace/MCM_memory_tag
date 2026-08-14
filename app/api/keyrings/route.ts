import { NextRequest, NextResponse } from "next/server";
import { getUserBySessionToken, SESSION_COOKIE_NAME } from "../../../lib/auth";
import { getDb } from "../../../lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// db/schema.ts: keyrings.keyring_code는 varchar(64), 실물 키링에 인쇄된 값을 그대로 받는다.
const KEYRING_CODE_PATTERN = /^[A-Z0-9-]{4,64}$/;

type KeyringRow = {
  user_id: string;
  keyring_code: string;
  connected_at: string;
};

async function getAuthenticatedUser(request: NextRequest) {
  const sessionToken = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  return sessionToken ? getUserBySessionToken(sessionToken) : null;
}

function normalizeKeyringCode(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim().toUpperCase();
  return KEYRING_CODE_PATTERN.test(normalized) ? normalized : null;
}

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
    }

    const result = await getDb().query<KeyringRow>(
      `SELECT user_id::text, keyring_code, connected_at FROM keyrings WHERE user_id = $1`,
      [user.id],
    );
    const row = result.rows[0];

    return NextResponse.json(
      { keyring: row ? { keyringCode: row.keyring_code, connectedAt: row.connected_at } : null },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("키링 상태 조회 실패", error);
    return NextResponse.json({ error: "키링 상태를 확인하지 못했습니다." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
    }

    const body = (await request.json()) as { keyringCode?: unknown };
    const keyringCode = normalizeKeyringCode(body.keyringCode);
    if (!keyringCode) {
      return NextResponse.json({ error: "키링 코드 형식이 올바르지 않습니다." }, { status: 400 });
    }

    const db = getDb();
    const existing = await db.query<KeyringRow>(
      `SELECT user_id::text, keyring_code, connected_at FROM keyrings WHERE keyring_code = $1`,
      [keyringCode],
    );
    const existingRow = existing.rows[0];

    if (existingRow) {
      if (existingRow.user_id === user.id) {
        return NextResponse.json({
          keyring: { keyringCode: existingRow.keyring_code, connectedAt: existingRow.connected_at },
          alreadyConnected: true,
        });
      }
      return NextResponse.json({ error: "이미 다른 계정에 등록된 키링입니다." }, { status: 409 });
    }

    try {
      const inserted = await db.query<KeyringRow>(
        `INSERT INTO keyrings (user_id, keyring_code) VALUES ($1, $2)
         RETURNING user_id::text, keyring_code, connected_at`,
        [user.id, keyringCode],
      );
      const row = inserted.rows[0];
      return NextResponse.json({ keyring: { keyringCode: row.keyring_code, connectedAt: row.connected_at } });
    } catch (error) {
      if ((error as { code?: string }).code === "23505") {
        return NextResponse.json({ error: "이미 계정에 연결된 키링이 있습니다." }, { status: 409 });
      }
      throw error;
    }
  } catch (error) {
    console.error("키링 연결 실패", error);
    return NextResponse.json({ error: "키링 연결을 처리하지 못했습니다." }, { status: 500 });
  }
}
