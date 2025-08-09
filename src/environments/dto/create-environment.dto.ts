import { IsString, IsOptional } from 'class-validator';

export class CreateEnvironmentDto {
  @IsString()
  key: string;

  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;
}