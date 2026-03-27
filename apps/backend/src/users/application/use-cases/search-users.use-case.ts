import { UserProfileRepository } from '../../domain/repositories/user-profile.repository';
import { UserProfile } from '../../domain/entities/user-profile.entity';

export interface SearchUsersDto {
  query: string;
  limit?: number;
  excludeUserId?: string;
}

export class SearchUsersUseCase {
  constructor(private readonly userProfileRepository: UserProfileRepository) {}

  async execute(dto: SearchUsersDto): Promise<UserProfile[]> {
    if (!dto.query || dto.query.length < 2) {
      return [];
    }

    const results = await this.userProfileRepository.searchByUsername(
      dto.query,
      dto.limit || 10
    );

    // Filter out the requesting user if provided
    if (dto.excludeUserId) {
      return results.filter(profile => profile.id !== dto.excludeUserId);
    }

    return results;
  }
}
