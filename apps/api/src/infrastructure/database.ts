import { DataSource } from 'typeorm';
import { ContentPackOrmEntity } from '../rules-engine/infrastructure/adapters/out/persistence/typeorm/content-pack.typeorm-entity';
import { AssetOrmEntity } from '../rules-engine/infrastructure/adapters/out/persistence/typeorm/asset.typeorm-entity';

export async function createDataSource(): Promise<DataSource> {
  const ds = new DataSource({
    type: 'postgres',
    url: process.env.DATABASE_URL,
    entities: [ContentPackOrmEntity, AssetOrmEntity],
    migrations: [import.meta.dir + '/../migrations/*.ts'],
    migrationsRun: true,
    synchronize: process.env.NODE_ENV === 'development',
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
  });

  await ds.initialize();
  console.log('✅ Database connected');
  return ds;
}
