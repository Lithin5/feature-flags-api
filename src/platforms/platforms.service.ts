import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePlatformDto } from './dto/create-platform.dto';
import { UpdatePlatformDto } from './dto/update-platform.dto';

@Injectable()
export class PlatformsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreatePlatformDto) {
    // Prevent duplicate keys on active platforms
    const existing = await this.prisma.platform.findFirst({
      where: { key: dto.key, deletedAt: null },
    });
    if (existing) {
      throw new BadRequestException('Platform key already exists');
    }

    // Prevent duplicate names on active platforms
    const nameExists = await this.prisma.platform.findFirst({
      where: { name: dto.name, deletedAt: null },
    });
    if (nameExists) {
      throw new BadRequestException('Platform name already exists');
    }

    return this.prisma.platform.create({
      data: dto,
    });
  }

  async update(id: string, dto: UpdatePlatformDto) {
    const platform = await this.prisma.platform.findUnique({ where: { id } });
    if (!platform || platform.deletedAt) {
      throw new NotFoundException('Platform not found');
    }

    // Prevent key changes
    if (dto.key && dto.key !== platform.key) {
      throw new BadRequestException('Platform key cannot be updated');
    }

    return this.prisma.platform.update({
      where: { id },
      data: {
        name: dto.name ?? platform.name,
        description: dto.description ?? platform.description,
        isActive: dto.isActive ?? platform.isActive,
      },
    });
  }

  async deactivate(id: string) {
    const platform = await this.prisma.platform.findUnique({ where: { id } });
    if (!platform || platform.deletedAt) {
      throw new NotFoundException('Platform not found');
    }

    return this.prisma.platform.update({
      where: { id },
      data: { isActive: false },
    });
  }

  async activate(id: string) {
    const platform = await this.prisma.platform.findUnique({ where: { id } });
    if (!platform || platform.deletedAt) {
      throw new NotFoundException('Platform not found');
    }

    return this.prisma.platform.update({
      where: { id },
      data: { isActive: true },
    });
  }

  async softDelete(id: string) {
    const platform = await this.prisma.platform.findUnique({ where: { id } });
    if (!platform || platform.deletedAt) {
      throw new NotFoundException('Platform not found');
    }

    return this.prisma.platform.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false },
    });
  }

  async restore(id: string) {
    const platform = await this.prisma.platform.findUnique({ where: { id } });
    if (!platform) {
      throw new NotFoundException('Platform not found');
    }
    if (!platform.deletedAt) {
      throw new BadRequestException('Platform is not deleted');
    }

    // Ensure no other active platform has the same key
    const conflict = await this.prisma.platform.findFirst({
      where: { key: platform.key, deletedAt: null },
    });
    if (conflict) {
      throw new BadRequestException('Cannot restore: key already in use');
    }

    return this.prisma.platform.update({
      where: { id },
      data: { deletedAt: null, isActive: true },
    });
  }

  async findAll() {
    return this.prisma.platform.findMany({
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
    const platform = await this.prisma.platform.findFirst({
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

    if (!platform) {
      throw new NotFoundException('Platform not found');
    }

    return platform;
  }
}
