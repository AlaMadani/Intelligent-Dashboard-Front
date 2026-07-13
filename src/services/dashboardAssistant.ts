import { api } from 'src/services/api-client';
import { unwrapEnvelope } from 'src/services/http';
import type { ApiEnvelope, ApiResponse } from 'src/types/api';
import type {
  DashboardAssistantRequest,
  DashboardAssistantResponse,
} from 'src/types/dashboardAssistant';

export const sendDashboardAssistantMessage = async (
  request: DashboardAssistantRequest,
): Promise<ApiEnvelope<DashboardAssistantResponse>> => {
  const response = await api.post<ApiResponse<DashboardAssistantResponse>>(
    '/api/v1/dashboard-assistant/message',
    request,
  );
  return unwrapEnvelope(response.data);
};
