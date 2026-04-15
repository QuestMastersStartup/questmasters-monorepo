import { describe, expect, it, mock } from 'bun:test';
import { CreateCampaignUseCase } from './create-campaign.use-case';

describe('CreateCampaignUseCase', () => {
  const mockCampaignRepo = {
    save: mock(() => Promise.resolve()),
  };

  const useCase = new CreateCampaignUseCase(mockCampaignRepo as any);

  it('should create a campaign with required fields', async () => {
    const result = await useCase.execute({
      name: 'Lost Mine of Phandelver',
      dmId: 'user-dm-123',
    });

    expect(result.isSuccess).toBe(true);
    expect(result.value.name).toBe('Lost Mine of Phandelver');
    expect(result.value.dmId).toBe('user-dm-123');
    expect(result.value.status.toString()).toBe('active');
    expect(mockCampaignRepo.save).toHaveBeenCalled();
  });

  it('should default system to dnd-5e-2014 when not provided', async () => {
    const result = await useCase.execute({
      name: 'Test Campaign',
      dmId: 'user-123',
    });

    expect(result.isSuccess).toBe(true);
    expect(result.value.system.toString()).toBe('dnd-5e-2014');
  });

  it('should create campaign with all optional fields', async () => {
    const result = await useCase.execute({
      name: 'Waterdeep Dragon Heist',
      description: 'A grand heist in Waterdeep',
      system: 'dnd-5e-2024',
      coverImageUrl: 'https://example.com/cover.jpg',
      dmId: 'user-dm-456',
    });

    expect(result.isSuccess).toBe(true);
    expect(result.value.description).toBe('A grand heist in Waterdeep');
    expect(result.value.system.toString()).toBe('dnd-5e-2024');
    expect(result.value.coverImageUrl).toBe('https://example.com/cover.jpg');
  });

  it('should create campaign with installed packs', async () => {
    const packId = '550e8400-e29b-41d4-a716-446655440000';
    const result = await useCase.execute({
      name: 'Campaign with Packs',
      dmId: 'user-dm-789',
      installedPackIds: [packId],
    });

    expect(result.isSuccess).toBe(true);
    expect(result.value.installedPackIds).toHaveLength(1);
    expect(result.value.installedPackIds[0].toString()).toBe(packId);
  });
});
