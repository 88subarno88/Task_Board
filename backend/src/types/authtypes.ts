export interface AuthUser {
  id: string;
  email: string;
  name: string;
  globalRole: string;
}

export interface AuthResponse {
  user: AuthUser;
  accessToken: string;
}

export interface RegisterDto {
  email: string;
  password: string;
  name: string;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export interface RefreshTokenDto {
  refreshToken: string;
}
