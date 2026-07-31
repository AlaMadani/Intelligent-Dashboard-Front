// ---- Imports ----
import axios from 'axios';
import { api } from 'src/services/api-client';
import { unwrapEnvelope } from 'src/services/http';
import { useAuthStore } from 'src/stores/auth';
import type { ApiEnvelope, ApiResponse } from 'src/types/api';
import type {
  V36AlertInvestigationDetail,
  V36AlertListParams,
  V36ChurnDashboardResponse,
  V36ChurnUsersParams,
  V36ChurnUsersResponse,
  V36CriticalAlertsResponse,
  V36DiagnosticsResponse,
  V36FinalWinnersResponse,
  V36ForecastDashboardResponse,
  V36LiveAlertsResponse,
  V36LlmEvidencePayload,
  V36LlmExplanationRequest,
  V36LlmExplanationResponse,
  V36ReportMetadataResponse,
  V36RuntimeHealthResponse,
  V36SecurityOverviewResponse,
  V36User360Response,
  V36UserAlertsParams,
  V36UserAlertsResponse,
} from 'src/types/analytics';

// ---- Error Types & Helpers ----
export interface NormalizedApiError {
  status?: number;
  code?: string;
  message: string;
  details?: Record<string, unknown>;
}

const toRecord = (value: unknown): Record<string, unknown> | null =>
  value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;

const readErrorPayload = (error: unknown) => {
  if (!axios.isAxiosError(error)) return null;
  return toRecord(error.response?.data);
};

export const isNotFoundError = (error: unknown) =>
  axios.isAxiosError(error) && error.response?.status === 404;

export const isUnavailableError = (error: unknown) =>
  axios.isAxiosError(error) && error.response?.status === 503;

export const normalizeApiError = (error: unknown): NormalizedApiError => {
  if (axios.isAxiosError(error)) {
    const payload = readErrorPayload(error);
    const message =
      (typeof payload?.message === 'string' && payload.message) ||
      (typeof payload?.error === 'string' && payload.error) ||
      error.message ||
      'API request failed';
    const code =
      (typeof payload?.error === 'string' && payload.error) ||
      (typeof payload?.code === 'string' && payload.code) ||
      undefined;

    return {
      ...(error.response?.status !== undefined ? { status: error.response.status } : {}),
      ...(code !== undefined ? { code } : {}),
      message,
      ...(payload ? { details: payload } : {}),
    };
  }

  if (error instanceof Error) {
    return { message: error.message };
  }

  return { message: 'Unexpected API error' };
};

// ---- API Functions ----
export const getV36RuntimeHealth = async (): Promise<ApiEnvelope<V36RuntimeHealthResponse>> => {
  const response = await api.get<ApiResponse<V36RuntimeHealthResponse>>(
    '/api/v1/ai/runtime-health',
  );
  return unwrapEnvelope(response.data);
};

export const getV36SecurityOverview = async (): Promise<
  ApiEnvelope<V36SecurityOverviewResponse>
> => {
  const response = await api.get<ApiResponse<V36SecurityOverviewResponse>>(
    '/api/v1/security/overview',
  );
  return unwrapEnvelope(response.data);
};

export const getV36Diagnostics = async (): Promise<ApiEnvelope<V36DiagnosticsResponse>> => {
  const response = await api.get<ApiResponse<V36DiagnosticsResponse>>(
    '/api/v1/security/diagnostics',
  );
  return unwrapEnvelope(response.data);
};

export const getV36LiveAlerts = async (
  params: V36AlertListParams = {},
): Promise<ApiEnvelope<V36LiveAlertsResponse>> => {
  const response = await api.get<ApiResponse<V36LiveAlertsResponse>>('/api/v1/alerts/live', {
    params,
  });
  return unwrapEnvelope(response.data);
};

export const getV36CriticalAlerts = async (
  params: V36AlertListParams = {},
): Promise<ApiEnvelope<V36CriticalAlertsResponse>> => {
  const response = await api.get<ApiResponse<V36CriticalAlertsResponse>>(
    '/api/v1/alerts/critical',
    { params },
  );
  return unwrapEnvelope(response.data);
};

export const getV36AlertInvestigation = async (
  eventId: string,
): Promise<ApiEnvelope<V36AlertInvestigationDetail>> => {
  const response = await api.get<ApiResponse<V36AlertInvestigationDetail>>(
    `/api/v1/alerts/${encodeURIComponent(eventId)}`,
  );
  return unwrapEnvelope(response.data);
};

export const getV36LlmEvidence = async (
  eventId: string,
): Promise<ApiEnvelope<V36LlmEvidencePayload>> => {
  const response = await api.get<ApiResponse<V36LlmEvidencePayload>>(
    `/api/v1/explanations/alerts/${encodeURIComponent(eventId)}/evidence`,
  );
  return unwrapEnvelope(response.data);
};

export const getV36CachedExplanation = async (
  eventId: string,
): Promise<ApiEnvelope<V36LlmExplanationResponse>> => {
  const response = await api.get<ApiResponse<V36LlmExplanationResponse>>(
    `/api/v1/explanations/alerts/${encodeURIComponent(eventId)}`,
  );
  return unwrapEnvelope(response.data);
};

export const generateV36Explanation = async (
  eventId: string,
  request: V36LlmExplanationRequest = {},
): Promise<ApiEnvelope<V36LlmExplanationResponse>> => {
  const response = await api.post<ApiResponse<V36LlmExplanationResponse>>(
    `/api/v1/explanations/alerts/${encodeURIComponent(eventId)}`,
    request,
  );
  return unwrapEnvelope(response.data);
};

export const getV36User360 = async (
  insuredId: string,
): Promise<ApiEnvelope<V36User360Response>> => {
  const response = await api.get<ApiResponse<V36User360Response>>(
    `/api/v1/users/${encodeURIComponent(insuredId)}/360`,
  );
  return unwrapEnvelope(response.data);
};

export const getV36UserAlerts = async (
  insuredId: string,
  params: V36UserAlertsParams = {},
): Promise<ApiEnvelope<V36UserAlertsResponse>> => {
  const response = await api.get<ApiResponse<V36UserAlertsResponse>>(
    `/api/v1/users/${encodeURIComponent(insuredId)}/alerts`,
    { params },
  );
  return unwrapEnvelope(response.data);
};

export const getV36ChurnDashboard = async (): Promise<
  ApiEnvelope<V36ChurnDashboardResponse>
> => {
  const response = await api.get<ApiResponse<V36ChurnDashboardResponse>>(
    '/api/v1/churn/dashboard',
  );
  return unwrapEnvelope(response.data);
};

export const getV36ChurnUsers = async (
  params: V36ChurnUsersParams = {},
): Promise<ApiEnvelope<V36ChurnUsersResponse>> => {
  const response = await api.get<ApiResponse<V36ChurnUsersResponse>>('/api/v1/churn/users', {
    params,
  });
  return unwrapEnvelope(response.data);
};

export const getV36ForecastDashboard = async (): Promise<
  ApiEnvelope<V36ForecastDashboardResponse>
> => {
  const response = await api.get<ApiResponse<V36ForecastDashboardResponse>>(
    '/api/v1/forecast/dashboard',
  );
  return unwrapEnvelope(response.data);
};

export const getV36FinalWinners = async (): Promise<ApiEnvelope<V36FinalWinnersResponse>> => {
  const response = await api.get<ApiResponse<V36FinalWinnersResponse>>(
    '/api/v1/ai/final-winners',
  );
  return unwrapEnvelope(response.data);
};

export const getV36Reports = async (): Promise<ApiEnvelope<V36ReportMetadataResponse>> => {
  const response = await api.get<ApiResponse<V36ReportMetadataResponse>>('/api/v1/ai/reports');
  return unwrapEnvelope(response.data);
};

export const getLiveStatsStreamUrl = () => {
  const baseUrl =
    typeof api.defaults.baseURL === 'string' && api.defaults.baseURL
      ? api.defaults.baseURL
      : window.location.origin;
  const streamUrl = new URL('/api/v1/stream/live', baseUrl);
  const token = useAuthStore().accessToken;
  if (token) {
    streamUrl.searchParams.set('access_token', token);
  }
  return streamUrl.toString();
};
