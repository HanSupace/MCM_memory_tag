import { ensureAuthSchema, getDb } from "./db";

export const SESSION_COOKIE_NAME = "mcm_session";
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;
export const OAUTH_STATE_COOKIE_NAME = "mcm_oauth_state";
export const OAUTH_STATE_MAX_AGE_SECONDS = 10 * 60;

export type UserRole = "visitor" | "exhibition_operator" | "content_operator";

export type PublicUser = {
  id: string;
  username: string;
  role: UserRole;
  displayName?: string | null;
  profileImageUrl?: string | null;
};

export const CONSENT_TYPES = ["required", "personalization", "photo_analysis", "marketing"] as const;

export type ConsentType = (typeof CONSENT_TYPES)[number];

export type ConsentPreferences = Record<ConsentType, boolean>;

export type OAuthProvider = "kakao";
export type OAuthMode = "login" | "signup";

type OAuthState = {
  provider: OAuthProvider;
  mode: OAuthMode;
  role?: UserRole;
  state: string;
  codeVerifier: string;
  consents?: ConsentPreferences;
  expiresAt: number;
};

type OAuthIdentity = {
  provider: OAuthProvider;
  providerUserId: string;
  email: string | null;
  displayName: string | null;
  profileImageUrl: string | null;
};

export function validateConsentPreferences(value: unknown):
  | { ok: true; preferences: ConsentPreferences }
  | { ok: false; error: string } {
  if (!value || typeof value !== "object") {
    return { ok: false, error: "필수 서비스 동의가 필요합니다." };
  }

  const input = value as Record<string, unknown>;
  if (input.required !== true) {
    return { ok: false, error: "필수 서비스 동의에 동의해 주세요." };
  }

  for (const type of CONSENT_TYPES) {
    if (typeof input[type] !== "boolean") {
      return { ok: false, error: "동의 항목을 다시 확인해 주세요." };
    }
  }

  return {
    ok: true,
    preferences: {
      required: true,
      personalization: input.personalization as boolean,
      photo_analysis: input.photo_analysis as boolean,
      marketing: input.marketing as boolean,
    },
  };
}

export async function saveConsentPreferences(userId: string, preferences: ConsentPreferences) {
  await ensureAuthSchema();
  await getDb().query(
    `INSERT INTO consents (user_id, type, granted)
     VALUES
       ($1, 'required', $2),
       ($1, 'personalization', $3),
       ($1, 'photo_analysis', $4),
       ($1, 'marketing', $5)
     ON CONFLICT (user_id, type)
     DO UPDATE SET granted = EXCLUDED.granted, updated_at = NOW()`,
    [
      userId,
      preferences.required,
      preferences.personalization,
      preferences.photo_analysis,
      preferences.marketing,
    ],
  );
}

export async function getConsentPreferences(userId: string): Promise<ConsentPreferences> {
  await ensureAuthSchema();
  const result = await getDb().query<{ type: ConsentType; granted: boolean }>(
    `SELECT type, granted
     FROM consents
     WHERE user_id = $1 AND type = ANY($2::varchar[])`,
    [userId, CONSENT_TYPES],
  );
  const preferences: ConsentPreferences = {
    required: false,
    personalization: false,
    photo_analysis: false,
    marketing: false,
  };

  for (const row of result.rows) {
    if (CONSENT_TYPES.includes(row.type)) {
      preferences[row.type] = row.granted;
    }
  }

  return preferences;
}

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

function bytesToBase64Url(bytes: Uint8Array) {
  const binary = Array.from(bytes, (byte) => String.fromCharCode(byte)).join("");
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function encodeOAuthState(value: OAuthState) {
  return bytesToBase64Url(new TextEncoder().encode(JSON.stringify(value)));
}

function decodeOAuthState(value: string): OAuthState | null {
  try {
    const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
    const bytes = Uint8Array.from(atob(padded), (character) => character.charCodeAt(0));
    return JSON.parse(new TextDecoder().decode(bytes)) as OAuthState;
  } catch {
    return null;
  }
}

async function createCodeChallenge(codeVerifier: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(codeVerifier));
  return bytesToBase64Url(new Uint8Array(digest));
}

function getOAuthConfig(provider: OAuthProvider) {
  const config = {
    clientId: process.env.KAKAO_CLIENT_ID,
    clientSecret: process.env.KAKAO_CLIENT_SECRET,
    authorizationEndpoint: "https://kauth.kakao.com/oauth/authorize",
    tokenEndpoint: "https://kauth.kakao.com/oauth/token",
    userInfoEndpoint: "https://kapi.kakao.com/v2/user/me",
    scope: "profile_nickname",
  } as const;

  if (!config.clientId || !config.clientSecret) {
    throw new Error(`${provider.toUpperCase()} OAuth 환경 변수가 설정되지 않았습니다.`);
  }

  return { ...config, clientId: config.clientId, clientSecret: config.clientSecret };
}

function getOAuthRedirectUri(provider: OAuthProvider) {
  const baseUrl = process.env.APP_BASE_URL?.replace(/\/$/, "");
  if (!baseUrl) {
    throw new Error("APP_BASE_URL 환경 변수가 설정되지 않았습니다.");
  }

  return `${baseUrl}/api/auth/oauth/${provider}/callback`;
}

export function isOAuthProvider(value: unknown): value is OAuthProvider {
  return value === "kakao";
}

export async function createOAuthAuthorization(
  provider: OAuthProvider,
  mode: OAuthMode,
  consents?: ConsentPreferences,
  role: UserRole = "visitor",
) {
  const config = getOAuthConfig(provider);
  const state = randomToken();
  const codeVerifier = randomToken();
  const codeChallenge = await createCodeChallenge(codeVerifier);
  const redirectUri = getOAuthRedirectUri(provider);
  const authorizationUrl = new URL(config.authorizationEndpoint);

  authorizationUrl.searchParams.set("client_id", config.clientId);
  authorizationUrl.searchParams.set("redirect_uri", redirectUri);
  authorizationUrl.searchParams.set("response_type", "code");
  if (config.scope) authorizationUrl.searchParams.set("scope", config.scope);
  authorizationUrl.searchParams.set("state", state);
  authorizationUrl.searchParams.set("code_challenge", codeChallenge);
  authorizationUrl.searchParams.set("code_challenge_method", "S256");

  return {
    authorizationUrl: authorizationUrl.toString(),
    stateCookie: encodeOAuthState({
      provider,
      mode,
      role,
      state,
      codeVerifier,
      consents,
      expiresAt: Date.now() + OAUTH_STATE_MAX_AGE_SECONDS * 1000,
    }),
  };
}

export function validateOAuthState(cookieValue: string | undefined, provider: OAuthProvider, state: string | null) {
  if (!cookieValue || !state) return null;
  const saved = decodeOAuthState(cookieValue);

  if (!saved || saved.provider !== provider || saved.state !== state || saved.expiresAt < Date.now()) {
    return null;
  }

  return saved;
}

export async function exchangeOAuthCode(
  provider: OAuthProvider,
  code: string,
  codeVerifier: string,
): Promise<OAuthIdentity> {
  const config = getOAuthConfig(provider);
  const tokenResponse = await fetch(config.tokenEndpoint, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      client_id: config.clientId,
      client_secret: config.clientSecret,
      redirect_uri: getOAuthRedirectUri(provider),
      code,
      code_verifier: codeVerifier,
    }),
  });

  if (!tokenResponse.ok) {
    throw new Error(`${provider} OAuth 토큰 발급에 실패했습니다.`);
  }

  const token = await tokenResponse.json() as { access_token?: string };
  if (!token.access_token) {
    throw new Error(`${provider} OAuth 응답에 access token이 없습니다.`);
  }

  const userResponse = await fetch(config.userInfoEndpoint, {
    headers: { Authorization: `Bearer ${token.access_token}` },
  });
  if (!userResponse.ok) {
    throw new Error(`${provider} 사용자 정보를 가져오지 못했습니다.`);
  }

  const profile = await userResponse.json() as {
    id?: string | number;
    properties?: { nickname?: string; profile_image?: string };
    kakao_account?: {
      email?: string;
      profile?: { nickname?: string; profile_image_url?: string };
    };
  };
  if (profile.id === undefined) throw new Error("Kakao 사용자 식별자가 없습니다.");
  return {
    provider,
    providerUserId: String(profile.id),
    email: profile.kakao_account?.email ?? null,
    displayName: profile.kakao_account?.profile?.nickname ?? profile.properties?.nickname ?? null,
    profileImageUrl: profile.kakao_account?.profile?.profile_image_url ?? profile.properties?.profile_image ?? null,
  };
}

async function createSocialUsername(provider: OAuthProvider, providerUserId: string) {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(`${provider}:${providerUserId}`),
  );
  const suffix = Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0"))
    .join("")
    .slice(0, 12);
  return `${provider}_${suffix}`;
}

export async function findOrCreateSocialUser(
  identity: OAuthIdentity,
  mode: OAuthMode,
  consents?: ConsentPreferences,
  role: UserRole = "visitor",
): Promise<PublicUser> {
  await ensureAuthSchema();
  const existing = await getDb().query<PublicUser>(
    `SELECT users.id::text, users.username,
            users.role,
            accounts.display_name AS "displayName",
            accounts.profile_image_url AS "profileImageUrl"
     FROM social_accounts accounts
     JOIN app_users users ON users.id = accounts.user_id
     WHERE accounts.provider = $1 AND accounts.provider_user_id = $2
     LIMIT 1`,
    [identity.provider, identity.providerUserId],
  );

  if (existing.rows[0] && mode === "signup") {
    throw new Error("SOCIAL_ACCOUNT_ALREADY_EXISTS");
  }

  if (existing.rows[0]) {
    await getDb().query(
      `UPDATE social_accounts
       SET email = $3, display_name = $4, profile_image_url = $5, updated_at = NOW()
       WHERE provider = $1 AND provider_user_id = $2`,
      [
        identity.provider,
        identity.providerUserId,
        identity.email,
        identity.displayName,
        identity.profileImageUrl,
      ],
    );
    return {
      ...existing.rows[0],
      displayName: identity.displayName,
      profileImageUrl: identity.profileImageUrl,
    };
  }
  if (mode !== "signup" || !consents?.required) {
    throw new Error("SOCIAL_ACCOUNT_NOT_FOUND");
  }

  const client = await getDb().connect();
  try {
    await client.query("BEGIN");
    const username = await createSocialUsername(identity.provider, identity.providerUserId);
    const userResult = await client.query<PublicUser>(
      `INSERT INTO app_users (username, password_hash, role)
       VALUES ($1, NULL, $2)
       RETURNING id::text, username, role`,
      [username, role],
    );
    const user = userResult.rows[0];

    await client.query(
      `INSERT INTO social_accounts
         (user_id, provider, provider_user_id, email, display_name, profile_image_url)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        user.id,
        identity.provider,
        identity.providerUserId,
        identity.email,
        identity.displayName,
        identity.profileImageUrl,
      ],
    );
    await client.query(
      `INSERT INTO consents (user_id, type, granted)
       VALUES
         ($1, 'required', $2),
         ($1, 'personalization', $3),
         ($1, 'photo_analysis', $4),
         ($1, 'marketing', $5)`,
      [user.id, consents.required, consents.personalization, consents.photo_analysis, consents.marketing],
    );
    await client.query("COMMIT");
    return {
      ...user,
      displayName: identity.displayName,
      profileImageUrl: identity.profileImageUrl,
    };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
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
  const result = await getDb().query<PublicUser>(
    `SELECT users.id::text, users.username,
            users.role,
            accounts.display_name AS "displayName",
            accounts.profile_image_url AS "profileImageUrl"
     FROM auth_sessions sessions
     JOIN app_users users ON users.id = sessions.user_id
     LEFT JOIN social_accounts accounts ON accounts.user_id = users.id
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
