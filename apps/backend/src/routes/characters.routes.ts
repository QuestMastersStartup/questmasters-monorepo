import { Elysia, t } from 'elysia';
import type { Container } from '../infrastructure/container';
import { requireUser } from '../infrastructure/auth/supabase';
import {
  CreateCharacterSchema,
  UpdateCharacterSchema,
  CharacterQuerySchema,
  AvailableAssetsQuerySchema,
} from '../schemas/character.schema';
import { CharacterMapper } from '../characters/infrastructure/mappers/character.mapper';
import { AssetMapper } from '../content/infrastructure/mappers/asset.mapper';
import { CharacterError } from '../characters/application/character-errors';
import { UUID } from '@shared/domain/value-objects/uuid.vo';
import type { Character } from '../characters/domain/entities/character.entity';
import type { AssetRepository } from '../content/domain/repositories/asset.repository';

/**
 * Helper: strips empty-string values from an object so optional fields
 * don't overwrite real data with "". (feedback §4)
 */
function cleanEmptyFields<T extends Record<string, any>>(obj: T): Partial<T> {
  const cleaned: Partial<T> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== '' && value !== undefined) {
      (cleaned as any)[key] = value;
    }
  }
  return cleaned;
}

/**
 * Maps a CharacterError to the appropriate HTTP status code.
 */
function errorToStatus(error: CharacterError): number {
  switch (error) {
    case CharacterError.NOT_FOUND:
      return 404;
    case CharacterError.UNAUTHORIZED:
      return 403;
    case CharacterError.ALREADY_EXISTS:
      return 409;
    case CharacterError.NOT_A_MEMBER:
    case CharacterError.CAMPAIGN_NOT_ACTIVE:
    case CharacterError.ASSET_NOT_IN_CAMPAIGN:
    case CharacterError.INVALID_STATS:
      return 400;
    default:
      return 400;
  }
}

/**
 * Resolves asset names (race, class, background) for a list of characters.
 * Returns a Map<assetId, assetName> for use with CharacterMapper.toEnrichedResponse.
 */
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
  return new Elysia({ prefix: '/characters' })

    // ─── GET /characters — List characters ────────────────────────────
    // Cuando NO hay campaignId: devuelve los personajes del usuario autenticado
    // con campaignName resuelto (usado por la página "Mis Personajes").
    // Cuando hay campaignId: devuelve los personajes de esa campaña.
    .get(
      '/',
      async ({ query, request, set }) => {
        const user = await requireUser(request, set);

        const result = await container.listCharactersUseCase.execute({
          campaignId: query.campaignId,
          userId: query.campaignId ? undefined : user.id,
        });

        if (result.isFailure) {
          set.status = errorToStatus(result.error);
          return { message: result.error };
        }

        const assetNames = await resolveAssetNames(result.value, container.assetRepo);

        // Sin filtro de campaña → vista "Mis Personajes": incluir campaignName
        if (!query.campaignId) {
          const campaignIds = new Set<string>();
          for (const c of result.value) {
            if (c.campaignId) campaignIds.add(c.campaignId.toString());
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

          return result.value.map((c) => ({
            ...CharacterMapper.toEnrichedResponse(c, assetNames),
            campaignName: c.campaignId
              ? (campaignNameMap.get(c.campaignId.toString()) ?? null)
              : null,
          }));
        }

        return result.value.map((c) => CharacterMapper.toEnrichedResponse(c, assetNames));
      },
      {
        query: CharacterQuerySchema,
        detail: {
          summary: 'List characters (by campaign or my own with campaign names)',
          tags: ['Characters'],
        },
      },
    )

    // ─── GET /characters/available-assets — List assets for builder ──
    .get(
      '/available-assets',
      async ({ query, request, set }) => {
        await requireUser(request, set);

        const result = await container.listAvailableAssetsUseCase.execute({
          campaignId: query.campaignId,
          type: query.type,
          query: query.query,
          system: query.system,
          packIds: query.packIds
            ? query.packIds.split(',').map(id => id.trim()).filter(Boolean)
            : undefined,
        });

        if (result.isFailure) {
          set.status = errorToStatus(result.error);
          return { message: result.error };
        }

        return {
          races:       result.value.races.map(AssetMapper.toResponse),
          subraces:    result.value.subraces.map(AssetMapper.toResponse),
          classes:     result.value.classes.map(AssetMapper.toResponse),
          backgrounds: result.value.backgrounds.map(AssetMapper.toResponse),
        };
      },
      {
        query: AvailableAssetsQuerySchema,
        detail: {
          summary: 'List available assets for character builder',
          tags: ['Characters'],
        },
      },
    )

    // ─── GET /characters/:charId — Get single character ──────────────
    .get(
      '/:charId',
      async ({ params, request, set }) => {
        await requireUser(request, set);

        const result = await container.getCharacterUseCase.execute(params.charId);

        if (result.isFailure) {
          set.status = errorToStatus(result.error);
          return { message: result.error };
        }

        const names = await resolveAssetNames([result.value], container.assetRepo);
        return CharacterMapper.toEnrichedResponse(result.value, names);
      },
      {
        params: t.Object({
          charId: t.String({ description: 'Character UUID' }),
        }),
        detail: {
          summary: 'Get a character by ID',
          tags: ['Characters'],
        },
      },
    )

    // ─── POST /characters — Create character ─────────────────────────
    .post(
      '/',
      async ({ body, request, set }) => {
        const user = await requireUser(request, set);
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
          set.status = errorToStatus(result.error);
          return { message: result.error };
        }

        set.status = 201;
        const names = await resolveAssetNames([result.value], container.assetRepo);
        return CharacterMapper.toEnrichedResponse(result.value, names);
      },
      {
        body: CreateCharacterSchema,
        detail: {
          summary: 'Create a new character',
          tags: ['Characters'],
        },
      },
    )

    // ─── PUT /characters/:charId — Update character ──────────────────
    .put(
      '/:charId',
      async ({ params, body, request, set }) => {
        const user = await requireUser(request, set);
        const cleaned = cleanEmptyFields(body);

        const result = await container.updateCharacterUseCase.execute({
          id: params.charId,
          requesterId: user.id,
          ...cleaned,
        });

        if (result.isFailure) {
          set.status = errorToStatus(result.error);
          return { message: result.error };
        }

        const names = await resolveAssetNames([result.value], container.assetRepo);
        return CharacterMapper.toEnrichedResponse(result.value, names);
      },
      {
        params: t.Object({
          charId: t.String(),
        }),
        body: UpdateCharacterSchema,
        detail: {
          summary: 'Update a character',
          tags: ['Characters'],
        },
      },
    )

    // ─── DELETE /characters/:charId — Delete character ────────────────
    .delete(
      '/:charId',
      async ({ params, request, set }) => {
        const user = await requireUser(request, set);

        const result = await container.deleteCharacterUseCase.execute({
          id: params.charId,
          requesterId: user.id,
        });

        if (result.isFailure) {
          set.status = errorToStatus(result.error);
          return { message: result.error };
        }

        set.status = 204;
      },
      {
        params: t.Object({
          charId: t.String(),
        }),
        detail: {
          summary: 'Delete a character',
          tags: ['Characters'],
        },
      },
    );
}
