import { 
  Body, Controller, Delete, Get, Param, Patch, Post, Put, Req, UseGuards 
} from '@nestjs/common';
import { FeatureFlagScopeService } from './feature-flag-scope.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { UserRole } from '@prisma/client';
import { CreateScopeDto } from './dto/create-scope.dto';
import { UpdateScopeDto } from './dto/update-scope.dto';
import { RolesMin } from 'src/auth/roles-min.decorator';

@Controller('feature-flag-scopes')
@UseGuards(JwtAuthGuard, RolesGuard)
export class FeatureFlagScopeController {
  constructor(private service: FeatureFlagScopeService) {}

  @Post()
  @RolesMin(UserRole.approve)
  create(@Body() dto: CreateScopeDto, @Req() req) {
    return this.service.create(dto);
  }

  @Put(':id')
  @RolesMin(UserRole.approve)
  update(@Param('id') id: string, @Body() dto: UpdateScopeDto) {
    return this.service.update(id, dto);
  }

  @Patch(':id/activate')
  @RolesMin(UserRole.approve)
  activate(@Param('id') id: string) {
    return this.service.activate(id);
  }

  @Patch(':id/deactivate')
  @RolesMin(UserRole.approve)
  deactivate(@Param('id') id: string) {
    return this.service.deactivate(id);
  }

  @Delete(':id')
  @RolesMin(UserRole.approve)
  softDelete(@Param('id') id: string) {
    return this.service.softDelete(id);
  }

  @Patch(':id/restore')
  @RolesMin(UserRole.approve)
  restore(@Param('id') id: string) {
    return this.service.restore(id);
  }

  @Get(':id')
  @RolesMin(UserRole.view)
  getById(@Param('id') id: string) {
    return this.service.findById(id);
  }

  @Get()
  @RolesMin(UserRole.view)
  getAll() {
    return this.service.findAll();
  }
}
