import { IsString, IsOptional } from 'class-validator';

export class UpdateEnvironmentDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  key?: string; // will be validated in service
}