import { createClient } from '@supabase/supabase-js';
import type { DataSource } from 'typeorm';
import { UserProfileOrmEntity } from '../users/infrastructure/adapters/out/persistence/typeorm/user-profile.typeorm-entity';

const ADMIN_EMAIL = 'admin@mail.com';
const ADMIN_PASSWORD = 'admin123';
const ADMIN_USERNAME = 'superadmin';

/**
 * Seeds a super-admin user in Supabase Auth and the local user_profiles table.
 * Requires SUPABASE_SERVICE_ROLE_KEY to create users via the Admin API.
 * Idempotent — skips if the admin profile already exists.
 */
export async function seedAdminUser(dataSource: DataSource): Promise<void> {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabaseUrl = process.env.SUPABASE_URL;

  if (!serviceRoleKey || !supabaseUrl) {
    console.warn('⚠️ SUPABASE_SERVICE_ROLE_KEY not set — skipping admin seed.');
    return;
  }

  const profileRepo = dataSource.getRepository(UserProfileOrmEntity);

  // Check if any admin profile already exists
  const existing = await profileRepo.findOne({ where: { isAdmin: true } });
  if (existing) {
    console.log('✅ Super admin already exists, skipping seed.');
    return;
  }

  // Create an admin client with the service_role key
  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // Check if the user already exists in Supabase Auth
  const { data: listData } = await adminClient.auth.admin.listUsers();
  const existingUser = listData?.users?.find((u) => u.email === ADMIN_EMAIL);

  let userId: string;

  if (existingUser) {
    userId = existingUser.id;
    console.log('🔑 Supabase admin user already exists, reusing ID.');
  } else {
    // Create user via Admin API — bypasses email validation and auto-confirms
    const { data, error } = await adminClient.auth.admin.createUser({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      email_confirm: true,
    });

    if (error || !data.user) {
      console.error('❌ Failed to create admin in Supabase Auth:', error?.message);
      return;
    }

    userId = data.user.id;
    console.log('🔑 Created admin user in Supabase Auth.');
  }

  // Create the profile with isAdmin = true
  const profile = new UserProfileOrmEntity();
  profile.id = userId;
  profile.username = ADMIN_USERNAME;
  profile.avatarUrl = null;
  profile.bio = 'QuestMasters Super Administrator';
  profile.role = 'admin';
  profile.isAdmin = true;

  await profileRepo.save(profile);
  console.log(`✅ Super admin profile seeded (${ADMIN_EMAIL} / ${ADMIN_USERNAME})`);
}
