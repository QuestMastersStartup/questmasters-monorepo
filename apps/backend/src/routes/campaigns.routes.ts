import { Elysia, t } from 'elysia';
import { createClient } from '@supabase/supabase-js';
import type { Container } from '../infrastructure/container';
import {
  requireUser,
  requireOwnerOrAdmin,
} from '../infrastructure/auth/supabase';
import {
  CreateCampaignSchema,
  UpdateCampaignSchema,
  ChangeCampaignStatusSchema,
  CampaignQuerySchema,
  InstallPacksSchema,
} from '../schemas/campaign.schema';
import { CampaignMapper } from '../campaigns/infrastructure/mappers/campaign.mapper';
import { CampaignMemberMapper } from '../campaigns/infrastructure/mappers/campaign-member.mapper';
import { CampaignError } from '../campaigns/application/errors';
import { CampaignStatus } from '../campaigns/domain/value-objects/campaign-status.vo';
import { UUID } from '@shared/domain/value-objects/uuid.vo';

export function campaignsRoutes(container: Container) {
  return (
    new Elysia({ prefix: '/campaigns' })
      // POST /campaigns/portrait — Upload a campaign portrait
      .post(
        '/portrait',
        async ({ request, set, body }) => {
          const user = await requireUser(request, set);
          const { file } = body;

          // 1. Validation (5MB limit)
          const MAX_SIZE = 5 * 1024 * 1024;
          if (file.size > MAX_SIZE) {
            set.status = 413;
            return { message: 'File too large (max 5MB)' };
          }

          const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
          if (!ALLOWED_TYPES.includes(file.type)) {
            set.status = 400;
            return { message: 'Invalid file type. Only JPEG, PNG, WEBP and GIF are allowed.' };
          }

          // 2. Prepare Auth-aware Supabase Client
          const authHeader = request.headers.get('authorization');
          const token = authHeader?.split(' ')[1];
          if (!token) {
            set.status = 401;
            return { message: 'Missing authentication token' };
          }

          const userSupabase = createClient(
            process.env.SUPABASE_URL || '',
            process.env.SUPABASE_KEY || '', // Anon key
            { global: { headers: { Authorization: `Bearer ${token}` } } }
          );

          // 3. Upload to Supabase Storage
          const fileExt = file.type.split('/')[1] || 'webp';
          const fileName = `${user.id}/portrait-${Date.now()}.${fileExt}`;

          try {
            const { error: uploadError } = await userSupabase
              .storage
              .from('campaign-portrait')
              .upload(fileName, file, {
                upsert: true,
                contentType: file.type
              });

            if (uploadError) {
              set.status = 500;
              return { message: uploadError.message || 'Failed to upload image' };
            }

            // 4. Get Public URL
            const { data: { publicUrl } } = userSupabase
              .storage
              .from('campaign-portrait')
              .getPublicUrl(fileName);

            return { 
              message: 'Portrait uploaded successfully',
              portraitUrl: publicUrl
            };
          } catch (e: any) {
            set.status = 500;
            return { message: e.message || 'Internal server error' };
          }
        },
        {
          body: t.Object({
            file: t.File(),
          }),
        }
      )
      // GET /campaigns
      .get(
        '/',
        async ({ query, request, set }) => {
          const user = await requireUser(request, set);
          
          // default search for DM's campaigns only
          const campaigns = await container.listCampaignsUseCase.execute({
            dmId: user.id,
            status: query.status,
            system: query.system
          });
          
          return campaigns.map((c) => CampaignMapper.toResponse(c));
        },
        {
          query: CampaignQuerySchema,
          detail: {
            summary: 'List my campaigns',
            tags: ['Campaigns'],
          },
        },
      )

      // GET /campaigns/:id
      .get(
        '/:id',
        async ({ params, request, set }) => {
          await requireUser(request, set);
          const result = await container.getCampaignUseCase.execute(params.id);

          if (result.isFailure) {
            set.status = 404;
            return { message: 'Campaign not found' };
          }

          return CampaignMapper.toResponse(result.value);
        },
        {
          params: t.Object({
            id: t.String({ description: 'The unique ID of the campaign' }),
          }),
          detail: {
            summary: 'Get a campaign by its ID',
            tags: ['Campaigns'],
          },
        },
      )

      // POST /campaigns
      .post(
        '/',
        async ({ body, request, set }) => {
          const user = await requireUser(request, set);
          (body as any).dmId = user.id;

          const result = await container.createCampaignUseCase.execute(body as any);

          if (result.isFailure) {
            set.status = 400;
            return { message: result.error };
          }

          set.status = 201;
          return CampaignMapper.toResponse(result.value);
        },
        {
          body: CreateCampaignSchema,
          detail: {
            summary: 'Create a new campaign',
            tags: ['Campaigns'],
          },
        },
      )

      // PUT /campaigns/:id
      .put(
        '/:id',
        async ({ params, body, request, set }) => {
          const getResult = await container.getCampaignUseCase.execute(params.id);
          if (getResult.isFailure) {
            set.status = 404;
            return { message: 'Campaign not found' };
          }

          await requireOwnerOrAdmin(request, set, getResult.value.dmId, container);

          const result = await container.updateCampaignUseCase.execute(params.id, body);
          if (result.isFailure) {
            set.status = 400;
            return { message: result.error };
          }

          return CampaignMapper.toResponse(result.value);
        },
        {
          body: UpdateCampaignSchema,
          params: t.Object({
            id: t.String(),
          }),
          detail: {
            summary: 'Update campaign metadata',
            tags: ['Campaigns'],
          },
        },
      )
 
      // POST /campaigns/:id/packs — Install packs
      .post(
        '/:id/packs',
        async ({ params, body, request, set }) => {
          const getResult = await container.getCampaignUseCase.execute(params.id);
          if (getResult.isFailure) {
            set.status = 404;
            return { message: 'Campaign not found' };
          }

          await requireOwnerOrAdmin(request, set, getResult.value.dmId, container);

          try {
            const uuids = body.packIds.map((id) => UUID.fromString(id));
            const campaign = getResult.value.installPacks(uuids);
            await container.campaignRepo.save(campaign);
            return CampaignMapper.toResponse(campaign);
          } catch (e: any) {
            set.status = 400;
            return { message: e.message };
          }
        },
        {
          body: InstallPacksSchema,
          params: t.Object({
            id: t.String(),
          }),
          detail: {
            summary: 'Install content packs in campaign',
            tags: ['Campaigns'],
          },
        },
      )

      // POST /campaigns/:id/packs/uninstall — Uninstall packs
      .post(
        '/:id/packs/uninstall',
        async ({ params, body, request, set }) => {
          const getResult = await container.getCampaignUseCase.execute(params.id);
          if (getResult.isFailure) {
            set.status = 404;
            return { message: 'Campaign not found' };
          }

          await requireOwnerOrAdmin(request, set, getResult.value.dmId, container);

          try {
            const uuids = body.packIds.map((id) => UUID.fromString(id));
            const campaign = getResult.value.uninstallPacks(uuids);
            await container.campaignRepo.save(campaign);
            return CampaignMapper.toResponse(campaign);
          } catch (e: any) {
            set.status = 400;
            return { message: e.message };
          }
        },
        {
          body: InstallPacksSchema,
          params: t.Object({
            id: t.String(),
          }),
          detail: {
            summary: 'Uninstall content packs from campaign',
            tags: ['Campaigns'],
          },
        },
      )

      // PATCH /campaigns/:id/status
      .patch(
        '/:id/status',
        async ({ params, body, request, set }) => {
          const getResult = await container.getCampaignUseCase.execute(params.id);
          if (getResult.isFailure) {
            set.status = 404;
            return { message: 'Campaign not found' };
          }

          await requireOwnerOrAdmin(request, set, getResult.value.dmId, container);

          try {
            const campaign = getResult.value.changeStatus(CampaignStatus.create(body.status));
            await container.campaignRepo.save(campaign);
            return CampaignMapper.toResponse(campaign);
          } catch (e: any) {
            set.status = 400;
            return { message: e.message };
          }
        },
        {
          body: ChangeCampaignStatusSchema,
          params: t.Object({
            id: t.String(),
          }),
          detail: {
            summary: 'Change campaign status',
            tags: ['Campaigns'],
          },
        },
      )

      // DELETE /campaigns/:id
      .delete(
        '/:id',
        async ({ params, request, set }) => {
          const getResult = await container.getCampaignUseCase.execute(params.id);
          if (getResult.isFailure) {
            set.status = 404;
            return { message: 'Campaign not found' };
          }

          await requireOwnerOrAdmin(request, set, getResult.value.dmId, container);

          const result = await container.deleteCampaignUseCase.execute(params.id);
          if (result.isFailure) {
            set.status = 400;
            return { message: result.error };
          }

          set.status = 204;
        },
        {
          params: t.Object({
            id: t.String(),
          }),
          detail: {
            summary: 'Delete a campaign',
            tags: ['Campaigns'],
          },
        },
      )

      // --- Members Management ---

      // GET /campaigns/:id/members — List all members
      .get(
        '/:id/members',
        async ({ params, request, set }) => {
          await requireUser(request, set);
          const result = await container.listMembersUseCase.execute(params.id);

          if (result.isFailure) {
            set.status = 404;
            return { message: 'Campaign not found' };
          }

          return result.value.map(CampaignMemberMapper.toResponse);
        },
        {
          params: t.Object({
            id: t.String(),
          }),
          detail: {
            summary: 'List campaign members',
            tags: ['Campaigns', 'Members'],
          },
        }
      )

      // POST /campaigns/:id/members — Invite a player
      .post(
        '/:id/members',
        async ({ params, body, request, set }) => {
          const getResult = await container.getCampaignUseCase.execute(params.id);
          if (getResult.isFailure) {
            set.status = 404;
            return { message: 'Campaign not found' };
          }

          // Only DM/Admin can invite
          await requireOwnerOrAdmin(request, set, getResult.value.dmId, container);

          const result = await container.invitePlayerUseCase.execute({
            campaignId: params.id,
            userId: (body as any).userId,
          });

          if (result.isFailure) {
            if (result.error === CampaignError.ALREADY_EXISTS) {
              set.status = 409;
              return { message: 'User is already a member of this campaign' };
            }
            set.status = 400;
            return { message: result.error };
          }

          set.status = 201;
          return CampaignMemberMapper.toResponse(result.value);
        },
        {
          params: t.Object({
            id: t.String(),
          }),
          body: t.Object({
            userId: t.String(),
          }),
          detail: {
            summary: 'Invite a player to campaign',
            tags: ['Campaigns', 'Members'],
          },
        }
      )

      // DELETE /campaigns/:id/members/:userId — Remove a player
      .delete(
        '/:id/members/:userId',
        async ({ params, request, set }) => {
          const getResult = await container.getCampaignUseCase.execute(params.id);
          if (getResult.isFailure) {
            set.status = 404;
            return { message: 'Campaign not found' };
          }

          // Only DM/Admin can kick players
          await requireOwnerOrAdmin(request, set, getResult.value.dmId, container);

          const result = await container.removeMemberUseCase.execute({
            campaignId: params.id,
            userId: params.userId,
          });

          if (result.isFailure) {
            set.status = 400;
            return { message: result.error };
          }

          set.status = 204;
        },
        {
          params: t.Object({
            id: t.String(),
            userId: t.String(),
          }),
          detail: {
            summary: 'Remove a player from campaign',
            tags: ['Campaigns', 'Members'],
          },
        }
      )
  );
}
