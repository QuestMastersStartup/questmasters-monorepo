import {
  IsString,
  IsOptional,
  IsArray,
  IsEnum,
  MinLength,
  MaxLength,
  Matches,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { PackTypeValue } from '../../domain/value-objects/pack-type.vo';
import { SystemTypeValue } from '../../domain/value-objects/system-type.vo';

export class CreatePackDto {
  @IsString()
  @MinLength(2)
  @MaxLength(255)
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: 'Slug must be lowercase with hyphens only',
  })
  slug: string;

  @IsString()
  @MinLength(1)
  @MaxLength(255)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @IsOptional()
  @IsString()
  @Matches(/^\d+(\.\d+){1,2}$/, {
    message: 'Version must follow format major.minor or major.minor.patch (e.g., 1.0 or 1.0.0)',
  })
  version?: string;

  @Transform(({ value }) => value?.toLowerCase())
  @IsEnum(PackTypeValue)
  type: PackTypeValue;

  @Transform(({ value }) => value?.toLowerCase())
  @IsOptional()
  @IsEnum(SystemTypeValue)
  system?: SystemTypeValue;

  @IsString()
  creatorId: string;

  @IsOptional()
  @IsArray()
  dependencies?: string[];

  @IsOptional()
  @IsArray()
  assets?: any[]; // Allowing assets payload
}

export class UpdatePackDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @IsOptional()
  @IsString()
  @Matches(/^\d+(\.\d+){1,2}$/, {
    message: 'Version must follow format major.minor or major.minor.patch (e.g., 1.0 or 1.0.0)',
  })
  version?: string;

  @IsOptional()
  @IsArray()
  assets?: any[];
}

export class SuspendPackDto {
  @IsString()
  @MinLength(10)
  @MaxLength(500)
  reason: string;
}
