import {
  IsString,
  IsOptional,
  IsArray,
  IsEnum,
  IsObject,
  MinLength,
  MaxLength,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { AssetTypeValue } from '../../domain/value-objects/asset-type.vo';

export class CreateAssetDtoNew {
  @Transform(({ value }) => value?.toLowerCase())
  @IsEnum(AssetTypeValue)
  type: AssetTypeValue;

  @IsString()
  @MinLength(1)
  @MaxLength(255)
  index: string;

  @IsObject()
  data: Record<string, any>;
}

export class UpdateAssetDto {
  @IsOptional()
  @IsObject()
  data?: Record<string, any>;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  compatibleWith?: string[];
}
