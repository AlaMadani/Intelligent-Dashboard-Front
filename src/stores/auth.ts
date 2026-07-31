// ---- Imports ----
import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import type { SessionExpiredReason } from 'src/constants/auth';
import authService from 'src/services/auth';
import type {
  AuthResponse,
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

// ---- Types ----
export interface AuthPersistedState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  pendingVerificationEmail: string | null;
  pendingPasswordResetEmail: string | null;
  passwordResetToken: string | null;
  lastActivityAt: number | null;
  sessionExpiredReason: SessionExpiredReason | null;
}

// ---- Default State Factory ----
const emptyPersistedState = (): AuthPersistedState => ({
  user: null,
  accessToken: null,
  refreshToken: null,
  pendingVerificationEmail: null,
  pendingPasswordResetEmail: null,
  passwordResetToken: null,
  lastActivityAt: null,
  sessionExpiredReason: null,
});

// ---- Store Definition ----
export const useAuthStore = defineStore('auth', () => {
  // -- State --
  const user = ref<User | null>(null);
  const accessToken = ref<string | null>(null);
  const refreshToken = ref<string | null>(null);
  const pendingVerificationEmail = ref<string | null>(null);
  const pendingPasswordResetEmail = ref<string | null>(null);
  const passwordResetToken = ref<string | null>(null);
  const lastActivityAt = ref<number | null>(null);
  const sessionExpiredReason = ref<SessionExpiredReason | null>(null);
  const hasHydrated = ref(false);
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  // -- Getters --
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
    lastActivityAt: lastActivityAt.value,
    sessionExpiredReason: sessionExpiredReason.value,
  }));

  const persistedState = computed<AuthPersistedState>(() => ({
    user: user.value,
    accessToken: accessToken.value,
    refreshToken: refreshToken.value,
    pendingVerificationEmail: pendingVerificationEmail.value,
    pendingPasswordResetEmail: pendingPasswordResetEmail.value,
    passwordResetToken: passwordResetToken.value,
    lastActivityAt: lastActivityAt.value,
    sessionExpiredReason: sessionExpiredReason.value,
  }));

  // -- Actions: Hydration --
  const hydratePersistedState = (state: Partial<AuthPersistedState> | null) => {
    const persisted = { ...emptyPersistedState(), ...(state ?? {}) };

    user.value = persisted.user;
    accessToken.value = persisted.accessToken;
    refreshToken.value = persisted.refreshToken;
    pendingVerificationEmail.value = persisted.pendingVerificationEmail;
    pendingPasswordResetEmail.value = persisted.pendingPasswordResetEmail;
    passwordResetToken.value = persisted.passwordResetToken;
    lastActivityAt.value = persisted.lastActivityAt;
    sessionExpiredReason.value = persisted.sessionExpiredReason;
    isLoading.value = false;
    error.value = null;
    hasHydrated.value = true;
  };

  const initialize = () => {
    hasHydrated.value = true;
  };

  // -- Actions: Session Management --
  const markSessionActivity = () => {
    lastActivityAt.value = Date.now();
  };

  const setLastActivityAt = (value: number | null) => {
    lastActivityAt.value = value;
  };

  const clearSessionActivity = () => {
    lastActivityAt.value = null;
  };

  const clearSessionExpiredNotice = () => {
    sessionExpiredReason.value = null;
  };

  const clearAuthenticatedState = () => {
    user.value = null;
    accessToken.value = null;
    refreshToken.value = null;
    error.value = null;
  };

  // -- Actions: Authentication --
  const setAuthenticatedState = (tokens: AuthTokens, authenticatedUser?: User | null) => {
    accessToken.value = tokens.accessToken;
    refreshToken.value = tokens.refreshToken;
    user.value = authenticatedUser ?? user.value;
    error.value = null;
    clearSessionExpiredNotice();
    markSessionActivity();
  };

  const markSessionExpired = (reason: SessionExpiredReason) => {
    clearAuthenticatedState();
    clearSessionActivity();
    sessionExpiredReason.value = reason;
  };

  const persistAuthenticatedResponse = (response: AuthResponse) => {
    if (response.success && response.user && response.accessToken && response.refreshToken) {
      setAuthenticatedState(
        { accessToken: response.accessToken, refreshToken: response.refreshToken },
        response.user,
      );
      return true;
    }

    return false;
  };

  const setPendingVerificationEmail = (email: string) => {
    pendingVerificationEmail.value = email;
  };

  const clearPendingVerificationEmail = () => {
    pendingVerificationEmail.value = null;
  };

  const setPendingPasswordResetEmail = (email: string) => {
    pendingPasswordResetEmail.value = email;
  };

  const setPasswordResetToken = (token: string) => {
    passwordResetToken.value = token;
  };

  const clearPasswordResetToken = () => {
    passwordResetToken.value = null;
  };

  const clearPasswordResetState = () => {
    pendingPasswordResetEmail.value = null;
    passwordResetToken.value = null;
  };

  // -- Actions: API Calls --
  const signUp = async (request: SignUpRequest) => {
    isLoading.value = true;
    error.value = null;

    try {
      const response = await authService.signUp(request);
      if (persistAuthenticatedResponse(response)) {
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
      if (persistAuthenticatedResponse(response)) {
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
      if (persistAuthenticatedResponse(response)) {
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
    clearAuthenticatedState();
    clearPendingVerificationEmail();
    clearPasswordResetState();
    clearSessionActivity();
    clearSessionExpiredNotice();
  };

  // -- Actions: Token Refresh --
  const refreshAccessTokenAction = async (): Promise<AuthTokens | null> => {
    try {
      const tokens = await authService.refreshAccessToken(refreshToken.value);
      if (tokens) {
        setAuthenticatedState(tokens);
      }
      return tokens;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Token refresh failed';
      signOut();
      return null;
    }
  };

  // -- Actions: Misc --
  const clearError = () => {
    error.value = null;
  };

  return {
    user,
    accessToken,
    refreshToken,
    pendingVerificationEmail,
    pendingPasswordResetEmail,
    passwordResetToken,
    lastActivityAt,
    sessionExpiredReason,
    hasHydrated,
    isLoading,
    error,
    isAuthenticated,
    authState,
    persistedState,
    hydratePersistedState,
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
    setAuthenticatedState,
    setPendingVerificationEmail,
    clearPendingVerificationEmail,
    setPendingPasswordResetEmail,
    setPasswordResetToken,
    clearPasswordResetState,
    setLastActivityAt,
    markSessionActivity,
    clearSessionActivity,
    markSessionExpired,
    clearSessionExpiredNotice,
    clearAuthenticatedState,
    clearError,
  };
});
