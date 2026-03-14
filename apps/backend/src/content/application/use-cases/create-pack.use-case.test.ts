import { describe, expect, it, mock } from 'bun:test';
import { CreatePackUseCase } from './create-pack.use-case';
import { Result } from '@shared/application/result';
import { PackError } from '../errors';

describe('CreatePackUseCase', () => {
  const mockPackRepo = {
    existsBySlug: mock(() => Promise.resolve(false)),
    save: mock(() => Promise.resolve()),
  };

  const mockCreateAssetUseCase = {
    execute: mock(() => Promise.resolve(Result.ok({}))),
  };

  const useCase = new CreatePackUseCase(
    mockPackRepo as any,
    mockCreateAssetUseCase as any,
  );

  it('should create a pack successfully', async () => {
    const dto = {
      slug: 'test-pack',
      name: 'Test Pack',
      type: 'srd',
      system: 'dnd-5e-2024',
      creatorId: 'creator-123',
    };

    const result = await useCase.execute(dto);

    expect(result.isSuccess).toBe(true);
    expect(mockPackRepo.existsBySlug).toHaveBeenCalled();
    expect(mockPackRepo.save).toHaveBeenCalled();
  });

  it('should fail if slug already exists', async () => {
    mockPackRepo.existsBySlug.mockImplementation(() => Promise.resolve(true));

    const dto = { slug: 'existing' };
    const result = await useCase.execute(dto);

    expect(result.isSuccess).toBe(false);
    expect(result.error).toBe(PackError.SLUG_ALREADY_EXISTS);
  });
});
