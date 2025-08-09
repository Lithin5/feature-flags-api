import { Test, TestingModule } from '@nestjs/testing';
import { FeatureFlagScopeService } from './feature-flag-scope.service';

describe('FeatureFlagScopeService', () => {
  let service: FeatureFlagScopeService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FeatureFlagScopeService],
    }).compile();

    service = module.get<FeatureFlagScopeService>(FeatureFlagScopeService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
