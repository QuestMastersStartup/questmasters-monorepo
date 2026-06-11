import { Hono } from 'hono';
import type { CloudflareBindings } from '../types/bindings';
import type { Container } from '../infrastructure/container';

export function rulesRoutes(container: Container) {
  const app = new Hono<{ Bindings: CloudflareBindings }>();

  app.post('/resolve', async (c) => {
    const body = await c.req.json();
    const result = container.resolveAssetUseCase.execute(body);
    return c.json(result);
  });

  return app;
}
