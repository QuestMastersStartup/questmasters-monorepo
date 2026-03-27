import { UUID } from '@shared/domain/value-objects/uuid.vo';
import { SystemType } from '@content/domain/value-objects/system-type.vo';
import { CampaignStatus } from '../value-objects/campaign-status.vo';

export interface CreateCampaignProps {
  name: string;
  description?: string;
  system: string;
  coverImageUrl?: string;
  dmId: string;
  installedPackIds?: string[];
}

export interface ReconstructCampaignProps {
  id: string;
  name: string;
  description: string;
  system: string;
  coverImageUrl: string | null;
  dmId: string;
  status: string;
  installedPackIds: string[];
  createdAt: Date;
  updatedAt: Date;
}

export class Campaign {
  private constructor(
    public readonly id: UUID,
    public readonly name: string,
    public readonly description: string,
    public readonly system: SystemType,
    public readonly coverImageUrl: string | null,
    public readonly dmId: string,
    public readonly status: CampaignStatus,
    public readonly installedPackIds: UUID[],
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}

  static create(props: CreateCampaignProps): Campaign {
    return new Campaign(
      UUID.generate(),
      props.name,
      props.description ?? '',
      SystemType.create(props.system),
      props.coverImageUrl ?? null,
      props.dmId,
      CampaignStatus.active(),
      props.installedPackIds?.map(id => UUID.fromString(id)) ?? [],
      new Date(),
      new Date(),
    );
  }

  static reconstruct(props: ReconstructCampaignProps): Campaign {
    return new Campaign(
      UUID.fromString(props.id),
      props.name,
      props.description,
      SystemType.create(props.system),
      props.coverImageUrl,
      props.dmId,
      CampaignStatus.create(props.status),
      props.installedPackIds.map(id => UUID.fromString(id)),
      props.createdAt,
      props.updatedAt,
    );
  }

  update(props: Partial<Pick<Campaign, 'name' | 'description' | 'coverImageUrl'>>): Campaign {
    return new Campaign(
      this.id,
      props.name ?? this.name,
      props.description ?? this.description,
      this.system,
      props.coverImageUrl !== undefined ? props.coverImageUrl : this.coverImageUrl,
      this.dmId,
      this.status,
      this.installedPackIds,
      this.createdAt,
      new Date(),
    );
  }

  changeStatus(newStatus: CampaignStatus): Campaign {
    if (!this.status.canTransitionTo(newStatus)) {
      throw new Error(`Cannot transition from ${this.status.toString()} to ${newStatus.toString()}`);
    }
    return new Campaign(
      this.id,
      this.name,
      this.description,
      this.system,
      this.coverImageUrl,
      this.dmId,
      newStatus,
      this.installedPackIds,
      this.createdAt,
      new Date(),
    );
  }

  installPacks(packIds: UUID[]): Campaign {
    // Basic deduplication
    const currentPackIds = new Set(this.installedPackIds.map(id => id.toString()));
    const newPackIds = [...this.installedPackIds];
    
    packIds.forEach(id => {
      if (!currentPackIds.has(id.toString())) {
        newPackIds.push(id);
      }
    });

    return new Campaign(
      this.id,
      this.name,
      this.description,
      this.system,
      this.coverImageUrl,
      this.dmId,
      this.status,
      newPackIds,
      this.createdAt,
      new Date(),
    );
  }

  uninstallPacks(packIds: UUID[]): Campaign {
    const toRemove = new Set(packIds.map(id => id.toString()));
    const newPackIds = this.installedPackIds.filter(id => !toRemove.has(id.toString()));

    return new Campaign(
      this.id,
      this.name,
      this.description,
      this.system,
      this.coverImageUrl,
      this.dmId,
      this.status,
      newPackIds,
      this.createdAt,
      new Date(),
    );
  }
}
