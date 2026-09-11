import { cache } from "react";
import { getDatabaseUrl } from "./env";
import { getPool, CONNECT_TIMEOUT_MS } from "./pool";
import { isSchemaMissingError } from "./errors";

export type DbIssueReason =
  | "missing_env"
  | "unreachable"
  | "schema_missing"
  | "not_seeded";

export type DbStatus =
  | { ok: true }
  | { ok: false; reason: DbIssueReason; title: string; hint: string };

export class DbUnavailableError extends Error {
  readonly reason: DbIssueReason;
  readonly hint: string;

  constructor(status: Extract<DbStatus, { ok: false }>) {
    super(`DB_UNAVAILABLE:${status.reason}:${status.title}`);
    this.name = "DbUnavailableError";
    this.reason = status.reason;
    this.hint = status.hint;
  }
}

const COPY: Record<
  DbIssueReason,
  { title: string; hint: string }
> = {
  missing_env: {
    title: "Falta la URL de Postgres",
    hint: "En local copiá .env.example a .env.local. En Vercel, conectá Supabase: el Marketplace inyecta POSTGRES_URL / DATABASE_URL.",
  },
  unreachable: {
    title: "No hay conexión con la base de datos",
    hint: "En local levantá Postgres con `make db-up`. En Vercel, DATABASE_URL tiene que ser el connection string de Postgres (postgresql://…), no la URL https del proyecto.",
  },
  schema_missing: {
    title: "La base está vacía: falta el schema",
    hint: "Con la base arriba, corré `make db-push` o `pnpm db:push` para crear las tablas.",
  },
  not_seeded: {
    title: "La base no tiene datos iniciales",
    hint: "Corré `make db-seed` o `pnpm db:seed` para cargar parámetros, canales y el catálogo de arranque.",
  },
};

export function dbIssue(
  reason: DbIssueReason,
): Extract<DbStatus, { ok: false }> {
  return { ok: false, reason, ...COPY[reason] };
}

function pgCode(error: unknown): string {
  if (typeof error !== "object" || error === null) return "";
  const err = error as { code?: string; message?: string };
  return String(err.code ?? err.message ?? "");
}

export { isDbConnectionError } from "./errors";

async function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      const error = new Error("ETIMEDOUT");
      (error as { code?: string }).code = "ETIMEDOUT";
      reject(error);
    }, ms);
  });
  try {
    return await Promise.race([promise, timeout]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

async function probeDb(): Promise<DbStatus> {
  const url = getDatabaseUrl();
  if (!url) return dbIssue("missing_env");

  try {
    const result = await withTimeout(
      getPool().query("select 1 from settings limit 1"),
      CONNECT_TIMEOUT_MS,
    );
    if (!result.rowCount) return dbIssue("not_seeded");
    return { ok: true };
  } catch (error) {
    if (isSchemaMissingError(error) || pgCode(error) === "42P01") {
      return dbIssue("schema_missing");
    }
    return dbIssue("unreachable");
  }
}

export const getDbStatus = cache(probeDb);
