import { Module } from '@nestjs/common';
import { FeatureFlagScopeController } from './feature-flag-scope.controller';
import { FeatureFlagScopeService } from './feature-flag-scope.service';

@Module({
  controllers: [FeatureFlagScopeController],
  providers: [FeatureFlagScopeService]
})
export class FeatureFlagScopeModule {}
