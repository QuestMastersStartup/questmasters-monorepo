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
   * Saves a new or updated UserProfile
   */
  save(profile: UserProfile): Promise<void>;
}
