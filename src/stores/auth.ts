import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import type {
  AuthState,
  AuthTokens,
  ChangePasswordRequest,
  EmailVerificationRequest,
  ForgotPasswordRequest,
  PasswordResetConfirmRequest,
  PasswordResetVerifyRequest,
  ResendVerificationRequest,
  SignInRequest,
  SignUpRequest,
  User,
} from 'src/types/auth';
import authService from 'src/services/auth';

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null);
  const accessToken = ref<string | null>(null);
  const refreshToken = ref<string | null>(null);
  const pendingVerificationEmail = ref<string | null>(localStorage.getItem('pendingVerificationEmail'));
  const pendingPasswordResetEmail = ref<string | null>(localStorage.getItem('pendingPasswordResetEmail'));
  const passwordResetToken = ref<string | null>(localStorage.getItem('passwordResetToken'));
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  // Computed properties
  const isAuthenticated = computed(() => !!accessToken.value && !!user.value);

  const authState = computed<AuthState>(() => ({
    user: user.value,
    accessToken: accessToken.value,
    refreshToken: refreshToken.value,
    isAuthenticated: isAuthenticated.value,
    isLoading: isLoading.value,
    error: error.value,
    pendingVerificationEmail: pendingVerificationEmail.value,
    pendingPasswordResetEmail: pendingPasswordResetEmail.value,
    passwordResetToken: passwordResetToken.value,
  }));

  // Actions
  const initialize = () => {
    const storedAccessToken = localStorage.getItem('accessToken');
    const storedRefreshToken = localStorage.getItem('refreshToken');
    const storedUser = localStorage.getItem('user');

    if (storedAccessToken && storedUser) {
      try {
        accessToken.value = storedAccessToken;
        refreshToken.value = storedRefreshToken;
        user.value = JSON.parse(storedUser) as User;
      } catch {
        authService.signOut();
        accessToken.value = null;
        refreshToken.value = null;
        user.value = null;
      }
    }
  };

  const signUp = async (request: SignUpRequest) => {
    isLoading.value = true;
    error.value = null;

    try {
      const response = await authService.signUp(request);
      if (response.success && response.user && response.accessToken && response.refreshToken) {
        user.value = response.user;
        accessToken.value = response.accessToken;
        refreshToken.value = response.refreshToken;
        clearPendingVerificationEmail();
      } else if (response.emailVerificationRequired && response.email) {
        setPendingVerificationEmail(response.email);
      } else {
        error.value = response.message || 'Sign up failed';
      }
      return response;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Sign up failed';
      return {
        success: false,
        message: error.value,
      };
    } finally {
      isLoading.value = false;
    }
  };

  const signIn = async (request: SignInRequest) => {
    isLoading.value = true;
    error.value = null;

    try {
      const response = await authService.signIn(request);
      if (response.success && response.user && response.accessToken && response.refreshToken) {
        user.value = response.user;
        accessToken.value = response.accessToken;
        refreshToken.value = response.refreshToken;
        clearPendingVerificationEmail();
      } else if (response.emailVerificationRequired && response.email) {
        setPendingVerificationEmail(response.email);
      } else {
        error.value = response.message || 'Sign in failed';
      }
      return response;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Sign in failed';
      return {
        success: false,
        message: error.value,
      };
    } finally {
      isLoading.value = false;
    }
  };

  const verifyEmail = async (request: EmailVerificationRequest) => {
    isLoading.value = true;
    error.value = null;

    try {
      const response = await authService.verifyEmail(request);
      if (response.success && response.user && response.accessToken && response.refreshToken) {
        user.value = response.user;
        accessToken.value = response.accessToken;
        refreshToken.value = response.refreshToken;
        clearPendingVerificationEmail();
      } else {
        error.value = response.message || 'Email verification failed';
      }
      return response;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Email verification failed';
      return {
        success: false,
        message: error.value,
      };
    } finally {
      isLoading.value = false;
    }
  };

  const resendVerificationCode = async (request: ResendVerificationRequest) => {
    isLoading.value = true;
    error.value = null;

    try {
      const response = await authService.resendVerificationCode(request);
      if (response.emailVerificationRequired && response.email) {
        setPendingVerificationEmail(response.email);
      }
      if (!response.success) {
        error.value = response.message || 'Could not resend verification code';
      }
      return response;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Could not resend verification code';
      return {
        success: false,
        message: error.value,
      };
    } finally {
      isLoading.value = false;
    }
  };

  const forgotPassword = async (request: ForgotPasswordRequest) => {
    isLoading.value = true;
    error.value = null;

    try {
      const response = await authService.forgotPassword(request);
      if (response.passwordResetRequired && response.email) {
        setPendingPasswordResetEmail(response.email);
        clearPasswordResetToken();
      }
      if (!response.success) {
        error.value = response.message || 'Could not send password reset code';
      }
      return response;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Could not send password reset code';
      return {
        success: false,
        message: error.value,
      };
    } finally {
      isLoading.value = false;
    }
  };

  const verifyPasswordResetCode = async (request: PasswordResetVerifyRequest) => {
    isLoading.value = true;
    error.value = null;

    try {
      const response = await authService.verifyPasswordResetCode(request);
      if (response.success && response.email && response.resetToken) {
        setPendingPasswordResetEmail(response.email);
        setPasswordResetToken(response.resetToken);
      } else {
        error.value = response.message || 'Password reset verification failed';
      }
      return response;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Password reset verification failed';
      return {
        success: false,
        message: error.value,
      };
    } finally {
      isLoading.value = false;
    }
  };

  const resetPassword = async (request: PasswordResetConfirmRequest) => {
    isLoading.value = true;
    error.value = null;

    try {
      const response = await authService.resetPassword(request);
      if (response.success) {
        clearPasswordResetState();
      } else {
        error.value = response.message || 'Password reset failed';
      }
      return response;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Password reset failed';
      return {
        success: false,
        message: error.value,
      };
    } finally {
      isLoading.value = false;
    }
  };

  const changePassword = async (request: ChangePasswordRequest) => {
    isLoading.value = true;
    error.value = null;

    try {
      const response = await authService.changePassword(request);
      if (!response.success) {
        error.value = response.message || 'Password change failed';
      }
      return response;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Password change failed';
      return {
        success: false,
        message: error.value,
      };
    } finally {
      isLoading.value = false;
    }
  };

  const signOut = () => {
    authService.signOut();
    user.value = null;
    accessToken.value = null;
    refreshToken.value = null;
    clearPendingVerificationEmail();
    clearPasswordResetState();
    error.value = null;
  };

  const setPendingVerificationEmail = (email: string) => {
    pendingVerificationEmail.value = email;
    localStorage.setItem('pendingVerificationEmail', email);
  };

  const clearPendingVerificationEmail = () => {
    pendingVerificationEmail.value = null;
    localStorage.removeItem('pendingVerificationEmail');
  };

  const setPendingPasswordResetEmail = (email: string) => {
    pendingPasswordResetEmail.value = email;
    localStorage.setItem('pendingPasswordResetEmail', email);
  };

  const setPasswordResetToken = (token: string) => {
    passwordResetToken.value = token;
    localStorage.setItem('passwordResetToken', token);
  };

  const clearPasswordResetToken = () => {
    passwordResetToken.value = null;
    localStorage.removeItem('passwordResetToken');
  };

  const clearPasswordResetState = () => {
    pendingPasswordResetEmail.value = null;
    passwordResetToken.value = null;
    localStorage.removeItem('pendingPasswordResetEmail');
    localStorage.removeItem('passwordResetToken');
  };

  const refreshAccessTokenAction = async (): Promise<AuthTokens | null> => {
    try {
      const tokens = await authService.refreshAccessToken();
      if (tokens) {
        accessToken.value = tokens.accessToken;
        refreshToken.value = tokens.refreshToken;
      }
      return tokens;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Token refresh failed';
      signOut();
      return null;
    }
  };

  const clearError = () => {
    error.value = null;
  };

  return {
    // State
    user,
    accessToken,
    refreshToken,
    pendingVerificationEmail,
    pendingPasswordResetEmail,
    passwordResetToken,
    isLoading,
    error,

    // Computed
    isAuthenticated,
    authState,

    // Actions
    initialize,
    signUp,
    signIn,
    verifyEmail,
    resendVerificationCode,
    forgotPassword,
    verifyPasswordResetCode,
    resetPassword,
    changePassword,
    signOut,
    refreshAccessTokenAction,
    setPendingVerificationEmail,
    clearPendingVerificationEmail,
    setPendingPasswordResetEmail,
    setPasswordResetToken,
    clearPasswordResetState,
    clearError,
  };
});
