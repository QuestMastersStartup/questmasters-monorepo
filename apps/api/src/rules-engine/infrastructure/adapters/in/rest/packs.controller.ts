import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Patch,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { CreatePackUseCase } from '@rules-engine/application/use-cases/create-pack.use-case';
import { GetPackUseCase } from '@rules-engine/application/use-cases/get-pack.use-case';
import { ListPacksUseCase } from '@rules-engine/application/use-cases/list-packs.use-case';
import { UpdatePackUseCase } from '@rules-engine/application/use-cases/update-pack.use-case';
import { SuspendPackUseCase } from '@rules-engine/application/use-cases/suspend-pack.use-case';
import { UnsuspendPackUseCase } from '@rules-engine/application/use-cases/unsuspend-pack.use-case';
import { DeletePackUseCase } from '@rules-engine/application/use-cases/delete-pack.use-case';
import {
  CreatePackDto,
  UpdatePackDto,
  SuspendPackDto,
} from '@rules-engine/application/dto/pack.dto';
import { PackError } from '@rules-engine/application/errors';
import { ContentPackMapper } from '../../out/persistence/mappers/content-pack.mapper';
import { AssetMapper } from '../../out/persistence/mappers/asset.mapper';

@Controller('packs')
export class PacksController {
  constructor(
    private readonly createPackUseCase: CreatePackUseCase,
    private readonly getPackUseCase: GetPackUseCase,
    private readonly listPacksUseCase: ListPacksUseCase,
    private readonly updatePackUseCase: UpdatePackUseCase,
    private readonly suspendPackUseCase: SuspendPackUseCase,
    private readonly unsuspendPackUseCase: UnsuspendPackUseCase,
    private readonly deletePackUseCase: DeletePackUseCase,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreatePackDto) {
    const result = await this.createPackUseCase.execute(dto);

    if (result.isFailure) {
      if (result.error === PackError.SLUG_ALREADY_EXISTS) {
        throw new BadRequestException('A pack with this slug already exists');
      }
      throw new BadRequestException(result.error);
    }

    return ContentPackMapper.toResponse(result.value);
  }

  @Get()
  async findAll(
    @Query('type') type?: string,
    @Query('creatorId') creatorId?: string,
  ) {
    const packs = await this.listPacksUseCase.execute({
      type,
      creatorId,
      isActive: true,
      isSuspended: false,
    });

    return packs.map((pack) => ContentPackMapper.toResponse(pack));
  }

  @Get(':slug')
  async findOne(@Param('slug') slug: string) {
    const result = await this.getPackUseCase.execute(slug);

    if (result.isFailure) {
      if (result.error === PackError.NOT_FOUND) {
        throw new NotFoundException(`Pack with slug '${slug}' not found`);
      }
      throw new BadRequestException(result.error);
    }

    const { pack, assets } = result.value;
    return {
      ...ContentPackMapper.toResponse(pack),
      assets: assets.map((asset) => AssetMapper.toResponse(asset)),
    };
  }

  @Get(':slug/assets')
  async getAssets(@Param('slug') slug: string, @Query('type') type?: string) {
    const result = await this.getPackUseCase.execute(slug);

    if (result.isFailure) {
      if (result.error === PackError.NOT_FOUND) {
        throw new NotFoundException(`Pack with slug '${slug}' not found`);
      }
      throw new BadRequestException(result.error);
    }

    const { assets } = result.value;

    // Filter assets if type is provided
    const filteredAssets = type
      ? assets.filter((a) => a.type.toString() === type)
      : assets;

    return filteredAssets.map((asset) => AssetMapper.toResponse(asset));
  }

  @Put(':slug')
  async update(@Param('slug') slug: string, @Body() dto: UpdatePackDto) {
    const result = await this.updatePackUseCase.execute(slug, dto);

    if (result.isFailure) {
      if (result.error === PackError.NOT_FOUND) {
        throw new NotFoundException(`Pack with slug '${slug}' not found`);
      }
      throw new BadRequestException(result.error);
    }

    return ContentPackMapper.toResponse(result.value);
  }

  @Patch(':slug/suspend')
  async suspend(@Param('slug') slug: string, @Body() dto: SuspendPackDto) {
    const result = await this.suspendPackUseCase.execute(slug, dto);

    if (result.isFailure) {
      if (result.error === PackError.NOT_FOUND) {
        throw new NotFoundException(`Pack with slug '${slug}' not found`);
      }
      throw new BadRequestException(result.error);
    }

    return ContentPackMapper.toResponse(result.value);
  }

  @Patch(':slug/unsuspend')
  async unsuspend(@Param('slug') slug: string) {
    const result = await this.unsuspendPackUseCase.execute(slug);

    if (result.isFailure) {
      if (result.error === PackError.NOT_FOUND) {
        throw new NotFoundException(`Pack with slug '${slug}' not found`);
      }
      throw new BadRequestException(result.error);
    }

    return ContentPackMapper.toResponse(result.value);
  }

  @Delete(':slug')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param('slug') slug: string) {
    const result = await this.deletePackUseCase.execute(slug);

    if (result.isFailure) {
      if (result.error === PackError.NOT_FOUND) {
        throw new NotFoundException(`Pack with slug '${slug}' not found`);
      }
      throw new BadRequestException(result.error);
    }
  }
}
