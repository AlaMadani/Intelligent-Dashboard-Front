import type { ApiEnvelope, ApiResponse } from 'src/types/api';

export const unwrapEnvelope = <T>(payload: ApiResponse<T>): ApiEnvelope<T> => ({
  data: payload.data,
  meta: payload.meta ?? null,
});
