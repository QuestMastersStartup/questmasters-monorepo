import {
  AssetRepository,
  ASSET_REPOSITORY,
} from '../../domain/repositories/asset.repository';
import { resolveChoice } from '@questmasters/dnd-rules';
import { Choice } from '@questmasters/dnd-rules';
import { UUID } from '../../../shared/domain/value-objects/uuid.vo';

interface ResolutionRequest {
  packId: string;
  assetType: string;
  assetIndex: string;
  selections: Record<string, string[]>;
}

export class ResolveAssetUseCase {
  constructor(private readonly assetRepository: AssetRepository) {}

  async execute(request: ResolutionRequest) {
    const asset = await this.assetRepository.findByPackAndTypeAndIndex(
      UUID.fromString(request.packId),
      request.assetType as any,
      request.assetIndex,
    );

    if (!asset) {
      throw new Error(
        `Asset ${request.assetIndex} not found in pack ${request.packId}`,
      );
    }

    const resolvedFeatures: any[] = [];
    const warnings: string[] = [];
    const assetData = asset.data.toObject() as any;

    // 1. Proficiency Choices (Common in Classes)
    if (assetData.proficiency_choices) {
      assetData.proficiency_choices.forEach((choice: Choice, idx: number) => {
        const selectionKey = `proficiency_choices_${idx}`;
        const userSelection = request.selections[selectionKey];

        if (userSelection) {
          const result = resolveChoice(choice, userSelection);
          resolvedFeatures.push(...result.features);
          warnings.push(...result.warnings);
        }
      });
    }

    // 2. Starting Equipment Options
    if (assetData.starting_equipment_options) {
      assetData.starting_equipment_options.forEach(
        (choice: Choice, idx: number) => {
          const selectionKey = `starting_equipment_options_${idx}`;
          const userSelection = request.selections[selectionKey];

          if (userSelection) {
            const result = resolveChoice(choice, userSelection);
            resolvedFeatures.push(...result.features);
            warnings.push(...result.warnings);
          }
        },
      );
    }

    return {
      original_asset: {
        name: asset.name,
        index: asset.index,
        type: asset.type,
      },
      resolved_features: resolvedFeatures,
      warnings: warnings,
    };
  }
}
