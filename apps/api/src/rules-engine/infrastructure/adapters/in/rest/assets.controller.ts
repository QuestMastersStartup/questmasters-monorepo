import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { CreateAssetUseCase } from '@rules-engine/application/use-cases/create-asset.use-case';
import { GetAssetUseCase } from '@rules-engine/application/use-cases/get-asset.use-case';
import { ListAssetsUseCase } from '@rules-engine/application/use-cases/list-assets.use-case';
import { UpdateAssetUseCase } from '@rules-engine/application/use-cases/update-asset.use-case';
import { DeleteAssetUseCase } from '@rules-engine/application/use-cases/delete-asset.use-case';
import {
  CreateAssetDtoNew,
  UpdateAssetDto,
} from '@rules-engine/application/dto/asset.dto';
import { AssetError } from '@rules-engine/application/errors';
import { AssetMapper } from '../../out/persistence/mappers/asset.mapper';

@Controller('packs/:packSlug/assets')
export class AssetsController {
  constructor(
    private readonly createAssetUseCase: CreateAssetUseCase,
    private readonly getAssetUseCase: GetAssetUseCase,
    private readonly listAssetsUseCase: ListAssetsUseCase,
    private readonly updateAssetUseCase: UpdateAssetUseCase,
    private readonly deleteAssetUseCase: DeleteAssetUseCase,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Param('packSlug') packSlug: string,
    @Body() dto: CreateAssetDtoNew,
  ) {
    const result = await this.createAssetUseCase.execute(packSlug, dto);

    if (result.isFailure) {
      switch (result.error) {
        case AssetError.PACK_NOT_FOUND:
          throw new NotFoundException(`Pack '${packSlug}' not found`);
        case AssetError.ALREADY_EXISTS:
          throw new BadRequestException(
            `Asset '${dto.type}/${dto.index}' already exists in this pack`,
          );
        default:
          throw new BadRequestException(result.error);
      }
    }

    return AssetMapper.toResponse(result.value);
  }

  @Get()
  async findAll(
    @Param('packSlug') packSlug: string,
    @Query('type') type?: string,
  ) {
    const result = await this.listAssetsUseCase.execute(packSlug, { type });

    if (result.isFailure) {
      if (result.error === AssetError.PACK_NOT_FOUND) {
        throw new NotFoundException(`Pack '${packSlug}' not found`);
      }
      throw new BadRequestException(result.error);
    }

    return result.value.map(AssetMapper.toResponse);
  }

  @Get(':type/:index')
  async findOne(
    @Param('packSlug') packSlug: string,
    @Param('type') type: string,
    @Param('index') index: string,
  ) {
    const result = await this.getAssetUseCase.execute(packSlug, type, index);

    if (result.isFailure) {
      switch (result.error) {
        case AssetError.PACK_NOT_FOUND:
          throw new NotFoundException(`Pack '${packSlug}' not found`);
        case AssetError.NOT_FOUND:
          throw new NotFoundException(
            `Asset '${type}/${index}' not found in pack '${packSlug}'`,
          );
        case AssetError.INVALID_TYPE:
          throw new BadRequestException(`Invalid asset type: ${type}`);
        default:
          throw new BadRequestException(result.error);
      }
    }

    return AssetMapper.toResponse(result.value);
  }

  @Put(':type/:index')
  async update(
    @Param('packSlug') packSlug: string,
    @Param('type') type: string,
    @Param('index') index: string,
    @Body() dto: UpdateAssetDto,
  ) {
    const result = await this.updateAssetUseCase.execute(
      packSlug,
      type,
      index,
      dto,
    );

    if (result.isFailure) {
      switch (result.error) {
        case AssetError.PACK_NOT_FOUND:
          throw new NotFoundException(`Pack '${packSlug}' not found`);
        case AssetError.NOT_FOUND:
          throw new NotFoundException(
            `Asset '${type}/${index}' not found in pack '${packSlug}'`,
          );
        case AssetError.INVALID_TYPE:
          throw new BadRequestException(`Invalid asset type: ${type}`);
        default:
          throw new BadRequestException(result.error);
      }
    }

    return AssetMapper.toResponse(result.value);
  }

  @Delete(':type/:index')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(
    @Param('packSlug') packSlug: string,
    @Param('type') type: string,
    @Param('index') index: string,
  ) {
    const result = await this.deleteAssetUseCase.execute(packSlug, type, index);

    if (result.isFailure) {
      switch (result.error) {
        case AssetError.PACK_NOT_FOUND:
          throw new NotFoundException(`Pack '${packSlug}' not found`);
        case AssetError.NOT_FOUND:
          throw new NotFoundException(
            `Asset '${type}/${index}' not found in pack '${packSlug}'`,
          );
        case AssetError.INVALID_TYPE:
          throw new BadRequestException(`Invalid asset type: ${type}`);
        default:
          throw new BadRequestException(result.error);
      }
    }
  }
}
