import { Elysia, t } from 'elysia';
import { Container } from '../infrastructure/container';

export const usernameRoutes = (container: Container) =>
  new Elysia({ prefix: '/users' })
    .get(
      '/check-username/:username',
      async ({ params }) => {
        const { username } = params;
        
        // We can use the profile repository indirectly or the use case if exists.
        // Let's check if there's a simple way via the use cases or repository.
        const profile = await container.userProfileRepo.findByUsername(username);
        
        return {
          available: !profile,
        };
      },
      {
        params: t.Object({
          username: t.String(),
        }),
      }
    );
