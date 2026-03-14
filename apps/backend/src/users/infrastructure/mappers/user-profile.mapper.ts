import { UserProfile } from '../../domain/entities/user-profile.entity';
import { UserProfileOrmEntity } from '../adapters/out/persistence/typeorm/user-profile.typeorm-entity';

export class UserProfileMapper {
  static toDomain(entity: UserProfileOrmEntity): UserProfile {
    return UserProfile.reconstruct({
      id: entity.id,
      username: entity.username,
      avatarUrl: entity.avatarUrl,
      bio: entity.bio,
      role: entity.role,
      isAdmin: entity.isAdmin,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    });
  }

  static toPersistence(domain: UserProfile): UserProfileOrmEntity {
    const entity = new UserProfileOrmEntity();
    entity.id = domain.id;
    entity.username = domain.username;
    entity.avatarUrl = domain.avatarUrl;
    entity.bio = domain.bio;
    entity.role = domain.role;
    entity.isAdmin = domain.isAdmin;
    entity.createdAt = domain.createdAt;
    entity.updatedAt = domain.updatedAt;
    return entity;
  }
}
