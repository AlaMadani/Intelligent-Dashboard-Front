// HTTP envelope helpers normalize backend responses into the shape used by the UI store.
import type { ApiEnvelope, ApiResponse } from 'src/types/api';

// Always expose a non-optional meta object so callers can rely on a consistent contract.
export const unwrapEnvelope = <T>(payload: ApiResponse<T>): ApiEnvelope<T> => ({
  data: payload.data,
  meta: payload.meta ?? null,
});
