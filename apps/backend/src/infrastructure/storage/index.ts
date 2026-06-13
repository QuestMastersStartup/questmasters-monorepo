import { createClient } from '@supabase/supabase-js';
import type { CloudflareBindings } from '../../types/bindings';
import { uploadToR2 } from './r2';

export async function uploadPortrait(
  env: CloudflareBindings,
  userId: string,
  file: File,
): Promise<string> {
  const fileExt = file.type.split('/')[1] || 'webp';
  const key = `${userId}/character-portrait-${Date.now()}.${fileExt}`;
  return uploadToR2(env.AVATARS_BUCKET, key, file, env.R2_PUBLIC_URL);
}

export async function uploadAvatar(
  env: CloudflareBindings,
  userId: string,
  file: File,
  authToken: string,
): Promise<string> {
  const key = `${userId}/avatar.webp`;

  if (env.TESIS === 'true') {
    return uploadToR2(env.AVATARS_BUCKET, key, file, env.R2_PUBLIC_URL);
  }

  // Supabase Storage path
  const client = createClient(env.SUPABASE_URL, env.SUPABASE_KEY, {
    global: { headers: { Authorization: `Bearer ${authToken}` } },
  });
  const { error } = await client.storage
    .from('avatars')
    .upload(key, file, { upsert: true, contentType: file.type });
  if (error) throw new Error(error.message);
  const { data: { publicUrl } } = client.storage.from('avatars').getPublicUrl(key);
  return publicUrl;
}
