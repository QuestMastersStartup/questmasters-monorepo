import { Body, Controller, Post } from '@nestjs/common';
import { ResolveAssetUseCase } from '../../../../application/use-cases/resolve-asset.use-case';

import { IsString, IsObject } from 'class-validator';

class ResolveAssetDto {
  @IsString()
  packId: string;
  @IsString()
  assetType: string;
  @IsString()
  assetIndex: string;
  @IsObject()
  selections: Record<string, string[]>;
}

@Controller('rules')
export class ResolutionController {
  constructor(private readonly resolveAssetUseCase: ResolveAssetUseCase) {}

  @Post('resolve')
  async resolve(@Body() dto: ResolveAssetDto) {
    return this.resolveAssetUseCase.execute(dto);
  }
}
