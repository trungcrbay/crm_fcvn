export interface LoginCommand {
  email: string;
  password?: string;
}

export interface RefreshTokenCommand {
  refreshToken: string;
}

export interface LogoutCommand {
  refreshToken: string;
}
