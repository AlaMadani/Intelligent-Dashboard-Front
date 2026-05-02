import { api } from 'boot/axios';
import type { ApiEnvelope, ApiResponse } from 'src/types/api';
import type {
  ActiveSessionDto,
  AnomalyAlertDto,
  AnomalyEventDto,
  AnomalyExplanationDto,
  AnomalyInvestigationDto,
  CommandCenterDto,
  DashboardView,
  NextActionPredictionDto,
  SessionAnalysisDto,
  StatsResponseDto,
  StatsSummaryDto,
  UserRiskProfileDto,
  UserDashboardDto,
} from 'src/types/analytics';
import type { JsonValue } from 'src/types/api';
import { unwrapEnvelope } from 'src/services/http';

export interface ListSessionsParams {
  insuredId?: string;
  from?: string;
  to?: string;
  isAnomaly?: boolean;
  signature?: string;
  page?: number;
  size?: number;
}

export type AnomalyTierFilter =
  | 'TIER1'
  | 'TIER2'
  | 'TIER3'
  | 'ML_ERROR'
  | 'SESSION_RUNTIME';

export interface ListAnomalyEventsParams {
  insuredId?: string;
  from?: string;
  to?: string;
  tier?: AnomalyTierFilter;
  type?: string;
  page?: number;
  size?: number;
}

export const listSessions = async (
  params: ListSessionsParams = {},
): Promise<ApiEnvelope<SessionAnalysisDto[]>> => {
  const response = await api.get<ApiResponse<SessionAnalysisDto[]>>('/api/v1/sessions', { params });
  return unwrapEnvelope(response.data);
};

export const getSession = async (id: number): Promise<ApiEnvelope<SessionAnalysisDto>> => {
  const response = await api.get<ApiResponse<SessionAnalysisDto>>(`/api/v1/sessions/${id}`);
  return unwrapEnvelope(response.data);
};

export const listAnomalyEvents = async (
  params: ListAnomalyEventsParams = {},
): Promise<ApiEnvelope<AnomalyEventDto[]>> => {
  const response = await api.get<ApiResponse<AnomalyEventDto[]>>('/api/v1/anomalies', { params });
  return unwrapEnvelope(response.data);
};

export const getAnomalyEvent = async (id: number): Promise<ApiEnvelope<AnomalyEventDto>> => {
  const response = await api.get<ApiResponse<AnomalyEventDto>>(`/api/v1/anomalies/${id}`);
  return unwrapEnvelope(response.data);
};

export const getAnomalyExplanation = async (
  id: number,
  refresh = false,
): Promise<ApiEnvelope<AnomalyExplanationDto>> => {
  const response = await api.get<ApiResponse<AnomalyExplanationDto>>(
    `/api/v1/anomalies/${id}/explain`,
    { params: { refresh } },
  );
  return unwrapEnvelope(response.data);
};

export const getAnomalyInvestigation = async (
  id: number,
): Promise<ApiEnvelope<AnomalyInvestigationDto>> => {
  const response = await api.get<ApiResponse<AnomalyInvestigationDto>>(
    `/api/v1/anomalies/${id}/investigation`,
  );
  return unwrapEnvelope(response.data);
};

export const getRiskProfile = async (
  insuredId: string,
): Promise<ApiEnvelope<UserRiskProfileDto>> => {
  const response = await api.get<ApiResponse<UserRiskProfileDto>>(
    `/api/v1/risk-profiles/${insuredId}`,
  );
  return unwrapEnvelope(response.data);
};

export const listRiskProfiles = async (
  page = 0,
  size = 20,
): Promise<ApiEnvelope<UserRiskProfileDto[]>> => {
  const response = await api.get<ApiResponse<UserRiskProfileDto[]>>('/api/v1/risk-profiles', {
    params: { page, size },
  });
  return unwrapEnvelope(response.data);
};

export const getNextActions = async (
  insuredId: string,
): Promise<ApiEnvelope<NextActionPredictionDto>> => {
  const response = await api.get<ApiResponse<NextActionPredictionDto>>(
    `/api/v1/next-actions/${insuredId}`,
  );
  return unwrapEnvelope(response.data);
};

export const getLiveStats = async (date: string): Promise<ApiEnvelope<StatsResponseDto>> => {
  const response = await api.get<ApiResponse<StatsResponseDto>>('/api/v1/stats/live', {
    params: { date },
  });
  return unwrapEnvelope(response.data);
};

export const getStatsSummary = async (): Promise<ApiEnvelope<StatsSummaryDto>> => {
  const response = await api.get<ApiResponse<StatsSummaryDto>>('/api/v1/stats/summary');
  return unwrapEnvelope(response.data);
};

export const getTrendStats = async (date: string): Promise<ApiEnvelope<StatsResponseDto>> => {
  const response = await api.get<ApiResponse<StatsResponseDto>>('/api/v1/trends/forecast', {
    params: { date },
  });
  return unwrapEnvelope(response.data);
};

export const getActiveAnomaly = async (
  insuredId: string,
): Promise<ApiEnvelope<AnomalyAlertDto>> => {
  const response = await api.get<ApiResponse<AnomalyAlertDto>>(
    `/api/v1/anomalies/active/${insuredId}`,
  );
  return unwrapEnvelope(response.data);
};

export const getDashboardSnapshot = async (
  view: DashboardView,
): Promise<ApiEnvelope<JsonValue>> => {
  const response = await api.get<ApiResponse<JsonValue>>(`/api/v1/dashboard/${view}`);
  return unwrapEnvelope(response.data);
};

export const getCommandCenter = async (date?: string): Promise<ApiEnvelope<CommandCenterDto>> => {
  const response = await api.get<ApiResponse<CommandCenterDto>>('/api/v1/dashboard/command-center', {
    params: date ? { date } : undefined,
  });
  return unwrapEnvelope(response.data);
};

export const getActiveSessions = async (params?: {
  insuredId?: string;
  anomalyOnly?: boolean;
  limit?: number;
}): Promise<ApiEnvelope<ActiveSessionDto[]>> => {
  const response = await api.get<ApiResponse<ActiveSessionDto[]>>('/api/v1/sessions/active', {
    params,
  });
  return unwrapEnvelope(response.data);
};

export const getSessionInsight = async (
  insuredId: string,
  sessionId: string,
): Promise<ApiEnvelope<JsonValue>> => {
  const response = await api.get<ApiResponse<JsonValue>>(
    `/api/v1/sessions/${encodeURIComponent(insuredId)}/${encodeURIComponent(sessionId)}/insight`,
  );
  return unwrapEnvelope(response.data);
};

export const getUserDashboard = async (
  insuredId: string,
): Promise<ApiEnvelope<UserDashboardDto>> => {
  const response = await api.get<ApiResponse<UserDashboardDto>>(
    `/api/v1/users/${encodeURIComponent(insuredId)}/dashboard`,
  );
  return unwrapEnvelope(response.data);
};

export const getUserSessions = async (
  insuredId: string,
  page = 0,
  size = 10,
): Promise<ApiEnvelope<SessionAnalysisDto[]>> => {
  const response = await api.get<ApiResponse<SessionAnalysisDto[]>>(
    `/api/v1/users/${encodeURIComponent(insuredId)}/sessions`,
    { params: { page, size } },
  );
  return unwrapEnvelope(response.data);
};

export const getHealth = async (): Promise<ApiEnvelope<Record<string, unknown>>> => {
  const response = await api.get<ApiResponse<Record<string, unknown>>>('/api/v1/health');
  return unwrapEnvelope(response.data);
};

export const getAnomalyStreamUrl = () => {
  const baseUrl =
    typeof api.defaults.baseURL === 'string' && api.defaults.baseURL
      ? api.defaults.baseURL
      : window.location.origin;
  return new URL('/topic/alerts', baseUrl).toString();
};

export const getLiveStatsStreamUrl = () => {
  const baseUrl =
    typeof api.defaults.baseURL === 'string' && api.defaults.baseURL
      ? api.defaults.baseURL
      : window.location.origin;
  return new URL('/api/v1/stream/live', baseUrl).toString();
};