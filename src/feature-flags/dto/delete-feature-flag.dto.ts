import { IsOptional, IsString } from 'class-validator';

export class DeleteFeatureFlagDto {
  @IsOptional()
  @IsString()
  reason?: string;
}
