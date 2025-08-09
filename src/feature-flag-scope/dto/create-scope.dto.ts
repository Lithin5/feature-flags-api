import { IsString, IsOptional } from 'class-validator';

export class CreateScopeDto {
  @IsString()
  name: string;

  @IsString()
  slug: string;

  @IsOptional()
  @IsString()
  description?: string;
}
