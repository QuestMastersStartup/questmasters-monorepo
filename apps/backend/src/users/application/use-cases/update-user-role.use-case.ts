import { UserProfile } from '../../domain/entities/user-profile.entity';
import { UserProfileRepository } from '../../domain/repositories/user-profile.repository';

export interface UpdateUserRoleRequest {
  userId: string;
  role: 'admin' | 'creator' | 'player';
}

export class UpdateUserRoleUseCase {
  constructor(private readonly repository: UserProfileRepository) {}

  async execute(request: UpdateUserRoleRequest): Promise<UserProfile> {
    const profile = await this.repository.findById(request.userId);

    if (!profile) {
      throw new Error('User profile not found.');
    }

    const updatedProfile = profile.changeRole(request.role);
    await this.repository.save(updatedProfile);

    return updatedProfile;
  }
}
