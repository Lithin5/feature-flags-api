import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Track scope usage asynchronously (one entry per scope request)
   */
  async trackScopeUsage(data: {
    platformKey: string;
    environmentKey: string;
    scopeSlug: string;
    userAgent?: string;
    ipAddress?: string;
    flagCount: number;
  }): Promise<void> {
    try {
      // Create scope usage record
      await this.prisma.featureFlagUsage.create({
        data: {
          flagKey: null, // No specific flag since we're tracking at scope level
          platformKey: data.platformKey,
          environmentKey: data.environmentKey,
          scopeSlug: data.scopeSlug,
          enabled: true, // Always true for scope requests
          userAgent: data.userAgent,
          ipAddress: data.ipAddress,
        },
      });

      // Update scope analytics
      await this.updateScopeAnalytics(data.scopeSlug);
    } catch (error) {
      this.logger.error('Failed to track scope usage', error);
      // Don't throw error to avoid affecting the main feature flag request
    }
  }

  /**
   * Track feature flag usage asynchronously (kept for backward compatibility)
   */
  async trackFeatureFlagUsage(data: {
    flagKey: string;
    platformKey: string;
    environmentKey: string;
    scopeSlug: string;
    enabled: boolean;
    userAgent?: string;
    ipAddress?: string;
    clientId?: string;
  }): Promise<void> {
    try {
      // Create usage record
      await this.prisma.featureFlagUsage.create({
        data: {
          flagKey: data.flagKey,
          platformKey: data.platformKey,
          environmentKey: data.environmentKey,
          scopeSlug: data.scopeSlug,
          enabled: data.enabled,
          userAgent: data.userAgent,
          ipAddress: data.ipAddress,
          clientId: data.clientId,
        },
      });

      // Update scope analytics
      await this.updateScopeAnalytics(data.scopeSlug);
    } catch (error) {
      this.logger.error('Failed to track feature flag usage', error);
      // Don't throw error to avoid affecting the main feature flag request
    }
  }

  /**
   * Update scope analytics with the latest count
   */
  private async updateScopeAnalytics(scopeSlug: string): Promise<void> {
    try {
      // Get scope name
      const scope = await this.prisma.featureFlagScope.findUnique({
        where: { slug: scopeSlug },
        select: { name: true },
      });

      if (!scope) {        
        this.logger.warn(`Scope not found for slug: ${scopeSlug}`);
        return;
      }

      // Count total requests for this scope
      const totalRequests = await this.prisma.featureFlagUsage.count({
        where: { scopeSlug },
      });

      // Upsert scope analytics
      await this.prisma.scopeAnalytics.upsert({
        where: { scopeSlug },
        update: {
          totalRequests,
          lastUpdated: new Date(),
        },
        create: {
          scopeSlug,
          scopeName: scope.name,
          totalRequests,
        },
      });
      console.log("saved scope analytics", scopeSlug, totalRequests);
    } catch (error) {
      this.logger.error('Failed to update scope analytics', error);
    }
  }

  /**
   * Get top 10 most called scopes
   */
  async getTopScopes(limit: number = 10): Promise<Array<{
    scopeSlug: string;
    scopeName: string;
    totalRequests: number;
    lastUpdated: Date;
  }>> {
    return this.prisma.scopeAnalytics.findMany({
      orderBy: { totalRequests: 'desc' },
      take: limit,
      select: {
        scopeSlug: true,
        scopeName: true,
        totalRequests: true,
        lastUpdated: true,
      },
    });
  }

  /**
   * Get scope analytics by slug
   */
  async getScopeAnalytics(scopeSlug: string): Promise<{
    scopeSlug: string;
    scopeName: string;
    totalRequests: number;
    lastUpdated: Date;
  } | null> {
    return this.prisma.scopeAnalytics.findUnique({
      where: { scopeSlug },
      select: {
        scopeSlug: true,
        scopeName: true,
        totalRequests: true,
        lastUpdated: true,
      },
    });
  }

  /**
   * Get usage statistics for a specific scope
   */
  async getScopeUsageStats(scopeSlug: string, days: number = 30): Promise<{
    totalRequests: number;
    requestsByDay: Array<{ date: string; count: number }>;
  }> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const [totalRequests, dailyRequests] = await Promise.all([
      this.prisma.featureFlagUsage.count({
        where: { scopeSlug },
      }),
      this.prisma.featureFlagUsage.groupBy({
        by: ['requestedAt'],
        where: {
          scopeSlug,
          requestedAt: { gte: startDate },
        },
        _count: { id: true },
        orderBy: { requestedAt: 'asc' },
      }),
    ]);

    const requestsByDay = dailyRequests.map((day) => ({
      date: day.requestedAt.toISOString().split('T')[0],
      count: day._count.id,
    }));

    return { totalRequests, requestsByDay };
  }
}
