import { eq, like } from 'drizzle-orm';
import type { AppDb } from '../../../infrastructure/db/connection';
import { userProfiles } from '../../../infrastructure/db/schema';
import { UserProfile } from '../../domain/entities/user-profile.entity';
import type { UserProfileRepository } from '../../domain/repositories/user-profile.repository';

type Row = typeof userProfiles.$inferSelect;

function toDomain(row: Row): UserProfile {
  return UserProfile.reconstruct({
    id: row.id,
    username: row.username,
    avatarUrl: row.avatarUrl,
    bio: row.bio,
    role: row.role as 'admin' | 'creator' | 'player',
    isAdmin: row.isAdmin,
    createdAt: row.createdAt as unknown as Date,
    updatedAt: row.updatedAt as unknown as Date,
  });
}

export class UserProfileDrizzleRepository implements UserProfileRepository {
  constructor(private readonly db: AppDb) {}

  async findById(id: string): Promise<UserProfile | null> {
    const row = await this.db.query.userProfiles.findFirst({
      where: eq(userProfiles.id, id),
    });
    return row ? toDomain(row) : null;
  }

  async findByUsername(username: string): Promise<UserProfile | null> {
    const row = await this.db.query.userProfiles.findFirst({
      where: eq(userProfiles.username, username),
    });
    return row ? toDomain(row) : null;
  }

  async searchByUsername(query: string, limit = 10): Promise<UserProfile[]> {
    const rows = await this.db
      .select()
      .from(userProfiles)
      .where(like(userProfiles.username, `%${query}%`))
      .limit(limit);
    return rows.map(toDomain);
  }

  async save(profile: UserProfile): Promise<void> {
    const data = {
      id: profile.id,
      username: profile.username,
      avatarUrl: profile.avatarUrl,
      bio: profile.bio,
      role: profile.role,
      isAdmin: profile.isAdmin,
      createdAt: profile.createdAt,
      updatedAt: profile.updatedAt,
    };
    await this.db
      .insert(userProfiles)
      .values(data)
      .onConflictDoUpdate({ target: userProfiles.id, set: data });
  }
}
