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
  AppError,
  CommonErrorCode,
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
  CreateUserInput,
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

/** Deliberately permissive: the identity provider is the authority on email. */
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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

  /**
   * Provision a brand-new plantilla account (FR-01, FR-02, FR-04).
   *
   * Order matters: authorize and resolve the initial roles FIRST, create the
   * account in Keycloak SECOND (it owns the credential and mints the OIDC
   * "sub" that keys the shadow row), and mirror the row plus its grants THIRD.
   * A Keycloak failure therefore aborts before any database write, and a
   * database failure leaves at worst an orphaned provider account - the same
   * reconciliation path `deactivate` already relies on.
   */
  async create(actorId: string, input: CreateUserInput): Promise<UserRecord> {
    const started = Date.now();

    const firstName = input.firstName?.trim();
    const lastName = input.lastName?.trim();
    const email = input.email?.trim().toLowerCase();
    const contactNo = input.contactNo?.trim();
    const office = input.office?.trim();
    const position = input.position?.trim();

    if (!firstName) throw new ValidationError("First name is required.");
    if (!lastName) throw new ValidationError("Last name is required.");
    if (!email || !EMAIL_PATTERN.test(email)) {
      throw new ValidationError("A valid email address is required.");
    }
    if (!contactNo) throw new ValidationError("Contact number is required.");
    if (!office) throw new ValidationError("Office is required.");
    if (!position) throw new ValidationError("Position is required.");

    const roles = await this.db.query(async (uow) => {
      await assertPermission(uow, actorId, "UserService:Create");

      const existing = await uow.users.findByEmail(email);
      if (existing) throw new ConflictError(`User '${email}'`);

      const resolved: RoleRecord[] = [];
      for (const roleId of new Set(input.roleIds ?? [])) {
        const role = await uow.roles.findById(roleId);
        if (!role) throw new NotFoundError("Role", roleId);
        resolved.push(role);
      }
      return resolved;
    });

    // The credential lives only in Keycloak (NFR-05). When no one-time
    // password is supplied the account is created without one and the holder
    // must be sent through the realm's reset-password flow.
    const idpResult = await this.idp.createUser({
      email,
      username: email,
      firstName,
      lastName,
      ...(input.temporaryPassword ? { password: input.temporaryPassword } : {}),
    });

    if (!idpResult.success || !idpResult.userId) {
      this.telemetry.trackError(
        new Error(idpResult.error ?? "Identity provider rejected the account request."),
        { operation: "user.create", email },
      );
      throw new AppError("The identity provider rejected the account request.", {
        status: 502,
        code: CommonErrorCode.INTERNAL_ERROR,
      });
    }

    const userId = idpResult.userId;

    const created = await this.db.transaction(async (uow) => {
      // Re-check inside the transaction: two concurrent creates can both pass
      // the pre-flight check while Keycloak is provisioning.
      const clash = await uow.users.findByEmail(email);
      if (clash) throw new ConflictError(`User '${email}'`);

      const record = await uow.users.create({
        id: userId,
        firstName,
        middleName: input.middleName?.trim() || null,
        lastName,
        suffix: input.suffix?.trim() || null,
        email,
        contactNo,
        office,
        position,
      });

      for (const role of roles) {
        await uow.roles.assign({ userId, roleId: role.id, assignedBy: actorId });
      }

      return record;
    });

    // Realm role mappings are a non-transactional side effect (FR-04).
    for (const role of roles) {
      await this.safeIdpCall(() => this.idp.addRole(userId, role.name), "user.addRole", userId);
    }

    this.telemetry.trackEvent("user.created", {
      userId: created.id,
      roleIds: roles.map((role) => role.id),
    });
    this.telemetry.trackPerformance("user.create", Date.now() - started);
    await this.cache.delete(`v1:user:get:${userId}`);
    return created;
  }

  /**
   * Update a profile. The account holder may always edit their own record;
   * editing somebody else's is an administrative act and requires
   * `UserService:Update` (FR-03).
   */
  async updateProfile(
    actorId: string,
    id: string,
    input: UpdateUserProfileInput,
  ): Promise<UserRecord> {
    const isSelf = actorId === id;

    return this.db.transaction(async (uow) => {
      if (!isSelf) {
        await assertPermission(uow, actorId, "UserService:Update");
      }

      const user = await uow.users.findById(id);
      if (!user) throw new NotFoundError("User", id);

      // `undefined` means "not supplied, leave alone"; an explicit null or an
      // empty string means "clear". A plain `value || undefined` would silently
      // refuse to clear a field, which is exactly what an account holder does
      // when they remove a contact number.
      const text = (value: string | null | undefined): string | undefined =>
        value === undefined ? undefined : (value ?? "").trim();
      const nullable = (value: string | null | undefined): string | null | undefined =>
        value === undefined ? undefined : (value ?? "").trim() || null;

      if (text(input.firstName) === "") throw new ValidationError("First name cannot be empty.");
      if (text(input.lastName) === "") throw new ValidationError("Last name cannot be empty.");
      if (text(input.email) === "") throw new ValidationError("Email cannot be empty.");

      const updated = await uow.users.update(id, {
        firstName: text(input.firstName),
        middleName: nullable(input.middleName),
        lastName: text(input.lastName),
        suffix: nullable(input.suffix),
        email: text(input.email),
        contactNo: text(input.contactNo),
        office: text(input.office),
        position: text(input.position),
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

  /**
   * Role assignment records who granted the role and when (FR-04). Returns the
   * updated account: `UserMutationPayload.user` is non-nullable, so the
   * resolver must hand back a record rather than void.
   */
  async assignRole(actorId: string, userId: string, roleId: string): Promise<UserRecord> {
    const { role, user } = await this.db.transaction(async (uow) => {
      await assertPermission(uow, actorId, "UserService:AssignRole");

      const target = await uow.users.findById(userId);
      if (!target) throw new NotFoundError("User", userId);

      const role = await uow.roles.findById(roleId);
      if (!role) throw new NotFoundError("Role", roleId);

      const existing = await uow.roles.findByUser(userId);
      if (existing.some((link) => link.roleId === roleId)) {
        throw new ConflictError(`Role assignment '${role.name}'`);
      }

      await uow.roles.assign({ userId, roleId, assignedBy: actorId });
      return { role, user: target };
    });

    await this.safeIdpCall(() => this.idp.addRole(userId, role.name), "user.addRole", userId);
    return user;
  }

  async removeRole(actorId: string, userId: string, roleId: string): Promise<UserRecord> {
    const { role, user } = await this.db.transaction(async (uow) => {
      await assertPermission(uow, actorId, "UserService:AssignRole");

      const target = await uow.users.findById(userId);
      if (!target) throw new NotFoundError("User", userId);

      const role = await uow.roles.findById(roleId);
      if (!role) throw new NotFoundError("Role", roleId);

      const removed = await uow.roles.unassign(userId, roleId);
      if (!removed) {
        throw new NotFoundError("Role assignment", `${userId}:${roleId}`);
      }
      return { role, user: target };
    });

    await this.safeIdpCall(
      () => this.idp.removeRole(userId, role.name),
      "user.removeRole",
      userId,
    );
    return user;
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
