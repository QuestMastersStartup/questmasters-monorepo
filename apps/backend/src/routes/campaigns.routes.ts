import { Hono } from 'hono';
import type { CloudflareBindings } from '../types/bindings';
import type { Container } from '../infrastructure/container';
import { requireUser, requireOwnerOrAdmin } from '../infrastructure/auth/guards';
import { uploadCampaignPortrait } from '../infrastructure/storage';
import { CampaignMapper } from '../campaigns/infrastructure/mappers/campaign.mapper';
import { CampaignMemberMapper } from '../campaigns/infrastructure/mappers/campaign-member.mapper';
import { CampaignError } from '../campaigns/application/errors';
import { CampaignStatus } from '../campaigns/domain/value-objects/campaign-status.vo';
import { UUID } from '@shared/domain/value-objects/uuid.vo';

export function campaignsRoutes(container: Container) {
  const app = new Hono<{ Bindings: CloudflareBindings }>();

  app.post('/portrait', async (c) => {
    const user = await requireUser(c);
    const formData = await c.req.formData();
    const file = formData.get('file') as File | null;

    if (!file) return c.json({ message: 'Missing file' }, 400);

    const MAX_SIZE = 5 * 1024 * 1024;
    if (file.size > MAX_SIZE) return c.json({ message: 'File too large (max 5MB)' }, 413);

    const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!ALLOWED_TYPES.includes(file.type)) {
      return c.json({ message: 'Invalid file type. Only JPEG, PNG, WEBP and GIF are allowed.' }, 400);
    }

    try {
      const portraitUrl = await uploadCampaignPortrait(c.env, user.id, file);
      return c.json({ message: 'Portrait uploaded successfully', portraitUrl });
    } catch (e: any) {
      return c.json({ message: e.message || 'Internal server error' }, 500);
    }
  });

  app.get('/', async (c) => {
    const user = await requireUser(c);
    const { status, system } = c.req.query();

    const campaigns = await container.listCampaignsUseCase.execute({
      dmId: user.id,
      status,
      system,
    });

    return c.json(campaigns.map((camp) => CampaignMapper.toResponse(camp)));
  });

  app.get('/:id', async (c) => {
    await requireUser(c);
    const id = c.req.param('id');
    const result = await container.getCampaignUseCase.execute(id);

    if (result.isFailure) return c.json({ message: 'Campaign not found' }, 404);

    return c.json(CampaignMapper.toResponse(result.value));
  });

  app.post('/', async (c) => {
    try {
      const user = await requireUser(c);
      const body = await c.req.json();
      body.dmId = user.id;

      const result = await container.createCampaignUseCase.execute(body);

      if (result.isFailure) return c.json({ message: result.error }, 400);

      return c.json(CampaignMapper.toResponse(result.value), 201);
    } catch (err) {
      console.error('[campaigns] POST / failed:', err);
      throw err;
    }
  });

  app.put('/:id', async (c) => {
    const id = c.req.param('id');
    const getResult = await container.getCampaignUseCase.execute(id);
    if (getResult.isFailure) return c.json({ message: 'Campaign not found' }, 404);

    await requireOwnerOrAdmin(c, getResult.value.dmId, container);

    const body = await c.req.json();
    const result = await container.updateCampaignUseCase.execute(id, body);
    if (result.isFailure) return c.json({ message: result.error }, 400);

    return c.json(CampaignMapper.toResponse(result.value));
  });

  app.post('/:id/packs', async (c) => {
    const id = c.req.param('id');
    const getResult = await container.getCampaignUseCase.execute(id);
    if (getResult.isFailure) return c.json({ message: 'Campaign not found' }, 404);

    await requireOwnerOrAdmin(c, getResult.value.dmId, container);

    try {
      const { packIds } = await c.req.json();
      const uuids = packIds.map((pid: string) => UUID.fromString(pid));
      const campaign = getResult.value.installPacks(uuids);
      await container.campaignRepo.save(campaign);
      return c.json(CampaignMapper.toResponse(campaign));
    } catch (e: any) {
      return c.json({ message: e.message }, 400);
    }
  });

  app.post('/:id/packs/uninstall', async (c) => {
    const id = c.req.param('id');
    const getResult = await container.getCampaignUseCase.execute(id);
    if (getResult.isFailure) return c.json({ message: 'Campaign not found' }, 404);

    await requireOwnerOrAdmin(c, getResult.value.dmId, container);

    try {
      const { packIds } = await c.req.json();
      const uuids = packIds.map((pid: string) => UUID.fromString(pid));
      const campaign = getResult.value.uninstallPacks(uuids);
      await container.campaignRepo.save(campaign);
      return c.json(CampaignMapper.toResponse(campaign));
    } catch (e: any) {
      return c.json({ message: e.message }, 400);
    }
  });

  app.patch('/:id/status', async (c) => {
    const id = c.req.param('id');
    const getResult = await container.getCampaignUseCase.execute(id);
    if (getResult.isFailure) return c.json({ message: 'Campaign not found' }, 404);

    await requireOwnerOrAdmin(c, getResult.value.dmId, container);

    try {
      const { status } = await c.req.json();
      const campaign = getResult.value.changeStatus(CampaignStatus.create(status));
      await container.campaignRepo.save(campaign);
      return c.json(CampaignMapper.toResponse(campaign));
    } catch (e: any) {
      return c.json({ message: e.message }, 400);
    }
  });

  app.delete('/:id', async (c) => {
    const id = c.req.param('id');
    const getResult = await container.getCampaignUseCase.execute(id);
    if (getResult.isFailure) return c.json({ message: 'Campaign not found' }, 404);

    await requireOwnerOrAdmin(c, getResult.value.dmId, container);

    const result = await container.deleteCampaignUseCase.execute(id);
    if (result.isFailure) return c.json({ message: result.error }, 400);

    return new Response(null, { status: 204 });
  });

  app.get('/:id/members', async (c) => {
    await requireUser(c);
    const id = c.req.param('id');
    const result = await container.listMembersUseCase.execute(id);

    if (result.isFailure) return c.json({ message: 'Campaign not found' }, 404);

    return c.json(result.value.map(CampaignMemberMapper.toResponse));
  });

  app.post('/:id/members', async (c) => {
    const id = c.req.param('id');
    const getResult = await container.getCampaignUseCase.execute(id);
    if (getResult.isFailure) return c.json({ message: 'Campaign not found' }, 404);

    await requireOwnerOrAdmin(c, getResult.value.dmId, container);

    const { userId } = await c.req.json();
    const result = await container.invitePlayerUseCase.execute({ campaignId: id, userId });

    if (result.isFailure) {
      if (result.error === CampaignError.ALREADY_EXISTS) {
        return c.json({ message: 'User is already a member of this campaign' }, 409);
      }
      return c.json({ message: result.error }, 400);
    }

    return c.json(CampaignMemberMapper.toResponse(result.value), 201);
  });

  app.delete('/:id/members/:userId', async (c) => {
    const id = c.req.param('id');
    const userId = c.req.param('userId');
    const getResult = await container.getCampaignUseCase.execute(id);
    if (getResult.isFailure) return c.json({ message: 'Campaign not found' }, 404);

    await requireOwnerOrAdmin(c, getResult.value.dmId, container);

    const result = await container.removeMemberUseCase.execute({ campaignId: id, userId });

    if (result.isFailure) return c.json({ message: result.error }, 400);

    return new Response(null, { status: 204 });
  });

  return app;
}
