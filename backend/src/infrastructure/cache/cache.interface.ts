/**
 * Cache Port Interface
 *
 * Abstracts the performance-caching layer (Redis in production). Cache is
 * NON-transactional and must never participate in a Unit of Work.
 */

export interface CacheSetOptions {
  /** Time-to-live in seconds. */
  ttl?: number;
}

export interface ICachePort {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, options?: CacheSetOptions): Promise<void>;
  delete(key: string): Promise<void>;
}
