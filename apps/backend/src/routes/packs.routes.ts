import { Hono } from 'hono';
import type { CloudflareBindings } from '../types/bindings';
import type { Container } from '../infrastructure/container';
import { requireUser, requireRole, requireOwnerOrAdmin } from '../infrastructure/auth/guards';
import { ContentPackMapper } from '../content/infrastructure/mappers/content-pack.mapper';
import { AssetMapper } from '../content/infrastructure/mappers/asset.mapper';
import { PackError } from '../content/application/errors';

export function packsRoutes(container: Container) {
  const app = new Hono<{ Bindings: CloudflareBindings }>();

  app.get('/', async (c) => {
    const { type, creatorId, status } = c.req.query();
    const packs = await container.listPacksUseCase.execute({
      type,
      creatorId,
      status,
      isActive: true,
      isSuspended: false,
    });
    return c.json(packs.map((pack) => ContentPackMapper.toResponse(pack)));
  });

  app.get('/:slug', async (c) => {
    const slug = c.req.param('slug');
    const result = await container.getPackUseCase.execute(slug);

    if (result.isFailure) {
      return c.json({ message: result.error }, result.error === PackError.NOT_FOUND ? 404 : 400);
    }

    const { pack, assets } = result.value;
    return c.json({
      ...ContentPackMapper.toResponse(pack),
      assets: assets.map((asset) => AssetMapper.toResponse(asset)),
    });
  });

  app.post('/', async (c) => {
    const user = await requireUser(c);
    const body = await c.req.json();
    body.creatorId = user.id;

    const result = await container.createPackUseCase.execute(body);

    if (result.isFailure) {
      if (result.error === PackError.SLUG_ALREADY_EXISTS) {
        return c.json({ message: 'A pack with this slug already exists' }, 400);
      }
      return c.json({ message: result.error }, 400);
    }

    return c.json(ContentPackMapper.toResponse(result.value), 201);
  });

  app.put('/:slug', async (c) => {
    const slug = c.req.param('slug');
    const getResult = await container.getPackUseCase.execute(slug);
    if (getResult.isFailure) {
      return c.json({ message: getResult.error }, getResult.error === PackError.NOT_FOUND ? 404 : 400);
    }

    await requireOwnerOrAdmin(c, getResult.value.pack.creatorId, container);

    const body = await c.req.json();
    const result = await container.updatePackUseCase.execute(slug, body);

    if (result.isFailure) {
      return c.json({ message: result.error }, result.error === PackError.NOT_FOUND ? 404 : 400);
    }

    return c.json(ContentPackMapper.toResponse(result.value));
  });

  app.patch('/:slug/status', async (c) => {
    const slug = c.req.param('slug');
    const getResult = await container.getPackUseCase.execute(slug);
    if (getResult.isFailure) {
      return c.json({ message: getResult.error }, getResult.error === PackError.NOT_FOUND ? 404 : 400);
    }

    await requireOwnerOrAdmin(c, getResult.value.pack.creatorId, container);

    const { status } = await c.req.json();
    const result = await container.changePackStatusUseCase.execute(slug, status);

    if (result.isFailure) {
      switch (result.error) {
        case PackError.NOT_FOUND:
          return c.json({ message: `Pack with slug '${slug}' not found` }, 404);
        case PackError.INVALID_STATUS:
          return c.json({ message: `Invalid status: '${status}'` }, 400);
        case PackError.INVALID_STATUS_TRANSITION:
          return c.json({ message: `Cannot transition to '${status}' from the current status` }, 422);
        default:
          return c.json({ message: result.error }, 400);
      }
    }

    return c.json(ContentPackMapper.toResponse(result.value));
  });

  app.patch('/:slug/suspend', async (c) => {
    await requireRole(c, ['admin'], container);
    const slug = c.req.param('slug');
    const body = await c.req.json();

    const result = await container.suspendPackUseCase.execute(slug, body);

    if (result.isFailure) {
      return c.json({ message: result.error }, result.error === PackError.NOT_FOUND ? 404 : 400);
    }

    return c.json(ContentPackMapper.toResponse(result.value));
  });

  app.patch('/:slug/unsuspend', async (c) => {
    await requireRole(c, ['admin'], container);
    const slug = c.req.param('slug');

    const result = await container.unsuspendPackUseCase.execute(slug);

    if (result.isFailure) {
      return c.json({ message: result.error }, result.error === PackError.NOT_FOUND ? 404 : 400);
    }

    return c.json(ContentPackMapper.toResponse(result.value));
  });

  app.delete('/:slug', async (c) => {
    const slug = c.req.param('slug');
    const getResult = await container.getPackUseCase.execute(slug);
    if (getResult.isFailure) {
      return c.json({ message: getResult.error }, getResult.error === PackError.NOT_FOUND ? 404 : 400);
    }

    await requireOwnerOrAdmin(c, getResult.value.pack.creatorId, container);

    const result = await container.deletePackUseCase.execute(slug);

    if (result.isFailure) {
      return c.json({ message: result.error }, result.error === PackError.NOT_FOUND ? 404 : 400);
    }

    return new Response(null, { status: 204 });
  });

  return app;
}
