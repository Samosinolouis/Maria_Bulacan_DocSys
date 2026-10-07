/**
 * User Resolvers
 *
 * Thin adapters: validate/authorize, then delegate to ctx.services.user.
 * Business rules live in the service layer. [SOLID:SRP]
 * Argument shapes come from the generated schema types (src/types/graphql.ts).
 */

import type { GraphQLContext } from "../context.js";
import { requireUser } from "../context.js";
import { toConnectionArgs } from "../helpers.js";
import type { UserFilter, UserSortField } from "../../interfaces/user.service.interface.js";
import type {
  MutationAssignRoleArgs,
  MutationCreateUserArgs,
  MutationDeactivateUserArgs,
  MutationReactivateUserArgs,
  MutationRemoveRoleArgs,
  MutationUpdateUserProfileArgs,
  QueryUserArgs,
  QueryUsersArgs,
} from "../../types/graphql.js";

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
      ctx.user ? ctx.services.user.ensureProvisioned(ctx.user) : null,

    user: (_p: unknown, { id }: QueryUserArgs, ctx: GraphQLContext) =>
      ctx.services.user.getById(id),

    users: (_p: unknown, args: QueryUsersArgs, ctx: GraphQLContext) =>
      ctx.services.user.list(toConnectionArgs<UserFilter, UserSortField>(args)),
  },

  Mutation: {
    createUser: (
      _p: unknown,
      { input }: MutationCreateUserArgs,
      ctx: GraphQLContext,
    ) => ctx.services.user.create(requireUser(ctx).sub, input),

    updateUserProfile: (
      _p: unknown,
      { id, input }: MutationUpdateUserProfileArgs,
      ctx: GraphQLContext,
    ) => ctx.services.user.updateProfile(requireUser(ctx).sub, id, input),

    deactivateUser: (_p: unknown, { id }: MutationDeactivateUserArgs, ctx: GraphQLContext) =>
      ctx.services.user.deactivate(requireUser(ctx).sub, id),

    reactivateUser: (_p: unknown, { id }: MutationReactivateUserArgs, ctx: GraphQLContext) =>
      ctx.services.user.reactivate(requireUser(ctx).sub, id),

    assignRole: (
      _p: unknown,
      { input }: MutationAssignRoleArgs,
      ctx: GraphQLContext,
    ) => ctx.services.user.assignRole(requireUser(ctx).sub, input.userId, input.roleId),

    removeRole: (
      _p: unknown,
      { input }: MutationRemoveRoleArgs,
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
