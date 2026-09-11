import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "./schema";
import { getDatabaseUrl } from "./env";
import { getPool } from "./pool";

export const db = drizzle(getPool(), { schema });
export { schema, getPool };
export const DATABASE_URL = getDatabaseUrl();
