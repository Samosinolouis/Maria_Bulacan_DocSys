/**
 * FolderService - archive folder tree (folders 1 --- N documents).
 * Reads are session-only (no grant check); create is gated on
 * `FolderService:Create`.
 */

import { authorizeOrThrow } from '@/authz/authorize';
import type { IAuthorizationEngine } from './contracts/authz';
import type { IClientCache } from './contracts/cache';
import type { IGraphQLClient } from './contracts/graphql';
import type { CreateFolderInput, Folder, IFolderService } from './contracts/report';
import type { MutationAnswer } from './contracts/mutation';
import {
  executeQueryWithCache,
  generateGetCacheKey,
  generateListCacheKey,
  invalidateChangedEntities,
  TTL,
} from './cache/helpers';
import { FOLDER_OPS } from './graphql/folder.ops';

export class FolderService implements IFolderService {
  constructor(
    private readonly gql: IGraphQLClient,
    private readonly cache: IClientCache,
    private readonly authz: IAuthorizationEngine,
  ) {}

  async getById(id: string): Promise<Folder | null> {
    return executeQueryWithCache<Folder | null>({
      cache: this.cache,
      queryKey: generateGetCacheKey('folder', id),
      entities: ['Folder'],
      queryType: 'get',
      ttlMs: TTL.OPERATIONAL,
      matchFn: null,
      queryFn: () =>
        this.gql
          .request<{ folder: Folder | null }>({ document: FOLDER_OPS.get, variables: { id }, operationName: 'Folder' })
          .then((d) => d.folder),
      extract: (r) => ({ items: r ? [r] : [], endCursor: null }),
      rehydrate: (items) => (items.length ? (items[0] as Folder) : null),
    });
  }

  async list(parentId?: string | null): Promise<Folder[]> {
    return executeQueryWithCache<Folder[]>({
      cache: this.cache,
      queryKey: generateListCacheKey('folder', { parentId: parentId ?? null }),
      entities: ['Folder'],
      queryType: 'list',
      ttlMs: TTL.OPERATIONAL,
      matchFn: (entity) => (entity as Folder).parentId === (parentId ?? null),
      queryFn: () =>
        this.gql
          .request<{ folders: Folder[] }>({
            document: FOLDER_OPS.list,
            variables: { parentId: parentId ?? null },
            operationName: 'Folders',
          })
          .then((d) => d.folders),
      extract: (rows) => ({ items: rows, endCursor: null }),
      rehydrate: (items) => items as Folder[],
    });
  }

  async create(input: CreateFolderInput): Promise<Folder> {
    authorizeOrThrow(this.authz, 'FolderService:Create');
    const payload = await this.gql.request<{ createFolder: MutationAnswer<'folder', Folder> }>({
      document: FOLDER_OPS.create,
      variables: { input },
      operationName: 'CreateFolder',
    });
    invalidateChangedEntities(this.cache, payload.createFolder.changedEntities);
    return payload.createFolder.folder;
  }
}
