import { Hono } from 'hono';
import type { CloudflareBindings } from '../types/bindings';
import type { Container } from '../infrastructure/container';

export function usernameRoutes(container: Container) {
  const app = new Hono<{ Bindings: CloudflareBindings }>();

  app.get('/check-username/:username', async (c) => {
    const username = c.req.param('username');
    const profile = await container.userProfileRepo.findByUsername(username);
    return c.json({ available: !profile });
  });

  return app;
}
