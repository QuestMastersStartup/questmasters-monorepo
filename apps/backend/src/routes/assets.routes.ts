import { Hono } from 'hono';
import type { CloudflareBindings } from '../types/bindings';
import type { Container } from '../infrastructure/container';
import { requireOwnerOrAdmin } from '../infrastructure/auth/guards';
import { AssetMapper } from '../content/infrastructure/mappers/asset.mapper';
import { AssetError, PackError } from '../content/application/errors';

export function assetsRoutes(container: Container) {
  const app = new Hono<{ Bindings: CloudflareBindings }>();

  app.get('/', async (c) => {
    const slug = c.req.param('slug')!;
    const { type } = c.req.query();
    const result = await container.listAssetsUseCase.execute(slug, { type });

    if (result.isFailure) {
      if (result.error === AssetError.PACK_NOT_FOUND) {
        return c.json({ message: `Pack '${slug}' not found` }, 404);
      }
      return c.json({ message: result.error }, 400);
    }

    return c.json(result.value.map(AssetMapper.toResponse));
  });

  app.get('/:type/:index', async (c) => {
    const slug = c.req.param('slug')!;
    const type = c.req.param('type')!;
    const index = c.req.param('index')!;
    const result = await container.getAssetUseCase.execute(slug, type, index);

    if (result.isFailure) {
      switch (result.error) {
        case AssetError.PACK_NOT_FOUND:
          return c.json({ message: `Pack '${slug}' not found` }, 404);
        case AssetError.NOT_FOUND:
          return c.json({ message: `Asset '${type}/${index}' not found in pack '${slug}'` }, 404);
        case AssetError.INVALID_TYPE:
          return c.json({ message: `Invalid asset type: ${type}` }, 400);
        default:
          return c.json({ message: result.error }, 400);
      }
    }

    return c.json(AssetMapper.toResponse(result.value));
  });

  app.post('/', async (c) => {
    const slug = c.req.param('slug')!;
    const getResult = await container.getPackUseCase.execute(slug);
    if (getResult.isFailure) {
      return c.json({ message: getResult.error }, getResult.error === PackError.NOT_FOUND ? 404 : 400);
    }

    await requireOwnerOrAdmin(c, getResult.value.pack.creatorId, container);

    const body = await c.req.json();
    const result = await container.createAssetUseCase.execute(slug, body);

    if (result.isFailure) {
      switch (result.error) {
        case AssetError.PACK_NOT_FOUND:
          return c.json({ message: `Pack '${slug}' not found` }, 404);
        case AssetError.ALREADY_EXISTS:
          return c.json({ message: `Asset '${body.type}/${body.index}' already exists in this pack` }, 400);
        default:
          return c.json({ message: result.error }, 400);
      }
    }

    return c.json(AssetMapper.toResponse(result.value), 201);
  });

  app.put('/:type/:index', async (c) => {
    const slug = c.req.param('slug')!;
    const type = c.req.param('type')!;
    const index = c.req.param('index')!;

    const getResult = await container.getPackUseCase.execute(slug);
    if (getResult.isFailure) {
      return c.json({ message: getResult.error }, getResult.error === PackError.NOT_FOUND ? 404 : 400);
    }

    await requireOwnerOrAdmin(c, getResult.value.pack.creatorId, container);

    const body = await c.req.json();
    const result = await container.updateAssetUseCase.execute(slug, type, index, body);

    if (result.isFailure) {
      switch (result.error) {
        case AssetError.PACK_NOT_FOUND:
          return c.json({ message: `Pack '${slug}' not found` }, 404);
        case AssetError.NOT_FOUND:
          return c.json({ message: `Asset '${type}/${index}' not found in pack '${slug}'` }, 404);
        case AssetError.INVALID_TYPE:
          return c.json({ message: `Invalid asset type: ${type}` }, 400);
        default:
          return c.json({ message: result.error }, 400);
      }
    }

    return c.json(AssetMapper.toResponse(result.value));
  });

  app.delete('/:type/:index', async (c) => {
    const slug = c.req.param('slug')!;
    const type = c.req.param('type')!;
    const index = c.req.param('index')!;

    const getResult = await container.getPackUseCase.execute(slug);
    if (getResult.isFailure) {
      return c.json({ message: getResult.error }, getResult.error === PackError.NOT_FOUND ? 404 : 400);
    }

    await requireOwnerOrAdmin(c, getResult.value.pack.creatorId, container);

    const result = await container.deleteAssetUseCase.execute(slug, type, index);

    if (result.isFailure) {
      switch (result.error) {
        case AssetError.PACK_NOT_FOUND:
          return c.json({ message: `Pack '${slug}' not found` }, 404);
        case AssetError.NOT_FOUND:
          return c.json({ message: `Asset '${type}/${index}' not found in pack '${slug}'` }, 404);
        case AssetError.INVALID_TYPE:
          return c.json({ message: `Invalid asset type: ${type}` }, 400);
        default:
          return c.json({ message: result.error }, 400);
      }
    }

    return new Response(null, { status: 204 });
  });

  return app;
}
