import { describe, expect, it, mock, beforeEach } from 'bun:test';
import { DeleteCampaignUseCase } from './delete-campaign.use-case';
import { CampaignError } from '../errors';

const VALID_UUID = '550e8400-e29b-41d4-a716-446655440000';

describe('DeleteCampaignUseCase', () => {
  const mockCampaignRepo = {
    exists: mock(() => Promise.resolve(true)),
    delete: mock(() => Promise.resolve()),
  };

  const useCase = new DeleteCampaignUseCase(mockCampaignRepo as any);

  beforeEach(() => {
    mockCampaignRepo.exists.mockClear();
    mockCampaignRepo.delete.mockClear();
    mockCampaignRepo.exists.mockImplementation(() => Promise.resolve(true));
    mockCampaignRepo.delete.mockImplementation(() => Promise.resolve());
  });

  it('should delete an existing campaign', async () => {
    const result = await useCase.execute(VALID_UUID);

    expect(result.isSuccess).toBe(true);
    expect(mockCampaignRepo.exists).toHaveBeenCalled();
    expect(mockCampaignRepo.delete).toHaveBeenCalled();
  });

  it('should fail when campaign does not exist', async () => {
    mockCampaignRepo.exists.mockImplementation(() => Promise.resolve(false));

    const result = await useCase.execute(VALID_UUID);

    expect(result.isFailure).toBe(true);
    expect(result.error).toBe(CampaignError.NOT_FOUND);
    expect(mockCampaignRepo.delete).not.toHaveBeenCalled();
  });

  it('should fail with invalid UUID', async () => {
    const result = await useCase.execute('not-a-valid-uuid');

    expect(result.isFailure).toBe(true);
    expect(result.error).toBe(CampaignError.NOT_FOUND);
  });
});
