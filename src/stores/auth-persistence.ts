import type { Pinia } from 'pinia';
import { LocalStorage } from 'quasar';
import { watch } from 'vue';
import {
  SESSION_EXPIRED_NOTICE_KEY,
  SESSION_EXPIRED_REASON_KEY,
  SESSION_LAST_ACTIVITY_KEY,
  type SessionExpiredReason,
} from 'src/constants/auth';
import { useAuthStore, type AuthPersistedState } from 'src/stores/auth';
import type { User } from 'src/types/auth';

const AUTH_STORAGE_KEY = 'noveocare.auth.state';

const LEGACY_STORAGE_KEYS = [
  'accessToken',
  'refreshToken',
  'user',
  'pendingVerificationEmail',
  'pendingPasswordResetEmail',
  'passwordResetToken',
  SESSION_EXPIRED_NOTICE_KEY,
  SESSION_EXPIRED_REASON_KEY,
  SESSION_LAST_ACTIVITY_KEY,
] as const;

const isClientStorageAvailable = () => typeof window !== 'undefined';

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === 'object' && !Array.isArray(value);

const isUser = (value: unknown): value is User =>
  isRecord(value) &&
  typeof value.id === 'number' &&
  typeof value.email === 'string' &&
  typeof value.fullName === 'string' &&
  typeof value.emailVerified === 'boolean';

const isSessionExpiredReason = (value: unknown): value is SessionExpiredReason =>
  value === 'idle' || value === 'refresh_failed' || value === 'token_expired';

const readString = (key: string) => {
  const value = LocalStorage.getItem<string>(key);
  return typeof value === 'string' && value.trim().length > 0 ? value : null;
};

const readLegacyUser = () => {
  const value = LocalStorage.getItem<User | string>('user');
  if (isUser(value)) {
    return value;
  }

  if (typeof value !== 'string') {
    return null;
  }

  try {
    const parsed = JSON.parse(value) as unknown;
    return isUser(parsed) ? parsed : null;
  } catch {
    return null;
  }
};

const readPersistedState = (): Partial<AuthPersistedState> | null => {
  if (!isClientStorageAvailable()) {
    return null;
  }

  const currentState = LocalStorage.getItem<Partial<AuthPersistedState>>(AUTH_STORAGE_KEY);
  if (isRecord(currentState)) {
    return {
      user: isUser(currentState.user) ? currentState.user : null,
      accessToken:
        typeof currentState.accessToken === 'string' ? currentState.accessToken : null,
      refreshToken:
        typeof currentState.refreshToken === 'string' ? currentState.refreshToken : null,
      pendingVerificationEmail:
        typeof currentState.pendingVerificationEmail === 'string'
          ? currentState.pendingVerificationEmail
          : null,
      pendingPasswordResetEmail:
        typeof currentState.pendingPasswordResetEmail === 'string'
          ? currentState.pendingPasswordResetEmail
          : null,
      passwordResetToken:
        typeof currentState.passwordResetToken === 'string'
          ? currentState.passwordResetToken
          : null,
      lastActivityAt:
        typeof currentState.lastActivityAt === 'number' ? currentState.lastActivityAt : null,
      sessionExpiredReason: isSessionExpiredReason(currentState.sessionExpiredReason)
        ? currentState.sessionExpiredReason
        : null,
    };
  }

  const hasLegacyNotice = LocalStorage.getItem<string>(SESSION_EXPIRED_NOTICE_KEY) === 'true';
  const legacyReason = LocalStorage.getItem<string>(SESSION_EXPIRED_REASON_KEY);
  const legacyLastActivityAt = Number(LocalStorage.getItem<string>(SESSION_LAST_ACTIVITY_KEY));

  return {
    user: readLegacyUser(),
    accessToken: readString('accessToken'),
    refreshToken: readString('refreshToken'),
    pendingVerificationEmail: readString('pendingVerificationEmail'),
    pendingPasswordResetEmail: readString('pendingPasswordResetEmail'),
    passwordResetToken: readString('passwordResetToken'),
    lastActivityAt: Number.isFinite(legacyLastActivityAt) ? legacyLastActivityAt : null,
    sessionExpiredReason:
      hasLegacyNotice && isSessionExpiredReason(legacyReason) ? legacyReason : null,
  };
};

const clearLegacyState = () => {
  LEGACY_STORAGE_KEYS.forEach((key) => {
    LocalStorage.remove(key);
  });
};

const persistState = (state: AuthPersistedState) => {
  if (!isClientStorageAvailable()) {
    return;
  }

  LocalStorage.set(AUTH_STORAGE_KEY, state);
  clearLegacyState();
};

export const setupAuthPersistence = (pinia: Pinia) => {
  const authStore = useAuthStore(pinia);

  authStore.hydratePersistedState(readPersistedState());
  persistState(authStore.persistedState);

  watch(
    () => authStore.persistedState,
    (state) => {
      persistState(state);
    },
    { deep: true },
  );
};
