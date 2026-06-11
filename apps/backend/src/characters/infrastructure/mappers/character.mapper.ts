import { Character } from '../../domain/entities/character.entity';

export class CharacterMapper {
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
