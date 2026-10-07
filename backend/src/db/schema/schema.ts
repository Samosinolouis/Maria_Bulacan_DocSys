/**
 * Application Database Schema Namespace
 *
 * The API owns the `app` schema. Keycloak owns `public` (its default) in the
 * SAME database - keeping application tables physically separate from IdP
 * tables so migrations never collide (NFR-05: no credentials in the app DB).
 *
 * Every table/enum in this folder is namespaced under `app`.
 */

import { pgSchema } from "drizzle-orm/pg-core";

export const appSchema = pgSchema("app");
