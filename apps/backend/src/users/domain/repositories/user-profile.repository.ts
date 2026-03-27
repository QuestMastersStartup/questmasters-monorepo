import { UserProfile } from '../entities/user-profile.entity';

export interface UserProfileRepository {
  /**
   * Finds a UserProfile by its ID (which matches the Supabase User UUID)
   */
  findById(id: string): Promise<UserProfile | null>;

  /**
   * Finds a UserProfile by username to ensure uniqueness
   */
  findByUsername(username: string): Promise<UserProfile | null>;

  /**
   * Search UserProfiles by username partial match (case-insensitive)
   */
  searchByUsername(query: string, limit?: number): Promise<UserProfile[]>;

  /**
   * Saves a new or updated UserProfile
   */
  save(profile: UserProfile): Promise<void>;
}
