import { ContentPack } from '@content/domain/entities/content-pack.entity';
import { ContentPackOrmEntity } from '../typeorm/content-pack.typeorm-entity';

export class ContentPackMapper {
  static toDomain(entity: ContentPackOrmEntity): ContentPack {
    return ContentPack.reconstruct({
      id: entity.id,
      slug: entity.slug,
      name: entity.name,
      description: entity.description ?? '',
      version: entity.version,
      type: entity.type,
      system: entity.system,
      creatorId: entity.creatorId,
      dependencies: entity.dependencies ?? [],
      isActive: entity.isActive,
      isSuspended: entity.isSuspended,
      suspensionReason: entity.suspensionReason,
      status: entity.status ?? 'draft',
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    });
  }

  static toPersistence(domain: ContentPack): ContentPackOrmEntity {
    const entity = new ContentPackOrmEntity();
    entity.id = domain.id.toString();
    entity.slug = domain.slug.toString();
    entity.name = domain.name;
    entity.description = domain.description;
    entity.version = domain.version;
    entity.type = domain.type.toString();
    entity.system = domain.system.toString();
    entity.creatorId = domain.creatorId.toString();
    entity.dependencies = domain.dependencies.map((d) => d.toString());
    entity.isActive = domain.isActive;
    entity.isSuspended = domain.isSuspended;
    entity.suspensionReason = domain.suspensionReason;
    entity.status = domain.status.toString();
    entity.createdAt = domain.createdAt;
    entity.updatedAt = domain.updatedAt;
    return entity;
  }

  static toResponse(domain: ContentPack) {
    return {
      id: domain.id.toString(),
      slug: domain.slug.toString(),
      name: domain.name,
      description: domain.description,
      version: domain.version,
      type: domain.type.toString(),
      system: domain.system.toString(),
      creatorId: domain.creatorId.toString(),
      dependencies: domain.dependencies.map((d) => d.toString()),
      isActive: domain.isActive,
      isSuspended: domain.isSuspended,
      suspensionReason: domain.suspensionReason,
      status: domain.status.toString(),
      createdAt: domain.createdAt.toISOString(),
      updatedAt: domain.updatedAt.toISOString(),
    };
  }
}
