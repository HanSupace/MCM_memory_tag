import type { Pool, PoolClient } from "pg";
import { artworks as seedArtworks, exhibitions as seedExhibitions } from "../db/seeds";

type Queryable = Pick<Pool, "query"> | Pick<PoolClient, "query">;

export async function resolveExhibitionId(db: Queryable, reference: string) {
  if (/^\d+$/.test(reference)) {
    const result = await db.query<{ id: string }>("SELECT id::text FROM exhibitions WHERE id = $1", [reference]);
    return result.rows[0]?.id ?? null;
  }

  const seed = seedExhibitions.find((item) => item.id === reference);
  if (!seed) return null;
  const result = await db.query<{ id: string }>("SELECT id::text FROM exhibitions WHERE title = $1", [seed.title]);
  return result.rows[0]?.id ?? null;
}

export async function resolveExhibitionArtworkId(db: Queryable, reference: string) {
  if (/^\d+$/.test(reference)) {
    const result = await db.query<{ id: string }>("SELECT id::text FROM exhibition_artworks WHERE id = $1", [reference]);
    return result.rows[0]?.id ?? null;
  }

  const artwork = seedArtworks.find((item) => item.id === reference);
  const exhibition = artwork && seedExhibitions.find((item) => item.id === artwork.exhibitionId);
  if (!artwork || !exhibition) return null;
  const result = await db.query<{ id: string }>(
    `SELECT ea.id::text
     FROM exhibition_artworks ea
     JOIN exhibitions e ON e.id = ea.exhibition_id
     WHERE e.title = $1 AND ea.collect_identifier = $2
     LIMIT 1`,
    [exhibition.title, artwork.slug],
  );
  return result.rows[0]?.id ?? null;
}

export function seedArtworkFor(exhibitionTitle: string, collectIdentifier: string | null) {
  const exhibition = seedExhibitions.find((item) => item.title === exhibitionTitle);
  return exhibition && collectIdentifier
    ? seedArtworks.find((item) => item.exhibitionId === exhibition.id && item.slug === collectIdentifier) ?? null
    : null;
}

export function seedExhibitionFor(title: string) {
  return seedExhibitions.find((item) => item.title === title) ?? null;
}
