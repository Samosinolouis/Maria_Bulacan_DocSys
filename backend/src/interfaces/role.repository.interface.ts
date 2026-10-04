/**
 * Role Repository Interface
 *
 * Data-access abstraction for `roles` and the `user_roles` join table.
 */

import { roles, userRoles } from "../db/schema/index.js";
import type { ListOptions } from "./common.interface.js";

export type RoleRecord = typeof roles.$inferSelect;
export type UserRoleRecord = typeof userRoles.$inferSelect;

export interface CreateRoleData {
  name: string;
  description: string;
  permissionPayload: string[];
}

export interface UpdateRoleData {
  name?: string;
  description?: string;
  permissionPayload?: string[];
}

export interface AssignRoleData {
  userId: string;
  roleId: string;
  /** Who granted the role (accountability). */
  assignedBy: string;
}

export interface IRoleRepository {
  findById(id: string): Promise<RoleRecord | null>;
  findByName(name: string): Promise<RoleRecord | null>;
  findMany(options: ListOptions): Promise<RoleRecord[]>;
  create(data: CreateRoleData): Promise<RoleRecord>;
  update(id: string, data: UpdateRoleData): Promise<RoleRecord>;

  /** --- user_roles join --- */
  assign(data: AssignRoleData): Promise<UserRoleRecord>;
  unassign(userId: string, roleId: string): Promise<UserRoleRecord | null>;
  findByUser(userId: string): Promise<UserRoleRecord[]>;
  findRolesForUser(userId: string): Promise<RoleRecord[]>;
}
