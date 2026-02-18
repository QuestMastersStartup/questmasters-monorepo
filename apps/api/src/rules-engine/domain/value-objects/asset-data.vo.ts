export class AssetData {
  private constructor(private readonly value: Record<string, unknown>) {}

  static create(data: Record<string, unknown>): AssetData {
    if (!data || typeof data !== 'object') {
      throw new Error('AssetData must be a valid object');
    }
    return new AssetData({ ...data });
  }

  static empty(): AssetData {
    return new AssetData({});
  }

  toObject(): Record<string, unknown> {
    return { ...this.value };
  }

  get<T>(key: string): T | undefined {
    return this.value[key] as T | undefined;
  }

  has(key: string): boolean {
    return key in this.value;
  }

  merge(other: AssetData): AssetData {
    return new AssetData({
      ...this.value,
      ...other.value,
    });
  }
}
