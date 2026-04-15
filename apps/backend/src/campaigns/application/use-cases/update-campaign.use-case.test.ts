import { describe, expect, it, mock, beforeEach } from 'bun:test';
import { UpdateCampaignUseCase } from './update-campaign.use-case';
import { Campaign } from '../../domain/entities/campaign.entity';
import { CampaignError } from '../errors';

const VALID_UUID = '550e8400-e29b-41d4-a716-446655440000';

function makeCampaign(overrides: Partial<Parameters<typeof Campaign.create>[0]> = {}): Campaign {
  return Campaign.create({
    name: 'Original Name',
    dmId: 'dm-user-1',
    system: 'dnd-5e-2014',
    ...overrides,
  });
}

describe('UpdateCampaignUseCase', () => {
  let campaign: Campaign;
  const mockCampaignRepo = {
    findById: mock(() => Promise.resolve(null)),
    save: mock(() => Promise.resolve()),
  };

  const useCase = new UpdateCampaignUseCase(mockCampaignRepo as any);

  beforeEach(() => {
    campaign = makeCampaign();
    mockCampaignRepo.findById.mockImplementation(() => Promise.resolve(campaign));
    mockCampaignRepo.save.mockImplementation(() => Promise.resolve());
  });

  it('should update campaign name', async () => {
    const result = await useCase.execute(VALID_UUID, { name: 'New Name' });

    expect(result.isSuccess).toBe(true);
    expect(result.value.name).toBe('New Name');
    expect(mockCampaignRepo.save).toHaveBeenCalled();
  });

  it('should update campaign description', async () => {
    const result = await useCase.execute(VALID_UUID, {
      description: 'An updated description',
    });

    expect(result.isSuccess).toBe(true);
    expect(result.value.description).toBe('An updated description');
  });

  it('should fail when campaign not found', async () => {
    mockCampaignRepo.findById.mockImplementation(() => Promise.resolve(null));

    const result = await useCase.execute(VALID_UUID, { name: 'Whatever' });

    expect(result.isFailure).toBe(true);
    expect(result.error).toBe(CampaignError.NOT_FOUND);
  });

  it('should fail with invalid UUID', async () => {
    const result = await useCase.execute('not-a-uuid', { name: 'Whatever' });

    expect(result.isFailure).toBe(true);
    expect(result.error).toBe(CampaignError.NOT_FOUND);
  });

  it('should install packs when provided', async () => {
    const packId = '550e8400-e29b-41d4-a716-446655440001';
    const result = await useCase.execute(VALID_UUID, {
      installedPackIds: [packId],
    });

    expect(result.isSuccess).toBe(true);
    expect(result.value.installedPackIds.map(id => id.toString())).toContain(packId);
  });
});
