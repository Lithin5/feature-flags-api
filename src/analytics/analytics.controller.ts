import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { RolesMin } from '../auth/roles-min.decorator';
import { UserRole } from '@prisma/client';

@Controller('analytics')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AnalyticsController {
  constructor(private analyticsService: AnalyticsService) {}

  @Get('scopes/top')
  @RolesMin(UserRole.view)
  getTopScopes(@Query('limit') limit?: string) {
    return this.analyticsService.getTopScopes(limit ? parseInt(limit, 10) : 10);
  }

  @Get('scopes/:scopeSlug')
  @RolesMin(UserRole.view)
  getScopeAnalytics(@Param('scopeSlug') scopeSlug: string) {
    return this.analyticsService.getScopeAnalytics(scopeSlug);
  }

  @Get('scopes/:scopeSlug/stats')
  @RolesMin(UserRole.view)
  getScopeUsageStats(
    @Param('scopeSlug') scopeSlug: string,
    @Query('days') days?: string,
  ) {
    return this.analyticsService.getScopeUsageStats(
      scopeSlug,
      days ? parseInt(days, 10) : 30,
    );
  }
}
