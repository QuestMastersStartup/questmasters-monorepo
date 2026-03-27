import { UserProfile } from '../../domain/entities/user-profile.entity';
import { UserProfileRepository } from '../../domain/repositories/user-profile.repository';

export class GetUserProfileUseCase {
  constructor(private readonly repository: UserProfileRepository) {}

  /**
   * Retrieves the profile for a given user ID.
   * If the profile does not exist (e.g. first time user), it creates and saves a default one.
   */
  async execute(userId: string, metadataUsername?: string): Promise<UserProfile> {
    let profile = await this.repository.findById(userId);

    if (!profile) {
      profile = UserProfile.create(userId);
      if (metadataUsername) {
        profile = profile.update({ username: metadataUsername });
      }
      await this.repository.save(profile);
    } else if (!profile.username && metadataUsername) {
      // If profile exists but has no username, and we have one from metadata, sync it
      profile = profile.update({ username: metadataUsername });
      await this.repository.save(profile);
    }

    return profile;
  }
}
