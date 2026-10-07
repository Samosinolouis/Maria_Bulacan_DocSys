/**
 * Folder Service
 *
 * Implements IFolderService - the archive folder tree that documents are
 * filed into when a request is closed (FR-29..31).
 *
 * Rules:
 *  - `path` is derived at creation: `<parent.path>/<name>`; root folders use
 *    `<name>` alone. Since no rename/move exists yet, the stored path never
 *    needs recomputing.
 *  - A name is unique among its siblings (enforced here with a friendly
 *    ConflictError; the database carries matching unique indexes as a
 *    backstop) and must not contain "/".
 *  - `itemCount` counts direct children at one level: subfolders + documents.
 *
 * [SOLID:SRP] Folder rules only - no DB or HTTP concerns.
 * [SOLID:DIP] Depends on IDatabase / IRepositories abstractions.
 */

import { ConflictError, NotFoundError, ValidationError } from "../../errors/index.js";
import type { IDatabase, IRepositories } from "../../interfaces/uow.interface.js";
import type { ITelemetryPort } from "../../infrastructure/telemetry/telemetry.interface.js";
import type {
  IFolderService,
  CreateFolderInput,
  FolderWithItemCount,
} from "../../interfaces/folder.service.interface.js";
import type { FolderRecord } from "../../interfaces/folder.repository.interface.js";
import { assertPermission } from "../shared/authz.js";

const MAX_NAME_LENGTH = 255;

export class FolderService implements IFolderService {
  constructor(
    private readonly db: IDatabase,
    private readonly telemetry: ITelemetryPort,
  ) {}

  async getById(id: string): Promise<FolderWithItemCount | null> {
    return this.db.query(async (uow) => {
      const folder = await uow.folders.findById(id);
      if (!folder) return null;
      const [view] = await this.withItemCounts(uow, [folder]);
      return view;
    });
  }

  async listChildren(parentId: string | null): Promise<FolderWithItemCount[]> {
    return this.db.query(async (uow) => {
      const children = await uow.folders.findChildren(parentId);
      return this.withItemCounts(uow, children);
    });
  }

  async create(actorId: string, input: CreateFolderInput): Promise<FolderWithItemCount> {
    const name = this.normalizeName(input.name);

    const created = await this.db.transaction(async (uow) => {
      await assertPermission(uow, actorId, "FolderService:Create");

      let parent: FolderRecord | null = null;
      if (input.parentId) {
        parent = await uow.folders.findById(input.parentId);
        if (!parent) throw new NotFoundError("Folder", input.parentId);
      }

      const sibling = await uow.folders.findByParentAndName(parent?.id ?? null, name);
      if (sibling) {
        throw new ConflictError(`Folder '${name}' among its siblings`);
      }

      const path = parent ? `${parent.path}/${name}` : name;
      return uow.folders.create({
        parentId: parent?.id ?? null,
        name,
        path,
        createdBy: actorId,
      });
    });

    this.telemetry.trackEvent("folder.created", {
      folderId: created.id,
      path: created.path,
    });
    return { ...created, itemCount: 0 };
  }

  // ------------------------------------------------------------------
  // Internals
  // ------------------------------------------------------------------

  /** Trim, reject empty, reject "/", cap at the column width. */
  private normalizeName(raw: string): string {
    const name = raw?.trim() ?? "";
    if (!name) {
      throw new ValidationError("Folder name is required.");
    }
    if (name.includes("/")) {
      throw new ValidationError('Folder names cannot contain "/".');
    }
    if (name.length > MAX_NAME_LENGTH) {
      throw new ValidationError(
        `Folder name must be ${MAX_NAME_LENGTH} characters or fewer.`,
      );
    }
    return name;
  }

  /** Attach itemCount = direct subfolders + direct documents, in 2 queries. */
  private async withItemCounts(
    uow: IRepositories,
    folders: FolderRecord[],
  ): Promise<FolderWithItemCount[]> {
    if (folders.length === 0) return [];

    const ids = folders.map((folder) => folder.id);
    const [subfolderCounts, documentCounts] = await Promise.all([
      uow.folders.countByParent(ids),
      uow.documents.countByFolder(ids),
    ]);

    const subfolderMap = new Map(subfolderCounts.map((row) => [row.parentId, row.count]));
    const documentMap = new Map(documentCounts.map((row) => [row.folderId, row.count]));

    return folders.map((folder) => ({
      ...folder,
      itemCount: (subfolderMap.get(folder.id) ?? 0) + (documentMap.get(folder.id) ?? 0),
    }));
  }
}
