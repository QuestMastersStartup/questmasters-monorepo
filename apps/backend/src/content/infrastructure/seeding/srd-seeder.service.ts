import type { ContentPackRepository } from '../../domain/repositories/content-pack.repository';
import type { AssetRepository } from '../../domain/repositories/asset.repository';
import { ContentPack } from '../../domain/entities/content-pack.entity';
import { Asset } from '../../domain/entities/asset.entity';
import { SystemTypeValue } from '../../domain/value-objects/system-type.vo';
import { PackTypeValue } from '../../domain/value-objects/pack-type.vo';
import { AssetType, AssetTypeValue } from '../../domain/value-objects/asset-type.vo';
import { UUID } from '@shared/domain/value-objects/uuid.vo';
import { Slug } from '@shared/domain/value-objects/slug.vo';

// Static imports — works in Cloudflare Workers (no fs/promises)
import races2014 from './data/dnd-5e-2014/5e-SRD-Races.json';
import subraces2014 from './data/dnd-5e-2014/5e-SRD-Subraces.json';
import classes2014 from './data/dnd-5e-2014/5e-SRD-Classes.json';
import backgrounds2014 from './data/dnd-5e-2014/5e-SRD-Backgrounds.json';
import backgrounds2024 from './data/dnd-5e-2024/5e-SRD-Backgrounds.json';

type AssetEntry = { index: string; name?: string; [key: string]: unknown };

const SRD_DATA: Record<string, Array<{ type: AssetTypeValue; items: AssetEntry[] }>> = {
  [SystemTypeValue.DND_5E_2014]: [
    { type: AssetTypeValue.RACE,       items: races2014 as AssetEntry[] },
    { type: AssetTypeValue.SUBRACE,    items: subraces2014 as AssetEntry[] },
    { type: AssetTypeValue.CLASS,      items: classes2014 as AssetEntry[] },
    { type: AssetTypeValue.BACKGROUND, items: backgrounds2014 as AssetEntry[] },
  ],
  [SystemTypeValue.DND_5E_2024]: [
    { type: AssetTypeValue.BACKGROUND, items: backgrounds2024 as AssetEntry[] },
  ],
};

const PACKS: Array<{
  slug: string;
  name: string;
  description: string;
  version: string;
  system: SystemTypeValue;
}> = [
  {
    slug: 'srd-dnd-5e-2014',
    name: 'System Reference Document 5.1 (2014)',
    description: 'Official SRD content for Dungeons & Dragons 5th Edition (2014 rules).',
    version: '5.1',
    system: SystemTypeValue.DND_5E_2014,
  },
  {
    slug: 'srd-dnd-5e-2024',
    name: 'Free Rules (2024)',
    description: 'Official Free Rules content for Dungeons & Dragons (2024 revision).',
    version: '2024.1',
    system: SystemTypeValue.DND_5E_2024,
  },
];

export class SrdSeederService {
  private readonly SYSTEM_CREATOR_ID = '550e8400-e29b-41d4-a716-446655440000';

  constructor(
    private readonly packRepository: ContentPackRepository,
    private readonly assetRepository: AssetRepository,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    for (const packDef of PACKS) {
      try {
        await this.seedPack(packDef);
      } catch (err) {
        console.error(`[SrdSeeder] Failed to seed pack "${packDef.slug}":`, err);
      }
    }
  }

  private async seedPack(packDef: typeof PACKS[number]): Promise<void> {
    const slug = Slug.create(packDef.slug);
    const exists = await this.packRepository.existsBySlug(slug);

    let packId: UUID;

    if (!exists) {
      const pack = ContentPack.create({
        slug: packDef.slug,
        name: packDef.name,
        description: packDef.description,
        version: packDef.version,
        type: PackTypeValue.SRD,
        system: packDef.system,
        creatorId: this.SYSTEM_CREATOR_ID,
      });
      await this.packRepository.save(pack);
      packId = pack.id;
    } else {
      const pack = await this.packRepository.findBySlug(slug);
      if (!pack) return;
      packId = pack.id;
    }

    const groups = SRD_DATA[packDef.system] ?? [];
    for (const group of groups) {
      await this.seedAssets(packId, group.type, group.items);
    }
  }

  private async seedAssets(
    packId: UUID,
    assetType: AssetTypeValue,
    items: AssetEntry[],
  ): Promise<void> {
    const type = AssetType.create(assetType);

    for (const item of items) {
      try {
        const alreadyExists = await this.assetRepository.existsByPackAndTypeAndIndex(
          packId,
          type,
          String(item.index),
        );
        if (alreadyExists) continue;

        const { index, name, ...rest } = item;

        let assetName = name;
        if (!assetName) {
          if (assetType === AssetTypeValue.LEVEL && (item as any).level && (item as any).class) {
            assetName = `${(item as any).class.name} Level ${(item as any).level}`;
          } else {
            assetName = String(index);
          }
        }

        const asset = Asset.create({
          packId: packId.toString(),
          type: assetType,
          index: String(index),
          name: String(assetName),
          data: rest as Record<string, unknown>,
          compatibleWith: (item.compatibleWith as string[]) ?? [],
        });
        await this.assetRepository.save(asset);
      } catch (err) {
        console.error(`[SrdSeeder] Failed to seed ${assetType} "${String(item.index)}":`, err);
      }
    }
  }
}
