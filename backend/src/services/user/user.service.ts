/**
 * User Service (SKELETON)
 *
 * Implements IUserService. Business logic intentionally NOT implemented yet —
 * every method throws NotImplementedError so unfinished behaviour fails loudly.
 *
 * Intended responsibilities (when implemented):
 *  - FR-02  sync the shadow record from the verified Keycloak identity on login
 *  - FR-03  soft deactivation; users are never deleted
 *  - FR-04  role assignment records who granted it and when
 *  - FR-05  effective permissions = union of role payloads (with wildcards)
 *  - FR-06  admins manage users/roles and view effective permissions
 *
 * [SOLID:SRP] Business rules only — no DB or HTTP concerns.
 * [SOLID:DIP] Depends on IDatabase / IIdentityProviderPort abstractions.
 */

import type { IDatabase } from "../../interfaces/uow.interface.js";
import type { ITelemetryPort } from "../../infrastructure/telemetry/telemetry.interface.js";
import type { IIdentityProviderPort, AuthUser } from "../../ports/idp.port.interface.js";
import type { ICachePort } from "../../infrastructure/cache/cache.interface.js";
import type {
  IUserService,
  ProvisionUserInput,
  UpdateUserProfileInput,
} from "../../interfaces/user.service.interface.js";
import type { Connection, ConnectionArgs } from "../../interfaces/common.interface.js";
import type { UserFilter, UserSortField } from "../../interfaces/user.service.interface.js";
import type { UserRecord } from "../../interfaces/user.repository.interface.js";
import type { RoleRecord } from "../../interfaces/role.repository.interface.js";
import { NotImplementedError } from "../../errors/index.js";

export class UserService implements IUserService {
  constructor(
    private readonly db: IDatabase,
    private readonly idp: IIdentityProviderPort,
    private readonly telemetry: ITelemetryPort,
    private readonly cache: ICachePort,
  ) {}

  async provisionFromIdentity(
    _identity: AuthUser,
    _input: ProvisionUserInput,
  ): Promise<UserRecord> {
    // TODO(FR-02): upsert shadow user keyed by Keycloak "sub" inside a UoW.
    throw new NotImplementedError("UserService.provisionFromIdentity");
  }

  async getById(_id: string): Promise<UserRecord | null> {
    // TODO: read-through from cache, fall back to users.findById.
    throw new NotImplementedError("UserService.getById");
  }

  async getByIds(_ids: string[]): Promise<UserRecord[]> {
    // TODO: users.findByIds (DataLoader batch target).
    throw new NotImplementedError("UserService.getByIds");
  }

  async getByEmail(_email: string): Promise<UserRecord | null> {
    throw new NotImplementedError("UserService.getByEmail");
  }

  async list(
    _args: ConnectionArgs<UserFilter, UserSortField>,
  ): Promise<Connection<UserRecord>> {
    throw new NotImplementedError("UserService.list");
  }

  async updateProfile(_id: string, _input: UpdateUserProfileInput): Promise<UserRecord> {
    // TODO: update shadow record; optionally propagate to Keycloak via idp.updateUser.
    throw new NotImplementedError("UserService.updateProfile");
  }

  async deactivate(_actorId: string, _userId: string): Promise<UserRecord> {
    // TODO(FR-03, NFR-12): soft deactivate; also idp.disableUser.
    throw new NotImplementedError("UserService.deactivate");
  }

  async reactivate(_actorId: string, _userId: string): Promise<UserRecord> {
    // TODO: set is_active=true; also idp.enableUser.
    throw new NotImplementedError("UserService.reactivate");
  }

  async assignRole(_actorId: string, _userId: string, _roleId: string): Promise<void> {
    // TODO(FR-04): insert user_roles row (assigned_by = actorId) + idp.addRole.
    throw new NotImplementedError("UserService.assignRole");
  }

  async removeRole(_actorId: string, _userId: string, _roleId: string): Promise<void> {
    // TODO(FR-04): delete user_roles row + idp.removeRole.
    throw new NotImplementedError("UserService.removeRole");
  }

  async getRoles(_userId: string): Promise<RoleRecord[]> {
    // TODO: roles.findRolesForUser(userId).
    throw new NotImplementedError("UserService.getRoles");
  }

  async getEffectivePermissions(_userId: string): Promise<string[]> {
    // TODO(FR-05/06): union of roles.findRolesForUser(...).permissionPayload.
    throw new NotImplementedError("UserService.getEffectivePermissions");
  }
}
