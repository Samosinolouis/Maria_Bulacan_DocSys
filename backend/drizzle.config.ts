/**
 * Drizzle Kit Configuration
 *
 * Controls migration generation / push / studio against PostgreSQL.
 * [NFR-22] Schema changes ship via versioned migrations — no manual DDL.
 */

import "dotenv/config";
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/db/schema/index.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "",
  },
  verbose: true,
  strict: true,
});
