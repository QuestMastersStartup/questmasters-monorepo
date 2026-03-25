export interface UserProfileProps {
  id: string; // The UUID from Supabase Auth
  username: string | null;
  avatarUrl: string | null;
  bio: string | null;
  role: 'admin' | 'creator' | 'player';
  isAdmin: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class UserProfile {
  private constructor(private readonly props: UserProfileProps) {}

  public static create(id: string): UserProfile {
    const now = new Date();
    return new UserProfile({
      id,
      username: null,
      avatarUrl: null,
      bio: null,
      role: 'player',
      isAdmin: false,
      createdAt: now,
      updatedAt: now,
    });
  }

  public static reconstruct(props: UserProfileProps): UserProfile {
    return new UserProfile(props);
  }

  public get id(): string {
    return this.props.id;
  }

  public get username(): string | null {
    return this.props.username;
  }

  public get avatarUrl(): string | null {
    return this.props.avatarUrl;
  }

  public get bio(): string | null {
    return this.props.bio;
  }

  public get role(): 'admin' | 'creator' | 'player' {
    return this.props.role;
  }

  public get isAdmin(): boolean {
    return this.props.isAdmin;
  }

  public get createdAt(): Date {
    return this.props.createdAt;
  }

  public get updatedAt(): Date {
    return this.props.updatedAt;
  }

  public update(props: { username?: string; bio?: string; avatarUrl?: string }): UserProfile {
    return new UserProfile({
      ...this.props,
      username: props.username !== undefined ? props.username : this.props.username,
      bio: props.bio !== undefined ? props.bio : this.props.bio,
      avatarUrl: props.avatarUrl !== undefined ? props.avatarUrl : this.props.avatarUrl,
      updatedAt: new Date(),
    });
  }

  public changeRole(role: 'admin' | 'creator' | 'player'): UserProfile {
    return new UserProfile({
      ...this.props,
      role,
      isAdmin: role === 'admin',
      updatedAt: new Date(),
    });
  }

  public toObject(): UserProfileProps {
    return { ...this.props };
  }
}
