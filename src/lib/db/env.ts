import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const ENV_FILES = [".env.local", ".env"];

function unquote(value: string) {
  return value.trim().replace(/^["']|["']$/g, "");
}

/** Carga .env.local / .env si el proceso no tiene las keys (tsx, drizzle-kit). */
export function hydrateEnvFiles() {
  for (const file of ENV_FILES) {
    const path = resolve(process.cwd(), file);
    if (!existsSync(path)) continue;
    for (const line of readFileSync(path, "utf8").split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq <= 0) continue;
      const key = trimmed.slice(0, eq).trim();
      const value = unquote(trimmed.slice(eq + 1));
      if (process.env[key] === undefined) process.env[key] = value;
    }
  }
}

export function getDatabaseUrl(): string {
  hydrateEnvFiles();
  return (
    process.env.DATABASE_URL?.trim() ||
    process.env.POSTGRES_PRISMA_URL?.trim() ||
    process.env.POSTGRES_URL?.trim() ||
    process.env.POSTGRES_URL_NON_POOLING?.trim() ||
    ""
  );
}

/** URL directa (sin pooler). Drizzle Kit la necesita para push/migrate. */
export function getDirectDatabaseUrl(): string {
  hydrateEnvFiles();
  return (
    process.env.POSTGRES_URL_NON_POOLING?.trim() ||
    process.env.DIRECT_URL?.trim() ||
    getDatabaseUrl()
  );
}

export function isRemoteDatabaseUrl(url: string): boolean {
  if (!url) return false;
  if (/127\.0\.0\.1|localhost/.test(url)) return false;
  return /supabase\.(co|com)|sslmode=require|neon\.tech|railway|amazonaws/i.test(
    url,
  );
}

export const LOCAL_DATABASE_URL =
  "postgres://zorvi:zorvi@127.0.0.1:5433/zorvi";
