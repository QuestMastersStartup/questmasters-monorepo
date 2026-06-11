import { Hono } from 'hono';
import { createClient } from '@supabase/supabase-js';
import type { CloudflareBindings } from '../types/bindings';
import type { Container } from '../infrastructure/container';
import { requireUser } from '../infrastructure/auth/supabase';

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

    const token = c.req.header('authorization')?.split(' ')[1];
    if (!token) return c.json({ message: 'Missing authentication token' }, 401);

    const userSupabase = createClient(c.env.SUPABASE_URL, c.env.SUPABASE_KEY, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });

    const fileExt = file.type.split('/')[1] || 'webp';
    const fileName = `${user.id}/avatar-${Date.now()}.${fileExt}`;

    try {
      const { error: uploadError } = await userSupabase.storage
        .from('avatars')
        .upload(fileName, file, { upsert: true, contentType: file.type });

      if (uploadError) {
        return c.json({ message: uploadError.message || 'Failed to upload image to storage' }, 500);
      }

      const { data: { publicUrl } } = userSupabase.storage.from('avatars').getPublicUrl(fileName);

      await container.updateUserProfileUseCase.execute({ userId: user.id, avatarUrl: publicUrl });

      return c.json({ message: 'Avatar updated successfully', avatarUrl: publicUrl });
    } catch (e: any) {
      return c.json({ message: e.message || 'Internal server error' }, 500);
    }
  });

  return app;
}
