// Analytics service: wrap the backend endpoints consumed by the dashboard views and streams.
import { api } from 'boot/axios';
import type { ApiEnvelope, ApiResponse } from 'src/types/api';
import type {
  AnomalyAlertDto,
  AnomalyEventDto,
  AnomalyExplanationDto,
  NextActionPredictionDto,
  SessionAnalysisDto,
  StatsResponseDto,
  UserRiskProfileDto,
} from 'src/types/analytics';
import { unwrapEnvelope } from 'src/services/http';

// Query parameter contracts for the analytics REST endpoints.
export interface ListSessionsParams {
  insuredId?: string;
  from?: string;
  to?: string;
  isAnomaly?: boolean;
  page?: number;
  size?: number;
}

export type AnomalyTier = 'TIER1' | 'TIER2' | 'TIER3' | 'ML_ERROR';

export interface ListAnomalyEventsParams {
  insuredId?: string;
  from?: string;
  to?: string;
  tier?: AnomalyTier;
  type?: string;
  page?: number;
  size?: number;
}

// Session and anomaly retrieval endpoints used by the dashboard tables and workbench.
export const listSessions = async (
  params: ListSessionsParams = {},
): Promise<ApiEnvelope<SessionAnalysisDto[]>> => {
  const response = await api.get<ApiResponse<SessionAnalysisDto[]>>('/api/analytics/sessions', {
    params,
  });
  return unwrapEnvelope(response.data);
};

export const getSession = async (id: number): Promise<ApiEnvelope<SessionAnalysisDto>> => {
  const response = await api.get<ApiResponse<SessionAnalysisDto>>(`/api/analytics/sessions/${id}`);
  return unwrapEnvelope(response.data);
};

export const listAnomalyEvents = async (
  params: ListAnomalyEventsParams = {},
): Promise<ApiEnvelope<AnomalyEventDto[]>> => {
  const response = await api.get<ApiResponse<AnomalyEventDto[]>>('/api/analytics/anomaly-events', {
    params,
  });
  return unwrapEnvelope(response.data);
};

export const getAnomalyEvent = async (id: number): Promise<ApiEnvelope<AnomalyEventDto>> => {
  const response = await api.get<ApiResponse<AnomalyEventDto>>(
    `/api/analytics/anomaly-events/${id}`,
  );
  return unwrapEnvelope(response.data);
};

export const getAnomalyExplanation = async (
  id: number,
  refresh = false,
): Promise<ApiEnvelope<AnomalyExplanationDto>> => {
  const response = await api.get<ApiResponse<AnomalyExplanationDto>>(
    `/api/analytics/anomaly-events/${id}/explanation`,
    { params: { refresh } },
  );
  return unwrapEnvelope(response.data);
};

// User-focused insight endpoints enrich the selected insured context.
export const getRiskProfile = async (
  insuredId: string,
): Promise<ApiEnvelope<UserRiskProfileDto>> => {
  const response = await api.get<ApiResponse<UserRiskProfileDto>>(
    `/api/analytics/risk/${insuredId}`,
  );
  return unwrapEnvelope(response.data);
};

export const getNextActions = async (
  insuredId: string,
): Promise<ApiEnvelope<NextActionPredictionDto>> => {
  const response = await api.get<ApiResponse<NextActionPredictionDto>>(
    `/api/analytics/next-actions/${insuredId}`,
  );
  return unwrapEnvelope(response.data);
};

// Live and trend stats power the overview hero, KPI strip, and analytics charts.
export const getLiveStats = async (date: string): Promise<ApiEnvelope<StatsResponseDto>> => {
  const response = await api.get<ApiResponse<StatsResponseDto>>('/api/analytics/stats/live', {
    params: { date },
  });
  return unwrapEnvelope(response.data);
};

export const getTrendStats = async (date: string): Promise<ApiEnvelope<StatsResponseDto>> => {
  const response = await api.get<ApiResponse<StatsResponseDto>>('/api/analytics/stats/trend', {
    params: { date },
  });
  return unwrapEnvelope(response.data);
};

export const getActiveAnomaly = async (
  insuredId: string,
): Promise<ApiEnvelope<AnomalyAlertDto>> => {
  const response = await api.get<ApiResponse<AnomalyAlertDto>>(
    `/api/analytics/anomaly/active/${insuredId}`,
  );
  return unwrapEnvelope(response.data);
};

// Stream URL builders reuse the configured API base for EventSource connections.
export const getAnomalyStreamUrl = () => {
  const baseUrl =
    typeof api.defaults.baseURL === 'string' && api.defaults.baseURL
      ? api.defaults.baseURL
      : window.location.origin;
  return new URL('/api/analytics/stream/anomalies', baseUrl).toString();
};

export const getLiveStatsStreamUrl = () => {
  const baseUrl =
    typeof api.defaults.baseURL === 'string' && api.defaults.baseURL
      ? api.defaults.baseURL
      : window.location.origin;
  return new URL('/api/analytics/stream/live', baseUrl).toString();
};
