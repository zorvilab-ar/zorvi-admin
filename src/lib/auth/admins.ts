/** Lista de emails con acceso al admin. Vacía = cualquier usuario de Auth. */
export function allowedAdminEmails(): string[] {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

export function isAllowedAdmin(email: string | null | undefined): boolean {
  if (!email) return false;
  const allowlist = allowedAdminEmails();
  if (allowlist.length === 0) return true;
  return allowlist.includes(email.trim().toLowerCase());
}
