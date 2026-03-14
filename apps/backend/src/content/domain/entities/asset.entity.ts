import { UUID } from '@shared/domain/value-objects/uuid.vo';
import { AssetType } from '../value-objects/asset-type.vo';
import { AssetData } from '../value-objects/asset-data.vo';

export interface CreateAssetProps {
  packId: string;
  type: string;
  index: string;
  name: string;
  data: Record<string, unknown>;
  compatibleWith?: string[];
}

export interface ReconstructAssetProps {
  id: string;
  packId: string;
  type: string;
  index: string;
  name: string;
  data: Record<string, unknown>;
  compatibleWith: string[];
  createdAt: Date;
  updatedAt: Date;
}

export class Asset {
  private constructor(
    public readonly id: UUID,
    public readonly packId: UUID,
    public readonly type: AssetType,
    public readonly index: string,
    public readonly name: string,
    public readonly data: AssetData,
    public readonly compatibleWith: UUID[],
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}

  static create(props: CreateAssetProps): Asset {
    return new Asset(
      UUID.generate(),
      UUID.fromString(props.packId),
      AssetType.create(props.type),
      props.index,
      props.name,
      AssetData.create(props.data),
      props.compatibleWith?.map((id) => UUID.fromString(id)) ?? [],
      new Date(),
      new Date(),
    );
  }

  static reconstruct(props: ReconstructAssetProps): Asset {
    return new Asset(
      UUID.fromString(props.id),
      UUID.fromString(props.packId),
      AssetType.create(props.type),
      props.index,
      props.name,
      AssetData.create(props.data),
      props.compatibleWith.map((id) => UUID.fromString(id)),
      props.createdAt,
      props.updatedAt,
    );
  }

  update(
    props: Partial<Pick<Asset, 'name' | 'data' | 'compatibleWith'>>,
  ): Asset {
    return new Asset(
      this.id,
      this.packId,
      this.type,
      this.index,
      props.name ?? this.name,
      props.data ?? this.data,
      props.compatibleWith ?? this.compatibleWith,
      this.createdAt,
      new Date(),
    );
  }
}
