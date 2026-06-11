import { Hono } from 'hono';
import type { CloudflareBindings } from '../types/bindings';
import type { Container } from '../infrastructure/container';
import { requireUser } from '../infrastructure/auth/supabase';
import { CharacterMapper } from '../characters/infrastructure/mappers/character.mapper';
import { AssetMapper } from '../content/infrastructure/mappers/asset.mapper';
import { CharacterError } from '../characters/application/character-errors';
import { UUID } from '@shared/domain/value-objects/uuid.vo';
import type { Character } from '../characters/domain/entities/character.entity';
import type { AssetRepository } from '../content/domain/repositories/asset.repository';

function cleanEmptyFields<T extends Record<string, any>>(obj: T): Partial<T> {
  const cleaned: Partial<T> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== '' && value !== undefined) {
      (cleaned as any)[key] = value;
    }
  }
  return cleaned;
}

function errorToStatus(error: CharacterError): number {
  switch (error) {
    case CharacterError.NOT_FOUND:
      return 404;
    case CharacterError.UNAUTHORIZED:
      return 403;
    case CharacterError.ALREADY_EXISTS:
      return 409;
    default:
      return 400;
  }
}

async function resolveAssetNames(
  characters: Character[],
  assetRepo: AssetRepository,
): Promise<Map<string, string>> {
  const assetIds = new Set<string>();
  for (const c of characters) {
    if (c.raceAssetId) assetIds.add(c.raceAssetId.toString());
    if (c.classAssetId) assetIds.add(c.classAssetId.toString());
    if (c.backgroundAssetId) assetIds.add(c.backgroundAssetId.toString());
  }

  if (assetIds.size === 0) return new Map();

  const assets = await assetRepo.findByIds(
    [...assetIds].map((id) => UUID.fromString(id)),
  );

  const nameMap = new Map<string, string>();
  for (const asset of assets) {
    nameMap.set(asset.id.toString(), asset.name);
  }
  return nameMap;
}

export function charactersRoutes(container: Container) {
  const app = new Hono<{ Bindings: CloudflareBindings }>();

  app.get('/', async (c) => {
    const user = await requireUser(c);
    const { campaignId, type, query: q, system, packIds } = c.req.query();

    const result = await container.listCharactersUseCase.execute({
      campaignId,
      userId: campaignId ? undefined : user.id,
    });

    if (result.isFailure) {
      return c.json({ message: result.error }, errorToStatus(result.error) as any);
    }

    const assetNames = await resolveAssetNames(result.value, container.assetRepo);

    if (!campaignId) {
      const campaignIds = new Set<string>();
      for (const ch of result.value) {
        if (ch.campaignId) campaignIds.add(ch.campaignId.toString());
      }

      const campaignNameMap = new Map<string, string>();
      if (campaignIds.size > 0) {
        const campaigns = await Promise.all(
          [...campaignIds].map((id) => container.campaignRepo.findById(UUID.fromString(id))),
        );
        for (const campaign of campaigns) {
          if (campaign) campaignNameMap.set(campaign.id.toString(), campaign.name);
        }
      }

      return c.json(
        result.value.map((ch) => ({
          ...CharacterMapper.toEnrichedResponse(ch, assetNames),
          campaignName: ch.campaignId
            ? (campaignNameMap.get(ch.campaignId.toString()) ?? null)
            : null,
        })),
      );
    }

    return c.json(result.value.map((ch) => CharacterMapper.toEnrichedResponse(ch, assetNames)));
  });

  app.get('/available-assets', async (c) => {
    await requireUser(c);
    const { campaignId, type, query: q, system, packIds } = c.req.query();

    const result = await container.listAvailableAssetsUseCase.execute({
      campaignId,
      type,
      query: q,
      system,
      packIds: packIds ? packIds.split(',').map((id) => id.trim()).filter(Boolean) : undefined,
    });

    if (result.isFailure) {
      return c.json({ message: result.error }, errorToStatus(result.error) as any);
    }

    return c.json({
      races: result.value.races.map(AssetMapper.toResponse),
      subraces: result.value.subraces.map(AssetMapper.toResponse),
      classes: result.value.classes.map(AssetMapper.toResponse),
      backgrounds: result.value.backgrounds.map(AssetMapper.toResponse),
    });
  });

  app.get('/:charId', async (c) => {
    await requireUser(c);
    const charId = c.req.param('charId');
    const result = await container.getCharacterUseCase.execute(charId);

    if (result.isFailure) {
      return c.json({ message: result.error }, errorToStatus(result.error) as any);
    }

    const names = await resolveAssetNames([result.value], container.assetRepo);
    return c.json(CharacterMapper.toEnrichedResponse(result.value, names));
  });

  app.post('/', async (c) => {
    const user = await requireUser(c);
    const body = await c.req.json();
    const cleaned = cleanEmptyFields(body);

    const result = await container.createCharacterUseCase.execute({
      ...cleaned,
      userId: user.id,
      name: cleaned.name!,
      raceAssetId: cleaned.raceAssetId ?? null,
      classAssetId: cleaned.classAssetId ?? null,
      backgroundAssetId: cleaned.backgroundAssetId ?? undefined,
      stats: cleaned.stats!,
      method: cleaned.method ?? 'point-buy',
    });

    if (result.isFailure) {
      return c.json({ message: result.error }, errorToStatus(result.error) as any);
    }

    const names = await resolveAssetNames([result.value], container.assetRepo);
    return c.json(CharacterMapper.toEnrichedResponse(result.value, names), 201);
  });

  app.put('/:charId', async (c) => {
    const user = await requireUser(c);
    const charId = c.req.param('charId');
    const body = await c.req.json();
    const cleaned = cleanEmptyFields(body);

    const result = await container.updateCharacterUseCase.execute({
      id: charId,
      requesterId: user.id,
      ...cleaned,
    });

    if (result.isFailure) {
      return c.json({ message: result.error }, errorToStatus(result.error) as any);
    }

    const names = await resolveAssetNames([result.value], container.assetRepo);
    return c.json(CharacterMapper.toEnrichedResponse(result.value, names));
  });

  app.delete('/:charId', async (c) => {
    const user = await requireUser(c);
    const charId = c.req.param('charId');

    const result = await container.deleteCharacterUseCase.execute({
      id: charId,
      requesterId: user.id,
    });

    if (result.isFailure) {
      return c.json({ message: result.error }, errorToStatus(result.error) as any);
    }

    return new Response(null, { status: 204 });
  });

  return app;
}
