import { describe, expect, it, mock } from 'bun:test';
import { DeletePackUseCase } from './delete-pack.use-case';
import { ContentPack } from '../../domain/entities/content-pack.entity';
import { PackError } from '../errors';

describe('DeletePackUseCase', () => {
  const mockPackRepo = {
    findBySlug: mock(),
    delete: mock(),
  };

  const useCase = new DeletePackUseCase(mockPackRepo as any);

  it('should delete a pack if it exists', async () => {
    const pack = ContentPack.create({
      slug: 'to-delete',
      name: 'Delete',
      description: 'Desc',
      version: '1.0.0',
      type: 'srd',
      system: 'universal',
      creatorId: 'xyz',
    });

    mockPackRepo.findBySlug.mockResolvedValue(pack);
    mockPackRepo.delete.mockResolvedValue(void 0);

    const result = await useCase.execute('to-delete');

    expect(result.isSuccess).toBe(true);
    expect(mockPackRepo.delete).toHaveBeenCalledWith(pack.id);
  });

  it('should return NOT_FOUND error if pack does not exist', async () => {
    mockPackRepo.findBySlug.mockResolvedValue(null);

    const result = await useCase.execute('none');

    expect(result.isFailure).toBe(true);
    expect(result.error).toBe(PackError.NOT_FOUND);
  });
});
