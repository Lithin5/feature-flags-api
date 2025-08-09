import { Test, TestingModule } from '@nestjs/testing';
import { FeatureFlagChangeRequestService } from './feature-flag-change-request.service';

describe('FeatureFlagChangeRequestService', () => {
  let service: FeatureFlagChangeRequestService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FeatureFlagChangeRequestService],
    }).compile();

    service = module.get<FeatureFlagChangeRequestService>(FeatureFlagChangeRequestService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
