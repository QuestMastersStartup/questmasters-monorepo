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
): Promise<string> {
  const key = `${userId}/avatar.webp`;
  return uploadToR2(env.AVATARS_BUCKET, key, file, env.R2_PUBLIC_URL);
}

export async function uploadCampaignPortrait(
  env: CloudflareBindings,
  userId: string,
  file: File,
): Promise<string> {
  const fileExt = file.type.split('/')[1] || 'webp';
  const key = `${userId}/campaign-portrait-${Date.now()}.${fileExt}`;
  return uploadToR2(env.AVATARS_BUCKET, key, file, env.R2_PUBLIC_URL);
}
