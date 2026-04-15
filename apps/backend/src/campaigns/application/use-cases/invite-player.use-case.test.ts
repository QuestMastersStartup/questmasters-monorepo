import { describe, expect, it, mock, beforeEach } from 'bun:test';
import { InvitePlayerUseCase } from './invite-player.use-case';
import { Campaign } from '../../domain/entities/campaign.entity';
import { CampaignError } from '../errors';

const CAMPAIGN_UUID = '550e8400-e29b-41d4-a716-446655440000';
const USER_ID = 'user-player-123';

function makeCampaign(): Campaign {
  return Campaign.create({
    name: 'Test Campaign',
    dmId: 'dm-user-1',
    system: 'dnd-5e-2014',
  });
}

describe('InvitePlayerUseCase', () => {
  const mockCampaignRepo = {
    findById: mock(() => Promise.resolve(null)),
  };
  const mockMemberRepo = {
    findByUserAndCampaign: mock(() => Promise.resolve(null)),
    save: mock(() => Promise.resolve()),
  };
  const mockUserRepo = {
    findById: mock(() => Promise.resolve({ id: USER_ID })),
  };

  const useCase = new InvitePlayerUseCase(
    mockCampaignRepo as any,
    mockMemberRepo as any,
    mockUserRepo as any,
  );

  beforeEach(() => {
    mockCampaignRepo.findById.mockImplementation(() => Promise.resolve(makeCampaign()));
    mockMemberRepo.findByUserAndCampaign.mockImplementation(() => Promise.resolve(null));
    mockMemberRepo.save.mockImplementation(() => Promise.resolve());
    mockUserRepo.findById.mockImplementation(() => Promise.resolve({ id: USER_ID }));
  });

  it('should invite a player successfully', async () => {
    const result = await useCase.execute({
      campaignId: CAMPAIGN_UUID,
      userId: USER_ID,
    });

    expect(result.isSuccess).toBe(true);
    expect(result.value.role).toBe('player');
    expect(result.value.userId).toBe(USER_ID);
    expect(mockMemberRepo.save).toHaveBeenCalled();
  });

  it('should fail when campaign not found', async () => {
    mockCampaignRepo.findById.mockImplementation(() => Promise.resolve(null));

    const result = await useCase.execute({
      campaignId: CAMPAIGN_UUID,
      userId: USER_ID,
    });

    expect(result.isFailure).toBe(true);
    expect(result.error).toBe(CampaignError.NOT_FOUND);
  });

  it('should fail when user not found', async () => {
    mockUserRepo.findById.mockImplementation(() => Promise.resolve(null));

    const result = await useCase.execute({
      campaignId: CAMPAIGN_UUID,
      userId: USER_ID,
    });

    expect(result.isFailure).toBe(true);
    expect(result.error).toBe(CampaignError.NOT_FOUND);
  });

  it('should fail when user is already a member', async () => {
    mockMemberRepo.findByUserAndCampaign.mockImplementation(() =>
      Promise.resolve({ userId: USER_ID, role: 'player' }),
    );

    const result = await useCase.execute({
      campaignId: CAMPAIGN_UUID,
      userId: USER_ID,
    });

    expect(result.isFailure).toBe(true);
    expect(result.error).toBe(CampaignError.ALREADY_EXISTS);
  });

  it('should fail with invalid campaign UUID', async () => {
    const result = await useCase.execute({
      campaignId: 'not-a-uuid',
      userId: USER_ID,
    });

    expect(result.isFailure).toBe(true);
    expect(result.error).toBe(CampaignError.NOT_FOUND);
  });
});
