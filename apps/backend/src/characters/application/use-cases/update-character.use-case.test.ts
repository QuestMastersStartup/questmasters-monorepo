import { describe, expect, it, mock, beforeEach } from 'bun:test';
import { UpdateCharacterUseCase } from './update-character.use-case';
import { Character } from '../../domain/entities/character.entity';
import { UUID } from '@shared/domain/value-objects/uuid.vo';
import { CharacterError } from '../character-errors';

const CHARACTER_UUID = '550e8400-e29b-41d4-a716-446655440000';
const OWNER_ID = 'user-owner-123';
const DM_ID = 'user-dm-456';

const defaultStats = {
  strength: 15,
  dexterity: 14,
  constitution: 13,
  intelligence: 12,
  wisdom: 10,
  charisma: 8,
};

function makeCharacter(overrides: Partial<Parameters<typeof Character.create>[0]> = {}): Character {
  return Character.create({
    userId: OWNER_ID,
    name: 'Frodo',
    raceAssetId: '550e8400-e29b-41d4-a716-000000000001',
    classAssetId: '550e8400-e29b-41d4-a716-000000000002',
    stats: defaultStats,
    hitPoints: 10,
    ...overrides,
  });
}

describe('UpdateCharacterUseCase', () => {
  const mockCharacterRepo = {
    findById: mock(() => Promise.resolve(null)),
    save: mock(() => Promise.resolve()),
  };
  const mockMemberRepo = {
    findByUserAndCampaign: mock(() => Promise.resolve(null)),
  };

  const useCase = new UpdateCharacterUseCase(mockCharacterRepo as any, mockMemberRepo as any);

  beforeEach(() => {
    const char = makeCharacter();
    mockCharacterRepo.findById.mockImplementation(() => Promise.resolve(char));
    mockCharacterRepo.save.mockImplementation(() => Promise.resolve());
    mockMemberRepo.findByUserAndCampaign.mockImplementation(() => Promise.resolve(null));
  });

  it('should allow owner to update name and backstory', async () => {
    const result = await useCase.execute({
      id: CHARACTER_UUID,
      requesterId: OWNER_ID,
      name: 'Samwise',
      backstory: 'A gardener from the Shire',
    });

    expect(result.isSuccess).toBe(true);
    expect(result.value.name).toBe('Samwise');
    expect(result.value.backstory).toBe('A gardener from the Shire');
    expect(mockCharacterRepo.save).toHaveBeenCalled();
  });

  it('should fail when character not found', async () => {
    mockCharacterRepo.findById.mockImplementation(() => Promise.resolve(null));

    const result = await useCase.execute({
      id: CHARACTER_UUID,
      requesterId: OWNER_ID,
      name: 'New Name',
    });

    expect(result.isFailure).toBe(true);
    expect(result.error).toBe(CharacterError.NOT_FOUND);
  });

  it('should fail when requester is neither owner nor DM', async () => {
    const result = await useCase.execute({
      id: CHARACTER_UUID,
      requesterId: 'random-user-999',
      name: 'Hacked Name',
    });

    expect(result.isFailure).toBe(true);
    expect(result.error).toBe(CharacterError.UNAUTHORIZED);
  });

  it('should allow DM to update stats and level for campaign character', async () => {
    const CAMPAIGN_UUID = '550e8400-e29b-41d4-a716-446655440099';
    const charWithCampaign = makeCharacter({ campaignId: CAMPAIGN_UUID });
    mockCharacterRepo.findById.mockImplementation(() => Promise.resolve(charWithCampaign));
    mockMemberRepo.findByUserAndCampaign.mockImplementation(() =>
      Promise.resolve({ role: 'dm', userId: DM_ID }),
    );

    const result = await useCase.execute({
      id: CHARACTER_UUID,
      requesterId: DM_ID,
      level: 5,
      hitPoints: 40,
    });

    expect(result.isSuccess).toBe(true);
    expect(result.value.level).toBe(5);
    expect(result.value.hitPoints).toBe(40);
  });

  it('should fail when DM provides out-of-range stats', async () => {
    const CAMPAIGN_UUID = '550e8400-e29b-41d4-a716-446655440099';
    const charWithCampaign = makeCharacter({ campaignId: CAMPAIGN_UUID });
    mockCharacterRepo.findById.mockImplementation(() => Promise.resolve(charWithCampaign));
    mockMemberRepo.findByUserAndCampaign.mockImplementation(() =>
      Promise.resolve({ role: 'dm', userId: DM_ID }),
    );

    const result = await useCase.execute({
      id: CHARACTER_UUID,
      requesterId: DM_ID,
      stats: { strength: 99, dexterity: 14, constitution: 13, intelligence: 12, wisdom: 10, charisma: 8 },
    });

    expect(result.isFailure).toBe(true);
    expect(result.error).toBe(CharacterError.INVALID_STATS);
  });

  it('should allow free character owner to act as DM', async () => {
    // No campaignId = owner is their own DM
    const result = await useCase.execute({
      id: CHARACTER_UUID,
      requesterId: OWNER_ID,
      level: 3,
      hitPoints: 25,
    });

    expect(result.isSuccess).toBe(true);
    expect(result.value.level).toBe(3);
  });
});
