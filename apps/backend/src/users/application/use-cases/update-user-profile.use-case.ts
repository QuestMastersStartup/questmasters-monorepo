import { UserProfile } from '../../domain/entities/user-profile.entity';
import { UserProfileRepository } from '../../domain/repositories/user-profile.repository';

export interface UpdateUserProfileRequest {
  userId: string;
  username?: string;
  bio?: string;
  avatarUrl?: string;
}

export class UpdateUserProfileUseCase {
  constructor(private readonly repository: UserProfileRepository) {}

  async execute(request: UpdateUserProfileRequest): Promise<UserProfile> {
    const profile = await this.repository.findById(request.userId);

    if (!profile) {
      throw new Error('User profile not found. Call GetUserProfile first.');
    }

    // Check username uniqueness if they are trying to change it
    if (request.username && request.username !== profile.username) {
      const existing = await this.repository.findByUsername(request.username);
      if (existing) {
        throw new Error(`Username '${request.username}' is already taken.`);
      }
    }

    const updatedProfile = profile.update({
      username: request.username,
      bio: request.bio,
      avatarUrl: request.avatarUrl,
    });

    await this.repository.save(updatedProfile);

    return updatedProfile;
  }
}
