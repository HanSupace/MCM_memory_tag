import { createHash, randomBytes } from "node:crypto";
import type { Pool, PoolClient } from "pg";

type Queryable = Pick<Pool, "query"> | Pick<PoolClient, "query">;

export type AccessSource = "keyring" | "venue_qr" | "artwork_qr" | "legacy";
export type EntryTokenType = "keyring" | "venue_qr";

type EntryTokenRow = {
  exhibition_id: string;
  token_type: EntryTokenType;
};

type VisitRow = {
  visited_at: string;
};

export function normalizeEntryToken(value: unknown): string | null {
  if (typeof value !== "string") return null;

  const trimmed = value.trim();
  if (!trimmed) return null;

  let candidate = trimmed;
  try {
    const parsed = new URL(trimmed, "https://memory-tag.invalid");
    const pathSegments = parsed.pathname.split("/").filter(Boolean);
    if (pathSegments.at(-2) === "visit") {
      candidate = pathSegments.at(-1) ?? "";
    } else {
      candidate = parsed.searchParams.get("visit") ?? trimmed;
    }
  } catch {
    candidate = trimmed;
  }

  return /^[A-Za-z0-9_-]{8,128}$/.test(candidate) ? candidate : null;
}

export function hashEntryToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function generateEntryToken() {
  return randomBytes(32).toString("base64url");
}

export function generateKeyringEntryToken() {
  const segment = () => randomBytes(2).toString("hex").toUpperCase();
  return `MCM-${segment()}-${segment()}`;
}

export async function resolveEntryToken(db: Queryable, value: unknown): Promise<{ exhibitionId: string; source: EntryTokenType } | null> {
  const token = normalizeEntryToken(value);
  if (!token) return null;

  const result = await db.query<EntryTokenRow>(
    `SELECT t.exhibition_id::text, t.token_type
     FROM exhibition_entry_tokens t
     JOIN exhibitions e ON e.id = t.exhibition_id
     WHERE t.token_hash = $1
       AND t.active = true
       AND e.published = true
       AND t.token_type IN ('keyring', 'venue_qr')
       AND (
         t.token_type = 'keyring'
         OR (e.start_at <= NOW() AND e.end_at >= NOW())
       )
     LIMIT 1`,
    [hashEntryToken(token)],
  );
  const row = result.rows[0];
  return row ? { exhibitionId: row.exhibition_id, source: row.token_type } : null;
}

export async function hasExhibitionAccess(db: Queryable, userId: string, exhibitionId: string) {
  const result = await db.query(
    `SELECT 1
     FROM visits
     WHERE user_id = $1 AND exhibition_id = $2
     LIMIT 1`,
    [userId, exhibitionId],
  );
  return (result.rowCount ?? 0) > 0;
}

export async function ensureExhibitionVisit(db: Queryable, userId: string, exhibitionId: string, accessSource: AccessSource) {
  const inserted = await db.query<VisitRow>(
    `INSERT INTO visits (user_id, exhibition_id, access_source)
     VALUES ($1, $2, $3)
     ON CONFLICT (user_id, exhibition_id) DO NOTHING
     RETURNING visited_at`,
    [userId, exhibitionId, accessSource],
  );

  if (inserted.rows[0]) {
    return { visitedAt: inserted.rows[0].visited_at, alreadyVisited: false };
  }

  const existing = await db.query<VisitRow>(
    `SELECT visited_at
     FROM visits
     WHERE user_id = $1 AND exhibition_id = $2`,
    [userId, exhibitionId],
  );
  return { visitedAt: existing.rows[0]?.visited_at ?? new Date().toISOString(), alreadyVisited: true };
}
