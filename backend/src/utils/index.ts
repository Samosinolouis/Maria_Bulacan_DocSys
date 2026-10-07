/**
 * Common utility helpers.
 */

import { createHash } from "node:crypto";

/**
 * Compute the SHA-256 hex digest of a buffer.
 * Used as the server-computed tamper-evidence checksum on every upload
 * (FR-10, NFR-08). The application NEVER computes file content - only this
 * integrity hash of what the client uploaded.
 */
export function computeSha256(buffer: Buffer | Uint8Array): string {
  return createHash("sha256").update(buffer).digest("hex");
}

/**
 * Build a deterministic, collision-resistant MinIO storage key.
 * Example: requests/<requestId>/<uuid>-<originalName>
 */
export function buildStorageKey(
  prefix: string,
  ownerId: string,
  originalName: string,
): string {
  const safeName = originalName.replace(/[^A-Za-z0-9._-]/g, "_");
  const unique = globalThis.crypto.randomUUID();
  return `${prefix}/${ownerId}/${unique}-${safeName}`;
}

/** Format a control number: <prefix>-<year>-<padded value>. e.g. TO-2026-0045 */
export function formatControlNo(
  prefix: string,
  year: number,
  value: number,
  pad = 4,
): string {
  return `${prefix}-${year}-${String(value).padStart(pad, "0")}`;
}
