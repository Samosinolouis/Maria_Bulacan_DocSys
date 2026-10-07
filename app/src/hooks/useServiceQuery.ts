'use client';

/**
 * The data-hook primitive. Owns `{ data, isLoading, isRefreshing, error, refresh }`
 * for one screen concern.
 *
 * Two rules keep the page state honest:
 *  - the first fetch waits for the authorization subject (the `me` snapshot),
 *    because every service gates its read on a permission and a request issued
 *    before hydration is rejected with NO_SESSION ("session is still loading");
 *  - the query re-runs whenever the data-refresh bus bumps (a completed
 *    use-case), so a mutation shows up on the page without a manual refresh.
 *    Only the invalidated cache entries hit the network, so this is cheap.
 *
 * `isLoading` (nothing loaded for the current key yet) is derived rather than
 * set inside the effect body, so the React 19 `set-state-in-effect` rule is
 * respected and a spinner shows on every dependency change and explicit
 * refresh. A bus-driven re-run keeps the current data on screen and reports
 * `isRefreshing` instead.
 */

import { useCallback, useEffect, useState, useSyncExternalStore } from 'react';
import { normalizeError } from '@/services/cache/helpers';
import { getDataVersion, subscribeToData } from '@/services/cache/refresh';
import type { AppErrorShape } from '@/services/contracts/errors';
import { useAuthorization } from './useAuthorization';

export interface ServiceQueryState<T> {
  data: T | null;
  isLoading: boolean;
  isRefreshing: boolean;
  error: AppErrorShape | null;
  refresh: () => void;
}

export function useServiceQuery<T>(
  fetcher: () => Promise<T>,
  deps: readonly unknown[],
): ServiceQueryState<T> {
  const { isHydrated } = useAuthorization();
  const dataVersion = useSyncExternalStore(subscribeToData, getDataVersion, getDataVersion);

  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<AppErrorShape | null>(null);
  const [version, setVersion] = useState(0);
  const [loadedKey, setLoadedKey] = useState<string | null>(null);
  const [loadedFetchKey, setLoadedFetchKey] = useState<string | null>(null);

  // Explicit refresh / dependency change: show the loading state.
  const key = `${JSON.stringify(deps)}:${version}`;
  // Completed use-case: refetch behind the scenes, keep the current data.
  const fetchKey = `${key}:${dataVersion}`;
  const isLoading = loadedKey !== key;
  const isRefreshing = !isLoading && loadedFetchKey !== fetchKey;

  useEffect(() => {
    if (!isHydrated) return;
    let live = true;
    (async () => {
      try {
        const result = await fetcher();
        if (!live) return;
        setData(result);
        setError(null);
      } catch (err) {
        if (!live) return;
        setError(normalizeError(err));
      } finally {
        if (live) {
          setLoadedKey(key);
          setLoadedFetchKey(fetchKey);
        }
      }
    })();
    return () => {
      live = false;
    };
    // `fetcher` is captured by the closure; its inputs are serialized into `key`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchKey, isHydrated]);

  const refresh = useCallback(() => setVersion((n) => n + 1), []);
  return { data, isLoading, isRefreshing, error, refresh };
}
