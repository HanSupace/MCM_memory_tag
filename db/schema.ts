import { sql } from "drizzle-orm";
import { bigserial, bigint, boolean, char, customType, index, jsonb, pgTable, text, timestamp, uniqueIndex, varchar } from "drizzle-orm/pg-core";

const bytea = customType<{ data: Buffer }>({
  dataType() {
    return "bytea";
  },
});

export const users = pgTable(
  "app_users",
  {
    id: bigserial("id", { mode: "bigint" }).primaryKey(),
    username: varchar("username", { length: 20 }).notNull(),
    passwordHash: text("password_hash"),
    // visitor | exhibition_operator | content_operator (PRD 역할: 방문 고객 / 전시 운영자 / MCM 콘텐츠 운영자)
    role: varchar("role", { length: 20 }).notNull().default("visitor"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex("app_users_username_lower_unique").on(sql`lower(${table.username})`)],
);

export const sessions = pgTable(
  "auth_sessions",
  {
    id: bigserial("id", { mode: "bigint" }).primaryKey(),
    userId: bigint("user_id", { mode: "bigint" }).notNull().references(() => users.id, { onDelete: "cascade" }),
    tokenHash: char("token_hash", { length: 64 }).notNull().unique(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("auth_sessions_user_id_idx").on(table.userId),
    index("auth_sessions_expires_at_idx").on(table.expiresAt),
  ],
);

export const socialAccounts = pgTable(
  "social_accounts",
  {
    id: bigserial("id", { mode: "bigint" }).primaryKey(),
    userId: bigint("user_id", { mode: "bigint" }).notNull().references(() => users.id, { onDelete: "cascade" }),
    provider: varchar("provider", { length: 20 }).notNull(),
    providerUserId: varchar("provider_user_id", { length: 255 }).notNull(),
    email: varchar("email", { length: 320 }),
    displayName: varchar("display_name", { length: 120 }),
    profileImageUrl: text("profile_image_url"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("social_accounts_user_id_idx").on(table.userId),
    uniqueIndex("social_accounts_provider_user_unique").on(table.provider, table.providerUserId),
  ],
);

// ---------------------------------------------------------------------------
// 전시 / 작가
// ---------------------------------------------------------------------------

export const artists = pgTable("artists", {
  id: bigserial("id", { mode: "bigint" }).primaryKey(),
  name: varchar("name", { length: 120 }).notNull(),
  bio: text("bio"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const exhibitions = pgTable("exhibitions", {
  id: bigserial("id", { mode: "bigint" }).primaryKey(),
  title: varchar("title", { length: 120 }).notNull(),
  description: text("description"),
  heroImageUrl: text("hero_image_url"),
  venue: varchar("venue", { length: 160 }).notNull(),
  startAt: timestamp("start_at", { withTimezone: true }).notNull(),
  endAt: timestamp("end_at", { withTimezone: true }).notNull(),
  operatingHours: varchar("operating_hours", { length: 160 }),
  // upcoming | ongoing | ended — 운영자가 승인한 상태값(자동 제안 + 운영자 승인 방식)
  status: varchar("status", { length: 20 }).notNull().default("upcoming"),
  published: boolean("published").notNull().default(false),
  createdBy: bigint("created_by", { mode: "bigint" }).references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const exhibitionArtists = pgTable(
  "exhibition_artists",
  {
    id: bigserial("id", { mode: "bigint" }).primaryKey(),
    exhibitionId: bigint("exhibition_id", { mode: "bigint" }).notNull().references(() => exhibitions.id, { onDelete: "cascade" }),
    artistId: bigint("artist_id", { mode: "bigint" }).notNull().references(() => artists.id, { onDelete: "cascade" }),
  },
  (table) => [uniqueIndex("exhibition_artists_unique").on(table.exhibitionId, table.artistId)],
);

// ---------------------------------------------------------------------------
// 작품 (공통 정보 + 전시별 연결)
// ---------------------------------------------------------------------------

export const artworks = pgTable("artworks", {
  id: bigserial("id", { mode: "bigint" }).primaryKey(),
  title: varchar("title", { length: 160 }).notNull(),
  artistId: bigint("artist_id", { mode: "bigint" }).references(() => artists.id),
  productionYear: varchar("production_year", { length: 20 }),
  material: varchar("material", { length: 160 }),
  imageUrl: text("image_url"),
  baseDescription: text("base_description"),
  appreciationPoints: text("appreciation_points"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const exhibitionArtworks = pgTable(
  "exhibition_artworks",
  {
    id: bigserial("id", { mode: "bigint" }).primaryKey(),
    exhibitionId: bigint("exhibition_id", { mode: "bigint" }).notNull().references(() => exhibitions.id, { onDelete: "cascade" }),
    artworkId: bigint("artwork_id", { mode: "bigint" }).notNull().references(() => artworks.id, { onDelete: "cascade" }),
    // QR / NFC / 코드 공용 수집 식별값 — 동일 전시 내 유일
    collectIdentifier: varchar("collect_identifier", { length: 120 }).notNull(),
    exhibitionDescription: text("exhibition_description"),
    published: boolean("published").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("exhibition_artworks_identifier_unique").on(table.exhibitionId, table.collectIdentifier),
    uniqueIndex("exhibition_artworks_exhibition_artwork_unique").on(table.exhibitionId, table.artworkId),
  ],
);

// ---------------------------------------------------------------------------
// 키링 / 방문 인증 / 작품 수집
// ---------------------------------------------------------------------------

export const keyrings = pgTable("keyrings", {
  id: bigserial("id", { mode: "bigint" }).primaryKey(),
  userId: bigint("user_id", { mode: "bigint" }).notNull().unique().references(() => users.id, { onDelete: "cascade" }),
  keyringCode: varchar("keyring_code", { length: 64 }).notNull().unique(),
  connectedAt: timestamp("connected_at", { withTimezone: true }).notNull().defaultNow(),
});

export const visits = pgTable(
  "visits",
  {
    id: bigserial("id", { mode: "bigint" }).primaryKey(),
    userId: bigint("user_id", { mode: "bigint" }).notNull().references(() => users.id, { onDelete: "cascade" }),
    exhibitionId: bigint("exhibition_id", { mode: "bigint" }).notNull().references(() => exhibitions.id, { onDelete: "cascade" }),
    visitedAt: timestamp("visited_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("visits_user_exhibition_unique").on(table.userId, table.exhibitionId),
    index("visits_exhibition_id_idx").on(table.exhibitionId),
  ],
);

export const collections = pgTable(
  "collections",
  {
    id: bigserial("id", { mode: "bigint" }).primaryKey(),
    userId: bigint("user_id", { mode: "bigint" }).notNull().references(() => users.id, { onDelete: "cascade" }),
    exhibitionArtworkId: bigint("exhibition_artwork_id", { mode: "bigint" }).notNull().references(() => exhibitionArtworks.id, { onDelete: "cascade" }),
    collectedAt: timestamp("collected_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex("collections_user_artwork_unique").on(table.userId, table.exhibitionArtworkId)],
);

// ---------------------------------------------------------------------------
// 한줄평 / 갤러리
// ---------------------------------------------------------------------------

export const notes = pgTable(
  "notes",
  {
    id: bigserial("id", { mode: "bigint" }).primaryKey(),
    userId: bigint("user_id", { mode: "bigint" }).notNull().references(() => users.id, { onDelete: "cascade" }),
    exhibitionArtworkId: bigint("exhibition_artwork_id", { mode: "bigint" }).notNull().references(() => exhibitionArtworks.id, { onDelete: "cascade" }),
    content: varchar("content", { length: 200 }).notNull(),
    visibility: varchar("visibility", { length: 20 }).notNull().default("private"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex("notes_user_artwork_unique").on(table.userId, table.exhibitionArtworkId)],
);

export const galleryPhotos = pgTable(
  "gallery_photos",
  {
    id: bigserial("id", { mode: "bigint" }).primaryKey(),
    userId: bigint("user_id", { mode: "bigint" }).notNull().references(() => users.id, { onDelete: "cascade" }),
    exhibitionId: bigint("exhibition_id", { mode: "bigint" }).notNull().references(() => exhibitions.id, { onDelete: "cascade" }),
    fileRef: text("file_ref").notNull(),
    imageData: bytea("image_data"),
    mimeType: varchar("mime_type", { length: 100 }),
    analysisConsent: boolean("analysis_consent").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("gallery_photos_user_exhibition_idx").on(table.userId, table.exhibitionId)],
);

// ---------------------------------------------------------------------------
// AI 도슨트 근거 자료
// ---------------------------------------------------------------------------

export const docentSources = pgTable(
  "docent_sources",
  {
    id: bigserial("id", { mode: "bigint" }).primaryKey(),
    artworkId: bigint("artwork_id", { mode: "bigint" }).notNull().references(() => artworks.id, { onDelete: "cascade" }),
    sourceType: varchar("source_type", { length: 40 }).notNull(),
    sourceInfo: text("source_info"),
    body: text("body").notNull(),
    published: boolean("published").notNull().default(false),
    // pending | approved | rejected
    reviewStatus: varchar("review_status", { length: 20 }).notNull().default("pending"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("docent_sources_artwork_id_idx").on(table.artworkId)],
);

export const docentConversations = pgTable(
  "docent_conversations",
  {
    id: bigserial("id", { mode: "bigint" }).primaryKey(),
    userId: bigint("user_id", { mode: "bigint" }).notNull().references(() => users.id, { onDelete: "cascade" }),
    exhibitionArtworkId: bigint("exhibition_artwork_id", { mode: "bigint" }).notNull().references(() => exhibitionArtworks.id, { onDelete: "cascade" }),
    // user | assistant
    role: varchar("role", { length: 20 }).notNull(),
    content: text("content").notNull(),
    // 취향 리포트 등 개인화 근거로 이 메시지를 활용해도 되는지 여부 (고객이 대화창에서 선택)
    sharePersonalization: boolean("share_personalization").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("docent_conversations_user_artwork_idx").on(table.userId, table.exhibitionArtworkId)],
);

// ---------------------------------------------------------------------------
// 취향 프로필 / 제품 추천
// ---------------------------------------------------------------------------

export const tasteProfiles = pgTable("taste_profiles", {
  id: bigserial("id", { mode: "bigint" }).primaryKey(),
  userId: bigint("user_id", { mode: "bigint" }).notNull().unique().references(() => users.id, { onDelete: "cascade" }),
  items: jsonb("items").notNull().default([]),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const productRecommendations = pgTable(
  "product_recommendations",
  {
    id: bigserial("id", { mode: "bigint" }).primaryKey(),
    userId: bigint("user_id", { mode: "bigint" }).notNull().references(() => users.id, { onDelete: "cascade" }),
    productRef: varchar("product_ref", { length: 120 }).notNull(),
    reason: text("reason"),
    impressedAt: timestamp("impressed_at", { withTimezone: true }),
    clickedAt: timestamp("clicked_at", { withTimezone: true }),
    savedAt: timestamp("saved_at", { withTimezone: true }),
    dismissedAt: timestamp("dismissed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("product_recommendations_user_id_idx").on(table.userId)],
);

// ---------------------------------------------------------------------------
// 시간차 콘텐츠 공개
// ---------------------------------------------------------------------------

export const contentUnlocks = pgTable(
  "content_unlocks",
  {
    id: bigserial("id", { mode: "bigint" }).primaryKey(),
    userId: bigint("user_id", { mode: "bigint" }).notNull().references(() => users.id, { onDelete: "cascade" }),
    exhibitionId: bigint("exhibition_id", { mode: "bigint" }).notNull().references(() => exhibitions.id, { onDelete: "cascade" }),
    contentType: varchar("content_type", { length: 40 }).notNull(),
    unlockAt: timestamp("unlock_at", { withTimezone: true }).notNull(),
    viewedAt: timestamp("viewed_at", { withTimezone: true }),
  },
  (table) => [uniqueIndex("content_unlocks_user_exhibition_type_unique").on(table.userId, table.exhibitionId, table.contentType)],
);

// ---------------------------------------------------------------------------
// 동의 항목
// ---------------------------------------------------------------------------

export const consents = pgTable(
  "consents",
  {
    id: bigserial("id", { mode: "bigint" }).primaryKey(),
    userId: bigint("user_id", { mode: "bigint" }).notNull().references(() => users.id, { onDelete: "cascade" }),
    // required | personalization | photo_analysis | marketing
    type: varchar("type", { length: 30 }).notNull(),
    granted: boolean("granted").notNull().default(false),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex("consents_user_type_unique").on(table.userId, table.type)],
);
