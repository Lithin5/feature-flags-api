import { IsString, IsOptional } from 'class-validator';

export class UpdateScopeDto {
  @IsOptional()
  @IsString()
  name?: string;

  // Slug will not be updated
  @IsOptional()
  @IsString()
  description?: string;
}