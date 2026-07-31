// ---- Imports ----
import type { SessionExpiredReason } from 'src/constants/auth';

// ---- User ----
export interface User {
  id: number;
  email: string;
  fullName: string;
  role: 'ADMIN' | 'ANALYST' | 'VIEWER';
  emailVerified: boolean;
}

// ---- Request DTOs ----
export interface SignUpRequest {
  fullName: string;
  email: string;
  password: string;
  passwordConfirm: string;
}

export interface SignInRequest {
  email: string;
  password: string;
}

export interface EmailVerificationRequest {
  email: string;
  code: string;
}

export interface ResendVerificationRequest {
  email: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface PasswordResetVerifyRequest {
  email: string;
  code: string;
}

export interface PasswordResetConfirmRequest {
  email: string;
  resetToken: string;
  password: string;
  passwordConfirm: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  passwordConfirm: string;
}

// ---- Response DTOs ----
export interface AuthResponse {
  success: boolean;
  message: string;
  accessToken?: string;
  refreshToken?: string;
  user?: User;
  emailVerificationRequired?: boolean;
  passwordResetRequired?: boolean;
  email?: string;
  resetToken?: string;
  resendAvailableInSeconds?: number;
  verificationExpiresInSeconds?: number;
  remainingAttempts?: number;
}

// ---- State / Tokens ----
export interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  pendingVerificationEmail: string | null;
  pendingPasswordResetEmail: string | null;
  passwordResetToken: string | null;
  lastActivityAt: number | null;
  sessionExpiredReason: SessionExpiredReason | null;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}
