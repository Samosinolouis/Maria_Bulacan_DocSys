/**
 * User Resolvers
 *
 * Thin adapters: validate/authorize, then delegate to ctx.services.user.
 * Business rules live in the service layer. [SOLID:SRP]
 */

import type { GraphQLContext, } from "../context.js";
import { requireUser } from "../context.js";
import { toConnectionArgs, type ListArgs } from "../helpers.js";
import type { UserFilter, UserSortField } from "../../interfaces/user.service.interface.js";

interface ProvisionUserInput {
  firstName: string;
  middleName?: string | null;
  lastName: string;
  suffix?: string | null;
  email: string;
  contactNo: string;
  office: string;
  position: string;
}

export const userResolvers = {
  Query: {
    me: (_p: unknown, _a: unknown, ctx: GraphQLContext) =>
      ctx.user ? ctx.services.user.getById(ctx.user.sub) : null,

    user: (_p: unknown, { id }: { id: string }, ctx: GraphQLContext) =>
      ctx.services.user.getById(id),

    users: (_p: unknown, args: ListArgs, ctx: GraphQLContext) =>
      ctx.services.user.list(toConnectionArgs<UserFilter, UserSortField>(args)),
  },

  Mutation: {
    updateUserProfile: (
      _p: unknown,
      { id, input }: { id: string; input: never },
      ctx: GraphQLContext,
    ) => ctx.services.user.updateProfile(id, input),

    deactivateUser: (_p: unknown, { id }: { id: string }, ctx: GraphQLContext) =>
      ctx.services.user.deactivate(requireUser(ctx).sub, id),

    reactivateUser: (_p: unknown, { id }: { id: string }, ctx: GraphQLContext) =>
      ctx.services.user.reactivate(requireUser(ctx).sub, id),

    assignRole: (
      _p: unknown,
      { input }: { input: { userId: string; roleId: string } },
      ctx: GraphQLContext,
    ) => ctx.services.user.assignRole(requireUser(ctx).sub, input.userId, input.roleId),

    removeRole: (
      _p: unknown,
      { input }: { input: { userId: string; roleId: string } },
      ctx: GraphQLContext,
    ) => ctx.services.user.removeRole(requireUser(ctx).sub, input.userId, input.roleId),
  },

  User: {
    roles: (parent: { id: string }, _a: unknown, ctx: GraphQLContext) =>
      ctx.services.user.getRoles(parent.id),
    effectivePermissions: (parent: { id: string }, _a: unknown, ctx: GraphQLContext) =>
      ctx.services.user.getEffectivePermissions(parent.id),
  },
};

export type { ProvisionUserInput };
