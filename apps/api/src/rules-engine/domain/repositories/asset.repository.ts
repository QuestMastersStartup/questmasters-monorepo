import { Asset } from '../entities/asset.entity';
import { UUID } from '@shared/domain/value-objects/uuid.vo';
import { AssetType } from '../value-objects/asset-type.vo';

export interface AssetFilters {
  type?: string;
  compatibleWith?: string;
}

export interface AssetRepository {
  save(asset: Asset): Promise<void>;
  findById(id: UUID): Promise<Asset | null>;
  findByPackAndTypeAndIndex(
    packId: UUID,
    type: AssetType,
    index: string,
  ): Promise<Asset | null>;
  findAllByPack(packId: UUID, filters?: AssetFilters): Promise<Asset[]>;
  findAllByType(packId: UUID, type: AssetType): Promise<Asset[]>;
  delete(id: UUID): Promise<void>;
  deleteAllByPack(packId: UUID): Promise<void>;
  existsByPackAndTypeAndIndex(
    packId: UUID,
    type: AssetType,
    index: string,
  ): Promise<boolean>;
}

export const ASSET_REPOSITORY = Symbol('AssetRepository');
