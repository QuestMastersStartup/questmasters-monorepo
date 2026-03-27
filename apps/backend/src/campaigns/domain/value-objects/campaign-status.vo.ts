export enum CampaignStatusValue {
  ACTIVE = 'active',
  PAUSED = 'paused',
  COMPLETED = 'completed',
}

export class CampaignStatus {
  private constructor(private readonly value: CampaignStatusValue) {}

  static create(value: string): CampaignStatus {
    if (!CampaignStatus.isValid(value)) {
      throw new Error(`Invalid CampaignStatus: ${value}`);
    }
    return new CampaignStatus(value as CampaignStatusValue);
  }

  static active(): CampaignStatus {
    return new CampaignStatus(CampaignStatusValue.ACTIVE);
  }

  static paused(): CampaignStatus {
    return new CampaignStatus(CampaignStatusValue.PAUSED);
  }

  static completed(): CampaignStatus {
    return new CampaignStatus(CampaignStatusValue.COMPLETED);
  }

  static isValid(value: string): boolean {
    return Object.values(CampaignStatusValue).includes(value as CampaignStatusValue);
  }

  canTransitionTo(newStatus: CampaignStatus): boolean {
    // Current state transition rules:
    // active <-> paused (always)
    // active -> completed (yes)
    // paused -> completed (yes)
    // completed -> anything (no, completed is terminal for US 3.1)
    
    if (this.value === CampaignStatusValue.COMPLETED) {
      return false;
    }
    
    return true; 
  }

  toString(): string {
    return this.value;
  }

  equals(other: CampaignStatus): boolean {
    return this.value === other.value;
  }
}
