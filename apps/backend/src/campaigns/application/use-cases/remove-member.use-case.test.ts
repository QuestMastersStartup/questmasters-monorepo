import { describe, expect, it, mock, beforeEach } from 'bun:test';
import { RemoveMemberUseCase } from './remove-member.use-case';
import { CampaignMember } from '../../domain/entities/campaign-member.entity';
import { UUID } from '@shared/domain/value-objects/uuid.vo';
import { CampaignError } from '../errors';

const CAMPAIGN_UUID = '550e8400-e29b-41d4-a716-446655440000';
const USER_ID = 'user-player-123';
const DM_USER_ID = 'user-dm-456';

function makePlayerMember(): CampaignMember {
  return CampaignMember.create(UUID.fromString(CAMPAIGN_UUID), USER_ID, 'player');
}

function makeDmMember(): CampaignMember {
  return CampaignMember.create(UUID.fromString(CAMPAIGN_UUID), DM_USER_ID, 'dm');
}

describe('RemoveMemberUseCase', () => {
  const mockMemberRepo = {
    findByUserAndCampaign: mock(() => Promise.resolve(null)),
    delete: mock(() => Promise.resolve()),
  };

  const useCase = new RemoveMemberUseCase(mockMemberRepo as any);

  beforeEach(() => {
    mockMemberRepo.findByUserAndCampaign.mockClear();
    mockMemberRepo.delete.mockClear();
    mockMemberRepo.findByUserAndCampaign.mockImplementation(() =>
      Promise.resolve(makePlayerMember()),
    );
    mockMemberRepo.delete.mockImplementation(() => Promise.resolve());
  });

  it('should remove a player member successfully', async () => {
    const result = await useCase.execute({
      campaignId: CAMPAIGN_UUID,
      userId: USER_ID,
    });

    expect(result.isSuccess).toBe(true);
    expect(mockMemberRepo.delete).toHaveBeenCalled();
  });

  it('should fail when member not found', async () => {
    mockMemberRepo.findByUserAndCampaign.mockImplementation(() => Promise.resolve(null));

    const result = await useCase.execute({
      campaignId: CAMPAIGN_UUID,
      userId: USER_ID,
    });

    expect(result.isFailure).toBe(true);
    expect(result.error).toBe(CampaignError.NOT_FOUND);
  });

  it('should fail when trying to remove the DM', async () => {
    mockMemberRepo.findByUserAndCampaign.mockImplementation(() =>
      Promise.resolve(makeDmMember()),
    );

    const result = await useCase.execute({
      campaignId: CAMPAIGN_UUID,
      userId: DM_USER_ID,
    });

    expect(result.isFailure).toBe(true);
    expect(result.error).toBe(CampaignError.UNAUTHORIZED);
    expect(mockMemberRepo.delete).not.toHaveBeenCalled();
  });

  it('should fail with invalid campaign UUID', async () => {
    const result = await useCase.execute({
      campaignId: 'bad-uuid',
      userId: USER_ID,
    });

    expect(result.isFailure).toBe(true);
    expect(result.error).toBe(CampaignError.NOT_FOUND);
  });
});
