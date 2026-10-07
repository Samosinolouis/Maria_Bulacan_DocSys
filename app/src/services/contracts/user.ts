/**
 * User & role contracts (shared platform).
 */

import type { Connection, ConnectionArgs } from './common';
import type { User, Role, PermissionCatalogEntry, UserSortField, RoleSortField } from './models';

export interface UpdateUserProfileInput {
  firstName?: string;
  middleName?: string | null;
  lastName?: string;
  suffix?: string | null;
  email?: string;
  contactNo?: string;
  office?: string;
  position?: string;
}

export interface AssignRoleInput {
  userId: string;
  roleId: string;
}

export interface RemoveRoleInput {
  userId: string;
  roleId: string;
}

export interface UserFilter {
  isActive?: boolean | null;
  office?: string | null;
  roleName?: string | null;
}

export interface IUserService {
  /** The authenticated user's shadow record. Ungated: session bootstrap. */
  getCurrent(): Promise<User | null>;

  /** Action: UserService:Read. */
  getById(id: string): Promise<User | null>;
  list(args: ConnectionArgs<UserFilter, UserSortField>): Promise<Connection<User>>;

  /** Action: UserService:Update. */
  updateProfile(id: string, input: UpdateUserProfileInput): Promise<User>;

  /** Soft deactivation, never delete (FR-03). Action: UserService:Deactivate. */
  deactivate(id: string): Promise<User>;
  reactivate(id: string): Promise<User>;

  /** Role assignment records who granted it and when (FR-04). Action: UserService:AssignRole. */
  assignRole(input: AssignRoleInput): Promise<User>;
  removeRole(input: RemoveRoleInput): Promise<User>;
}

export interface CreateRoleInput {
  name: string;
  description: string;
  /** Validated against ^[\w*]+:[\w*]+$ on write (NFR-21). */
  permissionPayload: string[];
}

export interface UpdateRoleInput {
  name?: string;
  description?: string;
  permissionPayload?: string[];
}

export interface RoleFilter {
  name?: string | null;
}

export interface IRoleService {
  /** Action: RoleService:Read. */
  getById(id: string): Promise<Role | null>;
  list(args: ConnectionArgs<RoleFilter, RoleSortField>): Promise<Connection<Role>>;

  /** The static permission catalog defined in backend code (NFR-21). Ungated. */
  permissionCatalog(): Promise<PermissionCatalogEntry[]>;

  /** Action: RoleService:Create. */
  create(input: CreateRoleInput): Promise<Role>;

  /** Action: RoleService:Update. */
  update(id: string, input: UpdateRoleInput): Promise<Role>;
}
