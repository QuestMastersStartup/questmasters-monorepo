import { describe, expect, it, mock } from 'bun:test';
import { ResolveAssetUseCase } from './resolve-asset.use-case';
import { Asset } from '../../domain/entities/asset.entity';
import { AssetType } from '../../domain/value-objects/asset-type.vo';
import { UUID } from '@shared/domain/value-objects/uuid.vo';

describe('ResolveAssetUseCase', () => {
  const packId = UUID.generate();
  const asset = Asset.reconstruct({
    id: UUID.generate().toString(),
    packId: packId.toString(),
    type: 'class',
    index: 'fighter',
    name: 'Fighter',
    data: {
      proficiency_choices: [
        {
          choose: 2,
          type: 'proficiencies',
          from: {
            option_set_type: 'options_array',
            options: [
              {
                option_type: 'reference',
                item: { index: 'skill-athletics', name: 'Athletics', url: '' },
              },
              {
                option_type: 'reference',
                item: { index: 'skill-acrobatics', name: 'Acrobatics', url: '' },
              },
            ],
          },
        },
      ],
    },
    compatibleWith: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  const mockAssetRepo = {
    findByPackAndTypeAndIndex: mock(() => Promise.resolve(asset)),
  };

  const useCase = new ResolveAssetUseCase(mockAssetRepo as any);

  it('should resolve an asset with selections', async () => {
    const request = {
      packId: packId.toString(),
      assetType: 'class',
      assetIndex: 'fighter',
      selections: {
        proficiency_choices_0: ['skill-athletics', 'skill-acrobatics'],
      },
    };

    const result = await useCase.execute(request);

    expect(result.original_asset.name).toBe('Fighter');
    expect(result.resolved_features.length).toBeGreaterThan(0);
    expect(result.resolved_features[0].index).toBe('skill-athletics');
  });

  it('should throw error if asset not found', async () => {
    mockAssetRepo.findByPackAndTypeAndIndex.mockImplementationOnce(() =>
      Promise.resolve(null as any),
    );

    expect(
      useCase.execute({
        packId: packId.toString(),
        assetType: 'class',
        assetIndex: 'missing',
        selections: {},
      }),
    ).rejects.toThrow();
  });
});
