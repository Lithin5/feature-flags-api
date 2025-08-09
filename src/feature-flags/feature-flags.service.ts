import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  FeatureFlagRequestType,
  FeatureFlagRequestStatus,
} from '../feature-flag-change-request/feature-flag-change-request.enums';
import { UpdateFeatureFlagDto } from './dto/update-feature-flag.dto';
import { UserRole } from '@prisma/client';
import { CreateFeatureFlagDto } from './dto/create-feature-flag.dto';
import { CacheService } from '../cache/cache.service';

@Injectable()
export class FeatureFlagsService {
  constructor(
    private prisma: PrismaService,
    private cacheService: CacheService
  ) {}

  /**
   * Get all feature flags with optional filters and search.
   * @param filters Optional filters: { scopeId, environmentId, platformId, search }
   */
  async getAll(
    filters: {
      scopeId?: string;
      environmentId?: string;
      platformId?: string;
      search?: string;
    } = {},
  ) {
    const { scopeId, environmentId, platformId, search } = filters;
    return this.prisma.featureFlag.findMany({
      where: {
        ...(scopeId && { scopeId }),
        ...(environmentId && { environmentId }),
        ...(platformId && { platformId }),
        ...(search && {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { key: { contains: search, mode: 'insensitive' } },
          ],
        }),
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Find a single feature flag by ID
   * @param id The ID of the feature flag to find
   * @returns The found feature flag or null if not found
   */
  async findOne(id: string) {
    return this.prisma.featureFlag.findUnique({
      where: { id },
      include: {
        scope: true,
        platform: true,
        environment: true,
      },
    });
  }

  /**
   * Returns feature flags grouped by key/platform/scope, with all environments as columns.
   * Output: [{ key, name, description, scope, platform, flagsByEnvironment: { [environmentId]: { enabled, flagId } } }]
   */
  async getAllGrouped({
    platformKey,
    scopeKey,
    search,
    page = 1,
    limit = 20,
  }: {
    platformKey?: string;
    scopeKey?: string;
    search?: string;
    page?: number;
    limit?: number;
  } = {}) {
    // Fetch all environments
    const environments = await this.prisma.environment.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: 'asc' },
      select: { id: true, key: true, name: true },
    });
    // Step 1: Group by key with pagination
    const groupWhere: any = {
      ...(platformKey && { platformKey }),
      ...(scopeKey && { scopeSlug: scopeKey }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { key: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };
    // Get unique keys for pagination
    const groups = await this.prisma.featureFlag.groupBy({
      by: ['key'],
      where: groupWhere,
      orderBy: { _max: { createdAt: 'desc' } },
      skip: (page - 1) * limit,
      take: limit,
    });
    // Get total number of unique keys
    const total = await this.prisma.featureFlag.groupBy({
      by: ['key'],
      where: groupWhere,
      _count: { _all: true },
    });
    const totalCount = total.length;
    const totalPages = Math.ceil(totalCount / limit);
    // Step 2: Fetch all feature flags for these keys
    const keys = groups.map((g) => g.key);
    const flags = await this.prisma.featureFlag.findMany({
      where: {
        key: { in: keys },
        ...(platformKey && { platformKey }),
        ...(scopeKey && { scopeSlug: scopeKey }),
      },
      include: {
        scope: true,
        platform: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    // Step 3: Group by key
    const grouped: Record<string, any> = {};
    for (const flag of flags) {
      const groupKey = flag.key;
      if (!grouped[groupKey]) {
        grouped[groupKey] = {
          key: flag.key,
          name: flag.name,
          description: flag.description,
          flagsByEnvironment: {},
          // Optionally: collect all platforms/scopes for this key if needed
          platforms: [],
          scopes: [],
        };
      }
      grouped[groupKey].flagsByEnvironment[flag.environmentId] =
        grouped[groupKey].flagsByEnvironment[flag.environmentId] || [];
      grouped[groupKey].flagsByEnvironment[flag.environmentId].push({
        enabled: flag.enabled,
        flagId: flag.id,
        platform: flag.platform,
        scope: flag.scope,
      });
      // Optionally collect platforms/scopes for summary columns
      if (
        !grouped[groupKey].platforms.some((p: any) => p.id === flag.platform.id)
      ) {
        grouped[groupKey].platforms.push(flag.platform);
      }
      if (!grouped[groupKey].scopes.some((s: any) => s.id === flag.scope.id)) {
        grouped[groupKey].scopes.push(flag.scope);
      }
    }
    // Ensure all environments are present as columns
    const features = Object.values(grouped).map((row: any) => {
      for (const env of environments) {
        if (!(env.id in row.flagsByEnvironment)) {
          row.flagsByEnvironment[env.id] = [];
        }
      }
      return row;
    });
    return {
      environments,
      features,
      total: totalCount,
      page,
      limit,
      totalPages,
    };
  }

  private async getDenormalizedValues(
    envId: string,
    platformId: string,
    scopeId: string,
  ) {
    const [environment, platform, scope] = await Promise.all([
      this.prisma.environment.findUnique({
        where: { id: envId, deletedAt: null },
      }),
      this.prisma.platform.findUnique({
        where: { id: platformId, deletedAt: null },
      }),
      this.prisma.featureFlagScope.findUnique({
        where: { id: scopeId, deletedAt: null },
      }),
    ]);

    if (!environment || !platform || !scope) {
      throw new BadRequestException('Invalid environment, platform, or scope');
    }

    return {
      environmentKey: environment.key,
      platformKey: platform.key,
      scopeSlug: scope.slug,
    };
  }

  async create(dto: CreateFeatureFlagDto, userId: string, role: UserRole) {
    // Handle multiple environments
    const results = [];
    const limitErrors = [];
    
    for (const environmentId of dto.environmentIds) {
      // Denormalize for each environment
      const denormalized = await this.getDenormalizedValues(
        environmentId,
        dto.platformId,
        dto.scopeId,
      );

      const limit = parseInt(process.env.FEATURE_FLAG_LIMIT ?? '0', 10);
      if (limit > 0) {
        const flagCount = await this.prisma.featureFlag.count({
          where: {
            platformKey: denormalized.platformKey,
            environmentKey: denormalized.environmentKey,
            scopeSlug: denormalized.scopeSlug,
          },
        });

        if (flagCount >= limit) {
          const errorMessage = `You have reached the maximum limit of ${limit} feature flags for this platform/environment/scope combination.`;
          results.push({
            environmentId,
            message: errorMessage,
            error: 'LIMIT_EXCEEDED',
            limit,
            currentCount: flagCount,
          });
          limitErrors.push({
            environmentId,
            environmentKey: denormalized.environmentKey,
            platformKey: denormalized.platformKey,
            scopeSlug: denormalized.scopeSlug,
            limit,
            currentCount: flagCount,
          });
          continue;
        }
      }

      // Check if flag already exists
      const existingFlag = await this.prisma.featureFlag.findUnique({
        where: {
          key_platformKey_environmentKey_scopeSlug: {
            key: dto.key,
            platformKey: denormalized.platformKey,
            environmentKey: denormalized.environmentKey,
            scopeSlug: denormalized.scopeSlug,
          },
        },
      });

      if (existingFlag) {
        results.push({
          environmentId,
          message: 'Feature flag with the same key already exists',
        });
        continue;
      }

      // For request role — check draft table as well
      if (role === UserRole.request) {
        const existingDraft = await this.prisma.featureFlagDraft.findFirst({
          where: {
            key: dto.key,
            platformKey: denormalized.platformKey,
            environmentKey: denormalized.environmentKey,
            scopeSlug: denormalized.scopeSlug,
          },
        });

        if (existingDraft) {
          results.push({
            environmentId,
            message:
              'Draft for this feature flag already exists (pending approval)',
          });
          continue;
        }

        const draft = await this.prisma.featureFlagDraft.create({
          data: {
            key: dto.key,
            name: dto.name,
            description: dto.description,
            enabled: dto.enabled,
            environmentId,
            platformId: dto.platformId,
            scopeId: dto.scopeId,
            platformKey: denormalized.platformKey,
            environmentKey: denormalized.environmentKey,
            scopeSlug: denormalized.scopeSlug,
            requestedBy: userId,
          },
        });

        await this.prisma.featureFlagChangeRequest.create({
          data: {
            requestedType: FeatureFlagRequestType.CREATE,
            proposedValue: dto.enabled,
            currentValue: false,
            status: FeatureFlagRequestStatus.PENDING,
            requestedBy: userId,
            draftId: draft.id,
          },
        });

        results.push({
          environmentId,
          message: 'Change request created (pending approval)',
        });
      } else {
        const flag = await this.prisma.featureFlag.create({
          data: {
            key: dto.key,
            name: dto.name,
            description: dto.description,
            enabled: dto.enabled,
            environmentId,
            platformId: dto.platformId,
            scopeId: dto.scopeId,
            ...denormalized,
          },
        });

        await this.prisma.featureFlagChangeRequest.create({
          data: {
            flagId: flag.id,
            requestedType: FeatureFlagRequestType.CREATE,
            proposedValue: dto.enabled,
            currentValue: false,
            status: FeatureFlagRequestStatus.APPROVED,
            requestedBy: userId,
            approvedBy: userId,
            approvedAt: new Date(),
          },
        });

        // Invalidate cache after creation
        await this.invalidateCache(denormalized.platformKey, denormalized.environmentKey, denormalized.scopeSlug);

        results.push({
          environmentId,
          message: 'Feature flag created successfully',
          flag,
        });
      }
    }
    
    // Check if all environments hit the limit
    const allLimitErrors = results.every(result => result.error === 'LIMIT_EXCEEDED');
    const hasLimitErrors = limitErrors.length > 0;
    
    return { 
      results,
      hasLimitErrors,
      limitErrors,
      allLimitErrors,
      limit: parseInt(process.env.FEATURE_FLAG_LIMIT ?? '0', 10)
    };
  }

  async update(
    flagId: string,
    dto: UpdateFeatureFlagDto,
    userId: string,
    role: UserRole,
  ) {
    const flag = await this.prisma.featureFlag.findUnique({
      where: { id: flagId },
      include: {
        environment: true,
        platform: true,
        scope: true,
      },
    });
    if (!flag) throw new NotFoundException('Feature flag not found');

    if (role === UserRole.request) {
      await this.prisma.featureFlagChangeRequest.create({
        data: {
          flagId,
          requestedBy: userId,
          requestReason: dto.reason,
          requestedType: FeatureFlagRequestType.UPDATE,
          proposedValue: dto.enabled ?? flag.enabled,
          currentValue: flag.enabled,
          status: FeatureFlagRequestStatus.PENDING,
          // Store flag details for audit trail
          flagName: flag.name,
          flagKey: flag.key,
          flagDescription: flag.description,
          environmentName: flag.environment?.name,
          environmentKey: flag.environmentKey,
          platformName: flag.platform?.name,
          platformKey: flag.platformKey,
          scopeName: flag.scope?.name,
          scopeSlug: flag.scopeSlug,
        },
      });
      return { message: 'Update request created (pending approval)' };
    }

    const updatedFlag = await this.prisma.featureFlag.update({
      where: { id: flagId },
      data: {
        enabled: dto.enabled,
      },
    });

    await this.prisma.featureFlagChangeRequest.create({
      data: {
        flagId: flag.id,
        requestedType: FeatureFlagRequestType.UPDATE,
        proposedValue: dto.enabled,
        currentValue: flag.enabled,
        status: FeatureFlagRequestStatus.APPROVED,
        requestedBy: userId,
        approvedBy: userId,
        approvedAt: new Date(),
        requestReason: dto.reason,
        // Store flag details for audit trail
        flagName: flag.name,
        flagKey: flag.key,
        flagDescription: flag.description,
        environmentName: flag.environment?.name,
        environmentKey: flag.environmentKey,
        platformName: flag.platform?.name,
        platformKey: flag.platformKey,
        scopeName: flag.scope?.name,
        scopeSlug: flag.scopeSlug,
      },
    });

    // Invalidate cache after update
    await this.invalidateCache(flag.platformKey, flag.environmentKey, flag.scopeSlug);

    return updatedFlag;
  }

  private async invalidateCache(platformKey: string, environmentKey: string, scopeSlug: string): Promise<void> {
    console.log(`Invalidating cache for platform: ${platformKey}, env: ${environmentKey}, scope: ${scopeSlug}`);
    await this.cacheService.invalidate(platformKey, environmentKey, scopeSlug);
  }

  async getFlagCount(platformKey: string, environmentKey: string, scopeSlug: string): Promise<{
    count: number;
    limit: number;
    remaining: number;
    isLimitReached: boolean;
  }> {
    const limit = parseInt(process.env.FEATURE_FLAG_LIMIT ?? '0', 10);
    const count = await this.prisma.featureFlag.count({
      where: {
        platformKey,
        environmentKey,
        scopeSlug,
      },
    });

    return {
      count,
      limit,
      remaining: Math.max(0, limit - count),
      isLimitReached: limit > 0 && count >= limit,
    };
  }

  async remove(flagId: string, userId: string, role: UserRole, reason?: string) {
    const flag = await this.prisma.featureFlag.findUnique({
      where: { id: flagId },
      include: {
        environment: true,
        platform: true,
        scope: true,
      },
    });
    if (!flag) throw new NotFoundException('Feature flag not found');

    if (role === UserRole.request) {
      await this.prisma.featureFlagChangeRequest.create({
        data: {
          flagId,
          requestedBy: userId,
          requestReason: reason,
          requestedType: FeatureFlagRequestType.DELETE,
          proposedValue: false,
          currentValue: flag.enabled,
          status: FeatureFlagRequestStatus.PENDING,
          // Store flag details for audit trail
          flagName: flag.name,
          flagKey: flag.key,
          flagDescription: flag.description,
          environmentName: flag.environment?.name,
          environmentKey: flag.environmentKey,
          platformName: flag.platform?.name,
          platformKey: flag.platformKey,
          scopeName: flag.scope?.name,
          scopeSlug: flag.scopeSlug,
        },
      });
      return { message: 'Delete request created (pending approval)' };
    }

    // First create the change request
    await this.prisma.featureFlagChangeRequest.create({
      data: {
        flagId,
        requestedBy: userId,
        requestReason: reason,
        requestedType: FeatureFlagRequestType.DELETE,
        proposedValue: false,
        currentValue: flag.enabled,
        status: FeatureFlagRequestStatus.APPROVED,
        approvedBy: userId,
        approvedAt: new Date(),
        // Store flag details for audit trail
        flagName: flag.name,
        flagKey: flag.key,
        flagDescription: flag.description,
        environmentName: flag.environment?.name,
        environmentKey: flag.environmentKey,
        platformName: flag.platform?.name,
        platformKey: flag.platformKey,
        scopeName: flag.scope?.name,
        scopeSlug: flag.scopeSlug,
      },
    });

    // Then delete the flag
    await this.prisma.featureFlag.delete({ where: { id: flagId } });

    // Invalidate cache
    await this.invalidateCache(flag.platformKey, flag.environmentKey, flag.scopeSlug);

    return { message: 'Feature flag deleted' };
  }
}
