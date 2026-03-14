import { UserProfile } from '../../domain/entities/user-profile.entity';
import { UserProfileRepository } from '../../domain/repositories/user-profile.repository';

export class GetUserProfileUseCase {
  constructor(private readonly repository: UserProfileRepository) {}

  /**
   * Retrieves the profile for a given user ID.
   * If the profile does not exist (e.g. first time user), it creates and saves a default one.
   */
  async execute(userId: string): Promise<UserProfile> {
    let profile = await this.repository.findById(userId);

    if (!profile) {
      profile = UserProfile.create(userId);
      await this.repository.save(profile);
    }

    return profile;
  }
}
