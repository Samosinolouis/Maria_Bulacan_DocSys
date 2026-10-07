/**
 * Folder Resolvers - delegate to ctx.services.folder.
 *
 * Folders are the archive tree documents are filed into at close time
 * (folders 1 --- N documents). Reads are session-scoped; create enforces
 * FolderService:Create in the service layer. Argument shapes come from the
 * generated schema types (src/types/graphql.ts).
 */

import type { GraphQLContext } from "../context.js";
import { requireUser } from "../context.js";
import type {
  MutationCreateFolderArgs,
  QueryFolderArgs,
  QueryFoldersArgs,
} from "../../types/graphql.js";

export const folderResolvers = {
  Query: {
    folder: (_p: unknown, { id }: QueryFolderArgs, ctx: GraphQLContext) =>
      ctx.services.folder.getById(id),

    folders: (
      _p: unknown,
      { parentId }: QueryFoldersArgs,
      ctx: GraphQLContext,
    ) => ctx.services.folder.listChildren(parentId ?? null),
  },

  Mutation: {
    createFolder: (
      _p: unknown,
      { input }: MutationCreateFolderArgs,
      ctx: GraphQLContext,
    ) => ctx.services.folder.create(requireUser(ctx).sub, input),
  },
};
