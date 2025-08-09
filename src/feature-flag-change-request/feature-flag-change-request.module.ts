import { Module } from '@nestjs/common';
import { FeatureFlagChangeRequestService } from './feature-flag-change-request.service';
import { FeatureFlagChangeRequestController } from './feature-flag-change-request.controller';
import { CacheModule } from '../cache/cache.module';

@Module({
  imports: [CacheModule],
  controllers: [FeatureFlagChangeRequestController],
  providers: [FeatureFlagChangeRequestService],
  exports: [FeatureFlagChangeRequestService],
})
export class FeatureFlagChangeRequestModule {}
