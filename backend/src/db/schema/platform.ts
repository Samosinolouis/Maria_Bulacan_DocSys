/**
 * [A] SHARED PLATFORM - Identity & Authorization
 *
 * Tables: users, roles, user_roles.
 *
 * Conventions (schema.txt):
 *  - users.id = Keycloak OIDC "sub" claim (UUID) - the join key by definition.
 *  - Users are deactivated (is_active = false), never deleted.
 *  - No local credentials - authentication lives entirely in Keycloak.
 */

import {
  uuid,
  varchar,
  text,
  boolean,
  timestamp,
  jsonb,
  unique,
  type AnyPgColumn,
} from "drizzle-orm/pg-core";

import { appSchema } from "./schema.ts";

/** Shadow record of the Keycloak user. */
export const users = appSchema.table("users", {
  /** = Keycloak OIDC "sub" (UUID); the join key by definition. */
  id: uuid("id").primaryKey(),
  firstName: varchar("first_name", { length: 255 }).notNull(),
  middleName: varchar("middle_name", { length: 255 }),
  lastName: varchar("last_name", { length: 255 }).notNull(),
  suffix: varchar("suffix", { length: 50 }),
  email: varchar("email", { length: 320 }).notNull().unique(),
  contactNo: varchar("contact_no", { length: 50 }).notNull(),
  /** e.g. "Office of the Municipal Administrator" */
  office: varchar("office", { length: 255 }).notNull(),
  /** e.g. "Administrative Officer IV" */
  position: varchar("position", { length: 255 }).notNull(),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

/**
 * Application roles. permission_payload is a JSON array of "Service:Action"
 * strings supporting "*" wildcards, e.g. ["RequestService:Encode", "*:*"].
 */
export const roles = appSchema.table("roles", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 100 }).notNull().unique(),
  description: text("description").notNull(),
  permissionPayload: jsonb("permission_payload")
    .$type<string[]>()
    .notNull()
    .default([]),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

/** Join table - users N --- M roles. */
export const userRoles = appSchema.table(
  "user_roles",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id),
    roleId: uuid("role_id")
      .notNull()
      .references(() => roles.id),
    /** Who granted the role (accountability) - self reference. */
    assignedBy: uuid("assigned_by")
      .notNull()
      .references((): AnyPgColumn => users.id),
    assignedAt: timestamp("assigned_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [unique("user_roles_user_id_role_id_unique").on(table.userId, table.roleId)],
);
