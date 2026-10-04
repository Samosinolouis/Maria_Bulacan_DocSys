/**
 * Database Client
 *
 * Creates a Drizzle ORM client connected to PostgreSQL via the `postgres`
 * driver. [SOLID:SRP] Only responsible for DB connection setup.
 */

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import { config } from "../config/index.js";
import * as schema from "./schema/index.js";

/** Raw postgres.js connection (used for queries). */
const client = postgres(config.databaseUrl);

/** Drizzle ORM instance — passed around via DI, not imported ad hoc. */
const db = drizzle(client, { schema });

export type Database = typeof db;

export default db;
