import { Test, TestingModule } from '@nestjs/testing';
import { FeatureFlagScopeController } from './feature-flag-scope.controller';

describe('FeatureFlagScopeController', () => {
  let controller: FeatureFlagScopeController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FeatureFlagScopeController],
    }).compile();

    controller = module.get<FeatureFlagScopeController>(FeatureFlagScopeController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
