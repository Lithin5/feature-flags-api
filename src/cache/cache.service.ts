import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable } from '@nestjs/common';
import { Cache } from 'cache-manager';

@Injectable()
export class CacheService {
  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  buildCacheKey(platformKey: string, environmentKey: string, scopeSlug: string): string {
    return `flags:${platformKey}:${environmentKey}:${scopeSlug}`;
  }

  async getFlags(platformKey: string, environmentKey: string, scopeSlug: string): Promise<Record<string, boolean> | undefined> {
    const cacheKey = this.buildCacheKey(platformKey, environmentKey, scopeSlug);
    console.log(`Getting flags from cache with key: ${cacheKey}`);
    const result = await this.cacheManager.get<Record<string, boolean>>(cacheKey);
    console.log(`Cache hit: ${result ? 'YES' : 'NO'}`);
    return result;
  }

  async setFlags(platformKey: string, environmentKey: string, scopeSlug: string, value: Record<string, boolean>): Promise<void> {
    const cacheKey = this.buildCacheKey(platformKey, environmentKey, scopeSlug);
    console.log(`Setting flags in cache with key: ${cacheKey}`);
    await this.cacheManager.set(cacheKey, value);
    console.log('Flags set in cache successfully');
  }

  async invalidate(platformKey: string, environmentKey: string, scopeSlug: string): Promise<void> {
    const cacheKey = this.buildCacheKey(platformKey, environmentKey, scopeSlug);
    console.log(`Invalidating cache with key: ${cacheKey}`);
    const deleted = await this.cacheManager.del(cacheKey);
    console.log(`Cache invalidation result: ${deleted ? 'SUCCESS' : 'KEY_NOT_FOUND'}`);
  }
}
