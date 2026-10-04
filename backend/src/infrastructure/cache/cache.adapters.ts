/**
 * Cache Adapters
 *
 * NoOpCacheService: silent passthrough for tests.
 * InMemoryCacheService: process-local Map fallback when Redis is unavailable.
 */

import type { ICachePort, CacheSetOptions } from "./cache.interface.js";

export class NoOpCacheService implements ICachePort {
  async get<T>(): Promise<T | null> {
    return null;
  }
  async set<T>(): Promise<void> {}
  async delete(): Promise<void> {}
}

interface Entry {
  value: unknown;
  expiresAt: number | null;
}

export class InMemoryCacheService implements ICachePort {
  private readonly store = new Map<string, Entry>();

  async get<T>(key: string): Promise<T | null> {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (entry.expiresAt !== null && entry.expiresAt < Date.now()) {
      this.store.delete(key);
      return null;
    }
    return entry.value as T;
  }

  async set<T>(key: string, value: T, options?: CacheSetOptions): Promise<void> {
    const expiresAt = options?.ttl ? Date.now() + options.ttl * 1000 : null;
    this.store.set(key, { value, expiresAt });
  }

  async delete(key: string): Promise<void> {
    this.store.delete(key);
  }
}
