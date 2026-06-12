import { Hono } from 'hono';
import type { CloudflareBindings } from '../types/bindings';
import type { Container } from '../infrastructure/container';
import { requireUser } from '../infrastructure/auth/guards';
import { uploadAvatar } from '../infrastructure/storage';

export function avatarRoutes(container: Container) {
  const app = new Hono<{ Bindings: CloudflareBindings }>();

  app.post('/me/avatar', async (c) => {
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

    const token = c.req.header('authorization')?.split(' ')[1] ?? '';

    try {
      const avatarUrl = await uploadAvatar(c.env, user.id, file, token);
      await container.updateUserProfileUseCase.execute({ userId: user.id, avatarUrl });
      return c.json({ message: 'Avatar updated successfully', avatarUrl });
    } catch (e: any) {
      return c.json({ message: e.message || 'Internal server error' }, 500);
    }
  });

  return app;
}
