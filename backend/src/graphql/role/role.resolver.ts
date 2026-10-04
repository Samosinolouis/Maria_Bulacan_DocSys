/**
 * Role Resolvers — delegate to ctx.services.role.
 * permissionCatalog is static code data (NFR-21), so it is resolved directly.
 */

import type { GraphQLContext } from "../context.js";
import { toConnectionArgs, type ListArgs } from "../helpers.js";
import { Permissions } from "../../types/permissions.js";
import type { RoleFilter, RoleSortField } from "../../interfaces/role.service.interface.js";

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
    role: (_p: unknown, { id }: { id: string }, ctx: GraphQLContext) =>
      ctx.services.role.getById(id),

    roles: (_p: unknown, args: ListArgs, ctx: GraphQLContext) =>
      ctx.services.role.list(toConnectionArgs<RoleFilter, RoleSortField>(args)),

    permissionCatalog: () => buildPermissionCatalog(),
  },

  Mutation: {
    createRole: (_p: unknown, { input }: { input: never }, ctx: GraphQLContext) =>
      ctx.services.role.create(input),

    updateRole: (
      _p: unknown,
      { id, input }: { id: string; input: never },
      ctx: GraphQLContext,
    ) => ctx.services.role.update(id, input),
  },
};
