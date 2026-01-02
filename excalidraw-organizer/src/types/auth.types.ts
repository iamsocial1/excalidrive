export interface User {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
  preferences: {
    theme: 'light' | 'dark' | 'system';
    defaultViewMode: 'list' | 'icon';
  };
}

export interface AuthResponse {
  user: User;
  token: string;
  refreshToken?: string;
}

export interface SignupRequest {
  name: string;
  email: string;
  password: string;
}

export interface SigninRequest {
  email: string;
  password: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface UpdateProfileRequest {
  name?: string;
  email?: string;
  preferences?: Partial<User['preferences']>;
}

export interface TokenPayload {
  userId: string;
  email: string;
  exp: number;
  iat: number;
}
