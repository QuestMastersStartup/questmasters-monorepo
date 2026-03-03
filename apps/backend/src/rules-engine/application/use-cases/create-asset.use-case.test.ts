import { describe, expect, it, mock } from 'bun:test';
import { CreateAssetUseCase } from './create-asset.use-case';
import { Result } from '@shared/application/result';
import { AssetError } from '../errors';
import { ContentPack } from '../../domain/entities/content-pack.entity';
import { UUID } from '@shared/domain/value-objects/uuid.vo';

describe('CreateAssetUseCase', () => {
  const mockAssetRepo = {
    existsByPackAndTypeAndIndex: mock(() => Promise.resolve(false)),
    save: mock(() => Promise.resolve()),
  };

  const pack = ContentPack.create({
    slug: 'test-pack',
    name: 'Test',
    type: 'srd',
    system: 'dnd-5e-2014',
    creatorId: UUID.generate().toString(),
  });

  const mockPackRepo = {
    findBySlug: mock(() => Promise.resolve(pack)),
  };

  const useCase = new CreateAssetUseCase(
    mockAssetRepo as any,
    mockPackRepo as any,
  );

  it('should create an asset successfully', async () => {
    const dto = {
      type: 'class',
      index: 'fighter',
      data: { name: 'Fighter', hp: 10 },
    };

    const result = await useCase.execute('test-pack', dto);

    expect(result.isSuccess).toBe(true);
    expect(mockAssetRepo.save).toHaveBeenCalled();
  });

  it('should fail if pack is not found', async () => {
    mockPackRepo.findBySlug.mockImplementationOnce(() =>
      Promise.resolve(null as any),
    );

    const result = await useCase.execute('non-existent', {});

    expect(result.isSuccess).toBe(false);
    expect(result.error).toBe(AssetError.PACK_NOT_FOUND);
  });

  it('should fail if asset already exists in pack', async () => {
    mockAssetRepo.existsByPackAndTypeAndIndex.mockImplementationOnce(() =>
      Promise.resolve(true),
    );

    const result = await useCase.execute('test-pack', {
      type: 'class',
      index: 'existing',
    });

    expect(result.isSuccess).toBe(false);
    expect(result.error).toBe(AssetError.ALREADY_EXISTS);
  });
});
