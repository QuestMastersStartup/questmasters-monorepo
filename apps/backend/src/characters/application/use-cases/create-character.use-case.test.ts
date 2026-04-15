import { describe, expect, it, mock, beforeEach } from 'bun:test';
import { CreateCharacterUseCase } from './create-character.use-case';
import { Campaign } from '../../../campaigns/domain/entities/campaign.entity';
import { CampaignMember } from '../../../campaigns/domain/entities/campaign-member.entity';
import { UUID } from '@shared/domain/value-objects/uuid.vo';
import { CharacterError } from '../character-errors';

const CAMPAIGN_UUID = '550e8400-e29b-41d4-a716-446655440000';
const USER_ID = 'user-player-123';
const RACE_ASSET_ID = '550e8400-e29b-41d4-a716-446655440001';
const CLASS_ASSET_ID = '550e8400-e29b-41d4-a716-446655440002';
const PACK_ID = '550e8400-e29b-41d4-a716-446655440099';

const defaultStats = {
  strength: 15,
  dexterity: 14,
  constitution: 13,
  intelligence: 12,
  wisdom: 10,
  charisma: 8,
};

function makeActiveCampaign(): Campaign {
  return Campaign.create({
    name: 'Active Campaign',
    dmId: 'dm-user-1',
    system: 'dnd-5e-2014',
    installedPackIds: [PACK_ID],
  });
}

function makeClassAsset() {
  return {
    packId: UUID.fromString(PACK_ID),
    data: { get: (_key: string) => 8 }, // hit_die = 8
  };
}

describe('CreateCharacterUseCase', () => {
  const mockCharacterRepo = {
    save: mock(() => Promise.resolve()),
    findActiveByUserAndCampaign: mock(() => Promise.resolve(null)),
  };
  const mockCampaignRepo = {
    findById: mock(() => Promise.resolve(makeActiveCampaign())),
  };
  const mockMemberRepo = {
    findByUserAndCampaign: mock(() =>
      Promise.resolve(
        CampaignMember.create(UUID.fromString(CAMPAIGN_UUID), USER_ID, 'player'),
      ),
    ),
  };
  const mockAssetRepo = {
    findById: mock(() => Promise.resolve(makeClassAsset())),
  };

  const useCase = new CreateCharacterUseCase(
    mockCharacterRepo as any,
    mockCampaignRepo as any,
    mockMemberRepo as any,
    mockAssetRepo as any,
  );

  beforeEach(() => {
    mockCharacterRepo.save.mockImplementation(() => Promise.resolve());
    mockCharacterRepo.findActiveByUserAndCampaign.mockImplementation(() => Promise.resolve(null));
    mockCampaignRepo.findById.mockImplementation(() => Promise.resolve(makeActiveCampaign()));
    mockMemberRepo.findByUserAndCampaign.mockImplementation(() =>
      Promise.resolve(CampaignMember.create(UUID.fromString(CAMPAIGN_UUID), USER_ID, 'player')),
    );
    mockAssetRepo.findById.mockImplementation(() => Promise.resolve(makeClassAsset()));
  });

  it('should create a free character (no campaign)', async () => {
    const result = await useCase.execute({
      userId: USER_ID,
      name: 'Aragorn',
      raceAssetId: RACE_ASSET_ID,
      classAssetId: CLASS_ASSET_ID,
      stats: defaultStats,
      method: 'point-buy',
    });

    expect(result.isSuccess).toBe(true);
    expect(result.value.name).toBe('Aragorn');
    expect(result.value.userId).toBe(USER_ID);
    expect(mockCharacterRepo.save).toHaveBeenCalled();
  });

  it('should create a campaign character when member', async () => {
    const result = await useCase.execute({
      campaignId: CAMPAIGN_UUID,
      userId: USER_ID,
      name: 'Legolas',
      raceAssetId: RACE_ASSET_ID,
      classAssetId: CLASS_ASSET_ID,
      stats: defaultStats,
      method: 'point-buy',
    });

    expect(result.isSuccess).toBe(true);
    expect(result.value.name).toBe('Legolas');
  });

  it('should fail when campaign not found', async () => {
    mockCampaignRepo.findById.mockImplementation(() => Promise.resolve(null));

    const result = await useCase.execute({
      campaignId: CAMPAIGN_UUID,
      userId: USER_ID,
      name: 'Gimli',
      raceAssetId: RACE_ASSET_ID,
      classAssetId: CLASS_ASSET_ID,
      stats: defaultStats,
      method: 'point-buy',
    });

    expect(result.isFailure).toBe(true);
    expect(result.error).toBe(CharacterError.NOT_FOUND);
  });

  it('should fail when user is not a campaign member', async () => {
    mockMemberRepo.findByUserAndCampaign.mockImplementation(() => Promise.resolve(null));

    const result = await useCase.execute({
      campaignId: CAMPAIGN_UUID,
      userId: USER_ID,
      name: 'Gimli',
      raceAssetId: RACE_ASSET_ID,
      classAssetId: CLASS_ASSET_ID,
      stats: defaultStats,
      method: 'point-buy',
    });

    expect(result.isFailure).toBe(true);
    expect(result.error).toBe(CharacterError.NOT_A_MEMBER);
  });

  it('should fail when user already has an active character in campaign', async () => {
    mockCharacterRepo.findActiveByUserAndCampaign.mockImplementation(() =>
      Promise.resolve({ id: UUID.generate(), name: 'Existing Character' }),
    );

    const result = await useCase.execute({
      campaignId: CAMPAIGN_UUID,
      userId: USER_ID,
      name: 'Second Character',
      raceAssetId: RACE_ASSET_ID,
      classAssetId: CLASS_ASSET_ID,
      stats: defaultStats,
      method: 'point-buy',
    });

    expect(result.isFailure).toBe(true);
    expect(result.error).toBe(CharacterError.ALREADY_EXISTS);
  });

  it('should fail with invalid stats in point-buy', async () => {
    const result = await useCase.execute({
      userId: USER_ID,
      name: 'Cheater',
      raceAssetId: RACE_ASSET_ID,
      classAssetId: CLASS_ASSET_ID,
      stats: { strength: 18, dexterity: 18, constitution: 18, intelligence: 18, wisdom: 18, charisma: 18 },
      method: 'point-buy',
    });

    expect(result.isFailure).toBe(true);
    expect(result.error).toBe(CharacterError.INVALID_STATS);
  });

  it('should fail with out-of-range stats in free mode', async () => {
    const result = await useCase.execute({
      userId: USER_ID,
      name: 'Godlike',
      raceAssetId: RACE_ASSET_ID,
      classAssetId: CLASS_ASSET_ID,
      stats: { strength: 100, dexterity: 14, constitution: 13, intelligence: 12, wisdom: 10, charisma: 8 },
      method: 'free',
    });

    expect(result.isFailure).toBe(true);
    expect(result.error).toBe(CharacterError.INVALID_STATS);
  });
});
