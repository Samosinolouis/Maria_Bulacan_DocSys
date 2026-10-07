/**
 * Folder Service Interface
 *
 * Business-logic abstraction for archive folders (folders 1 --- N documents).
 * A folder's `path` is derived from its parent's path plus its own name;
 * `itemCount` counts direct children at one level (subfolders + documents).
 */

import type { FolderRecord } from "./folder.repository.interface.js";

/** Folder row plus its one-level item count (subfolders + documents). */
export type FolderWithItemCount = FolderRecord & { itemCount: number };

export interface CreateFolderInput {
  name: string;
  /** Omit for a root-level folder. */
  parentId?: string | null;
}

export interface IFolderService {
  getById(id: string): Promise<FolderWithItemCount | null>;

  /** Direct subfolders of a folder; null lists root-level folders. */
  listChildren(parentId: string | null): Promise<FolderWithItemCount[]>;

  /**
   * Create a folder. The path is `<parent.path>/<name>` (root: `<name>`);
   * the name must be unique among its siblings and must not contain "/".
   * Action: FolderService:Create.
   */
  create(actorId: string, input: CreateFolderInput): Promise<FolderWithItemCount>;
}
