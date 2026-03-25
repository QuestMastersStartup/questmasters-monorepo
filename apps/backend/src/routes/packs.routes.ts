import { Elysia, t } from 'elysia';
import type { Container } from '../infrastructure/container';
import {
  requireUser,
  requireRole,
  requireOwnerOrAdmin,
} from '../infrastructure/auth/supabase';
import {
  CreatePackSchema,
  UpdatePackSchema,
  SuspendPackSchema,
  PackQuerySchema,
  ChangeStatusSchema,
} from '../schemas/pack.schema';
import { ContentPackMapper } from '../content/infrastructure/mappers/content-pack.mapper';
import { AssetMapper } from '../content/infrastructure/mappers/asset.mapper';
import { PackError } from '../content/application/errors';

export function packsRoutes(container: Container) {
  return (
    new Elysia({ prefix: '/packs' })
      // --- PUBLIC ROUTES ---
      // GET /packs — List packs (only active & non-suspended by default)
      .get(
        '/',
        async ({ query }) => {
          const packs = await container.listPacksUseCase.execute({
            type: query.type,
            creatorId: query.creatorId,
            status: query.status,
            isActive: true,
            isSuspended: false,
          });
          return packs.map((pack) => ContentPackMapper.toResponse(pack));
        },
        {
          query: PackQuerySchema,
          detail: {
            summary: 'List available content packs',
            tags: ['Packs'],
          },
        },
      )

      .get(
        '/:slug',
        async ({ params, set }) => {
          const result = await container.getPackUseCase.execute(params.slug);

          if (result.isFailure) {
            if (result.error === PackError.NOT_FOUND) {
              set.status = 404;
              return { message: `Pack with slug '${params.slug}' not found` };
            }
            set.status = 400;
            return { message: result.error };
          }

          const { pack, assets } = result.value;
          return {
            ...ContentPackMapper.toResponse(pack),
            assets: assets.map((asset) => AssetMapper.toResponse(asset)),
          };
        },
        {
          params: t.Object({
            slug: t.String({ description: 'The unique slug of the pack' }),
          }),
          detail: {
            summary: 'Get a pack by its slug',
            tags: ['Packs'],
          },
        },
      )

      // --- PROTECTED ROUTES ---

      // POST /packs — Create pack
      .post(
        '/',
        async ({ body, request, set }) => {
          const user = await requireUser(request, set);
          // Inject the authenticated user as the creator
          (body as any).creatorId = user.id;

          const result = await container.createPackUseCase.execute(body as any);

          if (result.isFailure) {
            if (result.error === PackError.SLUG_ALREADY_EXISTS) {
              set.status = 400;
              return { message: 'A pack with this slug already exists' };
            }
            set.status = 400;
            return { message: result.error };
          }

          set.status = 201;
          return ContentPackMapper.toResponse(result.value);
        },
        {
          body: CreatePackSchema,
          detail: {
            summary: 'Create a new content pack',
            tags: ['Packs'],
          },
        },
      )

      // PUT /packs/:slug — Update pack
      .put(
        '/:slug',
        async ({ params, body, request, set }) => {
          // 1. Fetch pack to get creatorId
          const getResult = await container.getPackUseCase.execute(params.slug);
          if (getResult.isFailure) {
            set.status = getResult.error === PackError.NOT_FOUND ? 404 : 400;
            return { message: getResult.error };
          }

          // 2. Authorize: Owner or Admin
          await requireOwnerOrAdmin(
            request,
            set,
            getResult.value.pack.creatorId,
            container,
          );

          // 3. Execute update
          const result = await container.updatePackUseCase.execute(
            params.slug,
            body,
          );

          if (result.isFailure) {
            set.status = result.error === PackError.NOT_FOUND ? 404 : 400;
            return { message: result.error };
          }

          return ContentPackMapper.toResponse(result.value);
        },
        {
          body: UpdatePackSchema,
          params: t.Object({
            slug: t.String({ description: 'The unique slug of the pack' }),
          }),
          detail: {
            summary: 'Update pack metadata',
            tags: ['Packs'],
          },
        },
      )

      // PATCH /packs/:slug/status — Change pack publication status
      .patch(
        '/:slug/status',
        async ({ params, body, request, set }) => {
          const getResult = await container.getPackUseCase.execute(params.slug);
          if (getResult.isFailure) {
            set.status = getResult.error === PackError.NOT_FOUND ? 404 : 400;
            return { message: getResult.error };
          }

          await requireOwnerOrAdmin(
            request,
            set,
            getResult.value.pack.creatorId,
            container,
          );

          const result = await container.changePackStatusUseCase.execute(
            params.slug,
            body.status,
          );

          if (result.isFailure) {
            switch (result.error) {
              case PackError.NOT_FOUND:
                set.status = 404;
                return { message: `Pack with slug '${params.slug}' not found` };
              case PackError.INVALID_STATUS:
                set.status = 400;
                return { message: `Invalid status: '${body.status}'` };
              case PackError.INVALID_STATUS_TRANSITION:
                set.status = 422;
                return {
                  message: `Cannot transition to '${body.status}' from the current status`,
                };
              default:
                set.status = 400;
                return { message: result.error };
            }
          }

          return ContentPackMapper.toResponse(result.value);
        },
        {
          body: ChangeStatusSchema,
          params: t.Object({
            slug: t.String({ description: 'The unique slug of the pack' }),
          }),
          detail: {
            summary: 'Change pack publication status',
            tags: ['Packs'],
          },
        },
      )

      // PATCH /packs/:slug/suspend — Suspend pack (Admin only)
      .patch(
        '/:slug/suspend',
        async ({ params, body, request, set }) => {
          await requireRole(request, set, ['admin'], container);

          const result = await container.suspendPackUseCase.execute(
            params.slug,
            body,
          );

          if (result.isFailure) {
            set.status = result.error === PackError.NOT_FOUND ? 404 : 400;
            return { message: result.error };
          }

          return ContentPackMapper.toResponse(result.value);
        },
        {
          body: SuspendPackSchema,
          params: t.Object({
            slug: t.String({ description: 'The unique slug of the pack' }),
          }),
          detail: {
            summary: 'Suspend a pack',
            tags: ['Packs'],
          },
        },
      )

      // PATCH /packs/:slug/unsuspend — Unsuspend pack (Admin only)
      .patch(
        '/:slug/unsuspend',
        async ({ params, request, set }) => {
          await requireRole(request, set, ['admin'], container);

          const result = await container.unsuspendPackUseCase.execute(
            params.slug,
          );

          if (result.isFailure) {
            set.status = result.error === PackError.NOT_FOUND ? 404 : 400;
            return { message: result.error };
          }

          return ContentPackMapper.toResponse(result.value);
        },
        {
          params: t.Object({
            slug: t.String({ description: 'The unique slug of the pack' }),
          }),
          detail: {
            summary: 'Unsuspend a pack',
            tags: ['Packs'],
          },
        },
      )

      // DELETE /packs/:slug — Delete pack
      .delete(
        '/:slug',
        async ({ params, request, set }) => {
          const getResult = await container.getPackUseCase.execute(params.slug);
          if (getResult.isFailure) {
            set.status = getResult.error === PackError.NOT_FOUND ? 404 : 400;
            return { message: getResult.error };
          }

          await requireOwnerOrAdmin(
            request,
            set,
            getResult.value.pack.creatorId,
            container,
          );

          const result = await container.deletePackUseCase.execute(params.slug);

          if (result.isFailure) {
            set.status = result.error === PackError.NOT_FOUND ? 404 : 400;
            return { message: result.error };
          }

          set.status = 204;
        },
        {
          params: t.Object({
            slug: t.String({ description: 'The unique slug of the pack' }),
          }),
          detail: {
            summary: 'Delete a pack',
            tags: ['Packs'],
          },
        },
      )
  );
}
