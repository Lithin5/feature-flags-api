import { Controller, Get, Param, ValidationPipe, UsePipes, Req } from '@nestjs/common';
import { Request } from 'express';
import { AppService } from './app.service';

interface HealthResponse {
  status: string;
  timestamp: string;
  service: string;
  version: string;
  environment: string;
  database: string;
}

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  checkHealth(): Promise<HealthResponse>{
    return this.appService.getHealth();
  }

  @Get('feature-flags/:environmentKey/:platformKey/:scopeSlug')
  @UsePipes(new ValidationPipe({ transform: true }))
  async getByIdentifier(
    @Param('environmentKey') environmentKey: string,
    @Param('platformKey') platformKey: string,
    @Param('scopeSlug') scopeSlug: string,
    @Req() req: Request,
  ) {
    return this.appService.getByIdentifier(
      platformKey, 
      environmentKey, 
      scopeSlug,
      req.headers['user-agent'],
      req.ip || req.connection.remoteAddress
    );
  }
}
