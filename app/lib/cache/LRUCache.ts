export interface CacheConfig {
  maxSize: number;        // 最大缓存大小（字节）
  maxAge: number;        // 最大缓存时间（毫秒）
  maxItems: number;      // 最大缓存条目数
}

export interface CacheItem<T> {
  data: T;
  size: number;
  timestamp: number;
  lastAccessed: number;
}

export class LRUCache<T> {
  private cache: Map<string, CacheItem<T>>;
  private currentSize: number;
  
  constructor(private config: CacheConfig) {
    this.cache = new Map();
    this.currentSize = 0;
  }
  
  set(key: string, value: T): void {
    const size = this.getSize(value);
    this.ensureSpace(size);
    
    const item: CacheItem<T> = {
      data: value,
      size,
      timestamp: Date.now(),
      lastAccessed: Date.now()
    };
    
    this.cache.set(key, item);
    this.currentSize += size;
  }
  
  get(key: string): T | undefined {
    const item = this.cache.get(key);
    if (!item) return undefined;
    
    // 检查是否过期
    if (Date.now() - item.timestamp > this.config.maxAge) {
      this.cache.delete(key);
      this.currentSize -= item.size;
      return undefined;
    }
    
    item.lastAccessed = Date.now();
    return item.data;
  }

  has(key: string): boolean {
    return this.cache.has(key);
  }

  delete(key: string): boolean {
    const item = this.cache.get(key);
    if (!item) return false;
    
    this.currentSize -= item.size;
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
    this.currentSize = 0;
  }
  
  private ensureSpace(requiredSize: number): void {
    if (requiredSize > this.config.maxSize) {
      throw new Error('Item too large for cache');
    }
    
    // 按 LRU 策略清理空间
    while (this.currentSize + requiredSize > this.config.maxSize || 
           this.cache.size >= this.config.maxItems) {
      const [lruKey] = [...this.cache.entries()]
        .sort((a, b) => a[1].lastAccessed - b[1].lastAccessed)[0];
      
      const item = this.cache.get(lruKey)!;
      this.cache.delete(lruKey);
      this.currentSize -= item.size;
    }
  }
  
  private getSize(value: T): number {
    if (typeof value === 'string') {
      return Buffer.byteLength(value, 'utf8');
    }
    // 对于其他类型的数据，可以根据需要扩展
    return JSON.stringify(value).length;
  }
} 