import { Inject, Injectable } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';
import { CacheService } from './cache/cache.service';
import { AnalyticsService } from './analytics/analytics.service';

@Injectable()
export class AppService {
  constructor(
    private prisma: PrismaService, 
    private cacheService: CacheService,
    private analyticsService: AnalyticsService
  ) {}

  async getHealth() {
    // Check DB connection
    let dbStatus = 'unknown';
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      dbStatus = 'up';
    } catch (e) {
      dbStatus = 'down';
    }

    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: process.env.npm_package_name || 'feature-flags-api',
      version: process.env.npm_package_version || 'unknown',
      environment: process.env.NODE_ENV || 'development',
      database: dbStatus,
    };
  }

  
  async getByIdentifier(
    platformKey: string, 
    environmentKey: string, 
    scopeSlug: string,
    userAgent?: string,
    ipAddress?: string
  ) {
    // Check cache first
    const cached = await this.cacheService.getFlags(platformKey, environmentKey, scopeSlug);
    
    if (cached) {
      console.log('Returning cached flags for:', { platformKey, environmentKey, scopeSlug });
      // Track analytics asynchronously for cached results
      this.trackAnalytics(cached, { platformKey, environmentKey, scopeSlug, userAgent, ipAddress }).catch((error) => {
        console.error('Analytics tracking failed:', error);
      });
      return cached;
    }
  
    // Cache miss - fetch from DB
    const flags = await this.prisma.featureFlag.findMany({
      where: { platformKey, environmentKey, scopeSlug },
      select: { key: true, enabled: true },
    });
  
    const result = Object.fromEntries(flags.map(f => [f.key, f.enabled]));
  
    // Store in cache for future requests
    await this.cacheService.setFlags(platformKey, environmentKey, scopeSlug, result);
    console.log('Cached flags for:', { platformKey, environmentKey, scopeSlug });
  
    // Track analytics asynchronously
    this.trackAnalytics(result, { platformKey, environmentKey, scopeSlug, userAgent, ipAddress }).catch((error) => {
      console.error('Analytics tracking failed:', error);
    });
  
    return result;
  }

  private async trackAnalytics(
    flags: Record<string, boolean>,
    metadata: {
      platformKey: string;
      environmentKey: string;
      scopeSlug: string;
      userAgent?: string;
      ipAddress?: string;
    },
  ): Promise<void> {
    // Track scope usage (one entry per scope, not per flag)
    await this.analyticsService.trackScopeUsage({
      platformKey: metadata.platformKey,
      environmentKey: metadata.environmentKey,
      scopeSlug: metadata.scopeSlug,
      userAgent: metadata.userAgent,
      ipAddress: metadata.ipAddress,
      flagCount: Object.keys(flags).length,
    });
  }

}
