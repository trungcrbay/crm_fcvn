export class RefreshTokenEntity {
  private constructor(
    public readonly id: number,
    private _token: string,
    private _userId: number,
    private _expiresAt: Date,
    public readonly createdAt?: Date,
    public readonly updatedAt?: Date,
  ) {}

  get token(): string {
    return this._token;
  }

  get userId(): number {
    return this._userId;
  }

  get expiresAt(): Date {
    return this._expiresAt;
  }

  get isExpired(): boolean {
    return new Date() > this._expiresAt;
  }

  static create(props: {
    id: number;
    token: string;
    userId: number;
    expiresAt: Date;
    createdAt?: Date;
    updatedAt?: Date;
  }): RefreshTokenEntity {
    if (!props.token || props.token.trim().length === 0) {
      throw new Error('Refresh token không được để trống');
    }

    return new RefreshTokenEntity(
      props.id,
      props.token.trim(),
      props.userId,
      props.expiresAt,
      props.createdAt ?? new Date(),
      props.updatedAt ?? new Date(),
    );
  }
}
