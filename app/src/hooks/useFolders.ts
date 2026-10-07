'use client';

/**
 * useFolders - state for the archive folder listing at one level.
 * View -> Hook -> Service -> GraphQL.
 */

import { useCallback } from 'react';
import type { Folder } from '@/services/contracts/report';
import { useFolderService } from './useDomainServices';
import { useServiceQuery } from './useServiceQuery';

export function useFolders(parentId: string | null) {
  const { list } = useFolderService();
  return useServiceQuery<Folder[]>(
    useCallback(() => list(parentId), [list, parentId]),
    [parentId],
  );
}
