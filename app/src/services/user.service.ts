/**
 * UserService and RoleService - shared platform (users, roles, catalog).
 */

import { authorizeOrThrow } from '@/authz/authorize';
import type { IAuthorizationEngine } from './contracts/authz';
import type { IClientCache } from './contracts/cache';
import type { Connection, ConnectionArgs } from './contracts/common';
import type { IGraphQLClient } from './contracts/graphql';
import type {
  PermissionCatalogEntry,
  Role,
  RoleSortField,
  User,
  UserSortField,
} from './contracts/models';
import type {
  AssignRoleInput,
  CreateRoleInput,
  CreateUserInput,
  IRoleService,
  IUserService,
  RemoveRoleInput,
  RoleFilter,
  UpdateRoleInput,
  UpdateUserProfileInput,
  UserFilter,
} from './contracts/user';
import type { MutationAnswer } from './contracts/mutation';
import {
  executeQueryWithCache,
  generateGetCacheKey,
  generateListCacheKey,
  invalidateChangedEntities,
  TTL,
} from './cache/helpers';
import { ROLE_OPS, USER_OPS } from './graphql/user.ops';

export class UserService implements IUserService {
  constructor(
    private readonly gql: IGraphQLClient,
    private readonly cache: IClientCache,
    private readonly authz: IAuthorizationEngine,
  ) {}

  /** Ungated: the `me` bootstrap. */
  async getCurrent(): Promise<User | null> {
    const data = await this.gql.request<{ me: User | null }>({
      document: USER_OPS.me,
      operationName: 'Me',
    });
    return data.me;
  }

  async getById(id: string): Promise<User | null> {
    authorizeOrThrow(this.authz, 'UserService:Read');
    return executeQueryWithCache<User | null>({
      cache: this.cache,
      queryKey: generateGetCacheKey('user', id),
      entities: ['User'],
      queryType: 'get',
      ttlMs: TTL.OPERATIONAL,
      matchFn: null,
      queryFn: () =>
        this.gql
          .request<{ user: User | null }>({ document: USER_OPS.get, variables: { id }, operationName: 'User' })
          .then((d) => d.user),
      extract: (r) => ({ items: r ? [r] : [], endCursor: null }),
      rehydrate: (items) => (items.length ? (items[0] as User) : null),
    });
  }

  async list(args: ConnectionArgs<UserFilter, UserSortField>): Promise<Connection<User>> {
    authorizeOrThrow(this.authz, 'UserService:Read');
    return executeQueryWithCache<Connection<User>>({
      cache: this.cache,
      queryKey: generateListCacheKey('user', args as Record<string, unknown>),
      entities: ['User'],
      queryType: 'list',
      ttlMs: TTL.OPERATIONAL,
      matchFn: () => true,
      queryFn: () =>
        this.gql.request<{ users: Connection<User> }>({
          document: USER_OPS.list,
          variables: { ...args },
          operationName: 'Users',
        }).then((d) => d.users),
      extract: (conn) => ({ items: conn.edges.map((e) => e.node), endCursor: conn.pageInfo.endCursor }),
      rehydrate: (items, endCursor) => ({
        edges: items.map((node) => ({ node: node as User, cursor: (node as User).id })),
        pageInfo: {
          hasNextPage: endCursor !== null,
          hasPreviousPage: false,
          startCursor: items.length ? (items[0] as User).id : null,
          endCursor,
          totalCount: items.length,
        },
      }),
    });
  }

  /** Provision a new account in the identity provider. Action: UserService:Create. */
  async create(input: CreateUserInput): Promise<User> {
    authorizeOrThrow(this.authz, 'UserService:Create');
    const payload = await this.gql.request<{ createUser: MutationAnswer<'user', User> }>({
      document: USER_OPS.create,
      variables: { input },
      operationName: 'CreateUser',
    });
    invalidateChangedEntities(this.cache, payload.createUser.changedEntities);
    return payload.createUser.user;
  }

  /**
   * The engine allows the account holder to edit their own record without the
   * grant (see the `UserService:Update` rule), so the resource id must be
   * passed for the self-service case to pass the policy.
   */
  async updateProfile(id: string, input: UpdateUserProfileInput): Promise<User> {
    authorizeOrThrow(this.authz, 'UserService:Update', { kind: 'user', attributes: { id } });
    const payload = await this.gql.request<{
      updateUserProfile: MutationAnswer<'user', User>;
    }>({
      document: USER_OPS.updateProfile,
      variables: { id, input },
      operationName: 'UpdateUserProfile',
    });
    invalidateChangedEntities(this.cache, payload.updateUserProfile.changedEntities);
    return payload.updateUserProfile.user;
  }

  async deactivate(id: string): Promise<User> {
    authorizeOrThrow(this.authz, 'UserService:Deactivate', { kind: 'user', attributes: { id } });
    const payload = await this.gql.request<{ deactivateUser: MutationAnswer<'user', User> }>({
      document: USER_OPS.deactivate,
      variables: { id },
      operationName: 'DeactivateUser',
    });
    invalidateChangedEntities(this.cache, payload.deactivateUser.changedEntities);
    return payload.deactivateUser.user;
  }

  async reactivate(id: string): Promise<User> {
    authorizeOrThrow(this.authz, 'UserService:Deactivate', { kind: 'user', attributes: { id } });
    const payload = await this.gql.request<{ reactivateUser: MutationAnswer<'user', User> }>({
      document: USER_OPS.reactivate,
      variables: { id },
      operationName: 'ReactivateUser',
    });
    invalidateChangedEntities(this.cache, payload.reactivateUser.changedEntities);
    return payload.reactivateUser.user;
  }

  async assignRole(input: AssignRoleInput): Promise<User> {
    authorizeOrThrow(this.authz, 'UserService:AssignRole');
    const payload = await this.gql.request<{ assignRole: MutationAnswer<'user', User> }>({
      document: USER_OPS.assignRole,
      variables: { input },
      operationName: 'AssignRole',
    });
    invalidateChangedEntities(this.cache, payload.assignRole.changedEntities);
    return payload.assignRole.user;
  }

  async removeRole(input: RemoveRoleInput): Promise<User> {
    authorizeOrThrow(this.authz, 'UserService:AssignRole');
    const payload = await this.gql.request<{ removeRole: MutationAnswer<'user', User> }>({
      document: USER_OPS.removeRole,
      variables: { input },
      operationName: 'RemoveRole',
    });
    invalidateChangedEntities(this.cache, payload.removeRole.changedEntities);
    return payload.removeRole.user;
  }
}

export class RoleService implements IRoleService {
  constructor(
    private readonly gql: IGraphQLClient,
    private readonly cache: IClientCache,
    private readonly authz: IAuthorizationEngine,
  ) {}

  async getById(id: string): Promise<Role | null> {
    authorizeOrThrow(this.authz, 'RoleService:Read');
    return executeQueryWithCache<Role | null>({
      cache: this.cache,
      queryKey: generateGetCacheKey('role', id),
      entities: ['Role'],
      queryType: 'get',
      ttlMs: TTL.OPERATIONAL,
      matchFn: null,
      queryFn: () =>
        this.gql
          .request<{ role: Role | null }>({ document: ROLE_OPS.get, variables: { id }, operationName: 'Role' })
          .then((d) => d.role),
      extract: (r) => ({ items: r ? [r] : [], endCursor: null }),
      rehydrate: (items) => (items.length ? (items[0] as Role) : null),
    });
  }

  async list(args: ConnectionArgs<RoleFilter, RoleSortField>): Promise<Connection<Role>> {
    authorizeOrThrow(this.authz, 'RoleService:Read');
    return executeQueryWithCache<Connection<Role>>({
      cache: this.cache,
      queryKey: generateListCacheKey('role', args as Record<string, unknown>),
      entities: ['Role'],
      queryType: 'list',
      ttlMs: TTL.OPERATIONAL,
      matchFn: () => true,
      queryFn: () =>
        this.gql.request<{ roles: Connection<Role> }>({
          document: ROLE_OPS.list,
          variables: { ...args },
          operationName: 'Roles',
        }).then((d) => d.roles),
      extract: (conn) => ({ items: conn.edges.map((e) => e.node), endCursor: conn.pageInfo.endCursor }),
      rehydrate: (items, endCursor) => ({
        edges: items.map((node) => ({ node: node as Role, cursor: (node as Role).id })),
        pageInfo: {
          hasNextPage: endCursor !== null,
          hasPreviousPage: false,
          startCursor: items.length ? (items[0] as Role).id : null,
          endCursor,
          totalCount: items.length,
        },
      }),
    });
  }

  /** Ungated: the static catalog defined in backend code. */
  async permissionCatalog(): Promise<PermissionCatalogEntry[]> {
    const data = await this.gql.request<{ permissionCatalog: PermissionCatalogEntry[] }>({
      document: ROLE_OPS.permissionCatalog,
      operationName: 'PermissionCatalog',
    });
    return data.permissionCatalog;
  }

  async create(input: CreateRoleInput): Promise<Role> {
    authorizeOrThrow(this.authz, 'RoleService:Create');
    const payload = await this.gql.request<{ createRole: MutationAnswer<'role', Role> }>({
      document: ROLE_OPS.create,
      variables: { input },
      operationName: 'CreateRole',
    });
    invalidateChangedEntities(this.cache, payload.createRole.changedEntities);
    return payload.createRole.role;
  }

  async update(id: string, input: UpdateRoleInput): Promise<Role> {
    authorizeOrThrow(this.authz, 'RoleService:Update');
    const payload = await this.gql.request<{ updateRole: MutationAnswer<'role', Role> }>({
      document: ROLE_OPS.update,
      variables: { id, input },
      operationName: 'UpdateRole',
    });
    invalidateChangedEntities(this.cache, payload.updateRole.changedEntities);
    return payload.updateRole.role;
  }
}
