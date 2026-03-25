import { describe, expect, it, mock } from 'bun:test';
import { GetUserProfileUseCase } from './get-user-profile.use-case';
import { UserProfile } from '../../domain/entities/user-profile.entity';

describe('GetUserProfileUseCase', () => {
  const mockRepo = {
    findById: mock(),
    save: mock(),
  };

  const useCase = new GetUserProfileUseCase(mockRepo as any);

  it('should return existing profile', async () => {
    const profile = UserProfile.create('user-1');
    mockRepo.findById.mockResolvedValue(profile);

    const result = await useCase.execute('user-1');

    expect(result).toBe(profile);
    expect(mockRepo.findById).toHaveBeenCalledWith('user-1');
    expect(mockRepo.save).not.toHaveBeenCalled();
  });

  it('should create and save a new profile if not found', async () => {
    mockRepo.findById.mockResolvedValue(null);
    mockRepo.save.mockResolvedValue(void 0);

    const result = await useCase.execute('new-user');

    expect(result.id).toBe('new-user');
    expect(mockRepo.findById).toHaveBeenCalledWith('new-user');
    expect(mockRepo.save).toHaveBeenCalled();
  });
});
