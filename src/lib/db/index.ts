import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "./schema";

export const DATABASE_URL =
  process.env.DATABASE_URL ??
  "postgres://zorvi:zorvi@localhost:5433/zorvi";

const globalForDb = globalThis as unknown as { pool?: Pool };

const pool =
  globalForDb.pool ??
  new Pool({ connectionString: DATABASE_URL, max: 10 });
globalForDb.pool = pool;

export const db = drizzle(pool, { schema });
export { schema };
