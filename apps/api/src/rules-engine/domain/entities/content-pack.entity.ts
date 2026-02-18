import { UUID } from '@shared/domain/value-objects/uuid.vo';
import { Slug } from '@shared/domain/value-objects/slug.vo';
import { PackType } from '../value-objects/pack-type.vo';
import { SystemType } from '../value-objects/system-type.vo';

export interface CreateContentPackProps {
  slug: string;
  name: string;
  description?: string;
  version?: string;
  type: string;
  system: string;
  creatorId: string;
  dependencies?: string[];
}

export interface ReconstructContentPackProps {
  id: string;
  slug: string;
  name: string;
  description: string;
  version: string;
  type: string;
  system: string;
  creatorId: string;
  dependencies: string[];
  isActive: boolean;
  isSuspended: boolean;
  suspensionReason: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export class ContentPack {
  private constructor(
    public readonly id: UUID,
    public readonly slug: Slug,
    public readonly name: string,
    public readonly description: string,
    public readonly version: string,
    public readonly type: PackType,
    public readonly system: SystemType,
    public readonly creatorId: string,
    public readonly dependencies: UUID[],
    public readonly isActive: boolean,
    public readonly isSuspended: boolean,
    public readonly suspensionReason: string | null,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}

  static create(props: CreateContentPackProps): ContentPack {
    return new ContentPack(
      UUID.generate(),
      Slug.create(props.slug),
      props.name,
      props.description ?? '',
      props.version ?? '1.0.0',
      PackType.create(props.type),
      SystemType.create(props.system),
      props.creatorId,
      props.dependencies?.map((d) => UUID.fromString(d)) ?? [],
      true,
      false,
      null,
      new Date(),
      new Date(),
    );
  }

  static reconstruct(props: ReconstructContentPackProps): ContentPack {
    return new ContentPack(
      UUID.fromString(props.id),
      Slug.fromString(props.slug),
      props.name,
      props.description,
      props.version,
      PackType.create(props.type),
      SystemType.create(props.system),
      props.creatorId,
      props.dependencies.map((d) => UUID.fromString(d)),
      props.isActive,
      props.isSuspended,
      props.suspensionReason,
      props.createdAt,
      props.updatedAt,
    );
  }

  suspend(reason: string): ContentPack {
    return new ContentPack(
      this.id,
      this.slug,
      this.name,
      this.description,
      this.version,
      this.type,
      this.system,
      this.creatorId,
      this.dependencies,
      this.isActive,
      true,
      reason,
      this.createdAt,
      new Date(),
    );
  }

  unsuspend(): ContentPack {
    return new ContentPack(
      this.id,
      this.slug,
      this.name,
      this.description,
      this.version,
      this.type,
      this.system,
      this.creatorId,
      this.dependencies,
      this.isActive,
      false,
      null,
      this.createdAt,
      new Date(),
    );
  }

  deactivate(): ContentPack {
    return new ContentPack(
      this.id,
      this.slug,
      this.name,
      this.description,
      this.version,
      this.type,
      this.system,
      this.creatorId,
      this.dependencies,
      false,
      this.isSuspended,
      this.suspensionReason,
      this.createdAt,
      new Date(),
    );
  }

  update(
    props: Partial<Pick<ContentPack, 'name' | 'description' | 'version'>>,
  ): ContentPack {
    return new ContentPack(
      this.id,
      this.slug,
      props.name ?? this.name,
      props.description ?? this.description,
      props.version ?? this.version,
      this.type,
      this.system,
      this.creatorId,
      this.dependencies,
      this.isActive,
      this.isSuspended,
      this.suspensionReason,
      this.createdAt,
      new Date(),
    );
  }
}
