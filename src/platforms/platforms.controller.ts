import { Body, Controller, Delete, Get, Param, Patch, Post, Put, UseGuards } from '@nestjs/common';
import { PlatformsService } from './platforms.service';
import { CreatePlatformDto } from './dto/create-platform.dto';
import { UpdatePlatformDto } from './dto/update-platform.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '@prisma/client';
import { RolesMin } from 'src/auth/roles-min.decorator';

@Controller('platforms')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PlatformsController {
  constructor(private service: PlatformsService) {}

  @Post()
  @Roles(UserRole.admin)
  create(@Body() dto: CreatePlatformDto) {
    return this.service.create(dto);
  }

  @Put(':id')
  @RolesMin(UserRole.approve)
  update(@Param('id') id: string, @Body() dto: UpdatePlatformDto) {
    return this.service.update(id, dto);
  }

  @Patch(':id/deactivate')
  @RolesMin(UserRole.approve)
  deactivate(@Param('id') id: string) {
    return this.service.deactivate(id);
  }

  @Patch(':id/activate')
  @RolesMin(UserRole.approve)
  activate(@Param('id') id: string) {
    return this.service.activate(id);
  }

  @Delete(':id')
  @RolesMin(UserRole.approve)
  softDelete(@Param('id') id: string) {
    return this.service.softDelete(id);
  }

  @Get()
  @RolesMin(UserRole.view)
  async getAll() {
    return this.service.findAll();
  }

  @Get(':id')
  @RolesMin(UserRole.view)
  async getById(@Param('id') id: string) {
    return this.service.findById(id);
  }

  @Patch(':id/restore')
  @Roles(UserRole.admin)
  async restore(@Param('id') id: string) {
    return this.service.restore(id);
  }
}
