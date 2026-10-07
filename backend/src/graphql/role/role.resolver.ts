/**
 * Role Resolvers - delegate to ctx.services.role.
 * permissionCatalog is static code data (NFR-21), so it is resolved directly.
 * Argument shapes come from the generated schema types (src/types/graphql.ts).
 */

import type { GraphQLContext } from "../context.js";
import { requireUser } from "../context.js";
import { toConnectionArgs } from "../helpers.js";
import { Permissions } from "../../types/permissions.js";
import type { RoleFilter, RoleSortField } from "../../interfaces/role.service.interface.js";
import type {
  MutationCreateRoleArgs,
  MutationUpdateRoleArgs,
  QueryRoleArgs,
  QueryRolesArgs,
} from "../../types/graphql.js";

function buildPermissionCatalog() {
  return Object.entries(Permissions)
    .filter(([service]) => service !== "All")
    .map(([service, actions]) => ({
      service,
      actions: Object.values(actions as Record<string, string>).filter(
        (p) => !p.endsWith(":*"),
      ),
    }));
}

export const roleResolvers = {
  Query: {
    role: (_p: unknown, { id }: QueryRoleArgs, ctx: GraphQLContext) =>
      ctx.services.role.getById(id),

    roles: (_p: unknown, args: QueryRolesArgs, ctx: GraphQLContext) =>
      ctx.services.role.list(toConnectionArgs<RoleFilter, RoleSortField>(args)),

    permissionCatalog: () => buildPermissionCatalog(),
  },

  Mutation: {
    createRole: (_p: unknown, { input }: MutationCreateRoleArgs, ctx: GraphQLContext) =>
      ctx.services.role.create(requireUser(ctx).sub, input),

    updateRole: (
      _p: unknown,
      { id, input }: MutationUpdateRoleArgs,
      ctx: GraphQLContext,
    ) => ctx.services.role.update(requireUser(ctx).sub, id, input),
  },
};
