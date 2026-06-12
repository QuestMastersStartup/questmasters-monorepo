import { Hono } from 'hono';
import type { CloudflareBindings } from '../types/bindings';
import type { Container } from '../infrastructure/container';
import { requireUser, requireRole } from '../infrastructure/auth/guards';

function sanitizeProfile(profile: any) {
  const { id, username, avatarUrl, bio, role, isAdmin, createdAt } = profile;
  return { id, username, avatarUrl, bio, role, isAdmin, createdAt };
}

export function usersRoutes(container: Container) {
  const app = new Hono<{ Bindings: CloudflareBindings }>();

  app.get('/search', async (c) => {
    const user = await requireUser(c);
    const q = c.req.query('q');

    if (!q || q.length < 2) return c.json([]);

    const results = await container.searchUsersUseCase.execute({
      query: q,
      excludeUserId: user.id,
      limit: 10,
    });

    return c.json(results.map((p) => ({ id: p.id, username: p.username, avatarUrl: p.avatarUrl })));
  });

  app.get('/me', async (c) => {
    const user = await requireUser(c);
    const metadataUsername = user.username;
    const profile = await container.getUserProfileUseCase.execute(user.id, metadataUsername);
    return c.json(sanitizeProfile(profile));
  });

  app.put('/me', async (c) => {
    const user = await requireUser(c);
    const body = await c.req.json();
    try {
      const profile = await container.updateUserProfileUseCase.execute({ userId: user.id, ...body });
      return c.json(sanitizeProfile(profile));
    } catch (e: any) {
      if (e.message.includes('already taken')) return c.json({ message: e.message }, 409);
      return c.json({ message: e.message }, 400);
    }
  });

  app.patch('/:id/role', async (c) => {
    await requireRole(c, ['admin'], container);
    const id = c.req.param('id');
    const body = await c.req.json();
    try {
      const profile = await container.updateUserRoleUseCase.execute({ userId: id, role: body.role });
      return c.json(sanitizeProfile(profile));
    } catch (e: any) {
      return c.json({ message: e.message }, 400);
    }
  });

  return app;
}
