/**
 * Cache Service
 * In-memory cache implementation
 */

import { log } from '../utils/logger';
import { getCurrentTimestamp } from '../utils/helpers';

// Metrics interfaces
interface CacheItem<T> {
  value: T;
  expiresAt: number;
  createdAt: number;
}

interface CacheStats {
  hits: number;
  misses: number;
  sets: number;
  deletes: number;
  size: number;
  hitRate: number;
}

/**
 * Simple in-memory cache with TTL support
 */
class InMemoryCache {
  private cache = new Map<string, CacheItem<any>>();
  private stats: CacheStats = {
    hits: 0,
    misses: 0,
    sets: 0,
    deletes: 0,
    size: 0,
    hitRate: 0
  };

  private maxSize: number = 1000; // Maximum items in cache
  private defaultTTL: number = 300; // 5 minutes default TTL

  constructor(maxSize?: number, defaultTTL?: number) {
    if (maxSize) this.maxSize = maxSize;
    if (defaultTTL) this.defaultTTL = defaultTTL;

    // Periodic cleanup
    setInterval(() => this.cleanup(), 60000); // Every minute
  }

  /**
   * Add data to cache
   */
  set<T>(key: string, value: T, ttlSeconds?: number): void {
    const ttl = ttlSeconds || this.defaultTTL;
    const expiresAt = getCurrentTimestamp() + ttl;

    // If cache is full, evict the oldest item
    if (this.cache.size >= this.maxSize) {
      this.evictOldest();
    }

    this.cache.set(key, {
      value,
      expiresAt,
      createdAt: getCurrentTimestamp()
    });

    this.stats.sets++;
    this.stats.size = this.cache.size;
    this.updateHitRate();

    log.debug(`Cache set: ${key} (TTL: ${ttl}s)`);
  }

  /**
   * Get data from cache
   */
  get<T>(key: string): T | null {
    const item = this.cache.get(key);

    if (!item) {
      this.stats.misses++;
      this.updateHitRate();
      return null;
    }

    // Expire check
    if (item.expiresAt < getCurrentTimestamp()) {
      this.cache.delete(key);
      this.stats.misses++;
      this.stats.deletes++;
      this.stats.size = this.cache.size;
      this.updateHitRate();
      return null;
    }

    this.stats.hits++;
    this.updateHitRate();
    return item.value;
  }

  /**
   * Delete data from cache
   */
  delete(key: string): boolean {
    const deleted = this.cache.delete(key);
    if (deleted) {
      this.stats.deletes++;
      this.stats.size = this.cache.size;
      this.updateHitRate();
      log.debug(`Cache delete: ${key}`);
    }
    return deleted;
  }

  /**
   * Clear the cache
   */
  clear(): void {
    const size = this.cache.size;
    this.cache.clear();
    this.stats.deletes += size;
    this.stats.size = 0;
    this.updateHitRate();
    log.info('Cache cleared');
  }

  /**
   * Check if a key exists
   */
  has(key: string): boolean {
    const item = this.cache.get(key);
    if (!item) return false;

    // Expire check
    if (item.expiresAt < getCurrentTimestamp()) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  /**
   * Get cache stats
   */
  getStats(): CacheStats {
    return { ...this.stats };
  }

  /**
   * Get cache keys
   */
  keys(): string[] {
    return Array.from(this.cache.keys());
  }

  /**
   * Get cache size
   */
  size(): number {
    return this.cache.size;
  }

  /**
   * Cleanup expired items
   */
  private cleanup(): void {
    const now = getCurrentTimestamp();
    let cleaned = 0;

    for (const [key, item] of this.cache.entries()) {
      if (item.expiresAt < now) {
        this.cache.delete(key);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      this.stats.deletes += cleaned;
      this.stats.size = this.cache.size;
      this.updateHitRate();
      log.debug(`Cache cleanup: ${cleaned} expired items removed`);
    }
  }

  /**
   * Evict the oldest item (LRU-like)
   */
  private evictOldest(): void {
    let oldestKey: string | null = null;
    let oldestTime = Infinity;

    for (const [key, item] of this.cache.entries()) {
      if (item.createdAt < oldestTime) {
        oldestTime = item.createdAt;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
      this.stats.deletes++;
      log.debug(`Cache eviction: ${oldestKey}`);
    }
  }

  /**
   * Update hit rate
   */
  private updateHitRate(): void {
    const total = this.stats.hits + this.stats.misses;
    this.stats.hitRate = total > 0 ? (this.stats.hits / total) * 100 : 0;
  }
}

// Global cache instances
export const responseCache = new InMemoryCache(500, 300); // Response cache: 500 items, 5 min TTL
export const modelCache = new InMemoryCache(50, 3600); // Model cache: 50 items, 1 hour TTL
export const configCache = new InMemoryCache(100, 1800); // Config cache: 100 items, 30 min TTL

/**
 * Cache wrapper with error handling
 */
export class SafeCache {
  constructor(private cache: InMemoryCache) { }

  async get<T>(key: string): Promise<T | null> {
    try {
      return this.cache.get<T>(key);
    } catch (error) {
      log.error(`Cache get error for key ${key}: ${error}`);
      return null;
    }
  }

  async set<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
    try {
      this.cache.set(key, value, ttlSeconds);
    } catch (error) {
      log.error(`Cache set error for key ${key}: ${error}`);
    }
  }

  async delete(key: string): Promise<boolean> {
    try {
      return this.cache.delete(key);
    } catch (error) {
      log.error(`Cache delete error for key ${key}: ${error}`);
      return false;
    }
  }

  async clear(): Promise<void> {
    try {
      this.cache.clear();
    } catch (error) {
      log.error(`Cache clear error: ${error}`);
    }
  }

  getStats(): CacheStats {
    return this.cache.getStats();
  }
}

export function getCacheStats() {
  const responseStats = responseCache.getStats();
  const modelStats = modelCache.getStats();
  const configStats = configCache.getStats();

  return {
    responseCache: {
      ...responseStats,
      hitRate: `${responseStats.hitRate.toFixed(1)}%`,
    },
    modelCache: {
      ...modelStats,
      hitRate: `${modelStats.hitRate.toFixed(1)}%`,
    },
    configCache: {
      ...configStats,
      hitRate: `${configStats.hitRate.toFixed(1)}%`,
    },
  };
} 