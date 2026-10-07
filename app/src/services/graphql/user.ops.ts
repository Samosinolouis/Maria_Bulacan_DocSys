/** User and role operations (shared platform). */

import { PAGE_INFO_FIELDS, ROLE_FIELDS, USER_FIELDS } from './fields';

export const USER_OPS = {
  me: `query Me { me { ${USER_FIELDS} roles { ${ROLE_FIELDS} } effectivePermissions } }`,
  get: `query User($id: ID!) { user(id: $id) { ${USER_FIELDS} roles { ${ROLE_FIELDS} } effectivePermissions } }`,
  list: `query Users($first: Int, $after: String, $search: String, $filter: UserFilterInput, $sort: UserSortInput) {
    users(first: $first, after: $after, search: $search, filter: $filter, sort: $sort) {
      edges { node { ${USER_FIELDS} roles { ${ROLE_FIELDS} } effectivePermissions } cursor }
      pageInfo { ${PAGE_INFO_FIELDS} }
    }
  }`,
  updateProfile: `mutation UpdateUserProfile($id: ID!, $input: UpdateUserProfileInput!) {
    updateUserProfile(id: $id, input: $input) { changedEntities user { ${USER_FIELDS} roles { ${ROLE_FIELDS} } effectivePermissions } }
  }`,
  create: `mutation CreateUser($input: CreateUserInput!) {
    createUser(input: $input) { changedEntities user { ${USER_FIELDS} roles { ${ROLE_FIELDS} } effectivePermissions } }
  }`,
  deactivate: `mutation DeactivateUser($id: ID!) {
    deactivateUser(id: $id) { changedEntities user { ${USER_FIELDS} roles { ${ROLE_FIELDS} } effectivePermissions } }
  }`,
  reactivate: `mutation ReactivateUser($id: ID!) {
    reactivateUser(id: $id) { changedEntities user { ${USER_FIELDS} roles { ${ROLE_FIELDS} } effectivePermissions } }
  }`,
  assignRole: `mutation AssignRole($input: AssignRoleInput!) {
    assignRole(input: $input) { changedEntities user { ${USER_FIELDS} roles { ${ROLE_FIELDS} } effectivePermissions } }
  }`,
  removeRole: `mutation RemoveRole($input: RemoveRoleInput!) {
    removeRole(input: $input) { changedEntities user { ${USER_FIELDS} roles { ${ROLE_FIELDS} } effectivePermissions } }
  }`,
};

export const ROLE_OPS = {
  get: `query Role($id: ID!) { role(id: $id) { ${ROLE_FIELDS} } }`,
  list: `query Roles($first: Int, $after: String, $search: String, $filter: RoleFilterInput, $sort: RoleSortInput) {
    roles(first: $first, after: $after, search: $search, filter: $filter, sort: $sort) {
      edges { node { ${ROLE_FIELDS} } cursor }
      pageInfo { ${PAGE_INFO_FIELDS} }
    }
  }`,
  permissionCatalog: `query PermissionCatalog { permissionCatalog { service actions } }`,
  create: `mutation CreateRole($input: CreateRoleInput!) { createRole(input: $input) { changedEntities role { ${ROLE_FIELDS} } } }`,
  update: `mutation UpdateRole($id: ID!, $input: UpdateRoleInput!) {
    updateRole(id: $id, input: $input) { changedEntities role { ${ROLE_FIELDS} } }
  }`,
};
