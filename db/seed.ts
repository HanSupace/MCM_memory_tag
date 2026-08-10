/**
 * 전시/작품 카탈로그 시드 데이터(db/seeds/*)를 실제 PostgreSQL 테이블에 반영한다.
 *
 * 실행 전 준비:
 *   1. drizzle/0001_great_arclight.sql 마이그레이션이 대상 DB에 이미 적용되어 있어야 한다.
 *   2. .env(또는 환경 변수)에 DATABASE_URL(또는 PGHOST/PGDATABASE/PGUSER 등)이 설정되어 있어야 한다.
 *
 * 실행:
 *   npx tsx db/seed.ts
 *
 * 재실행 안전성:
 *   전시는 title, 작가는 name, 작품은 title을 기준으로 이미 있으면 건너뛴다.
 *   db/seeds/exhibition-data.ts, artwork-data.ts에 새 항목이 추가된 뒤 다시 실행하면
 *   새로 추가된 항목만 반영되고 기존 데이터는 중복 생성되지 않는다.
 *
 * 알려진 한계 (카탈로그 원본에 없는 값에 대한 가정):
 *   - 운영 시간: 카탈로그에 시간 정보가 없어 10:00~18:00(KST)로 임시 지정한다.
 *   - collect_identifier(QR/NFC 식별값): 실물 QR이 없어 작품 slug를 임시값으로 사용한다.
 *   - hero_image_url / image_url: 카탈로그에 이미지가 없어 비워둔다 (이슈 #20 참고).
 *   - published: 큐레이션된 공식 콘텐츠이므로 true로 등록한다.
 */
import type { Pool } from "pg";
import { getDb } from "../lib/db";
import { artworks, exhibitions } from "./seeds";
import type { ArtworkSeed, ExhibitionSeed } from "./types/exhibition";

function toTimestamp(dateOnly: string, time: string): string {
  return `${dateOnly}T${time}+09:00`;
}

function buildExhibitionDescription(seed: ExhibitionSeed): string {
  const parts = [
    seed.summary,
    seed.description,
    `[전시 성격] ${seed.nature}`,
    `[핵심 메시지] ${seed.keyMessage}`,
  ];
  if (seed.featuredQuote) parts.push(`"${seed.featuredQuote}"`);
  return parts.filter(Boolean).join("\n\n");
}

function buildArtworkBaseDescription(seed: ArtworkSeed): string {
  const parts = [seed.summary, seed.description];
  if (seed.titleMeaning) parts.push(`[제목의 의미] ${seed.titleMeaning}`);
  return parts.filter(Boolean).join("\n\n");
}

function buildArtworkAppreciationPoints(seed: ArtworkSeed): string {
  const parts = [seed.interpretation];
  if (seed.viewingTips.length > 0) {
    parts.push(`[감상 팁]\n${seed.viewingTips.map((tip) => `- ${tip}`).join("\n")}`);
  }
  return parts.filter(Boolean).join("\n\n");
}

function buildDocentBody(seed: ArtworkSeed): string {
  const parts = [seed.interpretation];
  if (seed.tmi.length > 0) parts.push(`[TMI]\n${seed.tmi.map((item) => `- ${item}`).join("\n")}`);
  if (seed.facts.length > 0) parts.push(`[사실 확인]\n${seed.facts.map((item) => `- ${item}`).join("\n")}`);
  if (seed.contents && seed.contents.length > 0) {
    parts.push(`[추가 콘텐츠]\n${seed.contents.map((item) => `- ${item}`).join("\n")}`);
  }
  return parts.filter(Boolean).join("\n\n");
}

async function findOrCreateArtist(db: Pool, name: string): Promise<string> {
  const existing = await db.query<{ id: string }>("SELECT id FROM artists WHERE name = $1", [name]);
  if (existing.rows[0]) return existing.rows[0].id;

  const inserted = await db.query<{ id: string }>(
    "INSERT INTO artists (name) VALUES ($1) RETURNING id",
    [name],
  );
  return inserted.rows[0].id;
}

async function findOrCreateExhibition(db: Pool, seed: ExhibitionSeed): Promise<{ id: string; created: boolean }> {
  const existing = await db.query<{ id: string }>("SELECT id FROM exhibitions WHERE title = $1", [seed.title]);
  if (existing.rows[0]) return { id: existing.rows[0].id, created: false };

  const inserted = await db.query<{ id: string }>(
    `INSERT INTO exhibitions (title, description, venue, start_at, end_at, status, published)
     VALUES ($1, $2, $3, $4, $5, $6, true)
     RETURNING id`,
    [
      seed.title,
      buildExhibitionDescription(seed),
      seed.venue,
      toTimestamp(seed.startDate, "10:00:00"),
      toTimestamp(seed.endDate, "18:00:00"),
      seed.status,
    ],
  );
  return { id: inserted.rows[0].id, created: true };
}

async function linkExhibitionArtist(db: Pool, exhibitionId: string, artistId: string): Promise<void> {
  await db.query(
    `INSERT INTO exhibition_artists (exhibition_id, artist_id)
     VALUES ($1, $2)
     ON CONFLICT (exhibition_id, artist_id) DO NOTHING`,
    [exhibitionId, artistId],
  );
}

async function findOrCreateArtwork(
  db: Pool,
  seed: ArtworkSeed,
  artistId: string | null,
): Promise<{ id: string; created: boolean }> {
  const existing = await db.query<{ id: string }>("SELECT id FROM artworks WHERE title = $1", [seed.title]);
  if (existing.rows[0]) return { id: existing.rows[0].id, created: false };

  const inserted = await db.query<{ id: string }>(
    `INSERT INTO artworks (title, artist_id, material, base_description, appreciation_points)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id`,
    [seed.title, artistId, seed.material ?? null, buildArtworkBaseDescription(seed), buildArtworkAppreciationPoints(seed)],
  );
  return { id: inserted.rows[0].id, created: true };
}

async function linkExhibitionArtwork(
  db: Pool,
  exhibitionId: string,
  artworkId: string,
  collectIdentifier: string,
  exhibitionDescription: string,
): Promise<void> {
  await db.query(
    `INSERT INTO exhibition_artworks (exhibition_id, artwork_id, collect_identifier, exhibition_description, published)
     VALUES ($1, $2, $3, $4, true)
     ON CONFLICT (exhibition_id, artwork_id) DO NOTHING`,
    [exhibitionId, artworkId, collectIdentifier, exhibitionDescription],
  );
}

async function createDocentSourceIfMissing(db: Pool, artworkId: string, seed: ArtworkSeed): Promise<boolean> {
  const existing = await db.query<{ id: string }>(
    "SELECT id FROM docent_sources WHERE artwork_id = $1 AND source_type = $2",
    [artworkId, "notion_catalog"],
  );
  if (existing.rows[0]) return false;

  await db.query(
    `INSERT INTO docent_sources (artwork_id, source_type, source_info, body, published, review_status)
     VALUES ($1, $2, $3, $4, true, 'approved')`,
    [
      artworkId,
      "notion_catalog",
      `${seed.source.label} (${seed.source.url}) — 확인일 ${seed.source.accessedAt}`,
      buildDocentBody(seed),
    ],
  );
  return true;
}

async function main() {
  try {
    process.loadEnvFile();
  } catch {
    // .env가 없으면 무시한다 (환경 변수가 이미 다른 방식으로 설정된 경우 대비).
  }

  const db = getDb();
  const stats = {
    exhibitionsCreated: 0,
    exhibitionsSkipped: 0,
    artworksCreated: 0,
    artworksSkipped: 0,
    docentSourcesCreated: 0,
  };

  const exhibitionIdBySeedId = new Map<string, string>();

  for (const exhibitionSeed of exhibitions) {
    const artistIds: string[] = [];
    for (const artistName of exhibitionSeed.artists) {
      artistIds.push(await findOrCreateArtist(db, artistName));
    }

    const { id: exhibitionId, created } = await findOrCreateExhibition(db, exhibitionSeed);
    exhibitionIdBySeedId.set(exhibitionSeed.id, exhibitionId);
    if (created) {
      stats.exhibitionsCreated++;
    } else {
      stats.exhibitionsSkipped++;
    }

    for (const artistId of artistIds) {
      await linkExhibitionArtist(db, exhibitionId, artistId);
    }

    console.log(`[전시] ${created ? "생성" : "이미 존재"}: ${exhibitionSeed.title}`);
  }

  for (const artworkSeed of artworks) {
    const exhibitionId = exhibitionIdBySeedId.get(artworkSeed.exhibitionId);
    if (!exhibitionId) {
      console.warn(`[작품] 건너뜀: "${artworkSeed.title}"의 전시(${artworkSeed.exhibitionId})를 찾을 수 없음`);
      continue;
    }

    const artistId = await findOrCreateArtist(db, artworkSeed.artistName);
    const { id: artworkId, created } = await findOrCreateArtwork(db, artworkSeed, artistId);
    if (created) {
      stats.artworksCreated++;
    } else {
      stats.artworksSkipped++;
    }

    await linkExhibitionArtwork(db, exhibitionId, artworkId, artworkSeed.slug, artworkSeed.summary);
    if (await createDocentSourceIfMissing(db, artworkId, artworkSeed)) {
      stats.docentSourcesCreated++;
    }

    console.log(`[작품] ${created ? "생성" : "이미 존재"}: ${artworkSeed.title}`);
  }

  console.log("\n=== 시드 완료 ===");
  console.log(`전시: 신규 ${stats.exhibitionsCreated} / 기존 ${stats.exhibitionsSkipped}`);
  console.log(`작품: 신규 ${stats.artworksCreated} / 기존 ${stats.artworksSkipped}`);
  console.log(`AI 도슨트 근거자료: 신규 ${stats.docentSourcesCreated}`);

  await db.end();
}

main().catch((error: unknown) => {
  console.error("시드 스크립트 실패:", error);
  process.exitCode = 1;
});
