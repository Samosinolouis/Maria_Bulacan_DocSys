/**
 * Folder Repository Interfaces
 *
 * Data-access abstractions for archive folders (folders 1 --- N documents).
 * Paths are denormalized by the service layer; this layer stores and reads
 * rows, and provides the counts that back `itemCount`.
 */

import { folders } from "../db/schema/index.js";

export type FolderRecord = typeof folders.$inferSelect;

export interface CreateFolderData {
  /** NULL = root-level folder. */
  parentId?: string | null;
  /** Unique among siblings; "/" is illegal. */
  name: string;
  /** Denormalized path: `<parent.path>/<name>` (root: `<name>`). */
  path: string;
  createdBy: string;
}

export interface IFolderRepository {
  findById(id: string): Promise<FolderRecord | null>;
  findByPath(path: string): Promise<FolderRecord | null>;

  /** Direct children of a folder, ordered by name; null lists root folders. */
  findChildren(parentId: string | null): Promise<FolderRecord[]>;

  /** Sibling lookup for the uniqueness rule (null parent = root level). */
  findByParentAndName(
    parentId: string | null,
    name: string,
  ): Promise<FolderRecord | null>;

  create(data: CreateFolderData): Promise<FolderRecord>;

  /** Direct subfolder counts per parent id (for itemCount). */
  countByParent(
    parentIds: string[],
  ): Promise<Array<{ parentId: string; count: number }>>;
}
