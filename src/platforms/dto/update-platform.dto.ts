import { IsString, IsOptional, IsBoolean } from 'class-validator';

export class UpdatePlatformDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  // Will be ignored if provided (key is immutable)
  @IsOptional()
  @IsString()
  key?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
