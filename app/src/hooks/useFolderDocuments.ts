'use client';

/**
 * useFolderDocuments - documents filed in one archive folder (server-side
 * search included). Root level (null) lists nothing: archived documents live
 * inside folders; they are filed when a request is closed.
 * View -> Hook -> Service -> GraphQL.
 */

import { useCallback } from 'react';
import type { Document } from '@/services/contracts/models';
import { useDocumentService } from './useDomainServices';
import { useServiceQuery } from './useServiceQuery';

export function useFolderDocuments(folderId: string | null, search: string) {
  const { list } = useDocumentService();
  const trimmed = search.trim();
  return useServiceQuery<Document[]>(
    useCallback(
      () =>
        folderId
          ? list({ first: 100, search: trimmed || null, filter: { folderId } }).then((c) =>
              c.edges.map((e) => e.node),
            )
          : Promise.resolve([]),
      [list, folderId, trimmed],
    ),
    [folderId, trimmed],
  );
}
