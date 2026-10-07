/**
 * Client cache port. Services are the only layer that reads or writes the
 * cache; the implementation lives in `app/src/services/cache/`.
 */

export type CacheQueryType = 'get' | 'list';

/** Metadata stored for one cached query. */
export interface CacheQueryRecord {
  /** PascalCase entity names involved (e.g. ['Request']). */
  entities: string[];
  /** Normalized entity keys produced by the query (e.g. ['Request_abc']). */
  ids: string[];
  type: CacheQueryType;
  /** Absolute expiry timestamp in ms. */
  ttl: number;
  /**
   * Predicate deciding whether a newly created entity belongs to this query.
   * Conservative default matches everything; see CACHE_MANAGER.md.
   */
  match?: ((entity: unknown) => boolean) | null;
  /** Relay end cursor captured on cache miss, replayed on hit. */
  endCursor: string | null;
}

export interface IClientCache {
  hasValidQuery(queryKey: string): boolean;
  getQuery(queryKey: string): CacheQueryRecord | null;
  setQuery(queryKey: string, record: CacheQueryRecord): void;

  getEntity<T>(entityName: string, entityId: string): T | null;
  setEntity<T>(entityName: string, entityId: string, entity: T): void;

  /** Entity to query-keys mapping (drives update/delete invalidation). */
  registerMembership(entityName: string, entityId: string, queryKey: string): void;
  /** Entity type to query-keys mapping (drives create invalidation). */
  registerEntityType(entityName: string, queryKey: string): void;

  invalidateByEntity(entityName: string, entityId: string): void;
  invalidateByEntityType(entityName: string, entity: unknown): void;
  /**
   * Drop every cached query that depends on an entity type, ignoring each
   * query's match predicate. Used by the `changedEntities` invalidation path,
   * where a mutation reports the id of a changed row but not the row itself.
   */
  invalidateQueriesOfType(entityName: string): void;

  clear(): void;
}
