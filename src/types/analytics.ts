// Analytics DTOs mirror the backend contracts consumed by the dashboard (api-service / Data Processor).
import type { JsonValue } from 'src/types/api';

/** Redis dashboard snapshot keys (see GET /api/analytics/dashboard/{view}). */
export type DashboardView =
  | 'alerts'
  | 'risky-sessions'
  | 'cluster-mix'
  | 'drop-offs'
  | 'path-deviations'
  | 'forecasts'
  | 'forecast-series';

// Session and anomaly-event payloads drive the tables, workbench, and overview cards.
export interface SessionAnalysisDto {
  id: number;
  insuredId: string;
  sessionId: string;

  persona?: string | null;
  countryCode?: string | null;
  city?: string | null;
  month?: string | null;
  sessionNumber?: number | null;

  startTime: string | null;
  endTime: string | null;

  firstAction?: string | null;
  lastAction?: string | null;
  firstRoute?: string | null;
  lastRoute?: string | null;

  /** Total events in session (SQL `session_length`). */
  totalEvents: number | null;
  sessionDurationSeconds: number | null;

  uniqueActions: number | null;
  uniqueRoutes?: number | null;
  uniqueIpsUsed?: number | null;
  uniqueDevicesUsed?: number | null;

  totalKOs?: number | null;
  totalOKs?: number | null;
  longestKoStreak?: number | null;

  koRate: number | null;
  /** Mean inter-action seconds (backend `mean_delta_seconds`). */
  avgInterActionSeconds: number | null;
  minInterActionSeconds?: number | null;
  maxInterActionSeconds?: number | null;
  actionDiversity: number | null;

  hasLogin?: boolean | null;
  hasLogout?: boolean | null;
  ipChanged?: boolean | null;
  deviceChanged?: boolean | null;

  totalDownloadActions?: number | null;
  maxDownloadsIn2Minutes?: number | null;
  pingPongCount?: number | null;

  riskScoreMax?: number | null;
  riskScoreAvg?: number | null;
  endedAbruptly?: boolean | null;
  anomalyEventCount?: number | null;

  anomalyTypes?: string[];
  campaignIds?: string[];

  actionSequenceSignature?: string | null;
  routeSequenceSignature?: string | null;

  actionCounts?: Record<string, number>;
  /** Tabular / isolation-style detector score (SQL `iso_score`). */
  isoScore: number | null;
  isAnomaly: boolean | null;
  anomalyType: string | null;
  typeConfidence: number | null;
  anomalyProbability?: number | null;
  churnProbability?: number | null;
  ensembleRiskScore?: number | null;
  personaCluster?: number | null;
  binaryDetectorArtifact?: string | null;

  pathDeviation?: boolean | null;
  transitionProbability?: number | null;
  transitionFromAction?: string | null;
  transitionToAction?: string | null;

  top3NextActions: string[];
  ruleTriggered: boolean | null;
  ruleType: string | null;
  createdAt: string | null;
  updatedAt?: string | null;
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
  anomalyProbability?: number | null;
  typeConfidence: number | null;
  ruleType: string | null;
  anomalyFlag?: boolean | null;
  churnProbability?: number | null;
  riskScore?: number | null;
  personaCluster?: number | null;
  pathDeviation?: boolean | null;
  transitionProbability?: number | null;
  transitionFromAction?: string | null;
  transitionToAction?: string | null;
  modelArtifact?: string | null;
  nextActions?: string[];
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
  anomalyProbability?: number | null;
  typeConfidence: number | null;
  ruleType: string | null;
  anomalyFlag?: boolean | null;
  churnProbability?: number | null;
  riskScore?: number | null;
  personaCluster?: number | null;
  pathDeviation?: boolean | null;
  transitionProbability?: number | null;
  transitionFromAction?: string | null;
  transitionToAction?: string | null;
  modelArtifact?: string | null;
  nextActions?: string[];
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
