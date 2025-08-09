import { IsEnum, IsOptional, IsString } from 'class-validator';
import { FeatureFlagRequestStatus } from '../feature-flag-change-request.enums';

export class ReviewChangeRequestDto {
  @IsEnum(FeatureFlagRequestStatus, {
    message: 'Status must be either APPROVED or REJECTED',
  })
  status: FeatureFlagRequestStatus.APPROVED | FeatureFlagRequestStatus.REJECTED;

  @IsString()
  @IsOptional()
  comment?: string;
}
