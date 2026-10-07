/**
 * Role Service Interface
 *
 * Business-logic abstraction for roles and their permission payloads.
 * [NFR-21] Permission strings are validated on write.
 */

import type { RoleRecord } from "./role.repository.interface.js";
import type { Connection, ConnectionArgs } from "./common.interface.js";

export interface CreateRoleInput {
  name: string;
  description: string;
  permissionPayload: string[];
}

export interface UpdateRoleInput {
  name?: string | null;
  description?: string | null;
  permissionPayload?: string[] | null;
}

export interface RoleFilter {
  name?: string | null;
}

export type RoleSortField = "NAME" | "CREATED_AT";

export interface IRoleService {
  getById(id: string): Promise<RoleRecord | null>;
  getByName(name: string): Promise<RoleRecord | null>;
  list(args: ConnectionArgs<RoleFilter, RoleSortField>): Promise<Connection<RoleRecord>>;

  /** Validates every permission string against ^[\w*]+:[\w*]+$ (NFR-21). */
  create(actorId: string, input: CreateRoleInput): Promise<RoleRecord>;
  update(actorId: string, id: string, input: UpdateRoleInput): Promise<RoleRecord>;
}
