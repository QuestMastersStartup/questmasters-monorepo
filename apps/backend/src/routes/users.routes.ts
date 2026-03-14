import { Elysia, t } from 'elysia';
import { Container } from '../infrastructure/container';
import { requireUser } from '../infrastructure/auth/supabase';

// Helper to sanitize internal properties before sending to client
function sanitizeProfile(profile: any) {
  const { id, username, avatarUrl, bio, role, isAdmin, createdAt } = profile;
  return { id, username, avatarUrl, bio, role, isAdmin, createdAt };
}

export const usersRoutes = (container: Container) =>
  new Elysia({ prefix: '/users' })
    .get('/me', async ({ request, set }) => {
      const user = await requireUser(request, set);
      const profile = await container.getUserProfileUseCase.execute(user.id);
      return sanitizeProfile(profile);
    })
    .put(
      '/me',
      async ({ request, body, set }) => {
        const user = await requireUser(request, set);
        try {
          const profile = await container.updateUserProfileUseCase.execute({
            userId: user.id,
            ...body,
          });
          return sanitizeProfile(profile);
        } catch (e: any) {
          if (e.message.includes('already taken')) {
            set.status = 409;
            return { message: e.message };
          }
          set.status = 400;
          return { message: e.message };
        }
      },
      {
        body: t.Object({
          username: t.Optional(t.String({ minLength: 3, maxLength: 50 })),
          bio: t.Optional(t.String({ maxLength: 500 })),
          avatarUrl: t.Optional(t.String()),
        }),
      },
    );
