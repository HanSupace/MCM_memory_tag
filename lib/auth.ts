import { ensureAuthSchema, getDb } from "./db";

export const SESSION_COOKIE_NAME = "mcm_session";
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

export type PublicUser = {
  id: string;
  username: string;
};

export function validateCredentials(username: unknown, password: unknown) {
  if (typeof username !== "string" || typeof password !== "string") {
    return "아이디와 비밀번호를 입력해 주세요.";
  }

  const trimmedUsername = username.trim();
  if (!/^[a-zA-Z0-9가-힣_]{3,20}$/u.test(trimmedUsername)) {
    return "아이디는 3~20자의 한글, 영문, 숫자, 밑줄만 사용할 수 있습니다.";
  }

  if (password.length < 8 || password.length > 72) {
    return "비밀번호는 8~72자로 입력해 주세요.";
  }

  return null;
}

function randomToken() {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function hashToken(token: string) {
  const bytes = new TextEncoder().encode(token);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export async function createSession(userId: string) {
  await ensureAuthSchema();
  const db = getDb();
  const token = randomToken();
  const tokenHash = await hashToken(token);

  await db.query("DELETE FROM auth_sessions WHERE expires_at < NOW()");
  await db.query(
    `INSERT INTO auth_sessions (user_id, token_hash, expires_at)
     VALUES ($1, $2, NOW() + INTERVAL '30 days')`,
    [userId, tokenHash],
  );

  return token;
}

export async function getUserBySessionToken(token: string): Promise<PublicUser | null> {
  await ensureAuthSchema();
  const tokenHash = await hashToken(token);
  const result = await getDb().query<{ id: string; username: string }>(
    `SELECT users.id::text, users.username
     FROM auth_sessions sessions
     JOIN app_users users ON users.id = sessions.user_id
     WHERE sessions.token_hash = $1 AND sessions.expires_at > NOW()
     LIMIT 1`,
    [tokenHash],
  );

  return result.rows[0] ?? null;
}

export async function revokeSession(token: string) {
  await ensureAuthSchema();
  const tokenHash = await hashToken(token);
  await getDb().query("DELETE FROM auth_sessions WHERE token_hash = $1", [tokenHash]);
}

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  };
}
