import { ContentPack } from '@content/domain/entities/content-pack.entity';

export class ContentPackMapper {
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
