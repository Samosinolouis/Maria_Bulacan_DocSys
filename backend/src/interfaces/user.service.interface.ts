/**
 * User Service Interface
 *
 * Business-logic abstraction for shadow-user lifecycle and role assignment.
 * The GraphQL layer depends on this, never on the concrete service.
 *
 * [SOLID:DIP] GraphQL context -> IUserService <- UserService.
 * [FR-01..FR-06] Keycloak-idempotent provisioning, soft deactivation, RBAC.
 */

import type { UserRecord } from "./user.repository.interface.js";
import type { RoleRecord } from "./role.repository.interface.js";
import type { Connection, ConnectionArgs } from "./common.interface.js";
import type { AuthUser } from "../ports/idp.port.interface.js";

/** Sync the shadow record from the verified Keycloak identity on login (FR-02). */
export interface ProvisionUserInput {
  id: string;
  firstName: string;
  middleName?: string | null;
  lastName: string;
  suffix?: string | null;
  email: string;
  contactNo: string;
  office: string;
  position: string;
}

export interface UpdateUserProfileInput {
  firstName?: string | null;
  middleName?: string | null;
  lastName?: string | null;
  suffix?: string | null;
  email?: string | null;
  contactNo?: string | null;
  office?: string | null;
  position?: string | null;
}

/**
 * Administrative account creation (FR-01, FR-02).
 *
 * The account is created in the identity provider first and the shadow record
 * is keyed by the returned OIDC "sub", so `users.id` stays the join key. No
 * credential is ever persisted by the application: `temporaryPassword` is
 * handed to Keycloak as a one-time password that the holder must replace at
 * first sign-in (NFR-05).
 */
export interface CreateUserInput {
  firstName: string;
  middleName?: string | null;
  lastName: string;
  suffix?: string | null;
  email: string;
  contactNo: string;
  office: string;
  position: string;
  /** Initial realm roles; each id must already exist. */
  roleIds?: string[] | null;
  /** One-time credential stored by Keycloak as temporary. */
  temporaryPassword?: string | null;
}

export interface UserFilter {
  isActive?: boolean | null;
  office?: string | null;
  roleName?: string | null;
}

export type UserSortField = "CREATED_AT" | "FIRST_NAME" | "LAST_NAME" | "EMAIL";

export interface IUserService {
  /** Create-or-update the shadow user record from an authenticated identity. */
  provisionFromIdentity(identity: AuthUser, input: ProvisionUserInput): Promise<UserRecord>;

  /**
   * Get-or-provision the shadow record on login (FR-02): existing records are
   * returned untouched; missing ones are materialized from the verified token.
   */
  ensureProvisioned(identity: AuthUser): Promise<UserRecord>;

  getById(id: string): Promise<UserRecord | null>;
  getByIds(ids: string[]): Promise<UserRecord[]>;
  getByEmail(email: string): Promise<UserRecord | null>;
  list(args: ConnectionArgs<UserFilter, UserSortField>): Promise<Connection<UserRecord>>;

  /**
   * Provision a brand-new plantilla account: create it in the identity
   * provider, mirror the shadow record and (optionally) grant its initial
   * roles. Requires `UserService:Create` (FR-01, FR-04).
   */
  create(actorId: string, input: CreateUserInput): Promise<UserRecord>;

  /**
   * Update a profile. The account holder may always edit their own record;
   * editing somebody else's requires `UserService:Update` (FR-03).
   */
  updateProfile(actorId: string, id: string, input: UpdateUserProfileInput): Promise<UserRecord>;

  /** Soft deactivate - never delete (FR-03, NFR-12). */
  deactivate(actorId: string, userId: string): Promise<UserRecord>;
  reactivate(actorId: string, userId: string): Promise<UserRecord>;

  /** Role assignment records who granted the role and when (FR-04). */
  assignRole(actorId: string, userId: string, roleId: string): Promise<UserRecord>;
  removeRole(actorId: string, userId: string, roleId: string): Promise<UserRecord>;

  /** Roles currently assigned to a user. */
  getRoles(userId: string): Promise<RoleRecord[]>;

  /** Effective permission set = union of role payloads (FR-05, FR-06). */
  getEffectivePermissions(userId: string): Promise<string[]>;
}
