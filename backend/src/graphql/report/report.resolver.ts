/**
 * Report & Lookup Resolvers - dashboards, reports, reference-data maintenance.
 * Argument shapes come from the generated schema types (src/types/graphql.ts).
 */

import type { GraphQLContext } from "../context.js";
import type {
  MutationCreateDocumentTypeArgs,
  MutationCreateRequestTypeArgs,
  MutationExportSummaryArgs,
  MutationUpsertHolidayArgs,
  QueryCategorySummaryArgs,
  QueryHolidaysArgs,
} from "../../types/graphql.js";

export const reportResolvers = {
  Query: {
    dashboardMetrics: (_p: unknown, _a: unknown, ctx: GraphQLContext) =>
      ctx.services.report.getDashboardMetrics(),

    categorySummary: (_p: unknown, { input }: QueryCategorySummaryArgs, ctx: GraphQLContext) =>
      ctx.services.report.getCategorySummary(input),

    holidays: (
      _p: unknown,
      { from, to }: QueryHolidaysArgs,
      ctx: GraphQLContext,
    ) =>
      ctx.services.lookup.listHolidays(
        from ? new Date(from) : null,
        to ? new Date(to) : null,
      ),
  },

  Mutation: {
    exportSummary: async (_p: unknown, { input }: MutationExportSummaryArgs, ctx: GraphQLContext) => {
      const artifact = await ctx.services.report.exportSummary(input);
      return {
        fileName: artifact.fileName,
        mimeType: artifact.mimeType,
        bodyBase64: Buffer.from(artifact.body).toString("base64"),
      };
    },

    createRequestType: (_p: unknown, { input }: MutationCreateRequestTypeArgs, ctx: GraphQLContext) =>
      ctx.services.lookup.createRequestType(input),

    createDocumentType: (_p: unknown, { input }: MutationCreateDocumentTypeArgs, ctx: GraphQLContext) =>
      ctx.services.lookup.createDocumentType(input),

    upsertHoliday: (_p: unknown, { input }: MutationUpsertHolidayArgs, ctx: GraphQLContext) =>
      ctx.services.lookup.upsertHoliday(input),
  },
};
