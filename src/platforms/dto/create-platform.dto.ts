import { IsString, IsOptional } from 'class-validator';

export class CreatePlatformDto {
  @IsString()
  key: string;

  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;
}