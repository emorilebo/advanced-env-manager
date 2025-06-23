/**
 * Intelligent Caching Layer for Environment Manager
 * Production-ready caching with TTL, LRU eviction, and memory management
 */

export interface CacheEntry<T> {
  value: T;
  createdAt: number;
  lastAccessed: number;
  accessCount: number;
  ttl: number;
  tags: Set<string>;
  size: number; // Estimated memory size in bytes
}

export interface CacheConfig {
  maxSize: number; // Maximum number of entries
  defaultTtl: number; // Default TTL in milliseconds
  maxMemoryUsage: number; // Maximum memory usage in bytes
  cleanupInterval: number; // Cleanup interval in milliseconds
  enableMetrics: boolean;
  compressionThreshold: number; // Compress values larger than this
}

export interface CacheMetrics {
  hits: number;
  misses: number;
  sets: number;
  deletes: number;
  evictions: number;
  memoryCleanups: number;
  currentSize: number;
  currentMemoryUsage: number;
  hitRate: number;
  averageAccessTime: number;
}

export interface CacheStats {
  metrics: CacheMetrics;
  topKeys: Array<{ key: string; accessCount: number; lastAccessed: Date }>;
  memoryDistribution: Record<string, number>;
  ttlDistribution: Record<string, number>;
}

/**
 * High-performance intelligent cache with advanced features
 */
export class IntelligentCache<T = any> {
  private cache = new Map<string, CacheEntry<T>>();
  private accessOrder = new Set<string>(); // For LRU tracking
  private metrics: CacheMetrics;
  private cleanupTimer?: NodeJS.Timeout;
  private config: CacheConfig;

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = {
      maxSize: 1000,
      defaultTtl: 5 * 60 * 1000, // 5 minutes
      maxMemoryUsage: 50 * 1024 * 1024, // 50MB
      cleanupInterval: 60 * 1000, // 1 minute
      enableMetrics: true,
      compressionThreshold: 1024, // 1KB
      ...config
    };

    this.metrics = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      evictions: 0,
      memoryCleanups: 0,
      currentSize: 0,
      currentMemoryUsage: 0,
      hitRate: 0,
      averageAccessTime: 0
    };

    this.startCleanupTimer();
  }

  /**
   * Get value from cache with intelligent access tracking
   */
  get(key: string): T | undefined {
    const startTime = performance.now();
    const entry = this.cache.get(key);

    if (!entry) {
      this.recordMiss();
      return undefined;
    }

    // Check if expired
    if (this.isExpired(entry)) {
      this.cache.delete(key);
      this.accessOrder.delete(key);
      this.recordMiss();
      return undefined;
    }

    // Update access statistics
    entry.lastAccessed = Date.now();
    entry.accessCount++;
    
    // Update LRU order
    this.accessOrder.delete(key);
    this.accessOrder.add(key);

    this.recordHit();
    this.updateAverageAccessTime(performance.now() - startTime);

    return entry.value;
  }

  /**
   * Set value in cache with intelligent eviction
   */
  set(key: string, value: T, ttl?: number, tags: string[] = []): boolean {
    try {
      const size = this.estimateSize(value);
      const entry: CacheEntry<T> = {
        value,
        createdAt: Date.now(),
        lastAccessed: Date.now(),
        accessCount: 0,
        ttl: ttl || this.config.defaultTtl,
        tags: new Set(tags),
        size
      };

      // Check if we need to make space
      this.ensureCapacity(size);

      // Remove existing entry if it exists
      if (this.cache.has(key)) {
        this.delete(key);
      }

      // Add new entry
      this.cache.set(key, entry);
      this.accessOrder.add(key);
      
      this.updateMetrics();
      this.recordSet();

      return true;
    } catch (error) {
      console.error('Failed to set cache entry:', error);
      return false;
    }
  }

  /**
   * Delete specific key
   */
  delete(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) {
      return false;
    }

    this.cache.delete(key);
    this.accessOrder.delete(key);
    this.recordDelete();
    this.updateMetrics();

    return true;
  }

  /**
   * Check if key exists and is not expired
   */
  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) {
      return false;
    }

    if (this.isExpired(entry)) {
      this.delete(key);
      return false;
    }

    return true;
  }

  /**
   * Get or set pattern with async fetcher
   */
  async getOrSet<U extends T>(
    key: string,
    fetcher: () => Promise<U>,
    ttl?: number,
    tags: string[] = []
  ): Promise<U> {
    // Try to get from cache first
    const cached = this.get(key);
    if (cached !== undefined) {
      return cached as U;
    }

    // Fetch new value
    try {
      const value = await fetcher();
      this.set(key, value, ttl, tags);
      return value;
    } catch (error) {
      console.error(`Failed to fetch value for key ${key}:`, error);
      throw error;
    }
  }

  /**
   * Invalidate cache entries by tags
   */
  invalidateByTags(tags: string[]): number {
    let invalidated = 0;
    const tagSet = new Set(tags);

    for (const [key, entry] of this.cache.entries()) {
      if (this.hasAnyTag(entry.tags, tagSet)) {
        this.delete(key);
        invalidated++;
      }
    }

    return invalidated;
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
    this.accessOrder.clear();
    this.updateMetrics();
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    this.updateMetrics();
    
    // Get top accessed keys
    const topKeys = Array.from(this.cache.entries())
      .sort(([, a], [, b]) => b.accessCount - a.accessCount)
      .slice(0, 10)
      .map(([key, entry]) => ({
        key,
        accessCount: entry.accessCount,
        lastAccessed: new Date(entry.lastAccessed)
      }));

    // Memory distribution by key prefix
    const memoryDistribution: Record<string, number> = {};
    for (const [key, entry] of this.cache.entries()) {
      const prefix = key.split(':')[0] || 'other';
      memoryDistribution[prefix] = (memoryDistribution[prefix] || 0) + entry.size;
    }

    // TTL distribution
    const ttlDistribution: Record<string, number> = {};
    for (const [, entry] of this.cache.entries()) {
      const ttlRange = this.getTtlRange(entry.ttl);
      ttlDistribution[ttlRange] = (ttlDistribution[ttlRange] || 0) + 1;
    }

    return {
      metrics: { ...this.metrics },
      topKeys,
      memoryDistribution,
      ttlDistribution
    };
  }

  /**
   * Refresh cache entry with new value
   */
  async refresh<U extends T>(
    key: string,
    fetcher: () => Promise<U>,
    ttl?: number,
    tags: string[] = []
  ): Promise<U> {
    try {
      const newValue = await fetcher();
      this.set(key, newValue, ttl, tags);
      return newValue;
    } catch (error) {
      // Return existing value if refresh fails
      const existing = this.get(key);
      if (existing !== undefined) {
        console.warn(`Failed to refresh cache key ${key}, returning stale value:`, error);
        return existing as U;
      }
      throw error;
    }
  }

  /**
   * Get keys matching pattern
   */
  getKeys(pattern?: RegExp): string[] {
    const keys = Array.from(this.cache.keys());
    return pattern ? keys.filter(key => pattern.test(key)) : keys;
  }

  /**
   * Get cache size
   */
  size(): number {
    return this.cache.size;
  }

  /**
   * Get current memory usage
   */
  getMemoryUsage(): number {
    return this.metrics.currentMemoryUsage;
  }

  /**
   * Force cleanup of expired entries
   */
  cleanup(): number {
    let cleaned = 0;
    const now = Date.now();

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.createdAt > entry.ttl) {
        this.cache.delete(key);
        this.accessOrder.delete(key);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      this.updateMetrics();
    }

    return cleaned;
  }

  /**
   * Destroy cache and cleanup resources
   */
  destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }
    this.clear();
  }

  // Private methods

  private isExpired(entry: CacheEntry<T>): boolean {
    return Date.now() - entry.createdAt > entry.ttl;
  }

  private ensureCapacity(newEntrySize: number): void {
    // Check size limit
    while (this.cache.size >= this.config.maxSize) {
      this.evictLeastRecentlyUsed();
    }

    // Check memory limit
    while (this.metrics.currentMemoryUsage + newEntrySize > this.config.maxMemoryUsage) {
      if (!this.evictLeastRecentlyUsed()) {
        break; // No more entries to evict
      }
      this.metrics.memoryCleanups++;
    }
  }

  private evictLeastRecentlyUsed(): boolean {
    const oldestKey = this.accessOrder.values().next().value;
    if (oldestKey) {
      this.cache.delete(oldestKey);
      this.accessOrder.delete(oldestKey);
      this.metrics.evictions++;
      return true;
    }
    return false;
  }

  private estimateSize(value: T): number {
    try {
      const serialized = JSON.stringify(value);
      return serialized.length * 2; // UTF-16 characters
    } catch {
      return 100; // Default estimate for non-serializable values
    }
  }

  private hasAnyTag(entryTags: Set<string>, searchTags: Set<string>): boolean {
    for (const tag of entryTags) {
      if (searchTags.has(tag)) {
        return true;
      }
    }
    return false;
  }

  private getTtlRange(ttl: number): string {
    if (ttl < 60000) return '<1min';
    if (ttl < 300000) return '1-5min';
    if (ttl < 900000) return '5-15min';
    if (ttl < 3600000) return '15min-1h';
    return '>1h';
  }

  private startCleanupTimer(): void {
    this.cleanupTimer = setInterval(() => {
      this.cleanup();
    }, this.config.cleanupInterval);
  }

  private updateMetrics(): void {
    this.metrics.currentSize = this.cache.size;
    this.metrics.currentMemoryUsage = Array.from(this.cache.values())
      .reduce((total, entry) => total + entry.size, 0);
  }

  private recordHit(): void {
    this.metrics.hits++;
    this.updateHitRate();
  }

  private recordMiss(): void {
    this.metrics.misses++;
    this.updateHitRate();
  }

  private recordSet(): void {
    this.metrics.sets++;
  }

  private recordDelete(): void {
    this.metrics.deletes++;
  }

  private updateHitRate(): void {
    const total = this.metrics.hits + this.metrics.misses;
    this.metrics.hitRate = total > 0 ? this.metrics.hits / total : 0;
  }

  private updateAverageAccessTime(accessTime: number): void {
    const totalAccesses = this.metrics.hits + this.metrics.misses;
    this.metrics.averageAccessTime = 
      (this.metrics.averageAccessTime * (totalAccesses - 1) + accessTime) / totalAccesses;
  }
}

/**
 * Cache Manager for organizing multiple cache instances
 */
export class CacheManager {
  private caches = new Map<string, IntelligentCache>();

  createCache<T>(name: string, config?: Partial<CacheConfig>): IntelligentCache<T> {
    const cache = new IntelligentCache<T>(config);
    this.caches.set(name, cache);
    return cache;
  }

  getCache<T>(name: string): IntelligentCache<T> | undefined {
    return this.caches.get(name) as IntelligentCache<T>;
  }

  getAllStats(): Record<string, CacheStats> {
    const stats: Record<string, CacheStats> = {};
    for (const [name, cache] of this.caches.entries()) {
      stats[name] = cache.getStats();
    }
    return stats;
  }

  clearAll(): void {
    for (const cache of this.caches.values()) {
      cache.clear();
    }
  }

  destroyAll(): void {
    for (const cache of this.caches.values()) {
      cache.destroy();
    }
    this.caches.clear();
  }
}

// Global cache instances
export const cacheManager = new CacheManager();

// Pre-configured cache instances for common use cases
export const secretsCache = cacheManager.createCache('secrets', {
  defaultTtl: 15 * 60 * 1000, // 15 minutes
  maxSize: 500,
  maxMemoryUsage: 10 * 1024 * 1024, // 10MB
  cleanupInterval: 2 * 60 * 1000 // 2 minutes
});

export const configCache = cacheManager.createCache('config', {
  defaultTtl: 60 * 60 * 1000, // 1 hour
  maxSize: 100,
  maxMemoryUsage: 5 * 1024 * 1024, // 5MB
  cleanupInterval: 5 * 60 * 1000 // 5 minutes
});
