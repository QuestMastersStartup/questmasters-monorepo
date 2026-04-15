import { DataSource } from 'typeorm';
import { ContentPackOrmEntity } from '../content/infrastructure/typeorm/content-pack.typeorm-entity';
import { AssetOrmEntity } from '../content/infrastructure/typeorm/asset.typeorm-entity';
import { UserProfileOrmEntity } from '../users/infrastructure/adapters/out/persistence/typeorm/user-profile.typeorm-entity';
import { CampaignOrmEntity } from '../campaigns/infrastructure/typeorm/campaign.typeorm-entity';
import { CampaignInstalledPackOrmEntity } from '../campaigns/infrastructure/typeorm/campaign-installed-pack.typeorm-entity';
import { CampaignMemberOrmEntity } from '../campaigns/infrastructure/typeorm/campaign-member.typeorm-entity';
import { CharacterOrmEntity } from '../characters/infrastructure/typeorm/character.typeorm-entity';

export async function createDataSource(): Promise<DataSource> {
  const ds = new DataSource({
    type: 'postgres',
    url: process.env.DATABASE_URL,
    entities: [
      ContentPackOrmEntity,
      AssetOrmEntity,
      UserProfileOrmEntity,
      CampaignOrmEntity,
      CampaignInstalledPackOrmEntity,
      CampaignMemberOrmEntity,
      CharacterOrmEntity,
    ],
    // Migrations run explicitly via `bun run migration:run` — never at startup.
    // Do NOT enable migrationsRun or synchronize: they conflict with each other
    // and cause FK failures on fresh databases.
    migrations: [import.meta.dir + '/../migrations/*.ts'],
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
  });

  await ds.initialize();
  console.log('✅ Database connected');
  return ds;
}
