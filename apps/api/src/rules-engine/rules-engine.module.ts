import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

// TypeORM Entities
import { ContentPackOrmEntity } from './infrastructure/adapters/out/persistence/typeorm/content-pack.typeorm-entity';
import { AssetOrmEntity } from './infrastructure/adapters/out/persistence/typeorm/asset.typeorm-entity';

// Repository Tokens
import { CONTENT_PACK_REPOSITORY } from './domain/repositories/content-pack.repository';
import { ASSET_REPOSITORY } from './domain/repositories/asset.repository';

// Repository Implementations
import { ContentPackTypeormRepository } from './infrastructure/adapters/out/persistence/typeorm/content-pack.typeorm-repository';
import { AssetTypeormRepository } from './infrastructure/adapters/out/persistence/typeorm/asset.typeorm-repository';

// Use Cases
import { CreatePackUseCase } from './application/use-cases/create-pack.use-case';
import { GetPackUseCase } from './application/use-cases/get-pack.use-case';
import { ListPacksUseCase } from './application/use-cases/list-packs.use-case';
import { CreateAssetUseCase } from './application/use-cases/create-asset.use-case';
import { GetAssetUseCase } from './application/use-cases/get-asset.use-case';
import { ListAssetsUseCase } from './application/use-cases/list-assets.use-case';
import { UpdatePackUseCase } from './application/use-cases/update-pack.use-case';
import { SuspendPackUseCase } from './application/use-cases/suspend-pack.use-case';
import { UnsuspendPackUseCase } from './application/use-cases/unsuspend-pack.use-case';
import { DeletePackUseCase } from './application/use-cases/delete-pack.use-case';
import { UpdateAssetUseCase } from './application/use-cases/update-asset.use-case';
import { DeleteAssetUseCase } from './application/use-cases/delete-asset.use-case';
import { ResolveAssetUseCase } from './application/use-cases/resolve-asset.use-case';

// Controllers
import { PacksController } from './infrastructure/adapters/in/rest/packs.controller';
import { AssetsController } from './infrastructure/adapters/in/rest/assets.controller';
import { SrdSeederService } from './infrastructure/seeding/srd-seeder.service';

import { ResolutionController } from './infrastructure/adapters/in/rest/resolution.controller';

@Module({
  imports: [TypeOrmModule.forFeature([ContentPackOrmEntity, AssetOrmEntity])],
  controllers: [PacksController, AssetsController, ResolutionController],
  providers: [
    // Repository implementations bound to interfaces
    {
      provide: CONTENT_PACK_REPOSITORY,
      useClass: ContentPackTypeormRepository,
    },
    {
      provide: ASSET_REPOSITORY,
      useClass: AssetTypeormRepository,
    },
    // Use Cases
    CreatePackUseCase,
    GetPackUseCase,
    ListPacksUseCase,
    CreateAssetUseCase,
    GetAssetUseCase,
    ListAssetsUseCase,
    UpdatePackUseCase,
    SuspendPackUseCase,
    UnsuspendPackUseCase,
    DeletePackUseCase,
    UpdateAssetUseCase,
    DeleteAssetUseCase,
    SrdSeederService,
    ResolveAssetUseCase,
  ],
  exports: [
    CONTENT_PACK_REPOSITORY,
    ASSET_REPOSITORY,
    CreatePackUseCase,
    GetPackUseCase,
    ListPacksUseCase,
    CreateAssetUseCase,
    GetAssetUseCase,
    ListAssetsUseCase,
    UpdatePackUseCase,
    SuspendPackUseCase,
    UnsuspendPackUseCase,
    DeletePackUseCase,
    UpdateAssetUseCase,
    DeleteAssetUseCase,
    ResolveAssetUseCase,
  ],
})
export class RulesEngineModule {}
