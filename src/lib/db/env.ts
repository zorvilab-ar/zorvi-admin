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

/**
 * El host directo `db.<ref>.supabase.co` es solo IPv6 (ENOTFOUND en redes IPv4).
 * Lo reescribimos al pooler en modo sesión (puerto 5432) y encodeamos la password.
 */
export function normalizeDatabaseUrl(url: string): string {
  if (!url) return url;

  const direct = url.match(
    /^(postgres(?:ql)?):\/\/([^:@/]+):([^@]+)@db\.([a-z0-9]+)\.supabase\.co(?::\d+)?(\/[^?]*)?(\?.*)?$/i,
  );
  if (direct) {
    const [, proto, user, pass, ref, path] = direct;
    const region = process.env.SUPABASE_REGION?.trim() || "sa-east-1";
    const poolUser = user.includes(".") ? user : `${user}.${ref}`;
    const encoded = encodePassword(pass);
    const dbPath = path || "/postgres";
    return `${proto}://${poolUser}:${encoded}@aws-0-${region}.pooler.supabase.com:5432${dbPath}`;
  }

  return encodeUrlPassword(url);
}

function encodePassword(pass: string): string {
  try {
    if (/%[0-9A-Fa-f]{2}/.test(pass) && !/[+*$]/.test(pass)) {
      return encodeURIComponent(decodeURIComponent(pass));
    }
  } catch {
    // sigue abajo
  }
  return encodeURIComponent(pass);
}

function encodeUrlPassword(url: string): string {
  const match = url.match(/^(postgres(?:ql)?):\/\/([^:@/]+):([^@]+)@(.+)$/i);
  if (!match) return url;
  const [, proto, user, pass, rest] = match;
  return `${proto}://${user}:${encodePassword(pass)}@${rest}`;
}

export function getDatabaseUrl(): string {
  hydrateEnvFiles();
  return normalizeDatabaseUrl(
    process.env.DATABASE_URL?.trim() ||
      process.env.POSTGRES_PRISMA_URL?.trim() ||
      process.env.POSTGRES_URL?.trim() ||
      process.env.POSTGRES_URL_NON_POOLING?.trim() ||
      "",
  );
}

/** Misma URL que la app: en Supabase usamos el pooler IPv4, no el host db.* */
export function getDirectDatabaseUrl(): string {
  hydrateEnvFiles();
  return normalizeDatabaseUrl(
    process.env.POSTGRES_URL_NON_POOLING?.trim() ||
      process.env.DIRECT_URL?.trim() ||
      process.env.DATABASE_URL?.trim() ||
      process.env.POSTGRES_URL?.trim() ||
      "",
  );
}

export function isRemoteDatabaseUrl(url: string): boolean {
  if (!url) return false;
  if (/127\.0\.0\.1|localhost/.test(url)) return false;
  return /supabase\.(co|com)|sslmode=require|neon\.tech|railway|amazonaws|pooler/i.test(
    url,
  );
}

export const LOCAL_DATABASE_URL =
  "postgres://zorvi:zorvi@127.0.0.1:5433/zorvi";
