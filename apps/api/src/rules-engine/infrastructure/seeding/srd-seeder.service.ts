import {
  Injectable,
  Inject,
  OnApplicationBootstrap,
  Logger,
} from '@nestjs/common';
import {
  ContentPackRepository,
  CONTENT_PACK_REPOSITORY,
} from '../../domain/repositories/content-pack.repository';
import {
  AssetRepository,
  ASSET_REPOSITORY,
} from '../../domain/repositories/asset.repository';
import { ContentPack } from '../../domain/entities/content-pack.entity';

import { SystemTypeValue } from '../../domain/value-objects/system-type.vo';
import { PackTypeValue } from '../../domain/value-objects/pack-type.vo';
import {
  AssetType,
  AssetTypeValue,
} from '../../domain/value-objects/asset-type.vo';
import { UUID } from '@shared/domain/value-objects/uuid.vo';
import { Slug } from '@shared/domain/value-objects/slug.vo';
import { Asset } from '@rules-engine/domain/entities/asset.entity';

@Injectable()
export class SrdSeederService implements OnApplicationBootstrap {
  private readonly logger = new Logger(SrdSeederService.name);

  // Hardcoded Admin ID for system content (Valid UUID v4)
  private readonly SYSTEM_CREATOR_ID = '550e8400-e29b-41d4-a716-446655440000';

  constructor(
    @Inject(CONTENT_PACK_REPOSITORY)
    private readonly packRepository: ContentPackRepository,
    @Inject(ASSET_REPOSITORY)
    private readonly assetRepository: AssetRepository,
  ) {}

  async onApplicationBootstrap() {
    this.logger.log('Checking for SRD content packs...');

    // D&D 3.5 - REMOVED per user request
    // await this.seedPackAndAssets(...)

    // D&D 5e (2014)
    await this.seedPackAndAssets(
      'srd-dnd-5e-2014',
      'System Reference Document 5.1 (2014)',
      'Official SRD content for Dungeons & Dragons 5th Edition (2014 rules).',
      '5.1',
      SystemTypeValue.DND_5E_2014,
    );

    // D&D 5e (2024)
    await this.seedPackAndAssets(
      'srd-dnd-5e-2024',
      'Free Rules (2024)',
      'Official Free Rules content for Dungeons & Dragons (2024 revision).',
      '2024.1',
      SystemTypeValue.DND_5E_2024,
    );
  }

  private async seedPackAndAssets(
    slugStr: string,
    name: string,
    description: string,
    version: string,
    systemVal: SystemTypeValue,
    // assetsData argument is removed, will read from disk
  ) {
    const slug = Slug.create(slugStr);
    const exists = await this.packRepository.existsBySlug(slug);

    let packId: UUID;

    if (!exists) {
      this.logger.log(`Seeding Pack: ${name} (${systemVal})`);
      const pack = ContentPack.create({
        slug: slugStr,
        name,
        description,
        version,
        type: PackTypeValue.SRD,
        system: systemVal,
        creatorId: this.SYSTEM_CREATOR_ID,
      });
      await this.packRepository.save(pack);
      packId = pack.id;
    } else {
      const pack = await this.packRepository.findBySlug(slug);
      if (!pack) return;
      packId = pack.id;
    }

    // Load assets from JSON files in the corresponding system folder
    await this.loadAssetsFromDisk(packId, systemVal, name);
  }

  private async loadAssetsFromDisk(
    packId: UUID,
    systemVal: string,
    packName: string,
  ) {
    // Dynamic import to avoid build issues if fs/path not standard in some envs (but Node is fine)
    const fs = await import('fs/promises');
    const path = await import('path');

    const dataDir = path.join(__dirname, 'data', systemVal); // Resolved relative to this file in dist folder

    try {
      const files = await fs.readdir(dataDir);

      for (const file of files) {
        if (!file.endsWith('.json')) continue;

        const assetTypeStr = this.mapFilenameToAssetType(file);
        if (!assetTypeStr) {
          this.logger.warn(`Skipping file ${file}: Could not map to AssetType`);
          continue;
        }

        const filePath = path.join(dataDir, file);
        const fileContent = await fs.readFile(filePath, 'utf-8');
        const assets: any[] = JSON.parse(fileContent);

        this.logger.log(
          `Seeding ${assets.length} assets from ${file} (${assetTypeStr}) for ${packName}`,
        );

        for (const assetData of assets) {
          try {
            const type = AssetType.create(assetTypeStr);
            const assetExists =
              await this.assetRepository.existsByPackAndTypeAndIndex(
                packId,
                type,
                assetData.index,
              );

            if (!assetExists) {
              const { index, name: _name, ...rest } = assetData;
              void _name;

              // Construct name if missing (e.g. for Levels)
              let assetName = assetData.name;
              if (!assetName) {
                if (
                  assetTypeStr === (AssetTypeValue.LEVEL as string) &&
                  assetData.level &&
                  assetData.class
                ) {
                  assetName = `${assetData.class.name} Level ${assetData.level}`;
                } else {
                  assetName = assetData.index; // Fallback to index
                }
              }

              const asset = Asset.create({
                packId: packId.toString(),
                type: assetTypeStr as AssetTypeValue,
                index: String(index),
                name: String(assetName),
                data: rest,
                compatibleWith: (assetData.compatibleWith as string[]) || [], // Explicit cast
              });
              await this.assetRepository.save(asset);
            }
          } catch (err: unknown) {
            const message =
              err instanceof Error ? err.message : 'Unknown error';
            // this.logger.error(
            //   `Failed to seed asset ${assetData.index}: ${message}`,
            // );
          }
        }
      }
    } catch (error: any) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.warn(
        `No seed data found for ${systemVal} at ${dataDir}: ${message}`,
      );
    }
  }

  private mapFilenameToAssetType(filename: string): string | null {
    const lower = filename.toLowerCase();
    if (lower.includes('spells')) return AssetTypeValue.SPELL;
    if (lower.includes('subclasses')) return AssetTypeValue.SUBCLASS;
    if (lower.includes('classes')) return AssetTypeValue.CLASS;
    if (lower.includes('subraces')) return AssetTypeValue.SUBRACE;
    if (lower.includes('races')) return AssetTypeValue.RACE;
    if (lower.includes('monsters')) return AssetTypeValue.MONSTER;
    if (lower.includes('features')) return AssetTypeValue.FEATURE;
    if (lower.includes('feats')) return AssetTypeValue.FEAT;
    if (lower.includes('backgrounds')) return AssetTypeValue.BACKGROUND;
    if (lower.includes('equipment-categories'))
      return AssetTypeValue.EQUIPMENT_CATEGORY;
    if (lower.includes('equipment')) return AssetTypeValue.EQUIPMENT;
    if (lower.includes('magic-items')) return AssetTypeValue.MAGIC_ITEM;
    if (lower.includes('conditions')) return AssetTypeValue.CONDITION;
    if (lower.includes('damage-types')) return AssetTypeValue.DAMAGE_TYPE;
    if (lower.includes('magic-schools')) return AssetTypeValue.MAGIC_SCHOOL;
    if (lower.includes('ability-scores')) return AssetTypeValue.ABILITY_SCORE;
    if (lower.includes('languages')) return AssetTypeValue.LANGUAGE;
    if (lower.includes('skills')) return AssetTypeValue.SKILL;
    if (lower.includes('proficiencies')) return AssetTypeValue.PROFICIENCY;
    if (lower.includes('traits')) return AssetTypeValue.TRAIT;
    if (lower.includes('weapon-mastery')) return AssetTypeValue.WEAPON_MASTERY;
    if (lower.includes('weapon-properties'))
      return AssetTypeValue.WEAPON_PROPERTY;
    if (lower.includes('alignments')) return AssetTypeValue.ALIGNMENT;
    if (lower.includes('levels')) return AssetTypeValue.LEVEL;
    if (lower.includes('rules')) return AssetTypeValue.RULE;
    if (lower.includes('rule-sections')) return AssetTypeValue.RULE_SECTION;

    return null;
  }
}
