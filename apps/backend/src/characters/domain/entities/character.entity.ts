import { UUID } from '@shared/domain/value-objects/uuid.vo';
import { AbilityScores } from '@questmasters/dnd-rules';
import { CharacterStatus } from '../value-objects/character-status.vo';

export interface CreateCharacterProps {
  campaignId?: string; // Opcional: personajes libres
  userId: string;
  name: string;
  raceAssetId: string;
  classAssetId: string;
  backgroundAssetId?: string;
  stats: AbilityScores;
  hitPoints: number;
  portraitUrl?: string;
  backstory?: string;
  choices?: Record<string, any>;
}

export interface ReconstructCharacterProps {
  id: string;
  campaignId: string | null;
  userId: string;
  name: string;
  raceAssetId: string;
  classAssetId: string;
  backgroundAssetId: string | null;
  level: number;
  stats: AbilityScores;
  hitPoints: number;
  portraitUrl: string | null;
  backstory: string | null;
  status: string;
  choices: Record<string, any> | null;
  createdAt: Date;
  updatedAt: Date;
}

export class Character {
  private constructor(
    public readonly id: UUID,
    public readonly campaignId: UUID | null,
    public readonly userId: string,
    public readonly name: string,
    public readonly raceAssetId: UUID,
    public readonly classAssetId: UUID,
    public readonly backgroundAssetId: UUID | null,
    public readonly level: number,
    public readonly stats: AbilityScores,
    public readonly hitPoints: number,
    public readonly portraitUrl: string | null,
    public readonly backstory: string | null,
    public readonly status: CharacterStatus,
    public readonly choices: Record<string, any> | null,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}

  static create(props: CreateCharacterProps): Character {
    return new Character(
      UUID.generate(),
      props.campaignId ? UUID.fromString(props.campaignId) : null,
      props.userId,
      props.name,
      UUID.fromString(props.raceAssetId),
      UUID.fromString(props.classAssetId),
      props.backgroundAssetId ? UUID.fromString(props.backgroundAssetId) : null,
      1,
      props.stats,
      props.hitPoints,
      props.portraitUrl ?? null,
      props.backstory ?? null,
      CharacterStatus.active(),
      props.choices ?? null,
      new Date(),
      new Date(),
    );
  }

  static reconstruct(props: ReconstructCharacterProps): Character {
    return new Character(
      UUID.fromString(props.id),
      props.campaignId ? UUID.fromString(props.campaignId) : null,
      props.userId,
      props.name,
      UUID.fromString(props.raceAssetId),
      UUID.fromString(props.classAssetId),
      props.backgroundAssetId ? UUID.fromString(props.backgroundAssetId) : null,
      props.level,
      props.stats,
      props.hitPoints,
      props.portraitUrl,
      props.backstory,
      CharacterStatus.create(props.status),
      props.choices,
      props.createdAt,
      props.updatedAt,
    );
  }

  /**
   * Update owner-controlled fields.
   */
  update(props: Partial<Pick<Character, 'name' | 'portraitUrl' | 'backstory' | 'choices'>>): Character {
    return new Character(
      this.id,
      this.campaignId,
      this.userId,
      props.name ?? this.name,
      this.raceAssetId,
      this.classAssetId,
      this.backgroundAssetId,
      this.level,
      this.stats,
      this.hitPoints,
      props.portraitUrl !== undefined ? props.portraitUrl : this.portraitUrl,
      props.backstory !== undefined ? props.backstory : this.backstory,
      this.status,
      props.choices !== undefined ? props.choices : this.choices,
      this.createdAt,
      new Date(),
    );
  }

  /**
   * Update DM-controlled fields.
   */
  updateByDm(props: Partial<Pick<Character, 'stats' | 'level' | 'hitPoints' | 'status'>>): Character {
    return new Character(
      this.id,
      this.campaignId,
      this.userId,
      this.name,
      this.raceAssetId,
      this.classAssetId,
      this.backgroundAssetId,
      props.level ?? this.level,
      props.stats ?? this.stats,
      props.hitPoints ?? this.hitPoints,
      this.portraitUrl,
      this.backstory,
      props.status ?? this.status,
      this.choices,
      this.createdAt,
      new Date(),
    );
  }

  changeStatus(newStatus: CharacterStatus): Character {
    if (!this.status.canTransitionTo(newStatus)) {
      throw new Error(`Cannot transition from ${this.status.toString()} to ${newStatus.toString()}`);
    }
    return new Character(
      this.id,
      this.campaignId,
      this.userId,
      this.name,
      this.raceAssetId,
      this.classAssetId,
      this.backgroundAssetId,
      this.level,
      this.stats,
      this.hitPoints,
      this.portraitUrl,
      this.backstory,
      newStatus,
      this.choices,
      this.createdAt,
      new Date(),
    );
  }

  levelUp(newLevel: number, newHitPoints: number): Character {
    if (newLevel <= this.level) {
      throw new Error(`New level ${newLevel} must be greater than current level ${this.level}`);
    }
    return new Character(
      this.id,
      this.campaignId,
      this.userId,
      this.name,
      this.raceAssetId,
      this.classAssetId,
      this.backgroundAssetId,
      newLevel,
      this.stats,
      newHitPoints,
      this.portraitUrl,
      this.backstory,
      this.status,
      this.choices,
      this.createdAt,
      new Date(),
    );
  }
}
