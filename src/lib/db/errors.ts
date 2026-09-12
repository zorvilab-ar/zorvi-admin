function haystackOf(error: unknown): string {
  if (typeof error !== "object" || error === null) return "";
  const err = error as { name?: string; code?: string; message?: string };
  return `${err.name ?? ""} ${err.code ?? ""} ${err.message ?? ""}`;
}

export function isSchemaMissingError(error: unknown): boolean {
  const pattern = /42P01|relation .* does not exist/i;
  let current: unknown = error;
  for (let i = 0; i < 6 && current; i++) {
    if (pattern.test(haystackOf(current))) return true;
    if (typeof current !== "object" || current === null) break;
    current = (current as { cause?: unknown }).cause;
  }
  return false;
}

export function isDbConnectionError(error: unknown): boolean {
  const pattern =
    /DbUnavailableError|ECONNREFUSED|ETIMEDOUT|ENOTFOUND|ECONNRESET|EPIPE|EAI_AGAIN|connection refused|timeout expired|DB_UNAVAILABLE|the database system is starting up/i;

  let current: unknown = error;
  for (let i = 0; i < 6 && current; i++) {
    if (pattern.test(haystackOf(current))) return true;
    if (typeof current !== "object" || current === null) break;
    current = (current as { cause?: unknown }).cause;
  }
  return false;
}

export function dbErrorToast(error: unknown): string {
  if (isDbConnectionError(error)) {
    return "La base de datos no está disponible. Levantá Docker o revisá DATABASE_URL.";
  }
  if (error instanceof Error && error.name === "ValidationError") {
    return error.message;
  }
  return "No se pudo guardar. Revisá los datos.";
}
