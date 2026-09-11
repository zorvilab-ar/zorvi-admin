import { defineConfig } from "drizzle-kit";
import { getDirectDatabaseUrl, LOCAL_DATABASE_URL } from "./src/lib/db/env";

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/lib/db/schema.ts",
  out: "./drizzle",
  dbCredentials: {
    url: getDirectDatabaseUrl() || LOCAL_DATABASE_URL,
  },
});
