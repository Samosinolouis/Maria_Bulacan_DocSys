/**
 * Shared contract primitives - Relay-style pagination.
 * Mirrors `PageInfo` / `*Edge` / `*Connection` in the backend schema.
 */

export type SortDirection = 'ASC' | 'DESC';

/** ISO 8601 timestamp string (backend `DateTime` scalar). */
export type ISODateTime = string;

/** Relay-style pagination metadata. Mirrors `PageInfo` in the backend schema. */
export interface PageInfo {
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  startCursor: string | null;
  endCursor: string | null;
  totalCount: number;
}

/** Relay-style edge. Mirrors `*Edge` types in the backend schema. */
export interface Edge<T> {
  node: T;
  cursor: string;
}

/** Relay-style connection. Mirrors `*Connection` types in the backend schema. */
export interface Connection<T> {
  edges: Edge<T>[];
  pageInfo: PageInfo;
}

/** Sort argument accepted by every list operation. */
export interface SortArg<TSortField extends string> {
  field: TSortField;
  direction?: SortDirection;
}

/**
 * Common list arguments. Mirrors the shared list signature on every backend
 * list operation (`first`, `after`, `search`, `filter`, `sort`).
 */
export interface ConnectionArgs<TFilter = never, TSortField extends string = string> {
  first?: number;
  after?: string | null;
  search?: string | null;
  filter?: TFilter | null;
  sort?: SortArg<TSortField> | null;
}
