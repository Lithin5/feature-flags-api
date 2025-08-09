import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEnvironmentDto } from './dto/create-environment.dto';
import { UpdateEnvironmentDto } from './dto/update-environment.dto';

@Injectable()
export class EnvironmentsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateEnvironmentDto) {
    const exists = await this.prisma.environment.findUnique({
      where: { key: dto.key },
    });
    if (exists) throw new BadRequestException('Environment key already exists');

    return this.prisma.environment.create({
      data: dto,
    });
  }

  async update(id: string, dto: UpdateEnvironmentDto) {
    const env = await this.prisma.environment.findUnique({ where: { id } });
    if (!env || env.deletedAt)
      throw new NotFoundException('Environment not found');

    // Prevent key change if already used in FeatureFlag
    if (dto.key && dto.key !== env.key) {
      const used = await this.prisma.featureFlag.findFirst({
        where: { environmentId: id },
      });
      if (used) {
        throw new BadRequestException(
          'Cannot change key; environment is used in feature flags',
        );
      }
    }

    return this.prisma.environment.update({
      where: { id },
      data: dto,
    });
  }

  async deactivate(id: string) {
    const env = await this.prisma.environment.findUnique({ where: { id } });
    if (!env || env.deletedAt)
      throw new NotFoundException('Environment not found');

    return this.prisma.environment.update({
      where: { id },
      data: { isActive: false },
    });
  }

  async activate(id: string) {
    const env = await this.prisma.environment.findUnique({ where: { id } });
    if (!env || env.deletedAt)
      throw new NotFoundException('Environment not found');

    return this.prisma.environment.update({
      where: { id },
      data: { isActive: true },
    });
  }

  async softDelete(id: string) {
    const env = await this.prisma.environment.findUnique({ where: { id } });
    if (!env || env.deletedAt)
      throw new NotFoundException('Environment not found');

    return this.prisma.environment.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false },
    });
  }

  async findAll() {
    return this.prisma.environment.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        key: true,
        name: true,
        description: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async findById(id: string) {
    const env = await this.prisma.environment.findFirst({
      where: { id, deletedAt: null },
      select: {
        id: true,
        key: true,
        name: true,
        description: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!env) {
      throw new NotFoundException('Environment not found');
    }

    return env;
  }

  async restore(id: string) {
    const env = await this.prisma.environment.findUnique({ where: { id } });
    if (!env) throw new NotFoundException('Environment not found');
    if (!env.deletedAt)
      throw new BadRequestException('Environment is not deleted');

    // Check if any *other* environment with same key is active
    const conflict = await this.prisma.environment.findFirst({
      where: { key: env.key, deletedAt: null },
    });
    if (conflict) {
      throw new BadRequestException(
        'Cannot restore: key is already in use by another environment',
      );
    }

    return this.prisma.environment.update({
      where: { id },
      data: { deletedAt: null, isActive: true },
    });
  }
}
