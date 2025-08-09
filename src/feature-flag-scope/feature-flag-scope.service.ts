import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateScopeDto } from './dto/update-scope.dto';
import { CreateScopeDto } from './dto/create-scope.dto';

@Injectable()
export class FeatureFlagScopeService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateScopeDto) {
    const existing = await this.prisma.featureFlagScope.findFirst({
      where: { slug: dto.slug, deletedAt: null },
    });
    if (existing) {
      throw new BadRequestException('Scope slug already exists');
    }

    return this.prisma.featureFlagScope.create({
      data: {
        name: dto.name,
        slug: dto.slug.toLowerCase(),
        description: dto.description,        
        isActive: true,
      },
    });
  }

  async update(id: string, dto: UpdateScopeDto) {
    const scope = await this.prisma.featureFlagScope.findUnique({ where: { id } });
    if (!scope || scope.deletedAt) {
      throw new NotFoundException('Scope not found');
    }

    // Slug cannot be updated
    if ((dto as any).slug && (dto as any).slug !== scope.slug) {
      throw new BadRequestException('Slug cannot be updated');
    }

    const updated = await this.prisma.featureFlagScope.update({
      where: { id },
      data: {
        name: dto.name ?? scope.name,
        description: dto.description ?? scope.description,
      },
    });

    return updated;
  }

  async activate(id: string) {
    const scope = await this.prisma.featureFlagScope.findUnique({
      where: { id },
    });
    if (!scope || scope.deletedAt) {
      throw new NotFoundException('Scope not found');
    }

    const updated = await this.prisma.featureFlagScope.update({
      where: { id },
      data: { isActive: true },
    });
  }

  async deactivate(id: string) {
    const scope = await this.prisma.featureFlagScope.findUnique({
      where: { id },
    });
    if (!scope || scope.deletedAt) {
      throw new NotFoundException('Scope not found');
    }

    const updated = await this.prisma.featureFlagScope.update({
      where: { id },
      data: { isActive: false },
    });
    return updated;
  }

  async softDelete(id: string) {
    const scope = await this.prisma.featureFlagScope.findUnique({
      where: { id },
    });
    if (!scope || scope.deletedAt) {
      throw new NotFoundException('Scope not found');
    }

    const updated = await this.prisma.featureFlagScope.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false },
    });
    return updated;
  }

  async restore(id: string) {
    const scope = await this.prisma.featureFlagScope.findUnique({
      where: { id },
    });
    if (!scope) {
      throw new NotFoundException('Scope not found');
    }
    if (!scope.deletedAt) {
      throw new BadRequestException('Scope is not deleted');
    }

    const conflict = await this.prisma.featureFlagScope.findFirst({
      where: { slug: scope.slug, deletedAt: null },
    });
    if (conflict) {
      throw new BadRequestException('Cannot restore: slug already in use');
    }

    return this.prisma.featureFlagScope.update({
      where: { id },
      data: { deletedAt: null, isActive: true },
    });
  }

  async findById(id: string) {
    const scope = await this.prisma.featureFlagScope.findFirst({
      where: { id, deletedAt: null },
    });
    if (!scope) {
      throw new NotFoundException('Scope not found');
    }
    return scope;
  }

  async findAll() {
    return this.prisma.featureFlagScope.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: 'desc' },
    });
  }
}
