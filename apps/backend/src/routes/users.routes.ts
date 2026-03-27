import { Elysia, t } from 'elysia';
import { Container } from '../infrastructure/container';
import { requireUser, requireRole } from '../infrastructure/auth/supabase';

// Helper to sanitize internal properties before sending to client
function sanitizeProfile(profile: any) {
  const { id, username, avatarUrl, bio, role, isAdmin, createdAt } = profile;
  return { id, username, avatarUrl, bio, role, isAdmin, createdAt };
}

export const usersRoutes = (container: Container) =>
  new Elysia({ prefix: '/users' })
    .get('/search', async ({ query, request, set }) => {
      const user = await requireUser(request, set);
      const q = query.q as string;
      
      if (!q || q.length < 2) {
        return [];
      }

      const results = await container.searchUsersUseCase.execute({
        query: q,
        excludeUserId: user.id,
        limit: 10
      });

      return results.map(p => ({
        id: p.id,
        username: p.username,
        avatarUrl: p.avatarUrl
      }));
    }, {
      query: t.Object({
        q: t.String({ minLength: 2 })
      })
    })
    .get('/me', async ({ request, set }) => {
      const user = await requireUser(request, set);
      const metadataUsername = user.user_metadata?.username;
      const profile = await container.getUserProfileUseCase.execute(user.id, metadataUsername);
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
    )
    .patch(
      '/:id/role',
      async ({ params, body, request, set }) => {
        await requireRole(request, set, ['admin'], container);

        try {
          const profile = await container.updateUserRoleUseCase.execute({
            userId: params.id,
            role: body.role as any,
          });
          return sanitizeProfile(profile);
        } catch (e: any) {
          set.status = 400;
          return { message: e.message };
        }
      },
      {
        params: t.Object({
          id: t.String({ description: 'The UUID of the user' }),
        }),
        body: t.Object({
          role: t.String({
            description: 'The new role',
            enum: ['admin', 'creator', 'player'],
          }),
        }),
      },
    );
