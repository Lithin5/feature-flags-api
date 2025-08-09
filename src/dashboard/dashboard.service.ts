import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getStats() {
    // Get all statistics in parallel for better performance
    const [
      totalFlags,
      activeFlags,
      environments,
      users,
      flagsByEnvironment
    ] = await Promise.all([
      // Total flags
      this.prisma.featureFlag.count(),
      
      // Active flags
      this.prisma.featureFlag.count({
        where: { enabled: true }
      }),
      
      // Environments
      this.prisma.environment.count({
        where: { 
          deletedAt: null,
          isActive: true 
        }
      }),
      
      // Users
      this.prisma.user.count({
        where: { 
          deletedAt: null,
          isActive: true 
        }
      }),
      
      // Flags by environment - use raw query to avoid TypeScript issues
      this.prisma.$queryRaw`
        SELECT "environmentKey" as environment, COUNT(*) as count 
        FROM "FeatureFlag" 
        GROUP BY "environmentKey" 
        ORDER BY count DESC
      `
    ]);

    // Transform flags by environment data
    const flagsByEnvironmentData = (flagsByEnvironment as any[]).map(item => ({
      environment: item.environment,
      count: Number(item.count)
    }));

    return {
      totalFlags,
      activeFlags,
      environments,
      users,
      flagsByEnvironment: flagsByEnvironmentData
    };
  }
}
