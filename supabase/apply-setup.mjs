// Aplica supabase/setup.sql contra la DB apuntada por DATABASE_URL.
// Uso:  DATABASE_URL='postgres://postgres:...@...supabase.com:5432/postgres' node supabase/apply-setup.mjs
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import pg from "pg";

const url = process.env.DATABASE_URL?.trim();
if (!url) {
  console.error("Falta DATABASE_URL (connection string de Postgres de prod).");
  process.exit(1);
}

const here = dirname(fileURLToPath(import.meta.url));
const sql = readFileSync(join(here, "setup.sql"), "utf8");

const client = new pg.Client({
  connectionString: url,
  ssl: { rejectUnauthorized: false },
});

try {
  await client.connect();
  await client.query(sql);
  console.log("✅ setup.sql aplicado: RLS ON + grants revocados + realtime de sales.");
} catch (err) {
  console.error("❌ Error aplicando setup.sql:", err.message);
  process.exitCode = 1;
} finally {
  await client.end();
}
