/**
 * Role Service
 *
 * Implements IRoleService - roles and their permission payloads.
 *
 * - FR-04..06  role CRUD; permission payloads validated on write (NFR-21)
 * - NFR-21     permission strings are defined once as code constants and
 *              validated against ^[\w*]+:[\w*]+$ on write
 *
 * [SOLID:SRP] Role persistence rules only - no DB or HTTP concerns.
 */

import { and, asc, desc, eq, or, sql, type SQL } from "drizzle-orm";

import { roles } from "../../db/schema/index.js";
import {
  ConflictError,
  NotFoundError,
  ValidationError,
} from "../../errors/index.js";
import type { IDatabase } from "../../interfaces/uow.interface.js";
import type { ITelemetryPort } from "../../infrastructure/telemetry/telemetry.interface.js";
import type {
  IRoleService,
  CreateRoleInput,
  UpdateRoleInput,
  RoleFilter,
  RoleSortField,
} from "../../interfaces/role.service.interface.js";
import type {
  Connection,
  ConnectionArgs,
  SortDirection,
} from "../../interfaces/common.interface.js";
import type { RoleRecord } from "../../interfaces/role.repository.interface.js";
import { isValidPermission } from "../../types/permissions.js";
import { ilikePattern, resolveWindow, toConnection } from "../shared/query.js";
import { assertPermission } from "../shared/authz.js";

export class RoleService implements IRoleService {
  constructor(
    private readonly db: IDatabase,
    private readonly telemetry: ITelemetryPort,
  ) {}

  async getById(id: string): Promise<RoleRecord | null> {
    return this.db.query((uow) => uow.roles.findById(id));
  }

  async getByName(name: string): Promise<RoleRecord | null> {
    return this.db.query((uow) => uow.roles.findByName(name));
  }

  async list(args: ConnectionArgs<RoleFilter, RoleSortField>): Promise<Connection<RoleRecord>> {
    const { first, offset } = resolveWindow(args);
    const where = and(this.buildFilterWhere(args.filter), this.buildSearchWhere(args.search));

    return this.db.query(async (uow) => {
      const [rows, totalCount] = await Promise.all([
        uow.roles.findMany({
          limit: first + 1,
          offset,
          where,
          orderBy: this.orderBy(args.sort),
        }),
        uow.roles.count({ where }),
      ]);
      return toConnection({ rows, first, offset, totalCount });
    });
  }

  /** Validates every permission string against ^[\w*]+:[\w*]+$ (NFR-21). */
  async create(actorId: string, input: CreateRoleInput): Promise<RoleRecord> {
    const name = input.name?.trim();
    const description = input.description?.trim();
    if (!name) throw new ValidationError("Role name is required.");
    if (!description) throw new ValidationError("Role description is required.");
    this.validatePermissionPayload(input.permissionPayload);

    const created = await this.db.transaction(async (uow) => {
      await assertPermission(uow, actorId, "RoleService:Create");

      const existing = await uow.roles.findByName(name);
      if (existing) throw new ConflictError(`Role '${name}'`);
      return uow.roles.create({
        name,
        description,
        permissionPayload: [...new Set(input.permissionPayload)],
      });
    });

    this.telemetry.trackEvent("role.created", { roleId: created.id, name: created.name });
    return created;
  }

  async update(actorId: string, id: string, input: UpdateRoleInput): Promise<RoleRecord> {
    if (input.permissionPayload != null) {
      this.validatePermissionPayload(input.permissionPayload);
    }

    return this.db.transaction(async (uow) => {
      await assertPermission(uow, actorId, "RoleService:Update");

      const role = await uow.roles.findById(id);
      if (!role) throw new NotFoundError("Role", id);

      if (input.name != null) {
        const name = input.name.trim();
        if (!name) throw new ValidationError("Role name cannot be empty.");
        const clash = await uow.roles.findByName(name);
        if (clash && clash.id !== id) throw new ConflictError(`Role '${name}'`);
      }

      const updated = await uow.roles.update(id, {
        name: input.name?.trim() || undefined,
        description: input.description?.trim() || undefined,
        permissionPayload:
          input.permissionPayload != null
            ? [...new Set(input.permissionPayload)]
            : undefined,
      });

      this.telemetry.trackEvent("role.updated", { roleId: updated.id });
      return updated;
    });
  }

  // ------------------------------------------------------------------
  // Internals
  // ------------------------------------------------------------------

  private validatePermissionPayload(payload: string[]): void {
    if (!Array.isArray(payload)) {
      throw new ValidationError("permissionPayload must be an array of permission strings.");
    }
    for (const permission of payload) {
      if (typeof permission !== "string" || !isValidPermission(permission)) {
        throw new ValidationError(
          `Invalid permission string '${String(permission)}'. Expected "Service:Action" with optional "*" wildcards (NFR-21).`,
        );
      }
    }
  }

  private buildFilterWhere(filter?: RoleFilter | null): SQL | undefined {
    if (!filter?.name) return undefined;
    return sql`${roles.name} ILIKE ${ilikePattern(filter.name.trim())}`;
  }

  private buildSearchWhere(search?: string | null): SQL | undefined {
    const term = search?.trim();
    if (!term) return undefined;
    const pattern = ilikePattern(term);
    return or(
      sql`${roles.name} ILIKE ${pattern}`,
      sql`${roles.description} ILIKE ${pattern}`,
    );
  }

  private orderBy(
    sort?: { field: RoleSortField; direction?: SortDirection } | null,
  ): SQL[] {
    const direction = sort?.direction === "ASC" ? asc : desc;
    switch (sort?.field) {
      case "CREATED_AT":
        return [direction(roles.createdAt)];
      case "NAME":
      default:
        return [direction(roles.name)];
    }
  }
}
