import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { FeatureFlagsService } from './feature-flags.service';
import { CreateFeatureFlagDto } from './dto/create-feature-flag.dto';
import { UpdateFeatureFlagDto } from './dto/update-feature-flag.dto';
import { DeleteFeatureFlagDto } from './dto/delete-feature-flag.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '@prisma/client';
import { RolesMin } from 'src/auth/roles-min.decorator';

@Controller('feature-flags')
@UseGuards(JwtAuthGuard, RolesGuard)
export class FeatureFlagsController {
  constructor(private service: FeatureFlagsService) {}

  @Post()
  @Roles(UserRole.admin, UserRole.approve, UserRole.request)
  create(@Body() dto: CreateFeatureFlagDto, @Req() req) {
    return this.service.create(dto, req.user.userId, req.user.role);
  }

  /**
   * Returns grouped feature flags with pagination.
   * Query params: scopeId, platformId, search, page (default 1), limit (default 20)
   */
  @Get('grouped')
  @RolesMin(UserRole.view)
  getAllGrouped(
    @Query('platformKey') platformKey?: string,
    @Query('scopeKey') scopeKey?: string,
    @Query('search') search?: string,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
  ) {    
    return this.service.getAllGrouped({
      platformKey,
      scopeKey,
      search,
      page: Number(page) || 1,
      limit: Number(limit) || 20,
    });
  }

  @Patch(':id')
  @Roles(UserRole.admin, UserRole.approve, UserRole.request)
  update(
    @Param('id') id: string,
    @Body() dto: UpdateFeatureFlagDto,
    @Req() req,
  ) {
    return this.service.update(id, dto, req.user.userId, req.user.role);
  }

  @Delete(':id')
  @Roles(UserRole.admin, UserRole.approve, UserRole.request)
  remove(@Param('id') id: string, @Body() dto: DeleteFeatureFlagDto, @Req() req) {
    return this.service.remove(id, req.user.userId, req.user.role, dto.reason);
  }

  @Get()
  @RolesMin(UserRole.view)
  getAll(
    @Query('scopeId') scopeId?: string,
    @Query('environmentId') environmentId?: string,
    @Query('platformId') platformId?: string,
    @Query('search') search?: string
  ) {
    return this.service.getAll({ scopeId, environmentId, platformId, search });
  }

  @Get(':id')
  @RolesMin(UserRole.view)
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Get('count/:platformKey/:environmentKey/:scopeSlug')
  @RolesMin(UserRole.view)
  getFlagCount(
    @Param('platformKey') platformKey: string,
    @Param('environmentKey') environmentKey: string,
    @Param('scopeSlug') scopeSlug: string,
  ) {
    return this.service.getFlagCount(platformKey, environmentKey, scopeSlug);
  }

}
