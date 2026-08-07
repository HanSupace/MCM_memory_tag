import { Pool, type PoolConfig } from "pg";

type DatabaseGlobal = typeof globalThis & {
  mcmPgPool?: Pool;
  mcmAuthSchemaPromise?: Promise<void>;
};

const databaseGlobal = globalThis as DatabaseGlobal;

function createPool() {
  const hasDatabaseUrl = Boolean(process.env.DATABASE_URL);
  const hasPgEnvironment = Boolean(process.env.PGHOST && process.env.PGDATABASE && process.env.PGUSER);

  if (!hasDatabaseUrl && !hasPgEnvironment) {
    throw new Error("DATABASE_URL 또는 PostgreSQL 환경 변수가 설정되지 않았습니다.");
  }

  const config: PoolConfig = {
    max: Number(process.env.PGPOOL_MAX ?? 5),
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 8_000,
  };

  if (process.env.DATABASE_URL) {
    config.connectionString = process.env.DATABASE_URL;
  }

  if (process.env.DATABASE_SSL === "true") {
    config.ssl = { rejectUnauthorized: false };
  }

  return new Pool(config);
}

export function getDb() {
  if (!databaseGlobal.mcmPgPool) {
    databaseGlobal.mcmPgPool = createPool();
  }

  return databaseGlobal.mcmPgPool;
}

export async function ensureAuthSchema() {
  if (!databaseGlobal.mcmAuthSchemaPromise) {
    databaseGlobal.mcmAuthSchemaPromise = (async () => {
      const db = getDb();

      await db.query(`
        CREATE TABLE IF NOT EXISTS app_users (
          id BIGSERIAL PRIMARY KEY,
          username VARCHAR(20) NOT NULL,
          password_hash TEXT NOT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `);

      await db.query(`
        CREATE UNIQUE INDEX IF NOT EXISTS app_users_username_lower_unique
        ON app_users (LOWER(username))
      `);

      await db.query(`
        CREATE TABLE IF NOT EXISTS auth_sessions (
          id BIGSERIAL PRIMARY KEY,
          user_id BIGINT NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
          token_hash CHAR(64) NOT NULL UNIQUE,
          expires_at TIMESTAMPTZ NOT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `);

      await db.query(`
        CREATE INDEX IF NOT EXISTS auth_sessions_user_id_idx
        ON auth_sessions (user_id)
      `);

      await db.query(`
        CREATE INDEX IF NOT EXISTS auth_sessions_expires_at_idx
        ON auth_sessions (expires_at)
      `);
    })().catch((error) => {
      databaseGlobal.mcmAuthSchemaPromise = undefined;
      throw error;
    });
  }

  return databaseGlobal.mcmAuthSchemaPromise;
}
