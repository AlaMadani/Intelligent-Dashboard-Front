// Analytics DTOs mirror the backend contracts consumed by the dashboard.
import type { JsonValue } from 'src/types/api';

// Session and anomaly-event payloads drive the tables, workbench, and overview cards.
export interface SessionAnalysisDto {
  id: number;
  insuredId: string;
  sessionId: string;
  startTime: string | null;
  endTime: string | null;
  sessionLength: number | null;
  sessionDurationSeconds: number | null;
  uniqueActionCount: number | null;
  koRate: number | null;
  meanDeltaSeconds: number | null;
  actionDiversity: number | null;
  actionCounts: Record<string, number>;
  aeScore: number | null;
  isAnomaly: boolean | null;
  anomalyType: string | null;
  typeConfidence: number | null;
  top3NextActions: string[];
  ruleTriggered: boolean | null;
  ruleType: string | null;
  createdAt: string | null;
}

export interface AnomalyEventDto {
  id: number | null;
  insuredId: string;
  sessionId: string;
  eventId: string;
  eventTime: string | null;
  anomalyTier: string;
  anomalyType: string | null;
  anomalyScore: number | null;
  typeConfidence: number | null;
  ruleType: string | null;
  eventJson: string | null;
  detectedAt: string | null;
}

// User-insight payloads enrich the insured lookup and response workbench.
export interface UserRiskProfileDto {
  id: number;
  insuredId: string;
  lastUpdated: string | null;
  anomalyCount7d: number | null;
  anomalyCount30d: number | null;
  lastAnomalyType: string | null;
  riskTier: 'LOW' | 'MEDIUM' | 'HIGH' | null;
  anomalyRate30d: number | null;
  sessions7d: number | null;
  sessions30d: number | null;
  mostFrequentAction30d: string | null;
  avgSessionDuration30d: number | null;
  consecutiveCleanSessions: number | null;
}

export interface NextActionPredictionDto {
  id: number | null;
  insuredId: string;
  sessionId: string | null;
  predictedAt: string | null;
  top3Actions: string[];
}

// Stats and forecast payloads feed the live overview and analytics visualizations.
export interface StatsResponseDto {
  date: string;
  source: 'redis' | 'missing' | 'sql';
  payload: JsonValue;
}

export interface ActionStatsDailyDto {
  id: number;
  statDate: string;
  actionId: number;
  actionLabel: string;
  actualCount: number;
  predictedCount: number;
  rollingMean7: number;
  rollingStd7: number;
  spikeAlert: boolean;
  createdAt: string;
}

// Alert and explanation payloads support the active anomaly snapshot and AI narrative.
export interface AnomalyAlertDto {
  insuredId: string;
  sessionId: string;
  eventId: string;
  anomalyTier: string;
  anomalyType: string | null;
  anomalyScore: number | null;
  typeConfidence: number | null;
  ruleType: string | null;
  eventTime: string | null;
  detectedAt: string | null;
}

export interface AnomalyExplanationDto {
  anomalyEventId: number;
  source: string;
  model: string;
  generatedAt: string;
  cached: boolean;
  explanation: string;
}
