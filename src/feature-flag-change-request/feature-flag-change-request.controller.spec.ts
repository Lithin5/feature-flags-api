import { Test, TestingModule } from '@nestjs/testing';
import { FeatureFlagChangeRequestController } from './feature-flag-change-request.controller';

describe('FeatureFlagChangeRequestController', () => {
  let controller: FeatureFlagChangeRequestController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FeatureFlagChangeRequestController],
    }).compile();

    controller = module.get<FeatureFlagChangeRequestController>(FeatureFlagChangeRequestController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
