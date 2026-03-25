import { Elysia, t } from 'elysia';
import { createClient } from '@supabase/supabase-js';
import { requireUser } from '../infrastructure/auth/supabase';
import { Container } from '../infrastructure/container';

export const avatarRoutes = (container: Container) =>
  new Elysia({ prefix: '/users' })
    .post(
      '/me/avatar',
      async ({ request, set, body }) => {
        const user = await requireUser(request, set);
        const { file } = body;

        // 1. Validation (5MB limit)
        const MAX_SIZE = 5 * 1024 * 1024;
        if (file.size > MAX_SIZE) {
          set.status = 413;
          return { message: 'File too large (max 5MB)' };
        }

        const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
        if (!ALLOWED_TYPES.includes(file.type)) {
          set.status = 400;
          return { message: 'Invalid file type. Only JPEG, PNG, WEBP and GIF are allowed.' };
        }

        // 2. Prepare Auth-aware Supabase Client
        // We use the user's token to satisfy RLS policies in Storage
        const authHeader = request.headers.get('authorization');
        const token = authHeader?.split(' ')[1];
        
        if (!token) {
          set.status = 401;
          return { message: 'Missing authentication token' };
        }

        const userSupabase = createClient(
          process.env.SUPABASE_URL || '',
          process.env.SUPABASE_KEY || '', // Anon key
          { global: { headers: { Authorization: `Bearer ${token}` } } }
        );

        // 3. Upload to Supabase Storage
        const fileExt = file.type.split('/')[1] || 'webp';
        const fileName = `${user.id}/avatar-${Date.now()}.${fileExt}`;
        
        try {
          const { data: uploadData, error: uploadError } = await userSupabase
            .storage
            .from('avatars')
            .upload(fileName, file, {
              upsert: true,
              contentType: file.type
            });

          if (uploadError) {
            console.error('Storage Upload Error Detail:', uploadError);
            set.status = 500;
            return { message: uploadError.message || 'Failed to upload image to storage' };
          }

          // 4. Get Public URL (use the default client for public URL)
          const { data: { publicUrl } } = userSupabase
            .storage
            .from('avatars')
            .getPublicUrl(fileName);

          console.log('Generated Public URL:', publicUrl);

          // 5. Update Profile
          await container.updateUserProfileUseCase.execute({
            userId: user.id,
            avatarUrl: publicUrl
          });

          return { 
            message: 'Avatar updated successfully',
            avatarUrl: publicUrl
          };

        } catch (e: any) {
          console.error('Avatar Request Error:', e);
          set.status = 500;
          return { message: e.message || 'Internal server error' };
        }
      },
      {
        body: t.Object({
          file: t.File(),
        }),
      }
    );
