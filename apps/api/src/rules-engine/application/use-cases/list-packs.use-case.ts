import { ContentPack } from '../../domain/entities/content-pack.entity';
import {
  ContentPackRepository,
  ContentPackFilters,
  CONTENT_PACK_REPOSITORY,
} from '../../domain/repositories/content-pack.repository';

export class ListPacksUseCase {
  constructor(private readonly packRepository: ContentPackRepository) {}

  async execute(filters?: ContentPackFilters): Promise<ContentPack[]> {
    return this.packRepository.findAll(filters);
  }
}
