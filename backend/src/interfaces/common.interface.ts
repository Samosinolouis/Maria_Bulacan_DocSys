/**
 * Shared repository types.
 */

import { SQL } from "drizzle-orm";

/** Common list/query options for repositories. */
export interface ListOptions {
  limit: number;
  offset?: number;
  where?: SQL;
  orderBy?: SQL[];
}

/** Relay-style edge. */
export interface Edge<T> {
  node: T;
  cursor: string;
}

/** Relay-style cursor connection. */
export interface Connection<T> {
  edges: Array<Edge<T>>;
  pageInfo: {
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    startCursor: string | null;
    endCursor: string | null;
    totalCount: number;
  };
}

/** Sort direction. */
export type SortDirection = "ASC" | "DESC";

/** Common pagination/search/filter/sort arguments accepted by list services. */
export interface ConnectionArgs<
  TFilter = unknown,
  TSortField extends string = string,
> {
  first: number;
  after?: string | null;
  search?: string | null;
  filter?: TFilter | null;
  sort?: { field: TSortField; direction?: SortDirection } | null;
}
