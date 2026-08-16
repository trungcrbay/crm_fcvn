export interface AcessTokenPayloadCreate {
  userId: number;
  roleId: number;
  roleName: string;
}

export interface AccessTokenPayload extends AcessTokenPayloadCreate {
  exp: number;
  iat: number;
}

export interface RefreshTokenPayloadCreate {
  userId: number;
}

export interface RefreshTokenPayload extends RefreshTokenPayloadCreate {
  exp: number;
  iat: number;
}
