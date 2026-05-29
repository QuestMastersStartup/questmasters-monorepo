import { Character } from '../../domain/entities/character.entity';
import { CharacterOrmEntity } from '../typeorm/character.typeorm-entity';
import type { AbilityScores } from '@questmasters/dnd-rules';

export class CharacterMapper {
  static toDomain(entity: CharacterOrmEntity): Character {
    return Character.reconstruct({
      id: entity.id,
      campaignId: entity.campaignId,
      userId: entity.userId,
      name: entity.name,
      raceAssetId: entity.raceAssetId,
      classAssetId: entity.classAssetId,
      backgroundAssetId: entity.backgroundAssetId,
      level: entity.level,
      stats: entity.stats as AbilityScores,
      hitPoints: entity.hitPoints,
      portraitUrl: entity.portraitUrl,
      backstory: entity.backstory,
      status: entity.status,
      choices: entity.choices,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    });
  }

  static toPersistence(domain: Character): CharacterOrmEntity {
    const entity = new CharacterOrmEntity();
    entity.id = domain.id.toString();
    entity.campaignId = domain.campaignId?.toString() ?? null;
    entity.userId = domain.userId;
    entity.name = domain.name;
    entity.raceAssetId = domain.raceAssetId?.toString() ?? null;
    entity.classAssetId = domain.classAssetId?.toString() ?? null;
    entity.backgroundAssetId = domain.backgroundAssetId?.toString() ?? null;
    entity.level = domain.level;
    entity.stats = domain.stats;
    entity.hitPoints = domain.hitPoints;
    entity.portraitUrl = domain.portraitUrl;
    entity.backstory = domain.backstory;
    entity.status = domain.status.toString();
    entity.choices = domain.choices;
    entity.createdAt = domain.createdAt;
    entity.updatedAt = domain.updatedAt;
    return entity;
  }

  static toResponse(domain: Character) {
    return {
      id: domain.id.toString(),
      campaignId: domain.campaignId?.toString() ?? null,
      userId: domain.userId,
      name: domain.name,
      raceAssetId: domain.raceAssetId?.toString() ?? null,
      classAssetId: domain.classAssetId?.toString() ?? null,
      backgroundAssetId: domain.backgroundAssetId?.toString() ?? null,
      level: domain.level,
      stats: domain.stats,
      hitPoints: domain.hitPoints,
      portraitUrl: domain.portraitUrl,
      backstory: domain.backstory,
      status: domain.status.toString(),
      choices: domain.choices,
      createdAt: domain.createdAt.toISOString(),
      updatedAt: domain.updatedAt.toISOString(),
    };
  }

  /**
   * Enriched response that includes resolved asset names for display purposes.
   */
  static toEnrichedResponse(
    domain: Character,
    assetNames: Map<string, string>,
  ) {
    return {
      ...CharacterMapper.toResponse(domain),
      raceName: domain.raceAssetId ? (assetNames.get(domain.raceAssetId.toString()) ?? null) : null,
      className: domain.classAssetId ? (assetNames.get(domain.classAssetId.toString()) ?? null) : null,
      backgroundName: domain.backgroundAssetId
        ? assetNames.get(domain.backgroundAssetId.toString()) ?? null
        : null,
    };
  }
}
