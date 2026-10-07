/**
 * Response normalizers. List operations select scalar fields only (the nested
 * collections are fetched on detail reads), so list nodes are normalized to
 * satisfy the contract's non-optional collection fields with empty arrays.
 */

import type { Connection } from '../contracts/common';
import type { Document, Request } from '../contracts/models';

type Raw = Record<string, unknown>;

export function normalizeRequest(node: Raw): Request {
  return {
    ...(node as unknown as Request),
    documents: (node.documents as Request['documents']) ?? [],
    attachments: (node.attachments as Request['attachments']) ?? [],
    logs: (node.logs as Request['logs']) ?? [],
  };
}

export function normalizeDocument(node: Raw): Document {
  return {
    ...(node as unknown as Document),
    attachments: (node.attachments as Document['attachments']) ?? [],
    transmissions: (node.transmissions as Document['transmissions']) ?? [],
    logs: (node.logs as Document['logs']) ?? [],
  };
}

/** Map every node of a Relay connection, preserving cursors and page info. */
export function mapConnection<TIn, TOut>(
  conn: Connection<TIn>,
  map: (node: TIn) => TOut,
): Connection<TOut> {
  return {
    edges: conn.edges.map((edge) => ({ node: map(edge.node), cursor: edge.cursor })),
    pageInfo: conn.pageInfo,
  };
}
