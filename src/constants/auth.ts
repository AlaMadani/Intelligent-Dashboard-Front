// ---- Storage Keys ----
export const SESSION_EXPIRED_NOTICE_KEY = 'noveocare.auth.sessionExpired';
export const SESSION_EXPIRED_REASON_KEY = 'noveocare.auth.sessionExpiredReason';
export const SESSION_LAST_ACTIVITY_KEY = 'noveocare.auth.lastActivityAt';

// ---- Events ----
export const SESSION_EXPIRED_EVENT = 'noveocare:auth-session-expired';

// ---- Defaults / Types ----
export const DEFAULT_SESSION_IDLE_TIMEOUT_MS = 15 * 60 * 1000;
export type SessionExpiredReason = 'idle' | 'refresh_failed' | 'token_expired';
