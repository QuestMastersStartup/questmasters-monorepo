import { ContentPack } from '../entities/content-pack.entity';
import { UUID } from '@shared/domain/value-objects/uuid.vo';
import { Slug } from '@shared/domain/value-objects/slug.vo';

export interface ContentPackFilters {
  type?: string;
  creatorId?: string;
  isActive?: boolean;
  isSuspended?: boolean;
  status?: string;
}

export interface ContentPackRepository {
  save(pack: ContentPack): Promise<void>;
  findById(id: UUID): Promise<ContentPack | null>;
  findBySlug(slug: Slug): Promise<ContentPack | null>;
  findAll(filters?: ContentPackFilters): Promise<ContentPack[]>;
  delete(id: UUID): Promise<void>;
  existsBySlug(slug: Slug): Promise<boolean>;
}

export const CONTENT_PACK_REPOSITORY = Symbol('ContentPackRepository');
