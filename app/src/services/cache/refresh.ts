/**
 * Data-refresh bus.
 *
 * A completed use-case invalidates the client cache; this store is the signal
 * that tells the data hooks to re-run their fetchers so the page shows the new
 * state immediately. Queries whose entries were NOT invalidated are answered
 * from the cache (see CACHE_MANAGER.md), so a refetch costs no extra request.
 *
 * Deliberately framework-free: services notify, hooks subscribe.
 */

type DataListener = () => void;

let version = 0;
const listeners = new Set<DataListener>();

/** Snapshot for `useSyncExternalStore`. */
export function getDataVersion(): number {
  return version;
}

export function subscribeToData(listener: DataListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Announce that cached data changed: every mounted query re-runs. */
export function notifyDataChanged(): void {
  version += 1;
  for (const listener of listeners) listener();
}
