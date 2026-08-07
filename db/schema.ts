import { sql } from "drizzle-orm";
import { bigserial, bigint, char, index, pgTable, text, timestamp, uniqueIndex, varchar } from "drizzle-orm/pg-core";

export const users = pgTable(
  "app_users",
  {
    id: bigserial("id", { mode: "bigint" }).primaryKey(),
    username: varchar("username", { length: 20 }).notNull(),
    passwordHash: text("password_hash").notNull(),
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
