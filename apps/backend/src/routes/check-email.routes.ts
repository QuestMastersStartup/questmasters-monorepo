import { Elysia, t } from 'elysia';
import { supabaseAdmin } from '../infrastructure/auth/supabase';

export const checkEmailRoutes = () =>
  new Elysia({ prefix: '/auth' })
    .get(
      '/check-email/:email',
      async ({ params }) => {
        const { email } = params;

        // List users and find the one with the matching email
        const { data, error } = await supabaseAdmin.auth.admin.listUsers();

        if (error) {
          console.error('Error checking email:', error);
          return { available: true };
        }

        const isAvailable = !data.users.some(u => u.email === email);

        return {
          available: isAvailable,
        };
      },
      {
        params: t.Object({
          email: t.String({ format: 'email' }),
        }),
      }
    );
