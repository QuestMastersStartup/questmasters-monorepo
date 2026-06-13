import type { AppDb } from './db/connection';
import type { CloudflareBindings } from '../types/bindings';

// Drizzle Repositories
import { ContentPackDrizzleRepository } from '../content/infrastructure/drizzle/content-pack.drizzle-repository';
import { AssetDrizzleRepository } from '../content/infrastructure/drizzle/asset.drizzle-repository';
import { UserProfileDrizzleRepository } from '../users/infrastructure/drizzle/user-profile.drizzle-repository';
import { CampaignDrizzleRepository } from '../campaigns/infrastructure/drizzle/campaign.drizzle-repository';
import { CampaignMemberDrizzleRepository } from '../campaigns/infrastructure/drizzle/campaign-member.drizzle-repository';
import { CharacterDrizzleRepository } from '../characters/infrastructure/drizzle/character.drizzle-repository';
import { DmSessionDrizzleRepository } from '../dm-session/infrastructure/drizzle/dm-session.drizzle-repository';
import { DmTurnDrizzleRepository } from '../dm-session/infrastructure/drizzle/dm-turn.drizzle-repository';

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
import { SrdSeederService } from '../content/infrastructure/seeding/srd-seeder.service';
import { CreateDmSessionUseCase } from '../dm-session/application/use-cases/create-dm-session.use-case';
import { InitializeDmSessionUseCase } from '../dm-session/application/use-cases/initialize-dm-session.use-case';
import { SendPlayerTurnUseCase } from '../dm-session/application/use-cases/send-player-turn.use-case';
import { GetDmSessionUseCase } from '../dm-session/application/use-cases/get-dm-session.use-case';
import { ListDmSessionsUseCase } from '../dm-session/application/use-cases/list-dm-sessions.use-case';
import { GetSessionMetricsUseCase } from '../dm-session/application/use-cases/get-session-metrics.use-case';
import { EndDmSessionUseCase } from '../dm-session/application/use-cases/end-dm-session.use-case';

// DM Model Providers
import { StubDmModelAdapter } from '../dm-session/infrastructure/adapters/stub-dm-model.adapter';
import type { DmModelProvider } from '../dm-session/domain/ports/dm-model.provider';
import type { ArchitectureType } from '../dm-session/domain/entities/dm-session.entity';

export function createContainer(db: AppDb, env: CloudflareBindings) {
  // Repositories
  const packRepo = new ContentPackDrizzleRepository(db);
  const assetRepo = new AssetDrizzleRepository(db);
  const userProfileRepo = new UserProfileDrizzleRepository(db);
  const campaignRepo = new CampaignDrizzleRepository(db);
  const campaignMemberRepo = new CampaignMemberDrizzleRepository(db);
  const characterRepo = new CharacterDrizzleRepository(db);
  const dmSessionRepo = new DmSessionDrizzleRepository(db);
  const dmTurnRepo = new DmTurnDrizzleRepository(db);

  // DM Model Providers
  const dmModelProviders: Record<ArchitectureType, DmModelProvider> = {
    mas: new StubDmModelAdapter(env.DM_MODEL_ENDPOINT_MAS),
    monolithic: new StubDmModelAdapter(env.DM_MODEL_ENDPOINT_MONOLITHIC),
  };

  // Use Cases
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

  const createCharacterUseCase = new CreateCharacterUseCase(
    characterRepo,
    campaignRepo,
    campaignMemberRepo,
    assetRepo,
  );
  const getCharacterUseCase = new GetCharacterUseCase(characterRepo);
  const listCharactersUseCase = new ListCharactersUseCase(characterRepo);
  const updateCharacterUseCase = new UpdateCharacterUseCase(characterRepo, campaignMemberRepo);
  const deleteCharacterUseCase = new DeleteCharacterUseCase(characterRepo, campaignMemberRepo);
  const listAvailableAssetsUseCase = new ListAvailableAssetsUseCase(
    assetRepo,
    campaignRepo,
    packRepo,
  );

  const createDmSessionUseCase = new CreateDmSessionUseCase(dmSessionRepo);
  const initializeDmSessionUseCase = new InitializeDmSessionUseCase(
    dmSessionRepo,
    dmTurnRepo,
    dmModelProviders,
  );
  const sendPlayerTurnUseCase = new SendPlayerTurnUseCase(
    dmSessionRepo,
    dmTurnRepo,
    dmModelProviders,
  );
  const getDmSessionUseCase = new GetDmSessionUseCase(dmSessionRepo, dmTurnRepo);
  const listDmSessionsUseCase = new ListDmSessionsUseCase(dmSessionRepo);
  const getSessionMetricsUseCase = new GetSessionMetricsUseCase(dmSessionRepo, dmTurnRepo);
  const endDmSessionUseCase = new EndDmSessionUseCase(dmSessionRepo);

  const invitePlayerUseCase = new InvitePlayerUseCase(
    campaignRepo,
    campaignMemberRepo,
    userProfileRepo,
  );
  const listMembersUseCase = new ListMembersUseCase(campaignMemberRepo);
  const removeMemberUseCase = new RemoveMemberUseCase(campaignMemberRepo);

  const srdSeederService = new SrdSeederService(packRepo, assetRepo);

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

  return {
    // Seeder
    srdSeederService,
    // Repositories (acceso directo desde routes que lo necesitan)
    assetRepo,
    campaignRepo,
    userProfileRepo,
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
    // DM Sessions
    createDmSessionUseCase,
    initializeDmSessionUseCase,
    sendPlayerTurnUseCase,
    getDmSessionUseCase,
    listDmSessionsUseCase,
    getSessionMetricsUseCase,
    endDmSessionUseCase,
    // Members
    invitePlayerUseCase,
    listMembersUseCase,
    removeMemberUseCase,
  };
}

export type Container = ReturnType<typeof createContainer>;
