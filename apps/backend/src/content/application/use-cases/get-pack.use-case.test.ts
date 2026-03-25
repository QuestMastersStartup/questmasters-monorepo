import { describe, expect, it, mock } from 'bun:test';
import { GetPackUseCase } from './get-pack.use-case';
import { ContentPack } from '../../domain/entities/content-pack.entity';
import { PackError } from '../errors';

describe('GetPackUseCase', () => {
  const mockPackRepo = {
    findBySlug: mock(),
    existsBySlug: mock(),
    save: mock(),
    findAll: mock(),
    findById: mock(),
    delete: mock(),
  };

  const mockAssetRepo = {
    findAllByPack: mock(),
    findByPackAndIndex: mock(),
    save: mock(),
    delete: mock(),
    findById: mock(),
  };

  const useCase = new GetPackUseCase(mockPackRepo as any, mockAssetRepo as any);

  it('should return a pack and its assets if it exists', async () => {
    const pack = ContentPack.create({
      slug: 'test-pack',
      name: 'Test',
      description: 'Desc',
      version: '1.0.0',
      type: 'srd',
      system: 'universal',
      creatorId: 'xyz',
    });

    mockPackRepo.findBySlug.mockResolvedValue(pack);
    mockAssetRepo.findAllByPack.mockResolvedValue([]);

    const result = await useCase.execute('test-pack');

    expect(result.isSuccess).toBe(true);
    expect(result.value.pack).toBe(pack);
    expect(result.value.assets).toEqual([]);
    expect(mockPackRepo.findBySlug).toHaveBeenCalled();
  });

  it('should return NOT_FOUND if pack does not exist', async () => {
    mockPackRepo.findBySlug.mockResolvedValue(null);

    const result = await useCase.execute('none');

    expect(result.isFailure).toBe(true);
    expect(result.error).toBe(PackError.NOT_FOUND);
  });
});
