/**
 * User Service
 *
 * Implements IUserService - shadow-user lifecycle and role assignment.
 *
 * - FR-01..02  Keycloak-idempotent provisioning keyed by the OIDC "sub";
 *              profile fields refresh when the Keycloak profile changes
 * - FR-03      soft deactivation; users are never deleted
 * - FR-04      role assignment records who granted it and when
 * - FR-05..06  effective permissions = union of role payloads (with wildcards)
 *
 * [SOLID:SRP] Business rules only - no DB or HTTP concerns.
 * [SOLID:DIP] Depends on IDatabase / IIdentityProviderPort abstractions.
 */

import { and, asc, desc, eq, inArray, or, sql, type SQL } from "drizzle-orm";

import { users } from "../../db/schema/index.js";
import {
  ConflictError,
  InvalidStateError,
  NotFoundError,
  ValidationError,
} from "../../errors/index.js";
import type { IDatabase } from "../../interfaces/uow.interface.js";
import type { ITelemetryPort } from "../../infrastructure/telemetry/telemetry.interface.js";
import type {
  IIdentityProviderPort,
  AuthUser,
} from "../../ports/idp.port.interface.js";
import type { ICachePort } from "../../infrastructure/cache/cache.interface.js";
import type {
  IUserService,
  ProvisionUserInput,
  UpdateUserProfileInput,
  UserFilter,
  UserSortField,
} from "../../interfaces/user.service.interface.js";
import type {
  Connection,
  ConnectionArgs,
  SortDirection,
} from "../../interfaces/common.interface.js";
import type { UserRecord } from "../../interfaces/user.repository.interface.js";
import type { RoleRecord } from "../../interfaces/role.repository.interface.js";
import {
  emptyConnection,
  ilikePattern,
  resolveWindow,
  toConnection,
} from "../shared/query.js";
import { assertPermission } from "../shared/authz.js";

const USER_CACHE_TTL_SECONDS = 60;

export class UserService implements IUserService {
  constructor(
    private readonly db: IDatabase,
    private readonly idp: IIdentityProviderPort,
    private readonly telemetry: ITelemetryPort,
    private readonly cache: ICachePort,
  ) {}

  /** Create-or-update the shadow user record from an authenticated identity (FR-02). */
  async provisionFromIdentity(
    identity: AuthUser,
    input: ProvisionUserInput,
  ): Promise<UserRecord> {
    const started = Date.now();

    const provisioned = await this.db.transaction(async (uow) => {
      const existing = await uow.users.findById(identity.sub);
      if (!existing) {
        const created = await uow.users.create({
          id: identity.sub,
          firstName: input.firstName,
          middleName: input.middleName ?? null,
          lastName: input.lastName,
          suffix: input.suffix ?? null,
          email: input.email,
          contactNo: input.contactNo,
          office: input.office,
          position: input.position,
        });
        this.telemetry.trackEvent("user.provisioned", { userId: created.id });
        return created;
      }

      const changed =
        existing.firstName !== input.firstName ||
        existing.middleName !== (input.middleName ?? null) ||
        existing.lastName !== input.lastName ||
        existing.suffix !== (input.suffix ?? null) ||
        existing.email !== input.email ||
        existing.contactNo !== input.contactNo ||
        existing.office !== input.office ||
        existing.position !== input.position;

      if (!changed) return existing;

      return uow.users.update(existing.id, {
        firstName: input.firstName,
        middleName: input.middleName ?? null,
        lastName: input.lastName,
        suffix: input.suffix ?? null,
        email: input.email,
        contactNo: input.contactNo,
        office: input.office,
        position: input.position,
      });
    });

    this.telemetry.trackPerformance("user.provision", Date.now() - started);
    return provisioned;
  }

  /**
   * Get-or-provision the shadow record on login (FR-02). Existing records are
   * returned untouched; missing ones are materialized from the verified token
   * (office/position/contact stay placeholder until an admin edits the profile).
   */
  async ensureProvisioned(identity: AuthUser): Promise<UserRecord> {
    const existing = await this.getById(identity.sub);
    if (existing) return existing;
    return this.provisionFromIdentity(identity, this.deriveProvisionInput(identity));
  }

  async getById(id: string): Promise<UserRecord | null> {
    const cacheKey = `v1:user:get:${id}`;
    const cached = await this.cache.get<UserRecord>(cacheKey);
    if (cached) return cached;

    const user = await this.db.query((uow) => uow.users.findById(id));
    if (user) {
      await this.cache.set(cacheKey, user, { ttl: USER_CACHE_TTL_SECONDS });
    }
    return user;
  }

  async getByIds(ids: string[]): Promise<UserRecord[]> {
    return this.db.query((uow) => uow.users.findByIds(ids));
  }

  async getByEmail(email: string): Promise<UserRecord | null> {
    return this.db.query((uow) => uow.users.findByEmail(email));
  }

  async list(args: ConnectionArgs<UserFilter, UserSortField>): Promise<Connection<UserRecord>> {
    const { first, offset } = resolveWindow(args);
    const filter = args.filter;

    return this.db.query(async (uow) => {
      const conditions: SQL[] = [];

      if (filter?.isActive !== undefined && filter?.isActive !== null) {
        conditions.push(eq(users.isActive, filter.isActive));
      }
      if (filter?.office) {
        conditions.push(eq(users.office, filter.office));
      }
      if (filter?.roleName) {
        const role = await uow.roles.findByName(filter.roleName);
        if (!role) return emptyConnection<UserRecord>(first, offset);
        const links = await uow.roles.findByRole(role.id);
        const userIds = links.map((link) => link.userId);
        if (userIds.length === 0) return emptyConnection<UserRecord>(first, offset);
        conditions.push(inArray(users.id, userIds));
      }

      const where = and(...conditions, this.buildSearchWhere(args.search));

      const [rows, totalCount] = await Promise.all([
        uow.users.findMany({
          limit: first + 1,
          offset,
          where,
          orderBy: this.orderBy(args.sort),
        }),
        uow.users.count({ where }),
      ]);
      return toConnection({ rows, first, offset, totalCount });
    });
  }

  async updateProfile(
    actorId: string,
    id: string,
    input: UpdateUserProfileInput,
  ): Promise<UserRecord> {
    return this.db.transaction(async (uow) => {
      await assertPermission(uow, actorId, "UserService:Update");

      const user = await uow.users.findById(id);
      if (!user) throw new NotFoundError("User", id);

      if (input.email != null && !input.email.trim()) {
        throw new ValidationError("Email cannot be empty.");
      }

      const updated = await uow.users.update(id, {
        firstName: input.firstName?.trim() || undefined,
        middleName: input.middleName === undefined ? undefined : input.middleName,
        lastName: input.lastName?.trim() || undefined,
        suffix: input.suffix === undefined ? undefined : input.suffix,
        email: input.email?.trim() || undefined,
        contactNo: input.contactNo?.trim() || undefined,
        office: input.office?.trim() || undefined,
        position: input.position?.trim() || undefined,
      });
      await this.cache.delete(`v1:user:get:${id}`);
      return updated;
    });
  }

  /** Soft deactivate - never delete (FR-03, NFR-12). */
  async deactivate(actorId: string, userId: string): Promise<UserRecord> {
    if (actorId === userId) {
      throw new InvalidStateError("You cannot deactivate your own account.");
    }

    const updated = await this.db.transaction(async (uow) => {
      await assertPermission(uow, actorId, "UserService:Deactivate");

      const user = await uow.users.findById(userId);
      if (!user) throw new NotFoundError("User", userId);
      if (!user.isActive) return user; // idempotent
      return uow.users.deactivate(userId);
    });

    await this.safeIdpCall(() => this.idp.disableUser(userId), "user.disable", userId);
    await this.cache.delete(`v1:user:get:${userId}`);
    return updated;
  }

  async reactivate(actorId: string, userId: string): Promise<UserRecord> {
    const updated = await this.db.transaction(async (uow) => {
      await assertPermission(uow, actorId, "UserService:Deactivate");

      const user = await uow.users.findById(userId);
      if (!user) throw new NotFoundError("User", userId);
      if (user.isActive) return user; // idempotent
      return uow.users.update(userId, { isActive: true });
    });

    await this.safeIdpCall(() => this.idp.enableUser(userId), "user.enable", userId);
    await this.cache.delete(`v1:user:get:${userId}`);
    return updated;
  }

  /** Role assignment records who granted the role and when (FR-04). */
  async assignRole(actorId: string, userId: string, roleId: string): Promise<void> {
    const role = await this.db.transaction(async (uow) => {
      await assertPermission(uow, actorId, "UserService:AssignRole");

      const user = await uow.users.findById(userId);
      if (!user) throw new NotFoundError("User", userId);

      const target = await uow.roles.findById(roleId);
      if (!target) throw new NotFoundError("Role", roleId);

      const existing = await uow.roles.findByUser(userId);
      if (existing.some((link) => link.roleId === roleId)) {
        throw new ConflictError(`Role assignment '${target.name}'`);
      }

      await uow.roles.assign({ userId, roleId, assignedBy: actorId });
      return target;
    });

    await this.safeIdpCall(() => this.idp.addRole(userId, role.name), "user.addRole", userId);
  }

  async removeRole(actorId: string, userId: string, roleId: string): Promise<void> {
    const role = await this.db.transaction(async (uow) => {
      await assertPermission(uow, actorId, "UserService:AssignRole");

      const target = await uow.roles.findById(roleId);
      if (!target) throw new NotFoundError("Role", roleId);

      const removed = await uow.roles.unassign(userId, roleId);
      if (!removed) {
        throw new NotFoundError("Role assignment", `${userId}:${roleId}`);
      }
      return target;
    });

    await this.safeIdpCall(
      () => this.idp.removeRole(userId, role.name),
      "user.removeRole",
      userId,
    );
  }

  /** Roles currently assigned to a user. */
  async getRoles(userId: string): Promise<RoleRecord[]> {
    return this.db.query((uow) => uow.roles.findRolesForUser(userId));
  }

  /** Effective permission set = union of role payloads (FR-05, FR-06). */
  async getEffectivePermissions(userId: string): Promise<string[]> {
    return this.db.query(async (uow) => {
      const roles = await uow.roles.findRolesForUser(userId);
      const union = new Set<string>();
      for (const role of roles) {
        for (const permission of role.permissionPayload) {
          union.add(permission);
        }
      }
      return [...union];
    });
  }

  // ------------------------------------------------------------------
  // Internals
  // ------------------------------------------------------------------

  /** Best-effort profile from token claims (name / username / email). */
  private deriveProvisionInput(identity: AuthUser): ProvisionUserInput {
    const source = identity.name?.trim() || identity.preferredUsername?.trim() || "";
    const [first = "", ...rest] = source.split(/\s+/).filter(Boolean);
    const fallback = identity.email?.split("@")[0] ?? identity.sub;
    return {
      id: identity.sub,
      firstName: first || fallback,
      lastName: rest.join(" ") || "-",
      email: identity.email ?? `${identity.sub}@docsys.local`,
      contactNo: "",
      office: "UNASSIGNED",
      position: "UNASSIGNED",
    };
  }

  /**
   * Keycloak lifecycle calls are NON-transactional side effects; a failure
   * never rolls back the database change (reconciliation is manual/FR-03).
   */
  private async safeIdpCall(
    action: () => Promise<unknown>,
    operation: string,
    userId: string,
  ): Promise<void> {
    try {
      await action();
    } catch (error) {
      this.telemetry.trackError(
        error instanceof Error ? error : new Error(String(error)),
        { operation, userId },
      );
    }
  }

  private buildSearchWhere(search?: string | null): SQL | undefined {
    const term = search?.trim();
    if (!term) return undefined;
    const pattern = ilikePattern(term);
    return or(
      sql`${users.firstName} ILIKE ${pattern}`,
      sql`${users.lastName} ILIKE ${pattern}`,
      sql`${users.email} ILIKE ${pattern}`,
      sql`${users.office} ILIKE ${pattern}`,
    );
  }

  private orderBy(
    sort?: { field: UserSortField; direction?: SortDirection } | null,
  ): SQL[] {
    const direction = sort?.direction === "ASC" ? asc : desc;
    switch (sort?.field) {
      case "FIRST_NAME":
        return [direction(users.firstName)];
      case "LAST_NAME":
        return [direction(users.lastName)];
      case "EMAIL":
        return [direction(users.email)];
      case "CREATED_AT":
      default:
        return [direction(users.createdAt)];
    }
  }
}
