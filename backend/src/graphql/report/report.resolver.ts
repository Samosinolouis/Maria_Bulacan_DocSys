/**
 * Report & Lookup Resolvers — dashboards, reports, reference-data maintenance.
 */

import type { GraphQLContext } from "../context.js";

export const reportResolvers = {
  Query: {
    dashboardMetrics: (_p: unknown, _a: unknown, ctx: GraphQLContext) =>
      ctx.services.report.getDashboardMetrics(),

    categorySummary: (_p: unknown, { input }: { input: never }, ctx: GraphQLContext) =>
      ctx.services.report.getCategorySummary(input),

    holidays: (
      _p: unknown,
      { from, to }: { from?: string | null; to?: string | null },
      ctx: GraphQLContext,
    ) =>
      ctx.services.lookup.listHolidays(
        from ? new Date(from) : null,
        to ? new Date(to) : null,
      ),
  },

  Mutation: {
    exportSummary: async (_p: unknown, { input }: { input: never }, ctx: GraphQLContext) => {
      const artifact = await ctx.services.report.exportSummary(input);
      return {
        fileName: artifact.fileName,
        mimeType: artifact.mimeType,
        bodyBase64: Buffer.from(artifact.body).toString("base64"),
      };
    },

    createRequestType: (_p: unknown, { input }: { input: never }, ctx: GraphQLContext) =>
      ctx.services.lookup.createRequestType(input),

    createDocumentType: (_p: unknown, { input }: { input: never }, ctx: GraphQLContext) =>
      ctx.services.lookup.createDocumentType(input),

    upsertHoliday: (_p: unknown, { input }: { input: never }, ctx: GraphQLContext) =>
      ctx.services.lookup.upsertHoliday(input),
  },
};
