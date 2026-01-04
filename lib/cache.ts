import { cacheConfig } from './config';
import { logger } from './logger';

// Cache interface
interface CacheEntry<T = any> {
  value: T;
  expires: number;
  createdAt: number;
  accessCount: number;
  lastAccessed: number;
}

// Cache options
interface CacheOptions {
  ttl?: number; // Time to live in seconds
  maxSize?: number; // Maximum number of entries
  compression?: boolean; // Enable compression
  serialize?: boolean; // Enable serialization
}

// Cache class
class Cache<T = any> {
  private store: Map<string, CacheEntry<T>>;
  private maxSize: number;
  private defaultTtl: number;
  private compression: boolean;
  private serialize: boolean;
  private accessCount: number;
  private hitCount: number;
  private missCount: number;

  constructor(options: CacheOptions = {}) {
    this.store = new Map();
    this.maxSize = options.maxSize || 1000;
    this.defaultTtl = options.ttl || cacheConfig.defaultTtl;
    this.compression = options.compression || cacheConfig.compression;
    this.serialize = options.serialize ?? true;
    this.accessCount = 0;
    this.hitCount = 0;
    this.missCount = 0;
  }

  // Generate cache key
  private generateKey(key: string): string {
    return `${cacheConfig.keyPrefix}${key}`;
  }

  // Check if entry is expired
  private isExpired(entry: CacheEntry<T>): boolean {
    return Date.now() > entry.expires;
  }

  // Clean up expired entries
  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (now > entry.expires) {
        this.store.delete(key);
      }
    }
  }

  // Evict least recently used entry
  private evictLRU(): void {
    if (this.store.size >= this.maxSize) {
      let oldestKey = '';
      let oldestTime = Date.now();

      for (const [key, entry] of this.store.entries()) {
        if (entry.lastAccessed < oldestTime) {
          oldestTime = entry.lastAccessed;
          oldestKey = key;
        }
      }

      if (oldestKey) {
        this.store.delete(oldestKey);
      }
    }
  }

  // Serialize value
  private serializeValue(value: T): string {
    if (!this.serialize) {
      return value as any;
    }

    try {
      return JSON.stringify(value);
    } catch (error) {
      logger.error('Cache serialization failed', {}, error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }

  // Deserialize value
  private deserializeValue(value: string): T {
    if (!this.serialize) {
      return value as any;
    }

    try {
      return JSON.parse(value);
    } catch (error) {
      logger.error('Cache deserialization failed', {}, error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }

  // Get value from cache
  get(key: string): T | null {
    const cacheKey = this.generateKey(key);
    const entry = this.store.get(cacheKey);

    this.accessCount++;

    if (!entry) {
      this.missCount++;
      return null;
    }

    if (this.isExpired(entry)) {
      this.store.delete(cacheKey);
      this.missCount++;
      return null;
    }

    // Update access statistics
    entry.accessCount++;
    entry.lastAccessed = Date.now();

    this.hitCount++;

    logger.debug('Cache hit', {
      key: cacheKey,
      accessCount: entry.accessCount,
      age: Date.now() - entry.createdAt,
    });

    return entry.value;
  }

  // Set value in cache
  set(key: string, value: T, ttl?: number): void {
    const cacheKey = this.generateKey(key);
    const now = Date.now();
    const expires = now + (ttl || this.defaultTtl) * 1000;

    // Clean up if needed
    this.cleanup();

    // Evict LRU if at capacity
    if (this.store.size >= this.maxSize) {
      this.evictLRU();
    }

    const entry: CacheEntry<T> = {
      value,
      expires,
      createdAt: now,
      accessCount: 0,
      lastAccessed: now,
    };

    this.store.set(cacheKey, entry);

    logger.debug('Cache set', {
      key: cacheKey,
      ttl: ttl || this.defaultTtl,
      size: this.store.size,
    });
  }

  // Delete value from cache
  delete(key: string): boolean {
    const cacheKey = this.generateKey(key);
    const deleted = this.store.delete(cacheKey);

    if (deleted) {
      logger.debug('Cache delete', { key: cacheKey });
    }

    return deleted;
  }

  // Clear all cache entries
  clear(): void {
    this.store.clear();
    this.accessCount = 0;
    this.hitCount = 0;
    this.missCount = 0;

    logger.info('Cache cleared');
  }

  // Check if key exists
  has(key: string): boolean {
    const cacheKey = this.generateKey(key);
    const entry = this.store.get(cacheKey);

    if (!entry) {
      return false;
    }

    if (this.isExpired(entry)) {
      this.store.delete(cacheKey);
      return false;
    }

    return true;
  }

  // Get cache statistics
  getStats(): {
    size: number;
    maxSize: number;
    accessCount: number;
    hitCount: number;
    missCount: number;
    hitRate: number;
    missRate: number;
  } {
    const hitRate = this.accessCount > 0 ? this.hitCount / this.accessCount : 0;
    const missRate = this.accessCount > 0 ? this.missCount / this.accessCount : 0;

    return {
      size: this.store.size,
      maxSize: this.maxSize,
      accessCount: this.accessCount,
      hitCount: this.hitCount,
      missCount: this.missCount,
      hitRate,
      missRate,
    };
  }

  // Get all keys
  keys(): string[] {
    return Array.from(this.store.keys());
  }

  // Get cache size
  size(): number {
    return this.store.size;
  }

  // Check if cache is full
  isFull(): boolean {
    return this.store.size >= this.maxSize;
  }

  // Get memory usage (approximate)
  getMemoryUsage(): number {
    let totalSize = 0;
    for (const [key, entry] of this.store.entries()) {
      totalSize += key.length;
      totalSize += JSON.stringify(entry).length;
    }
    return totalSize;
  }
}

// Create cache instances
export const memoryCache = new Cache({
  maxSize: 1000,
  ttl: cacheConfig.defaultTtl,
  compression: cacheConfig.compression,
});

export const apiCache = new Cache({
  maxSize: 500,
  ttl: 300, // 5 minutes
  compression: true,
});

export const sessionCache = new Cache({
  maxSize: 10000,
  ttl: 3600, // 1 hour
  compression: false,
});

export const productCache = new Cache({
  maxSize: 2000,
  ttl: 1800, // 30 minutes
  compression: true,
});

// Cache decorator
export function withCache<T extends any[]>(
  cache: Cache,
  keyGenerator: (...args: T) => string,
  ttl?: number
) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: T) {
      const key = keyGenerator(...args);
      
      // Try to get from cache
      const cached = cache.get(key);
      if (cached !== null) {
        logger.debug('Cache hit in decorator', { key, method: propertyKey });
        return cached;
      }

      // Execute original method
      const result = await originalMethod.apply(this, args);

      // Store in cache
      cache.set(key, result, ttl);

      logger.debug('Cache set in decorator', { key, method: propertyKey, ttl });

      return result;
    };

    return descriptor;
  };
}

// Cache utility functions
export function createCache<T = any>(options: CacheOptions = {}): Cache<T> {
  return new Cache<T>(options);
}

export function clearAllCaches(): void {
  memoryCache.clear();
  apiCache.clear();
  sessionCache.clear();
  productCache.clear();
}

export function getCacheStats(): Record<string, any> {
  return {
    memory: memoryCache.getStats(),
    api: apiCache.getStats(),
    session: sessionCache.getStats(),
    product: productCache.getStats(),
  };
}

// Cache middleware
export function cacheMiddleware(cache: Cache, keyGenerator: (request: any) => string, ttl?: number) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (request: any, ...args: any[]) {
      const key = keyGenerator(request);
      
      // Try to get from cache
      const cached = cache.get(key);
      if (cached !== null) {
        return cached;
      }

      // Execute original method
      const result = await originalMethod.apply(this, [request, ...args]);

      // Store in cache
      cache.set(key, result, ttl);

      return result;
    };

    return descriptor;
  };
}

// Export cache class
export { Cache };

export default memoryCache;