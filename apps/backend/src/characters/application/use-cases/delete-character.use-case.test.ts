import { describe, expect, it, mock, beforeEach } from 'bun:test';
import { DeleteCharacterUseCase } from './delete-character.use-case';
import { Character } from '../../domain/entities/character.entity';
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
    name: 'Bilbo',
    raceAssetId: '550e8400-e29b-41d4-a716-000000000001',
    classAssetId: '550e8400-e29b-41d4-a716-000000000002',
    stats: defaultStats,
    hitPoints: 8,
    ...overrides,
  });
}

describe('DeleteCharacterUseCase', () => {
  const mockCharacterRepo = {
    findById: mock(() => Promise.resolve(null)),
    delete: mock(() => Promise.resolve()),
  };
  const mockMemberRepo = {
    findByUserAndCampaign: mock(() => Promise.resolve(null)),
  };

  const useCase = new DeleteCharacterUseCase(mockCharacterRepo as any, mockMemberRepo as any);

  beforeEach(() => {
    mockCharacterRepo.findById.mockClear();
    mockCharacterRepo.delete.mockClear();
    mockMemberRepo.findByUserAndCampaign.mockClear();
    mockCharacterRepo.findById.mockImplementation(() => Promise.resolve(makeCharacter()));
    mockCharacterRepo.delete.mockImplementation(() => Promise.resolve());
    mockMemberRepo.findByUserAndCampaign.mockImplementation(() => Promise.resolve(null));
  });

  it('should delete character when requester is the owner', async () => {
    const result = await useCase.execute({
      id: CHARACTER_UUID,
      requesterId: OWNER_ID,
    });

    expect(result.isSuccess).toBe(true);
    expect(mockCharacterRepo.delete).toHaveBeenCalled();
  });

  it('should fail when character not found', async () => {
    mockCharacterRepo.findById.mockImplementation(() => Promise.resolve(null));

    const result = await useCase.execute({
      id: CHARACTER_UUID,
      requesterId: OWNER_ID,
    });

    expect(result.isFailure).toBe(true);
    expect(result.error).toBe(CharacterError.NOT_FOUND);
  });

  it('should fail when requester is neither owner nor DM', async () => {
    const result = await useCase.execute({
      id: CHARACTER_UUID,
      requesterId: 'random-user-999',
    });

    expect(result.isFailure).toBe(true);
    expect(result.error).toBe(CharacterError.UNAUTHORIZED);
    expect(mockCharacterRepo.delete).not.toHaveBeenCalled();
  });

  it('should allow DM to delete a campaign character', async () => {
    const CAMPAIGN_UUID = '550e8400-e29b-41d4-a716-446655440099';
    const charWithCampaign = makeCharacter({ campaignId: CAMPAIGN_UUID });
    mockCharacterRepo.findById.mockImplementation(() => Promise.resolve(charWithCampaign));
    mockMemberRepo.findByUserAndCampaign.mockImplementation(() =>
      Promise.resolve({ role: 'dm', userId: DM_ID }),
    );

    const result = await useCase.execute({
      id: CHARACTER_UUID,
      requesterId: DM_ID,
    });

    expect(result.isSuccess).toBe(true);
    expect(mockCharacterRepo.delete).toHaveBeenCalled();
  });

  it('should fail with invalid UUID', async () => {
    const result = await useCase.execute({
      id: 'not-a-uuid',
      requesterId: OWNER_ID,
    });

    expect(result.isFailure).toBe(true);
    expect(result.error).toBe(CharacterError.NOT_FOUND);
  });
});
