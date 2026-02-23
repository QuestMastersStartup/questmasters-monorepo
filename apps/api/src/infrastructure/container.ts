import { DataSource } from 'typeorm';

// TypeORM Entities
import { ContentPackOrmEntity } from '../rules-engine/infrastructure/adapters/out/persistence/typeorm/content-pack.typeorm-entity';
import { AssetOrmEntity } from '../rules-engine/infrastructure/adapters/out/persistence/typeorm/asset.typeorm-entity';

// Repository Implementations
import { ContentPackTypeormRepository } from '../rules-engine/infrastructure/adapters/out/persistence/typeorm/content-pack.typeorm-repository';
import { AssetTypeormRepository } from '../rules-engine/infrastructure/adapters/out/persistence/typeorm/asset.typeorm-repository';

// Use Cases
import { CreatePackUseCase } from '../rules-engine/application/use-cases/create-pack.use-case';
import { GetPackUseCase } from '../rules-engine/application/use-cases/get-pack.use-case';
import { ListPacksUseCase } from '../rules-engine/application/use-cases/list-packs.use-case';
import { UpdatePackUseCase } from '../rules-engine/application/use-cases/update-pack.use-case';
import { SuspendPackUseCase } from '../rules-engine/application/use-cases/suspend-pack.use-case';
import { UnsuspendPackUseCase } from '../rules-engine/application/use-cases/unsuspend-pack.use-case';
import { DeletePackUseCase } from '../rules-engine/application/use-cases/delete-pack.use-case';
import { CreateAssetUseCase } from '../rules-engine/application/use-cases/create-asset.use-case';
import { GetAssetUseCase } from '../rules-engine/application/use-cases/get-asset.use-case';
import { ListAssetsUseCase } from '../rules-engine/application/use-cases/list-assets.use-case';
import { UpdateAssetUseCase } from '../rules-engine/application/use-cases/update-asset.use-case';
import { DeleteAssetUseCase } from '../rules-engine/application/use-cases/delete-asset.use-case';
import { ResolveAssetUseCase } from '../rules-engine/application/use-cases/resolve-asset.use-case';

// Seeder
import { SrdSeederService } from '../rules-engine/infrastructure/seeding/srd-seeder.service';

export function createContainer(dataSource: DataSource) {
  // TypeORM Repositories
  const packRepo = new ContentPackTypeormRepository(
    dataSource.getRepository(ContentPackOrmEntity),
  );
  const assetRepo = new AssetTypeormRepository(
    dataSource.getRepository(AssetOrmEntity),
  );

  // Use Cases — manually wired (order matters for dependencies)
  const createAssetUseCase = new CreateAssetUseCase(assetRepo, packRepo);
  const getAssetUseCase = new GetAssetUseCase(assetRepo, packRepo);
  const listAssetsUseCase = new ListAssetsUseCase(assetRepo, packRepo);
  const updateAssetUseCase = new UpdateAssetUseCase(assetRepo, packRepo);
  const deleteAssetUseCase = new DeleteAssetUseCase(assetRepo, packRepo);
  const resolveAssetUseCase = new ResolveAssetUseCase(assetRepo);

  const createPackUseCase = new CreatePackUseCase(packRepo, createAssetUseCase);
  const getPackUseCase = new GetPackUseCase(packRepo, assetRepo);
  const listPacksUseCase = new ListPacksUseCase(packRepo);
  const updatePackUseCase = new UpdatePackUseCase(
    packRepo,
    assetRepo,
    createAssetUseCase,
    updateAssetUseCase,
    deleteAssetUseCase,
  );
  const suspendPackUseCase = new SuspendPackUseCase(packRepo);
  const unsuspendPackUseCase = new UnsuspendPackUseCase(packRepo);
  const deletePackUseCase = new DeletePackUseCase(packRepo);

  // Seeder
  const srdSeederService = new SrdSeederService(packRepo, assetRepo);

  return {
    // Repositories
    packRepo,
    assetRepo,
    // Pack Use Cases
    createPackUseCase,
    getPackUseCase,
    listPacksUseCase,
    updatePackUseCase,
    suspendPackUseCase,
    unsuspendPackUseCase,
    deletePackUseCase,
    // Asset Use Cases
    createAssetUseCase,
    getAssetUseCase,
    listAssetsUseCase,
    updateAssetUseCase,
    deleteAssetUseCase,
    // Rules
    resolveAssetUseCase,
    // Seeder
    srdSeederService,
  };
}

export type Container = ReturnType<typeof createContainer>;
