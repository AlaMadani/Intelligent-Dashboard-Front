import { environment } from 'src/config/environment';
import { SESSION_EXPIRED_EVENT, type SessionExpiredReason } from 'src/constants/auth';
import { useAuthStore } from 'src/stores/auth';

export type { SessionExpiredReason } from 'src/constants/auth';

export const clearStoredAuth = () => {
  useAuthStore().clearAuthenticatedState();
};

export const clearSessionExpiredNotice = () => {
  useAuthStore().clearSessionExpiredNotice();
};

export const clearSessionActivity = () => {
  useAuthStore().clearSessionActivity();
};

export const markSessionActivity = () => {
  useAuthStore().markSessionActivity();
};

export const millisecondsUntilIdleExpiration = () => {
  const lastActivityAt = useAuthStore().lastActivityAt;
  if (!Number.isFinite(lastActivityAt) || !lastActivityAt || lastActivityAt <= 0) {
    return environment.sessionIdleTimeoutMs;
  }

  return Math.max(environment.sessionIdleTimeoutMs - (Date.now() - lastActivityAt), 0);
};

export const hasIdleSessionExpired = () => millisecondsUntilIdleExpiration() === 0;

export const markSessionExpired = (reason: SessionExpiredReason) => {
  useAuthStore().markSessionExpired(reason);

  window.dispatchEvent(
    new CustomEvent<{ reason: SessionExpiredReason }>(SESSION_EXPIRED_EVENT, {
      detail: { reason },
    }),
  );
};

export const consumeSessionExpiredReason = (): SessionExpiredReason | null => {
  const authStore = useAuthStore();
  const reason = authStore.sessionExpiredReason;
  if (!reason) {
    return null;
  }

  authStore.clearSessionExpiredNotice();
  return reason;
};

export const isJwtExpired = (token: string | null) => {
  if (!token) {
    return true;
  }

  try {
    const [, payload] = token.split('.');
    if (!payload) {
      return true;
    }

    const normalizedPayload = payload.replace(/-/g, '+').replace(/_/g, '/');
    const paddedPayload = normalizedPayload.padEnd(
      normalizedPayload.length + ((4 - (normalizedPayload.length % 4)) % 4),
      '=',
    );
    const decodedPayload = JSON.parse(window.atob(paddedPayload)) as { exp?: number };
    return typeof decodedPayload.exp !== 'number' || Date.now() >= decodedPayload.exp * 1000;
  } catch {
    return true;
  }
};
