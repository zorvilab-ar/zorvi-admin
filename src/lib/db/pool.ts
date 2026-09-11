import { Pool } from "pg";
import { getDatabaseUrl, isRemoteDatabaseUrl } from "./env";

const globalForDb = globalThis as unknown as {
  pool?: Pool;
  poolKey?: string;
};

/** Local Docker responde al toque; Vercel → São Paulo necesita más margen en cold start. */
export const CONNECT_TIMEOUT_MS = process.env.VERCEL ? 8000 : 2500;

export function getPool(): Pool {
  const url = getDatabaseUrl();
  const key = `${url}|${CONNECT_TIMEOUT_MS}`;

  if (!globalForDb.pool || globalForDb.poolKey !== key) {
    void globalForDb.pool?.end().catch(() => undefined);
    globalForDb.pool = new Pool({
      connectionString: url || "postgres://127.0.0.1:9/zorvi",
      max: process.env.VERCEL ? 3 : 10,
      connectionTimeoutMillis: url ? CONNECT_TIMEOUT_MS : 1,
      idleTimeoutMillis: 10_000,
      ssl: isRemoteDatabaseUrl(url) ? { rejectUnauthorized: false } : undefined,
    });
    globalForDb.poolKey = key;
  }
  return globalForDb.pool;
}
