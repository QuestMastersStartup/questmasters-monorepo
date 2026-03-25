import { Elysia, t } from 'elysia';
import { requireUser, supabaseClient } from '../infrastructure/auth/supabase';
import { Container } from '../infrastructure/container';

export const avatarRoutes = (container: Container) =>
  new Elysia({ prefix: '/users' })
    .post(
      '/me/avatar',
      async ({ request, set, body }) => {
        const user = await requireUser(request, set);
        const { file } = body;

        // 1. Validation (5MB limit as requested)
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

        // 2. Upload to Supabase Storage
        const fileExt = file.type.split('/')[1] || 'webp';
        const fileName = `${user.id}/avatar-${Date.now()}.${fileExt}`;
        
        try {
          const { data: uploadData, error: uploadError } = await supabaseClient
            .storage
            .from('avatars')
            .upload(fileName, file, {
              upsert: true,
              contentType: file.type
            });

          if (uploadError) {
            console.error('Upload Error:', uploadError);
            set.status = 500;
            return { message: 'Failed to upload image to storage' };
          }

          // 3. Get Public URL
          const { data: { publicUrl } } = supabaseClient
            .storage
            .from('avatars')
            .getPublicUrl(fileName);

          // 4. Update Profile
          await container.updateUserProfileUseCase.execute({
            userId: user.id,
            avatarUrl: publicUrl
          });

          return { 
            message: 'Avatar updated successfully',
            avatarUrl: publicUrl
          };

        } catch (e: any) {
          console.error('Avatar Error:', e);
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
