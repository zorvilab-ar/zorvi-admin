import { defineConfig } from "drizzle-kit";
import {
  getDirectDatabaseUrl,
  LOCAL_DATABASE_URL,
  isRemoteDatabaseUrl,
} from "./src/lib/db/env";

const url = getDirectDatabaseUrl() || LOCAL_DATABASE_URL;

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/lib/db/schema.ts",
  out: "./drizzle",
  dbCredentials: {
    url,
    ssl: isRemoteDatabaseUrl(url) ? { rejectUnauthorized: false } : undefined,
  },
});
