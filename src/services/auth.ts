import axios from 'axios';
import type {
  AuthResponse,
  ChangePasswordRequest,
  EmailVerificationRequest,
  ForgotPasswordRequest,
  PasswordResetConfirmRequest,
  PasswordResetVerifyRequest,
  ResendVerificationRequest,
  SignInRequest,
  SignUpRequest,
  AuthTokens,
} from 'src/types/auth';
import { api } from 'src/services/api-client';

const authErrorResponse = (error: unknown, fallbackMessage: string): AuthResponse => {
  const data = axios.isAxiosError<AuthResponse>(error) ? error.response?.data : undefined;
  return {
    ...(data ?? {}),
    success: false,
    message: data?.message || fallbackMessage,
  };
};

class AuthService {
  async signUp(request: SignUpRequest): Promise<AuthResponse> {
    try {
      const response = await api.post<AuthResponse>('/api/auth/signup', request);
      return response.data;
    } catch (error: unknown) {
      return authErrorResponse(error, 'Sign up failed');
    }
  }

  async signIn(request: SignInRequest): Promise<AuthResponse> {
    try {
      const response = await api.post<AuthResponse>('/api/auth/signin', request);
      return response.data;
    } catch (error: unknown) {
      return authErrorResponse(error, 'Sign in failed');
    }
  }

  async verifyEmail(request: EmailVerificationRequest): Promise<AuthResponse> {
    try {
      const response = await api.post<AuthResponse>('/api/auth/verify-email', request);
      return response.data;
    } catch (error: unknown) {
      return authErrorResponse(error, 'Email verification failed');
    }
  }

  async resendVerificationCode(request: ResendVerificationRequest): Promise<AuthResponse> {
    try {
      const response = await api.post<AuthResponse>('/api/auth/resend-verification', request);
      return response.data;
    } catch (error: unknown) {
      return authErrorResponse(error, 'Could not resend verification code');
    }
  }

  async forgotPassword(request: ForgotPasswordRequest): Promise<AuthResponse> {
    try {
      const response = await api.post<AuthResponse>('/api/auth/forgot-password', request);
      return response.data;
    } catch (error: unknown) {
      return authErrorResponse(error, 'Could not send password reset code');
    }
  }

  async verifyPasswordResetCode(request: PasswordResetVerifyRequest): Promise<AuthResponse> {
    try {
      const response = await api.post<AuthResponse>('/api/auth/forgot-password/verify', request);
      return response.data;
    } catch (error: unknown) {
      return authErrorResponse(error, 'Password reset verification failed');
    }
  }

  async resetPassword(request: PasswordResetConfirmRequest): Promise<AuthResponse> {
    try {
      const response = await api.post<AuthResponse>('/api/auth/forgot-password/reset', request);
      return response.data;
    } catch (error: unknown) {
      return authErrorResponse(error, 'Password reset failed');
    }
  }

  async changePassword(request: ChangePasswordRequest): Promise<AuthResponse> {
    try {
      const response = await api.post<AuthResponse>('/api/account/password', request);
      return response.data;
    } catch (error: unknown) {
      return authErrorResponse(error, 'Password change failed');
    }
  }

  async refreshAccessToken(refreshToken: string | null): Promise<AuthTokens | null> {
    try {
      if (!refreshToken) {
        return null;
      }

      const response = await api.post<AuthResponse>('/api/auth/refresh', {}, {
        headers: {
          Authorization: `Bearer ${refreshToken}`,
        },
      });

      if (response.data.success && response.data.accessToken && response.data.refreshToken) {
        return {
          accessToken: response.data.accessToken,
          refreshToken: response.data.refreshToken,
        };
      }
      return null;
    } catch (error: unknown) {
      console.error('Token refresh failed:', error);
      return null;
    }
  }
}

export default new AuthService();
