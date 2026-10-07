/**
 * [B] Document Module - Archive Folder Repository Implementation
 *
 * Concrete data-access for the `folders` table (folders 1 --- N documents).
 * [SOLID:SRP] Queries only - path computation and rules live in the service.
 */

import { and, asc, eq, inArray, isNull, sql } from "drizzle-orm";

import type { Database } from "../db/index.js";
import { folders } from "../db/schema/index.js";
import type {
  IFolderRepository,
  CreateFolderData,
  FolderRecord,
} from "../interfaces/folder.repository.interface.js";

export class FolderRepository implements IFolderRepository {
  constructor(private readonly tx: Database) {}

  async findById(id: string): Promise<FolderRecord | null> {
    const [row] = await this.tx
      .select()
      .from(folders)
      .where(eq(folders.id, id))
      .limit(1);
    return row ?? null;
  }

  async findByPath(path: string): Promise<FolderRecord | null> {
    const [row] = await this.tx
      .select()
      .from(folders)
      .where(eq(folders.path, path))
      .limit(1);
    return row ?? null;
  }

  async findChildren(parentId: string | null): Promise<FolderRecord[]> {
    return this.tx
      .select()
      .from(folders)
      .where(
        parentId === null
          ? isNull(folders.parentId)
          : eq(folders.parentId, parentId),
      )
      .orderBy(asc(folders.name));
  }

  async findByParentAndName(
    parentId: string | null,
    name: string,
  ): Promise<FolderRecord | null> {
    const [row] = await this.tx
      .select()
      .from(folders)
      .where(
        and(
          parentId === null
            ? isNull(folders.parentId)
            : eq(folders.parentId, parentId),
          eq(folders.name, name),
        ),
      )
      .limit(1);
    return row ?? null;
  }

  async create(data: CreateFolderData): Promise<FolderRecord> {
    const [row] = await this.tx
      .insert(folders)
      .values({
        parentId: data.parentId ?? null,
        name: data.name,
        path: data.path,
        createdBy: data.createdBy,
      })
      .returning();
    return row;
  }

  async countByParent(
    parentIds: string[],
  ): Promise<Array<{ parentId: string; count: number }>> {
    if (parentIds.length === 0) return [];
    const rows = await this.tx
      .select({
        parentId: folders.parentId,
        count: sql<number>`count(*)::int`,
      })
      .from(folders)
      .where(inArray(folders.parentId, parentIds))
      .groupBy(folders.parentId);
    return rows.map((row) => ({ parentId: row.parentId as string, count: row.count }));
  }
}
