import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import {
  AssetRepository,
  ASSET_REPOSITORY,
} from '../../domain/repositories/asset.repository';
import { AssetType } from '@questmasters/dnd-rules';
import { resolveChoice } from '@questmasters/dnd-rules';
import { Choice } from '@questmasters/dnd-rules'; // Need to ensure Choice is exported or mapped
import { UUID } from '../../../shared/domain/value-objects/uuid.vo';
import { AssetTypeValue } from '../../domain/value-objects/asset-type.vo';

interface ResolutionRequest {
  packId: string;
  assetType: string;
  assetIndex: string;
  selections: Record<string, string[]>; // choice_index -> selected_ids
}

@Injectable()
export class ResolveAssetUseCase {
  constructor(
    @Inject(ASSET_REPOSITORY) private readonly assetRepository: AssetRepository,
  ) {}

  async execute(request: ResolutionRequest) {
    const asset = await this.assetRepository.findByPackAndTypeAndIndex(
      UUID.fromString(request.packId),
      // Validate asset type. For now casting, but ideally use domain VO validation
      request.assetType as any,
      request.assetIndex,
    );

    if (!asset) {
      throw new NotFoundException(
        `Asset ${request.assetIndex} not found in pack ${request.packId}`,
      );
    }

    const resolvedFeatures: any[] = [];
    const warnings: string[] = [];
    const assetData = asset.data.toObject() as any;

    // Detect choices in the asset data
    // Different asset types store choices differently.
    // e.g. Class uses 'proficiency_choices', 'starting_equipment_options'
    // This part effectively "Flattening" logic specific to the asset structure

    // 1. Proficiency Choices (Common in Classes)
    if (assetData.proficiency_choices) {
      // Ideally, the client sends selections keyed by the choice index (if array) or some ID.
      // The SRD 'proficiency_choices' is an array.
      // Let's assume request.selections['proficiency_choices_0'] maps to the first choice block.

      assetData.proficiency_choices.forEach((choice: Choice, idx: number) => {
        const selectionKey = `proficiency_choices_${idx}`;
        const userSelection = request.selections[selectionKey];

        if (userSelection) {
          const result = resolveChoice(choice, userSelection);
          resolvedFeatures.push(...result.features);
          warnings.push(...result.warnings);
        } else {
          // If mandatory choice is missing, we could warn, or just ignore for "preview" mode.
          // warnings.push(`Missing selection for ${selectionKey}`);
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

    // TODO: Add more handlers for Feature choices, Subclass choices, etc.

    return {
      original_asset: {
        name: asset.name,
        index: asset.index,
        type: asset.type,
      },
      resolved_features: resolvedFeatures,
      warnings: warnings,
      // Pass-through static data
      // ...
    };
  }
}
