/**
 * Thumbnail cache utility for localStorage
 * Implements LRU (Least Recently Used) cache with size limits
 */

const THUMBNAIL_CACHE_KEY = 'excalidraw_thumbnail_cache';
const MAX_CACHE_SIZE = 5 * 1024 * 1024; // 5MB max cache size
const MAX_CACHE_ITEMS = 100; // Max 100 thumbnails

interface CacheEntry {
  thumbnail: string;
  timestamp: number;
  size: number;
}

interface ThumbnailCache {
  [drawingId: string]: CacheEntry;
}

class ThumbnailCacheManager {
  private cache: ThumbnailCache = {};
  private totalSize = 0;

  constructor() {
    this.loadCache();
  }

  /**
   * Load cache from localStorage
   */
  private loadCache(): void {
    try {
      const cached = localStorage.getItem(THUMBNAIL_CACHE_KEY);
      if (cached) {
        this.cache = JSON.parse(cached);
        this.calculateTotalSize();
      }
    } catch (error) {
      console.error('Failed to load thumbnail cache:', error);
      this.cache = {};
      this.totalSize = 0;
    }
  }

  /**
   * Save cache to localStorage
   */
  private saveCache(): void {
    try {
      localStorage.setItem(THUMBNAIL_CACHE_KEY, JSON.stringify(this.cache));
    } catch (error) {
      console.error('Failed to save thumbnail cache:', error);
      // If quota exceeded, clear some old entries and try again
      this.evictOldEntries(10);
      try {
        localStorage.setItem(THUMBNAIL_CACHE_KEY, JSON.stringify(this.cache));
      } catch (retryError) {
        console.error('Failed to save cache after eviction:', retryError);
      }
    }
  }

  /**
   * Calculate total cache size
   */
  private calculateTotalSize(): void {
    this.totalSize = Object.values(this.cache).reduce(
      (sum, entry) => sum + entry.size,
      0
    );
  }

  /**
   * Evict old entries to make space
   */
  private evictOldEntries(count: number): void {
    const entries = Object.entries(this.cache);
    // Sort by timestamp (oldest first)
    entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
    
    // Remove oldest entries
    for (let i = 0; i < Math.min(count, entries.length); i++) {
      const [drawingId] = entries[i];
      delete this.cache[drawingId];
    }
    
    this.calculateTotalSize();
  }

  /**
   * Ensure cache doesn't exceed size limits
   */
  private ensureCacheSize(): void {
    const entries = Object.entries(this.cache);
    
    // Check if we exceed max items
    if (entries.length > MAX_CACHE_ITEMS) {
      this.evictOldEntries(entries.length - MAX_CACHE_ITEMS);
    }
    
    // Check if we exceed max size
    while (this.totalSize > MAX_CACHE_SIZE && entries.length > 0) {
      this.evictOldEntries(5);
    }
  }

  /**
   * Get thumbnail from cache
   */
  get(drawingId: string): string | null {
    const entry = this.cache[drawingId];
    if (!entry) {
      return null;
    }
    
    // Update timestamp (LRU)
    entry.timestamp = Date.now();
    this.saveCache();
    
    return entry.thumbnail;
  }

  /**
   * Set thumbnail in cache
   */
  set(drawingId: string, thumbnail: string): void {
    const size = thumbnail.length;
    
    // Remove old entry if exists
    if (this.cache[drawingId]) {
      this.totalSize -= this.cache[drawingId].size;
    }
    
    // Add new entry
    this.cache[drawingId] = {
      thumbnail,
      timestamp: Date.now(),
      size,
    };
    
    this.totalSize += size;
    
    // Ensure cache size limits
    this.ensureCacheSize();
    
    // Save to localStorage
    this.saveCache();
  }

  /**
   * Remove thumbnail from cache
   */
  remove(drawingId: string): void {
    if (this.cache[drawingId]) {
      this.totalSize -= this.cache[drawingId].size;
      delete this.cache[drawingId];
      this.saveCache();
    }
  }

  /**
   * Clear entire cache
   */
  clear(): void {
    this.cache = {};
    this.totalSize = 0;
    try {
      localStorage.removeItem(THUMBNAIL_CACHE_KEY);
    } catch (error) {
      console.error('Failed to clear thumbnail cache:', error);
    }
  }

  /**
   * Get cache statistics
   */
  getStats(): { itemCount: number; totalSize: number; maxSize: number } {
    return {
      itemCount: Object.keys(this.cache).length,
      totalSize: this.totalSize,
      maxSize: MAX_CACHE_SIZE,
    };
  }
}

// Export singleton instance
export const thumbnailCache = new ThumbnailCacheManager();
