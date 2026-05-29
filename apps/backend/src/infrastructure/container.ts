import { DataSource } from 'typeorm';

// TypeORM Entities
import { ContentPackOrmEntity } from '../content/infrastructure/typeorm/content-pack.typeorm-entity';
import { AssetOrmEntity } from '../content/infrastructure/typeorm/asset.typeorm-entity';
import { CampaignOrmEntity } from '../campaigns/infrastructure/typeorm/campaign.typeorm-entity';
import { CampaignMemberOrmEntity } from '../campaigns/infrastructure/typeorm/campaign-member.typeorm-entity';
import { CharacterOrmEntity } from '../characters/infrastructure/typeorm/character.typeorm-entity';

// Repository Implementations
import { ContentPackTypeormRepository } from '../content/infrastructure/typeorm/content-pack.typeorm-repository';
import { AssetTypeormRepository } from '../content/infrastructure/typeorm/asset.typeorm-repository';
import { UserProfileTypeormRepository } from '../users/infrastructure/adapters/out/persistence/typeorm/user-profile.typeorm-repository';
import { UserProfileOrmEntity } from '../users/infrastructure/adapters/out/persistence/typeorm/user-profile.typeorm-entity';
import { CampaignTypeormRepository } from '../campaigns/infrastructure/typeorm/campaign.typeorm-repository';
import { CampaignMemberTypeormRepository } from '../campaigns/infrastructure/typeorm/campaign-member.typeorm-repository';
import { CharacterTypeormRepository } from '../characters/infrastructure/typeorm/character.typeorm-repository';

// Use Cases
import { CreatePackUseCase } from '../content/application/use-cases/create-pack.use-case';
import { GetPackUseCase } from '../content/application/use-cases/get-pack.use-case';
import { ListPacksUseCase } from '../content/application/use-cases/list-packs.use-case';
import { UpdatePackUseCase } from '../content/application/use-cases/update-pack.use-case';
import { SuspendPackUseCase } from '../content/application/use-cases/suspend-pack.use-case';
import { UnsuspendPackUseCase } from '../content/application/use-cases/unsuspend-pack.use-case';
import { DeletePackUseCase } from '../content/application/use-cases/delete-pack.use-case';
import { ChangePackStatusUseCase } from '../content/application/use-cases/change-pack-status.use-case';
import { CreateAssetUseCase } from '../content/application/use-cases/create-asset.use-case';
import { GetAssetUseCase } from '../content/application/use-cases/get-asset.use-case';
import { ListAssetsUseCase } from '../content/application/use-cases/list-assets.use-case';
import { UpdateAssetUseCase } from '../content/application/use-cases/update-asset.use-case';
import { DeleteAssetUseCase } from '../content/application/use-cases/delete-asset.use-case';
import { ResolveAssetUseCase } from '../content/application/use-cases/resolve-asset.use-case';
import { GetUserProfileUseCase } from '../users/application/use-cases/get-user-profile.use-case';
import { UpdateUserProfileUseCase } from '../users/application/use-cases/update-user-profile.use-case';
import { UpdateUserRoleUseCase } from '../users/application/use-cases/update-user-role.use-case';
import { SearchUsersUseCase } from '../users/application/use-cases/search-users.use-case';

import { CreateCampaignUseCase } from '../campaigns/application/use-cases/create-campaign.use-case';
import { GetCampaignUseCase } from '../campaigns/application/use-cases/get-campaign.use-case';
import { ListCampaignsUseCase } from '../campaigns/application/use-cases/list-campaigns.use-case';
import { UpdateCampaignUseCase } from '../campaigns/application/use-cases/update-campaign.use-case';
import { DeleteCampaignUseCase } from '../campaigns/application/use-cases/delete-campaign.use-case';
import { InvitePlayerUseCase } from '../campaigns/application/use-cases/invite-player.use-case';
import { ListMembersUseCase } from '../campaigns/application/use-cases/list-members.use-case';
import { RemoveMemberUseCase } from '../campaigns/application/use-cases/remove-member.use-case';

import { CreateCharacterUseCase } from '../characters/application/use-cases/create-character.use-case';
import { GetCharacterUseCase } from '../characters/application/use-cases/get-character.use-case';
import { ListCharactersUseCase } from '../characters/application/use-cases/list-characters.use-case';
import { UpdateCharacterUseCase } from '../characters/application/use-cases/update-character.use-case';
import { DeleteCharacterUseCase } from '../characters/application/use-cases/delete-character.use-case';
import { ListAvailableAssetsUseCase } from '../characters/application/use-cases/list-available-assets.use-case';

// Seeder
import { SrdSeederService } from '../content/infrastructure/seeding/srd-seeder.service';

export function createContainer(dataSource: DataSource) {
  // TypeORM Repositories
  const packRepo = new ContentPackTypeormRepository(
    dataSource.getRepository(ContentPackOrmEntity),
  );
  const assetRepo = new AssetTypeormRepository(
    dataSource.getRepository(AssetOrmEntity),
  );
  const userProfileRepo = new UserProfileTypeormRepository(
    dataSource.getRepository(UserProfileOrmEntity),
  );
  const campaignRepo = new CampaignTypeormRepository(
    dataSource.getRepository(CampaignOrmEntity),
  );
  const campaignMemberRepo = new CampaignMemberTypeormRepository(
    dataSource.getRepository(CampaignMemberOrmEntity),
  );
  const characterRepo = new CharacterTypeormRepository(
    dataSource.getRepository(CharacterOrmEntity),
  );

  // Use Cases — manually wired (order matters for dependencies)
  const createAssetUseCase = new CreateAssetUseCase(assetRepo, packRepo);
  const getAssetUseCase = new GetAssetUseCase(assetRepo, packRepo);
  const listAssetsUseCase = new ListAssetsUseCase(assetRepo, packRepo);
  const updateAssetUseCase = new UpdateAssetUseCase(assetRepo, packRepo);
  const deleteAssetUseCase = new DeleteAssetUseCase(assetRepo, packRepo);
  const resolveAssetUseCase = new ResolveAssetUseCase(assetRepo);

  const getUserProfileUseCase = new GetUserProfileUseCase(userProfileRepo);
  const updateUserProfileUseCase = new UpdateUserProfileUseCase(userProfileRepo);
  const updateUserRoleUseCase = new UpdateUserRoleUseCase(userProfileRepo);
  const searchUsersUseCase = new SearchUsersUseCase(userProfileRepo);

  const createCampaignUseCase = new CreateCampaignUseCase(campaignRepo);
  const getCampaignUseCase = new GetCampaignUseCase(campaignRepo);
  const listCampaignsUseCase = new ListCampaignsUseCase(campaignRepo);
  const updateCampaignUseCase = new UpdateCampaignUseCase(campaignRepo);
  const deleteCampaignUseCase = new DeleteCampaignUseCase(campaignRepo);

  const createCharacterUseCase = new CreateCharacterUseCase(characterRepo, campaignRepo, campaignMemberRepo, assetRepo);
  const getCharacterUseCase = new GetCharacterUseCase(characterRepo);
  const listCharactersUseCase = new ListCharactersUseCase(characterRepo);
  const updateCharacterUseCase = new UpdateCharacterUseCase(characterRepo, campaignMemberRepo);
  const deleteCharacterUseCase = new DeleteCharacterUseCase(characterRepo, campaignMemberRepo);
  const listAvailableAssetsUseCase = new ListAvailableAssetsUseCase(assetRepo, campaignRepo, packRepo);

  const invitePlayerUseCase = new InvitePlayerUseCase(campaignRepo, campaignMemberRepo, userProfileRepo);
  const listMembersUseCase = new ListMembersUseCase(campaignMemberRepo);
  const removeMemberUseCase = new RemoveMemberUseCase(campaignMemberRepo);

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
  const changePackStatusUseCase = new ChangePackStatusUseCase(packRepo);

  // Seeder
  const srdSeederService = new SrdSeederService(packRepo, assetRepo);

  return {
    // Repositories
    packRepo,
    assetRepo,
    userProfileRepo,
    campaignRepo,
    campaignMemberRepo,
    characterRepo,
    // Pack Use Cases
    createPackUseCase,
    getPackUseCase,
    listPacksUseCase,
    updatePackUseCase,
    suspendPackUseCase,
    unsuspendPackUseCase,
    deletePackUseCase,
    changePackStatusUseCase,
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
    // Users
    getUserProfileUseCase,
    updateUserProfileUseCase,
    updateUserRoleUseCase,
    searchUsersUseCase,
    // Campaigns
    createCampaignUseCase,
    getCampaignUseCase,
    listCampaignsUseCase,
    updateCampaignUseCase,
    deleteCampaignUseCase,
    // Characters
    createCharacterUseCase,
    getCharacterUseCase,
    listCharactersUseCase,
    updateCharacterUseCase,
    deleteCharacterUseCase,
    listAvailableAssetsUseCase,
    // Members
    invitePlayerUseCase,
    listMembersUseCase,
    removeMemberUseCase,
  };
}

export type Container = ReturnType<typeof createContainer>;
