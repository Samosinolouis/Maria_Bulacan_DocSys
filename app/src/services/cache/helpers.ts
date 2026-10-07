/**
 * Cache helpers - key generation, the cache-aside read orchestration, and the
 * invalidation helpers every service shares. Services never reimplement these.
 */

import { AppError, isAppError, type AppErrorShape } from '../contracts/errors';
import type { CacheQueryType, IClientCache } from '../contracts/cache';
import { notifyDataChanged } from './refresh';

export const TTL = {
  /** Operational reads (requests, documents, events, notifications). */
  OPERATIONAL: 60_000,
  /** Dashboard metrics. */
  METRICS: 30_000,
  /** Reference data (types, holidays, catalog). */
  REFERENCE: 600_000,
  /**
   * Reads that carry a LIVE aggregate rather than plain reference data (venue
   * availability, whose `activeBookings` count is computed per query). Kept
   * short on purpose: the scheduler should not show a venue as free long after
   * a booking landed. Mutations still invalidate immediately.
   */
  LIVE: 15_000,
} as const;

const CACHE_NAMESPACE = 'v1';

/** 32-bit djb2 variant, base-36. Not cryptographic; deterministic is enough. */
function hash(input: string): string {
  let h = 5381;
  for (let i = 0; i < input.length; i++) {
    h = ((h << 5) + h + input.charCodeAt(i)) | 0;
  }
  return (h >>> 0).toString(36);
}

/** Stable stringify with alphabetically sorted keys, null/undefined stripped. */
function stableStringify(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`;
  const entries = Object.entries(value as Record<string, unknown>)
    .filter(([, v]) => v !== null && v !== undefined)
    .sort(([a], [b]) => a.localeCompare(b));
  return `{${entries.map(([k, v]) => `${k}:${stableStringify(v)}`).join(',')}}`;
}

export function generateGetCacheKey(entitySnake: string, id: string): string {
  return `${CACHE_NAMESPACE}:${entitySnake}:get:${id}`;
}

export function generateListCacheKey(
  entitySnake: string,
  args: Record<string, unknown>,
): string {
  return `${CACHE_NAMESPACE}:${entitySnake}:list:${hash(stableStringify(args))}`;
}

/** Fixed key for the single dashboard-metrics query. */
export const METRICS_QUERY_KEY = `${CACHE_NAMESPACE}:metrics:dashboard`;

/** Fixed key for the unread-notification-count query. */
export const UNREAD_COUNT_QUERY_KEY = `${CACHE_NAMESPACE}:notification:unread-count`;

export interface ExecuteQueryOptions<TResult> {
  cache: IClientCache;
  queryKey: string;
  /** PascalCase entity names involved. */
  entities: string[];
  queryType: CacheQueryType;
  ttlMs: number;
  matchFn?: ((entity: unknown) => boolean) | null;
  queryFn: () => Promise<TResult>;
  /**
   * Pull the id-bearing items and the Relay end cursor out of the result.
   *
   * These items ARE the entities that get stored and later rehydrated on a
   * cache hit, so a get-by-id query must hand back the whole entity - returning
   * an `{ id }` stub poisons the entity store and every later cached read comes
   * back as a bare id.
   */
  extract: (result: TResult) => { items: Array<{ id: string }>; endCursor: string | null };
  /** Rebuild the result from cached items + the stored end cursor. Return
   *  `undefined` to force a miss (e.g. an entity went missing). */
  rehydrate: (items: unknown[], endCursor: string | null) => TResult | undefined;
}

/**
 * Cache-aside read. On a hit, entities are resolved from the entity store and
 * rehydrated; on a miss the query runs and every item is normalized + indexed.
 */
export async function executeQueryWithCache<TResult>(
  options: ExecuteQueryOptions<TResult>,
): Promise<TResult> {
  const { cache, queryKey, entities, queryType, ttlMs, matchFn, queryFn, extract, rehydrate } =
    options;

  if (cache.hasValidQuery(queryKey)) {
    const record = cache.getQuery(queryKey);
    if (record) {
      const resolved: unknown[] = [];
      let complete = true;
      for (const id of record.ids) {
        const { entityName, entityId } = splitId(id);
        const entity = cache.getEntity(entityName, entityId);
        if (entity === null) {
          complete = false;
          break;
        }
        resolved.push(entity);
      }
      if (complete) {
        const hit = rehydrate(resolved, record.endCursor);
        if (hit !== undefined) {
          console.debug(`[cache] HIT  ${queryKey}`);
          return hit;
        }
      }
    }
  }

  console.debug(`[cache] MISS ${queryKey}`);
  const result = await queryFn();
  const { items, endCursor } = extract(result);

  const ids: string[] = [];
  for (const item of items) {
    for (const entityName of entities) {
      cache.setEntity(entityName, item.id, item);
      cache.registerMembership(entityName, item.id, queryKey);
    }
    ids.push(`${entities[0]}${'_'}${item.id}`);
  }

  cache.setQuery(queryKey, {
    entities,
    ids,
    type: queryType,
    ttl: Date.now() + ttlMs,
    match: matchFn ?? null,
    endCursor,
  });
  for (const entityName of entities) cache.registerEntityType(entityName, queryKey);

  return result;
}

function splitId(key: string): { entityName: string; entityId: string } {
  const idx = key.indexOf('_');
  return { entityName: key.slice(0, idx), entityId: key.slice(idx + 1) };
}

/** Invalidate a single entity (update / delete). */
export function invalidateOnUpdate(cache: IClientCache, entityName: string, id: string): void {
  cache.invalidateByEntity(entityName, id);
  notifyDataChanged();
}

/** Invalidate the queries a newly created entity belongs to (match-driven). */
export function invalidateOnCreate(
  cache: IClientCache,
  entityName: string,
  entity: unknown,
): void {
  cache.invalidateByEntityType(entityName, entity);
  notifyDataChanged();
}

/** Dashboard metrics are always-invalidatable on request/document/event changes. */
export function invalidateMetrics(cache: IClientCache): void {
  cache.invalidateByEntityType('DashboardMetrics', {});
  notifyDataChanged();
}

/** Unread-count query invalidation. */
export function invalidateUnreadCount(cache: IClientCache): void {
  cache.invalidateByEntityType('Notification', {});
  notifyDataChanged();
}

/**
 * Entity names whose queries also depend on the dashboard metrics.
 */
const METRICS_DEPENDENT_ENTITIES = new Set(['Request', 'Document', 'Event']);

/**
 * Entity names that also move the venue availability aggregate: a booking
 * change alters `Venue.activeBookings`, so the venue reads must be dropped with
 * it or the scheduler keeps showing the pre-booking count until the LIVE TTL
 * lapses.
 */
const VENUE_DEPENDENT_ENTITIES = new Set(['Event']);

/**
 * Invalidate exactly what a mutation reported in `changedEntities`
 * (`EntityName_EntityId`, or a bare `EntityName` when a bulk write cannot name
 * rows). Every entry drops the entity's own queries plus the list queries of its
 * type; a changed request/document/event also drops the dashboard metrics.
 */
export function invalidateChangedEntities(
  cache: IClientCache,
  changedEntities: readonly string[] | null | undefined,
): void {
  if (!changedEntities || changedEntities.length === 0) {
    notifyDataChanged();
    return;
  }

  let metricsStale = false;
  let venuesStale = false;
  for (const entry of changedEntities) {
    const separator = entry.indexOf('_');
    const entityName = separator === -1 ? entry : entry.slice(0, separator);
    const entityId = separator === -1 ? null : entry.slice(separator + 1);

    if (entityId) cache.invalidateByEntity(entityName, entityId);
    cache.invalidateQueriesOfType(entityName);
    if (METRICS_DEPENDENT_ENTITIES.has(entityName)) metricsStale = true;
    if (VENUE_DEPENDENT_ENTITIES.has(entityName)) venuesStale = true;
  }

  if (metricsStale) cache.invalidateByEntityType('DashboardMetrics', {});
  if (venuesStale) cache.invalidateQueriesOfType('Venue');
  notifyDataChanged();
}

/** Convert any thrown value into an AppErrorShape. */
export function normalizeError(error: unknown): AppErrorShape {
  if (isAppError(error)) return error;
  if (error instanceof AppError) return error;
  if (error instanceof TypeError) {
    return { code: 'NETWORK', message: 'Network unavailable. Check your connection.' };
  }
  return {
    code: 'UNKNOWN',
    message: 'Something went wrong. Please try again.',
    cause: error,
  };
}
