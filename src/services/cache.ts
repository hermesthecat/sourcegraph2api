/**
 * Cache Service / Önbellek Servisi
 * In-memory cache implementation / Bellek içi önbellek uygulaması
 */

import { log } from '../utils/logger';
import { getCurrentTimestamp } from '../utils/helpers';

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
 * Simple in-memory cache with TTL support / TTL destekli basit bellek içi önbellek
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

  private maxSize: number = 1000; // Maximum items in cache / Önbellekteki maksimum öğe sayısı
  private defaultTTL: number = 300; // 5 minutes default TTL / 5 dakika varsayılan TTL

  constructor(maxSize?: number, defaultTTL?: number) {
    if (maxSize) this.maxSize = maxSize;
    if (defaultTTL) this.defaultTTL = defaultTTL;

    // Periyodik temizlik / Periodic cleanup
    setInterval(() => this.cleanup(), 60000); // Her dakika / Every minute
  }

  /**
   * Cache'e veri ekle / Add data to cache
   */
  set<T>(key: string, value: T, ttlSeconds?: number): void {
    const ttl = ttlSeconds || this.defaultTTL;
    const expiresAt = getCurrentTimestamp() + ttl;

    // Eğer cache doluysa, en eski item'ı sil / If cache is full, evict the oldest item
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

    log.debug(`Cache set: ${key} (TTL: ${ttl}s) / Önbellek ayarlandı: ${key} (TTL: ${ttl}s)`);
  }

  /**
   * Cache'den veri al / Get data from cache
   */
  get<T>(key: string): T | null {
    const item = this.cache.get(key);

    if (!item) {
      this.stats.misses++;
      this.updateHitRate();
      return null;
    }

    // Expire check / Süre sonu kontrolü
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
   * Cache'den veri sil / Delete data from cache
   */
  delete(key: string): boolean {
    const deleted = this.cache.delete(key);
    if (deleted) {
      this.stats.deletes++;
      this.stats.size = this.cache.size;
      this.updateHitRate();
      log.debug(`Cache delete: ${key} / Önbellekten silindi: ${key}`);
    }
    return deleted;
  }

  /**
   * Cache'i temizle / Clear the cache
   */
  clear(): void {
    const size = this.cache.size;
    this.cache.clear();
    this.stats.deletes += size;
    this.stats.size = 0;
    this.updateHitRate();
    log.info('Cache cleared / Önbellek temizlendi');
  }

  /**
   * Key var mı kontrol et / Check if a key exists
   */
  has(key: string): boolean {
    const item = this.cache.get(key);
    if (!item) return false;

    // Expire check / Süre sonu kontrolü
    if (item.expiresAt < getCurrentTimestamp()) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  /**
   * Cache stats al / Get cache stats
   */
  getStats(): CacheStats {
    return { ...this.stats };
  }

  /**
   * Cache keys al / Get cache keys
   */
  keys(): string[] {
    return Array.from(this.cache.keys());
  }

  /**
   * Cache size al / Get cache size
   */
  size(): number {
    return this.cache.size;
  }

  /**
   * Expired items'ları temizle / Cleanup expired items
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
      log.debug(`Cache cleanup: ${cleaned} expired items removed / Önbellek temizliği: ${cleaned} süresi dolmuş öğe kaldırıldı`);
    }
  }

  /**
   * En eski item'ı sil (LRU-like) / Evict the oldest item (LRU-like)
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
      log.debug(`Cache eviction: ${oldestKey} / Önbellekten çıkarma: ${oldestKey}`);
    }
  }

  /**
   * Hit rate'i güncelle / Update hit rate
   */
  private updateHitRate(): void {
    const total = this.stats.hits + this.stats.misses;
    this.stats.hitRate = total > 0 ? (this.stats.hits / total) * 100 : 0;
  }
}

// Global cache instances / Global önbellek örnekleri
export const responseCache = new InMemoryCache(500, 300); // Response cache: 500 items, 5 min TTL / Yanıt önbelleği: 500 öğe, 5 dk TTL
export const modelCache = new InMemoryCache(50, 3600); // Model cache: 50 items, 1 hour TTL / Model önbelleği: 50 öğe, 1 saat TTL
export const configCache = new InMemoryCache(100, 1800); // Config cache: 100 items, 30 min TTL / Yapılandırma önbelleği: 100 öğe, 30 dk TTL

/**
 * Cache wrapper with error handling / Hata yönetimi ile önbellek sarmalayıcı
 */
export class SafeCache {
  constructor(private cache: InMemoryCache) { }

  async get<T>(key: string): Promise<T | null> {
    try {
      return this.cache.get<T>(key);
    } catch (error) {
      log.error(`Cache get error for key ${key}: ${error} / Önbellek alma hatası, anahtar ${key}: ${error}`);
      return null;
    }
  }

  async set<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
    try {
      this.cache.set(key, value, ttlSeconds);
    } catch (error) {
      log.error(`Cache set error for key ${key}: ${error} / Önbellek ayarlama hatası, anahtar ${key}: ${error}`);
    }
  }

  async delete(key: string): Promise<boolean> {
    try {
      return this.cache.delete(key);
    } catch (error) {
      log.error(`Cache delete error for key ${key}: ${error} / Önbellek silme hatası, anahtar ${key}: ${error}`);
      return false;
    }
  }

  async clear(): Promise<void> {
    try {
      this.cache.clear();
    } catch (error) {
      log.error(`Cache clear error: ${error} / Önbellek temizleme hatası: ${error}`);
    }
  }

  getStats(): CacheStats {
    return this.cache.getStats();
  }
}

// Safe cache instances / Güvenli önbellek örnekleri
export const safeResponseCache = new SafeCache(responseCache);
export const safeModelCache = new SafeCache(modelCache);
export const safeConfigCache = new SafeCache(configCache);

/**
 * Response cache için utility fonksiyonlar / Utility functions for response cache
 */
export const ResponseCacheUtils = {
  /**
   * Chat completion response cache key oluştur / Generate chat completion response cache key
   */
  generateChatKey: (model: string, messages: any[], temperature?: number): string => {
    const messageHash = JSON.stringify(messages);
    const tempStr = temperature ? `_temp${temperature}` : '';
    return `chat_${model}${tempStr}_${Buffer.from(messageHash).toString('base64').slice(0, 16)}`;
  },

  /**
   * Model list cache key / Model listesi önbellek anahtarı
   */
  getModelListKey: (): string => 'models_list',

  /**
   * Cache'lenebilir request mi kontrol et / Check if the request is cacheable
   */
  isCacheable: (request: any): boolean => {
    // Stream request'leri cache'leme / Don't cache stream requests
    if (request.stream) return false;

    // Temperature çok yüksekse cache'leme (randomness) / Don't cache if temperature is too high (randomness)
    if (request.temperature && request.temperature > 0.5) return false;

    return true;
  },

  /**
   * Cache TTL hesapla (model bazında) / Calculate cache TTL (per model)
   */
  calculateTTL: (model: string): number => {
    // Büyük modeller için daha uzun cache / Longer cache for large models
    if (model.includes('claude-3-opus') || model.includes('gpt-4')) {
      return 600; // 10 dakika / 10 minutes
    }

    // Hızlı modeller için kısa cache / Shorter cache for fast models
    if (model.includes('haiku') || model.includes('gpt-3.5')) {
      return 180; // 3 dakika / 3 minutes
    }

    return 300; // 5 dakika default / 5 minutes default
  }
};

/**
 * Cache stats dashboard / Önbellek istatistikleri panosu
 */
export function getCacheStats() {
  return {
    responseCache: responseCache.getStats(),
    modelCache: modelCache.getStats(),
    configCache: configCache.getStats(),

    overall: {
      totalHits: responseCache.getStats().hits + modelCache.getStats().hits + configCache.getStats().hits,
      totalMisses: responseCache.getStats().misses + modelCache.getStats().misses + configCache.getStats().misses,
      totalSize: responseCache.size() + modelCache.size() + configCache.size()
    }
  };
} 