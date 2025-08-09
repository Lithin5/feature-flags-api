import { IsBoolean, IsString, MaxLength, IsArray, ArrayNotEmpty, ArrayMinSize } from 'class-validator';

export class CreateFeatureFlagDto {
  @IsString()
  @MaxLength(40)
  key: string;

  @IsString()
  name: string;

  @IsString()
  description: string;

  @IsBoolean()
  enabled: boolean;

  @IsArray()
  @ArrayNotEmpty({ message: 'At least one environment must be selected' })
  @IsString({ each: true })
  environmentIds: string[];

  @IsString()
  platformId: string;

  @IsString()
  scopeId: string;

}
