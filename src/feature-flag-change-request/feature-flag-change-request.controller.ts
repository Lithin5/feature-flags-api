import {
  Controller,
  Get,
  Param,
  Post,
  Body,
  BadRequestException,
  Request,
  UseGuards,
  Query,
  ParseIntPipe,
  ForbiddenException,
} from '@nestjs/common';
import { Request as ExpressRequest } from 'express';
import { UserRole } from '@prisma/client';
import { ReviewChangeRequestDto } from './dto/review-change-request.dto';
import { FeatureFlagChangeRequestService } from './feature-flag-change-request.service';
import { FeatureFlagRequestStatus } from './feature-flag-change-request.enums';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

interface AuthenticatedRequest extends ExpressRequest {
  user: {
    userId: string;
    role: UserRole;
  };
}

@Controller('feature-flag-change-requests')
@UseGuards(JwtAuthGuard, RolesGuard)
export class FeatureFlagChangeRequestController {
  constructor(
    private readonly changeRequestService: FeatureFlagChangeRequestService,
  ) {}

  @Get()
  @Roles(UserRole.admin, UserRole.approve)
  async findAllPending(@Request() req: AuthenticatedRequest) {
    return this.changeRequestService.findAllPending();
  }

  @Get('my-requests')
  @Roles(UserRole.request)
  async findMyRequests(
    @Request() req: AuthenticatedRequest,
    @Query('page', new ParseIntPipe({ optional: true })) page: number = 1,
    @Query('limit', new ParseIntPipe({ optional: true })) limit: number = 10,
    @Query('status') status?: string,
    @Query('search') search?: string,
  ) {
    return this.changeRequestService.findByUser(req.user.userId, page, limit, status, search);
  }

  @Get('all')
  @Roles(UserRole.admin, UserRole.approve)
  async findAll(
    @Request() req: AuthenticatedRequest,
    @Query('page', new ParseIntPipe({ optional: true })) page: number = 1,
    @Query('limit', new ParseIntPipe({ optional: true })) limit: number = 10,
    @Query('status') status?: string,
    @Query('search') search?: string,
  ) {
    return this.changeRequestService.findAll(page, limit, status, search);
  }

  @Get(':id')
  @Roles(UserRole.admin, UserRole.approve, UserRole.request)
  async findOne(
    @Param('id') id: string,
    @Request() req: AuthenticatedRequest
  ) {
    const request = await this.changeRequestService.findOne(id);
    
    // If user is a requester, check if they own this request
    if (req.user.role === UserRole.request && request.requestedBy !== req.user.userId) {
      throw new ForbiddenException('You can only view your own change requests');
    }
    
    return request;
  }

  @Post(':id/approve')
  @Roles(UserRole.admin, UserRole.approve)
  async approveRequest(
    @Param('id') id: string,
    @Request() req: AuthenticatedRequest,
    @Body() reviewDto: ReviewChangeRequestDto,
  ) {
    if (reviewDto.status !== FeatureFlagRequestStatus.APPROVED) {
      throw new BadRequestException('Invalid status for approval endpoint');
    }
    
    return this.changeRequestService.approveRequest(
      id,
      req.user.userId,
      reviewDto.comment,
    );
  }

  @Post(':id/reject')
  @Roles(UserRole.admin, UserRole.approve)
  async rejectRequest(
    @Param('id') id: string,
    @Request() req: AuthenticatedRequest,
    @Body() reviewDto: ReviewChangeRequestDto,
  ) {
    if (reviewDto.status !== FeatureFlagRequestStatus.REJECTED) {
      throw new BadRequestException('Invalid status for rejection endpoint');
    }
    
    return this.changeRequestService.rejectRequest(
      id,
      req.user.userId,
      reviewDto.comment,
    );
  }
}
