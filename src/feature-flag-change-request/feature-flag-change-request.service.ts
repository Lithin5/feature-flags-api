import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { FeatureFlagRequestType, FeatureFlagRequestStatus } from './feature-flag-change-request.enums';
import { UserRole } from '@prisma/client';
import { CacheService } from '../cache/cache.service';

@Injectable()
export class FeatureFlagChangeRequestService {
  constructor(
    private prisma: PrismaService,
    private cacheService: CacheService
  ) {}

  async findAllPending() {
    return this.prisma.featureFlagChangeRequest.findMany({
      where: { status: FeatureFlagRequestStatus.PENDING },
      select: {
        id: true,
        flagId: true,
        draftId: true,
        requestReason: true,
        requestedType: true,
        proposedValue: true,
        currentValue: true,
        status: true,
        requestedBy: true,
        approvedBy: true,
        approvedAt: true,
        comment: true,
        createdAt: true,
        // Stored flag details for audit trail
        flagName: true,
        flagKey: true,
        flagDescription: true,
        environmentName: true,
        environmentKey: true,
        platformName: true,
        platformKey: true,
        scopeName: true,
        scopeSlug: true,
        flag: {
          include: {
            environment: true,
            platform: true,
            scope: true,
          },
        },
        draft: true,
        requestedByUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' }, // Latest pending requests first
    });
  }

  async findAll(page: number = 1, limit: number = 10, status?: string, search?: string) {
    const skip = (page - 1) * limit;
    
    // Build where clause for filtering
    const whereClause: any = {};
    if (status && status !== 'all') {
      whereClause.status = status;
    }
    
    // Add search functionality
    if (search && search.trim()) {
      const searchTerm = search.trim();
      whereClause.OR = [
        // Search in flag name and key
        {
          flag: {
            OR: [
              { name: { contains: searchTerm, mode: 'insensitive' } },
              { key: { contains: searchTerm, mode: 'insensitive' } },
            ],
          },
        },
        // Search in draft name and key
        {
          draft: {
            OR: [
              { name: { contains: searchTerm, mode: 'insensitive' } },
              { key: { contains: searchTerm, mode: 'insensitive' } },
            ],
          },
        },
        // Search in stored flag details
        { flagName: { contains: searchTerm, mode: 'insensitive' } },
        { flagKey: { contains: searchTerm, mode: 'insensitive' } },
        { flagDescription: { contains: searchTerm, mode: 'insensitive' } },
        // Search in request reason
        { requestReason: { contains: searchTerm, mode: 'insensitive' } },
      ];
    }
    
    const [requests, total] = await Promise.all([
      this.prisma.featureFlagChangeRequest.findMany({
        where: whereClause,
        skip,
        take: limit,
        select: {
          id: true,
          flagId: true,
          draftId: true,
          requestReason: true,
          requestedType: true,
          proposedValue: true,
          currentValue: true,
          status: true,
          requestedBy: true,
          approvedBy: true,
          approvedAt: true,
          comment: true,
          createdAt: true,
          // Stored flag details for audit trail
          flagName: true,
          flagKey: true,
          flagDescription: true,
          environmentName: true,
          environmentKey: true,
          platformName: true,
          platformKey: true,
          scopeName: true,
          scopeSlug: true,
          flag: {
            include: {
              environment: true,
              platform: true,
              scope: true,
            },
          },
          draft: true,
          requestedByUser: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          approvedByUser: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
        orderBy: [
          { createdAt: 'desc' }, // latest first
        ],
      }),
      this.prisma.featureFlagChangeRequest.count({
        where: whereClause,
      }),
    ]);

    return {
      requests,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
    };
  }

  async findByUser(userId: string, page: number = 1, limit: number = 10, status?: string, search?: string) {
    const skip = (page - 1) * limit;
    
    // Build where clause for filtering
    const whereClause: any = {
      requestedBy: userId,
    };
    if (status && status !== 'all') {
      whereClause.status = status;
    }
    
    // Add search functionality
    if (search && search.trim()) {
      const searchTerm = search.trim();
      whereClause.OR = [
        // Search in flag name and key
        {
          flag: {
            OR: [
              { name: { contains: searchTerm, mode: 'insensitive' } },
              { key: { contains: searchTerm, mode: 'insensitive' } },
            ],
          },
        },
        // Search in draft name and key
        {
          draft: {
            OR: [
              { name: { contains: searchTerm, mode: 'insensitive' } },
              { key: { contains: searchTerm, mode: 'insensitive' } },
            ],
          },
        },
        // Search in stored flag details
        { flagName: { contains: searchTerm, mode: 'insensitive' } },
        { flagKey: { contains: searchTerm, mode: 'insensitive' } },
        { flagDescription: { contains: searchTerm, mode: 'insensitive' } },
        // Search in request reason
        { requestReason: { contains: searchTerm, mode: 'insensitive' } },
      ];
    }
    
    const [requests, total] = await Promise.all([
      this.prisma.featureFlagChangeRequest.findMany({
        where: whereClause,
        skip,
        take: limit,
        select: {
          id: true,
          flagId: true,
          draftId: true,
          requestReason: true,
          requestedType: true,
          proposedValue: true,
          currentValue: true,
          status: true,
          requestedBy: true,
          approvedBy: true,
          approvedAt: true,
          comment: true,
          createdAt: true,
          // Stored flag details for audit trail
          flagName: true,
          flagKey: true,
          flagDescription: true,
          environmentName: true,
          environmentKey: true,
          platformName: true,
          platformKey: true,
          scopeName: true,
          scopeSlug: true,
          flag: {
            include: {
              environment: true,
              platform: true,
              scope: true,
            },
          },
          draft: true,
          requestedByUser: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          approvedByUser: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
        orderBy: [
          { createdAt: 'desc' }, // latest first
        ],
      }),
      this.prisma.featureFlagChangeRequest.count({
        where: whereClause,
      }),
    ]);

    return {
      requests,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
    };
  }

  async findOne(id: string) {
    const request = await this.prisma.featureFlagChangeRequest.findUnique({
      where: { id },
      select: {
        id: true,
        flagId: true,
        draftId: true,
        requestReason: true,
        requestedType: true,
        proposedValue: true,
        currentValue: true,
        status: true,
        requestedBy: true,
        approvedBy: true,
        approvedAt: true,
        comment: true,
        createdAt: true,
        // Stored flag details for audit trail
        flagName: true,
        flagKey: true,
        flagDescription: true,
        environmentName: true,
        environmentKey: true,
        platformName: true,
        platformKey: true,
        scopeName: true,
        scopeSlug: true,
        flag: {
          include: {
            environment: true,
            platform: true,
            scope: true,
          },
        },
        draft: true,
        requestedByUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        approvedByUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    if (!request) {
      throw new NotFoundException('Change request not found');
    }

    return request;
  }

  async approveRequest(requestId: string, approverId: string, comment?: string) {
    return this.handleRequestReview(
      requestId,
      approverId,
      FeatureFlagRequestStatus.APPROVED,
      comment,
    );
  }

  async rejectRequest(requestId: string, approverId: string, comment?: string) {
    return this.handleRequestReview(
      requestId,
      approverId,
      FeatureFlagRequestStatus.REJECTED,
      comment,
    );
  }

  private async handleRequestReview(
    requestId: string,
    approverId: string,
    status: FeatureFlagRequestStatus.APPROVED | FeatureFlagRequestStatus.REJECTED,
    comment?: string,
  ) {
    const request = await this.prisma.featureFlagChangeRequest.findUnique({
      where: { id: requestId },
      select: {
        id: true,
        flagId: true,
        draftId: true,
        requestReason: true,
        requestedType: true,
        proposedValue: true,
        currentValue: true,
        status: true,
        requestedBy: true,
        approvedBy: true,
        approvedAt: true,
        comment: true,
        createdAt: true,
        // Stored flag details for audit trail
        flagName: true,
        flagKey: true,
        flagDescription: true,
        environmentName: true,
        environmentKey: true,
        platformName: true,
        platformKey: true,
        scopeName: true,
        scopeSlug: true,
        flag: {
          include: {
            environment: true,
            platform: true,
            scope: true,
          },
        },
        draft: true,
        requestedByUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        approvedByUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    if (!request) {
      throw new NotFoundException('Change request not found');
    }

    if (request.status !== FeatureFlagRequestStatus.PENDING) {
      throw new BadRequestException('This request has already been processed');
    }

    // Start a transaction to ensure data consistency
    return this.prisma.$transaction(async (prisma) => {
      // Update the request status
      const updatedRequest = await prisma.featureFlagChangeRequest.update({
        where: { id: requestId },
        data: {
          status,
          approvedBy: approverId,
          approvedAt: new Date(),
          ...(comment && { comment }),
        },
        select: {
          id: true,
          flagId: true,
          draftId: true,
          requestReason: true,
          requestedType: true,
          proposedValue: true,
          currentValue: true,
          status: true,
          requestedBy: true,
          approvedBy: true,
          approvedAt: true,
          comment: true,
          createdAt: true,
          // Stored flag details for audit trail
          flagName: true,
          flagKey: true,
          flagDescription: true,
          environmentName: true,
          environmentKey: true,
          platformName: true,
          platformKey: true,
          scopeName: true,
          scopeSlug: true,
          flag: {
            include: {
              environment: true,
              platform: true,
              scope: true,
            },
          },
          draft: true,
          requestedByUser: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          approvedByUser: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      });

      // If approved, apply the changes
      if (status === FeatureFlagRequestStatus.APPROVED) {
        if (request.requestedType === FeatureFlagRequestType.CREATE && request.draft) {
          // For create requests, create the flag from the draft
          await prisma.featureFlag.create({
            data: {
              key: request.draft.key,
              name: request.draft.name,
              description: request.draft.description,
              enabled: request.draft.enabled,
              environmentId: request.draft.environmentId,
              platformId: request.draft.platformId,
              scopeId: request.draft.scopeId,
              platformKey: request.draft.platformKey,
              environmentKey: request.draft.environmentKey,
              scopeSlug: request.draft.scopeSlug,
            },
          });

          // Delete the draft
          await prisma.featureFlagDraft.delete({
            where: { id: request.draft.id },
          });

          // Invalidate cache for the new flag
          console.log(`Invalidating cache for new flag: platform=${request.draft.platformKey}, env=${request.draft.environmentKey}, scope=${request.draft.scopeSlug}`);
          try {
            await this.cacheService.invalidate(
              request.draft.platformKey,
              request.draft.environmentKey,
              request.draft.scopeSlug
            );
            console.log('Cache invalidated successfully for new flag');
          } catch (error) {
            console.error('Failed to invalidate cache for new flag:', error);
          }
        } else if (request.flagId) {
          // For update/delete requests, update the flag
          if (request.requestedType === FeatureFlagRequestType.DELETE) {
            await prisma.featureFlag.delete({
              where: { id: request.flagId },
            });
          } else {
            // For update requests
            await prisma.featureFlag.update({
              where: { id: request.flagId },
              data: {
                enabled: request.proposedValue,
              },
            });
          }

          // Invalidate cache for the affected flag
          if (request.flag) {
            console.log(`Invalidating cache for updated/deleted flag: platform=${request.flag.platformKey}, env=${request.flag.environmentKey}, scope=${request.flag.scopeSlug}`);
            try {
              await this.cacheService.invalidate(
                request.flag.platformKey,
                request.flag.environmentKey,
                request.flag.scopeSlug
              );
              console.log('Cache invalidated successfully for updated/deleted flag');
            } catch (error) {
              console.error('Failed to invalidate cache for updated/deleted flag:', error);
            }
          }
        }
      }

      return updatedRequest;
    });
  }
}
