import { Elysia, t } from 'elysia';
import type { Container } from '../infrastructure/container';
import { requireAuth } from '../infrastructure/auth/supabase';
import { CreateAssetSchema, UpdateAssetSchema } from '../schemas/asset.schema';
import { AssetMapper } from '../content/infrastructure/mappers/asset.mapper';
import { AssetError } from '../content/application/errors';

export function assetsRoutes(container: Container) {
  return (
    new Elysia({ prefix: '/packs/:slug/assets' })
      // --- PUBLIC ROUTES ---
      // GET /packs/:slug/assets — List assets
      .get(
        '/',
        async ({ params, query, set }) => {
          const result = await container.listAssetsUseCase.execute(
            params.slug,
            { type: query.type },
          );

          if (result.isFailure) {
            if (result.error === AssetError.PACK_NOT_FOUND) {
              set.status = 404;
              return { message: `Pack '${params.slug}' not found` };
            }
            set.status = 400;
            return { message: result.error };
          }

          return result.value.map(AssetMapper.toResponse);
        },
        {
          params: t.Object({
            slug: t.String({ description: 'The unique slug of the pack' }),
          }),
          query: t.Object({
            type: t.Optional(
              t.String({
                description: 'Filter assets by type (e.g., class, item)',
              }),
            ),
          }),
          detail: {
            summary: 'List assets within a pack',
            tags: ['Assets'],
          },
        },
      )

      // GET /packs/:slug/assets/:type/:index — Get single asset
      .get(
        '/:type/:index',
        async ({ params, set }) => {
          const result = await container.getAssetUseCase.execute(
            params.slug,
            params.type,
            params.index,
          );

          if (result.isFailure) {
            switch (result.error) {
              case AssetError.PACK_NOT_FOUND:
                set.status = 404;
                return { message: `Pack '${params.slug}' not found` };
              case AssetError.NOT_FOUND:
                set.status = 404;
                return {
                  message: `Asset '${params.type}/${params.index}' not found in pack '${params.slug}'`,
                };
              case AssetError.INVALID_TYPE:
                set.status = 400;
                return { message: `Invalid asset type: ${params.type}` };
              default:
                set.status = 400;
                return { message: result.error };
            }
          }

          return AssetMapper.toResponse(result.value);
        },
        {
          params: t.Object({
            slug: t.String({ description: 'The unique slug of the pack' }),
            type: t.String({ description: 'The asset type' }),
            index: t.String({ description: 'The asset unique index' }),
          }),
          detail: {
            summary: 'Get a single asset from a pack',
            tags: ['Assets'],
          },
        },
      )

      // --- PROTECTED ROUTES ---
      .use(requireAuth)

      // POST /packs/:slug/assets — Create asset
      .post(
        '/',
        async ({ params, body, set }) => {
          const result = await container.createAssetUseCase.execute(
            params.slug,
            body,
          );

          if (result.isFailure) {
            switch (result.error) {
              case AssetError.PACK_NOT_FOUND:
                set.status = 404;
                return { message: `Pack '${params.slug}' not found` };
              case AssetError.ALREADY_EXISTS:
                set.status = 400;
                return {
                  message: `Asset '${body.type}/${body.index}' already exists in this pack`,
                };
              default:
                set.status = 400;
                return { message: result.error };
            }
          }

          set.status = 201;
          return AssetMapper.toResponse(result.value);
        },
        {
          body: CreateAssetSchema,
          params: t.Object({
            slug: t.String({ description: 'The unique slug of the pack' }),
          }),
          detail: {
            summary: 'Create a new asset in a pack',
            tags: ['Assets'],
          },
        },
      )

      // PUT /packs/:slug/assets/:type/:index — Update asset
      .put(
        '/:type/:index',
        async ({ params, body, set }) => {
          const result = await container.updateAssetUseCase.execute(
            params.slug,
            params.type,
            params.index,
            body,
          );

          if (result.isFailure) {
            switch (result.error) {
              case AssetError.PACK_NOT_FOUND:
                set.status = 404;
                return { message: `Pack '${params.slug}' not found` };
              case AssetError.NOT_FOUND:
                set.status = 404;
                return {
                  message: `Asset '${params.type}/${params.index}' not found in pack '${params.slug}'`,
                };
              case AssetError.INVALID_TYPE:
                set.status = 400;
                return { message: `Invalid asset type: ${params.type}` };
              default:
                set.status = 400;
                return { message: result.error };
            }
          }

          return AssetMapper.toResponse(result.value);
        },
        {
          body: UpdateAssetSchema,
          params: t.Object({
            slug: t.String({ description: 'The unique slug of the pack' }),
            type: t.String({ description: 'The asset type' }),
            index: t.String({ description: 'The asset unique index' }),
          }),
          detail: {
            summary: 'Update asset metadata',
            tags: ['Assets'],
          },
        },
      )

      // DELETE /packs/:slug/assets/:type/:index — Delete asset
      .delete(
        '/:type/:index',
        async ({ params, set }) => {
          const result = await container.deleteAssetUseCase.execute(
            params.slug,
            params.type,
            params.index,
          );

          if (result.isFailure) {
            switch (result.error) {
              case AssetError.PACK_NOT_FOUND:
                set.status = 404;
                return { message: `Pack '${params.slug}' not found` };
              case AssetError.NOT_FOUND:
                set.status = 404;
                return {
                  message: `Asset '${params.type}/${params.index}' not found in pack '${params.slug}'`,
                };
              case AssetError.INVALID_TYPE:
                set.status = 400;
                return { message: `Invalid asset type: ${params.type}` };
              default:
                set.status = 400;
                return { message: result.error };
            }
          }

          set.status = 204;
        },
        {
          params: t.Object({
            slug: t.String({ description: 'The unique slug of the pack' }),
            type: t.String({ description: 'The asset type' }),
            index: t.String({ description: 'The asset unique index' }),
          }),
          detail: {
            summary: 'Delete an asset from a pack',
            tags: ['Assets'],
          },
        },
      )
  );
}
