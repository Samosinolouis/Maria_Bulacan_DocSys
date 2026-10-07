/**
 * Shared query helpers for service-layer lists.
 *
 * Cursor pagination follows the Relay-style connection contract: services
 * fetch `first + 1` rows from a decoded offset, and `toConnection` trims the
 * extra row to compute `hasNextPage`. Cursors are opaque base64url strings
 * wrapping an absolute offset.
 *
 * [SOLID:SRP] Pagination/search mechanics only - no domain knowledge.
 */

import { ValidationError } from "../../errors/index.js";
import type {
  Connection,
  Edge,
} from "../../interfaces/common.interface.js";

const CURSOR_PREFIX = "offset:";
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

/** Encode an absolute offset as an opaque cursor. */
export function encodeCursor(offset: number): string {
  return Buffer.from(`${CURSOR_PREFIX}${offset}`, "utf8").toString("base64url");
}

/** Decode a cursor back to an offset (0 when absent). Malformed cursors reject. */
export function decodeCursor(cursor: string | null | undefined): number {
  if (!cursor) return 0;
  try {
    const decoded = Buffer.from(cursor, "base64url").toString("utf8");
    if (!decoded.startsWith(CURSOR_PREFIX)) throw new Error("bad prefix");
    const value = Number.parseInt(decoded.slice(CURSOR_PREFIX.length), 10);
    if (!Number.isInteger(value) || value < 0) throw new Error("bad value");
    return value;
  } catch {
    throw new ValidationError("Invalid pagination cursor.");
  }
}

/** Normalize list arguments into a fetch window. */
export function resolveWindow(args: {
  first?: number | null;
  after?: string | null;
}): { first: number; offset: number } {
  const requested = args.first ?? DEFAULT_LIMIT;
  const first = Math.min(Math.max(requested, 1), MAX_LIMIT);
  return { first, offset: decodeCursor(args.after) };
}

export interface PageSlice<T> {
  /** Rows fetched with `limit: first + 1` from `offset`. */
  rows: T[];
  first: number;
  offset: number;
  totalCount: number;
}

/** Build a Relay-style connection from a fetched page slice. */
export function toConnection<T>(slice: PageSlice<T>): Connection<T> {
  const { rows, first, offset, totalCount } = slice;
  const pageRows = rows.slice(0, first);
  const edges: Array<Edge<T>> = pageRows.map((node, index) => ({
    node,
    cursor: encodeCursor(offset + index),
  }));

  return {
    edges,
    pageInfo: {
      hasNextPage: rows.length > first,
      hasPreviousPage: offset > 0,
      startCursor: edges[0]?.cursor ?? null,
      endCursor: edges[edges.length - 1]?.cursor ?? null,
      totalCount,
    },
  };
}

/** Build an empty connection (used when a filter can never match). */
export function emptyConnection<T>(first: number, offset: number): Connection<T> {
  return toConnection<T>({ rows: [], first, offset, totalCount: 0 });
}

/** Escape LIKE wildcards so user input is matched literally, then wrap. */
export function ilikePattern(term: string): string {
  const escaped = term.replace(/[\\%_]/g, (match) => `\\${match}`);
  return `%${escaped}%`;
}
