import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { appConfig, getRequiredEnv } from "../config.js";

let pool: Pool | null = null;

export function hasDatabaseUrl(): boolean {
  return Boolean(appConfig.databaseUrl);
}

export function createPool(): Pool {
  if (!pool) {
    pool = new Pool({
      connectionString: getRequiredEnv("DATABASE_URL"),
      max: 10,
    });
  }

  return pool;
}

export function getDb() {
  return drizzle(createPool());
}

export async function closePool() {
  if (pool) {
    await pool.end();
    pool = null;
  }
}
