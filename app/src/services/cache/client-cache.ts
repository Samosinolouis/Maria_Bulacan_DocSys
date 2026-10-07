/**
 * Client cache implementation - four stores (see CACHE_MANAGER.md):
 *  1. EntityStore      Map<'EntityName_id', object>
 *  2. QueryStore       Map<queryKey, CacheQueryRecord>
 *  3. QueryMembership  Map<'EntityName_id', Set<queryKey>>
 *  4. EntityTypeIndex  Map<'EntityName', Set<queryKey>>
 */

import type { CacheQueryRecord, IClientCache } from '../contracts/cache';

const ENTITY_SEPARATOR = '_';

function entityKey(entityName: string, entityId: string): string {
  return `${entityName}${ENTITY_SEPARATOR}${entityId}`;
}

export class ClientCache implements IClientCache {
  private readonly entityStore = new Map<string, unknown>();
  private readonly queryStore = new Map<string, CacheQueryRecord>();
  private readonly membership = new Map<string, Set<string>>();
  private readonly entityTypeIndex = new Map<string, Set<string>>();

  hasValidQuery(queryKey: string): boolean {
    const record = this.queryStore.get(queryKey);
    return !!record && record.ttl > Date.now();
  }

  getQuery(queryKey: string): CacheQueryRecord | null {
    return this.queryStore.get(queryKey) ?? null;
  }

  setQuery(queryKey: string, record: CacheQueryRecord): void {
    this.queryStore.set(queryKey, record);
  }

  getEntity<T>(entityName: string, entityId: string): T | null {
    return (this.entityStore.get(entityKey(entityName, entityId)) as T | undefined) ?? null;
  }

  setEntity<T>(entityName: string, entityId: string, entity: T): void {
    this.entityStore.set(entityKey(entityName, entityId), entity);
  }

  registerMembership(entityName: string, entityId: string, queryKey: string): void {
    const key = entityKey(entityName, entityId);
    const set = this.membership.get(key) ?? new Set<string>();
    set.add(queryKey);
    this.membership.set(key, set);
  }

  registerEntityType(entityName: string, queryKey: string): void {
    const set = this.entityTypeIndex.get(entityName) ?? new Set<string>();
    set.add(queryKey);
    this.entityTypeIndex.set(entityName, set);
  }

  invalidateByEntity(entityName: string, entityId: string): void {
    const key = entityKey(entityName, entityId);
    const queries = this.membership.get(key);
    if (queries) {
      for (const queryKey of queries) this.queryStore.delete(queryKey);
      this.membership.delete(key);
    }
    this.entityStore.delete(key);
  }

  invalidateByEntityType(entityName: string, entity: unknown): void {
    const queries = this.entityTypeIndex.get(entityName);
    if (!queries) return;
    for (const queryKey of queries) {
      const record = this.queryStore.get(queryKey);
      if (!record) {
        queries.delete(queryKey);
        continue;
      }
      const matches = record.match ? record.match(entity) : true;
      if (!matches) continue;
      this.queryStore.delete(queryKey);
      for (const name of record.entities) {
        this.entityTypeIndex.get(name)?.delete(queryKey);
      }
    }
  }

  invalidateQueriesOfType(entityName: string): void {
    const queries = this.entityTypeIndex.get(entityName);
    if (!queries) return;
    for (const queryKey of queries) {
      const record = this.queryStore.get(queryKey);
      this.queryStore.delete(queryKey);
      for (const name of record?.entities ?? [entityName]) {
        this.entityTypeIndex.get(name)?.delete(queryKey);
      }
    }
    this.entityTypeIndex.delete(entityName);
  }

  clear(): void {
    this.entityStore.clear();
    this.queryStore.clear();
    this.membership.clear();
    this.entityTypeIndex.clear();
  }

  /** Debug helper (browser console): store sizes. */
  stats() {
    return {
      entities: this.entityStore.size,
      queries: this.queryStore.size,
      memberships: this.membership.size,
      entityTypes: this.entityTypeIndex.size,
    };
  }
}
