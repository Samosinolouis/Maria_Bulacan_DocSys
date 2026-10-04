/**
 * GraphQL Resolver Helpers
 *
 * Small mapping utilities shared by resolvers. [SOLID:SRP]
 */

import type { ConnectionArgs } from "../interfaces/common.interface.js";

/** Shape of the standard list arguments exposed in the schema. */
export interface ListArgs {
  first?: number | null;
  after?: string | null;
  search?: string | null;
  filter?: unknown;
  sort?: unknown;
}

/** Normalize schema list args into service ConnectionArgs. */
export function toConnectionArgs<TFilter, TSortField extends string>(
  args: ListArgs,
): ConnectionArgs<TFilter, TSortField> {
  return {
    first: args.first ?? 20,
    after: args.after ?? null,
    search: args.search ?? null,
    filter: (args.filter as TFilter) ?? null,
    sort: (args.sort as { field: TSortField; direction?: "ASC" | "DESC" }) ?? null,
  };
}
