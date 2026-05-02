import type { JsonValue } from 'src/types/api';

export type DashboardView =
  | 'alerts'
  | 'risky-sessions'
  | 'cluster-mix'
  | 'drop-offs'
  | 'path-deviations'
  | 'forecasts'
  | 'forecast-series';

export interface FeatureContributionDto {
  feature: string;
  importance?: number | null;
  actualValue?: JsonValue;
  description?: string | null;
}

export interface PathDeviationDto {
  deviated?: boolean | null;
  fromAction?: string | null;
  toAction?: string | null;
  transitionProbability?: number | null;
}

export interface NextActionScoreDto {
  action: string;
  probability?: number | null;
}

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
  actionSequence?: string[];
  routeSequence?: string[];
  actionSequenceSignature?: string | null;
  routeSequenceSignature?: string | null;
  actionCounts?: Record<string, number>;
  isoScore: number | null;
  isAnomaly: boolean | null;
  anomalyType: string | null;
  typeConfidence: number | null;
  anomalyProbability?: number | null;
  churnProbability?: number | null;
  ensembleRiskScore?: number | null;
  personaCluster?: number | null;
  binaryDetectorArtifact?: string | null;
  topContributingFeatures?: FeatureContributionDto[];
  explainabilityText?: string | null;
  warnings?: string[];
  triggeredRules?: string[];
  contextTags?: string[];
  rareTransitions?: PathDeviationDto[];
  pathDeviation?: boolean | null;
  transitionProbability?: number | null;
  transitionFromAction?: string | null;
  transitionToAction?: string | null;
  top3NextActions: NextActionScoreDto[];
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
  nextActions?: NextActionScoreDto[];
  eventContext?: Record<string, unknown> | null;
  detectedAt: string | null;
}

export interface ActiveSessionDto {
  sessionId: string;
  insuredId: string;
  persona?: string | null;
  countryCode?: string | null;
  city?: string | null;
  month?: string | null;
  sessionNumber?: number | null;
  sessionStart?: string | null;
  sessionEnd?: string | null;
  totalEvents?: number | null;
  totalDurationSeconds?: number | null;
  firstAction?: string | null;
  lastAction?: string | null;
  firstRoute?: string | null;
  lastRoute?: string | null;
  avgInterActionSeconds?: number | null;
  minInterActionSeconds?: number | null;
  maxInterActionSeconds?: number | null;
  uniqueActions?: number | null;
  uniqueRoutes?: number | null;
  uniqueIpsUsed?: number | null;
  uniqueDevicesUsed?: number | null;
  totalKOs?: number | null;
  totalOKs?: number | null;
  longestKoStreak?: number | null;
  hasLogin?: boolean | null;
  hasLogout?: boolean | null;
  ipChanged?: boolean | null;
  deviceChanged?: boolean | null;
  totalDownloadActions?: number | null;
  maxDownloadsIn2Minutes?: number | null;
  pingPongCount?: number | null;
  riskScoreMax?: number | null;
  riskScoreAvg?: number | null;
  anomalyEventCount?: number | null;
  anomalyTypes?: string[];
  campaignIds?: string[];
  actionCounts?: Record<string, number>;
  actionSequenceSignature?: string | null;
  routeSequenceSignature?: string | null;
  binaryAnomaly?: boolean | null;
  anomalyFlag?: boolean | null;
  anomalyType?: string | null;
  anomalyScore?: number | null;
  anomalyProbability?: number | null;
  binaryDetectorArtifact?: string | null;
  typeConfidence?: number | null;
  churnProbability?: number | null;
  riskScore?: number | null;
  personaCluster?: number | null;
  riskLevel?: string | null;
  pathDeviation?: PathDeviationDto | null;
  pathDeviationFlag?: boolean | null;
  transitionProbability?: number | null;
  transitionFromAction?: string | null;
  transitionToAction?: string | null;
  rareTransitions?: PathDeviationDto[];
  nextActions?: NextActionScoreDto[];
  contextTags?: string[];
  triggeredRules?: string[];
  warnings?: string[];
  topContributingFeatures?: FeatureContributionDto[];
  explainabilityText?: string | null;
  actionSequence?: string[];
  routeSequence?: string[];
  computedAt?: string | null;
}

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
  top3Actions: NextActionScoreDto[];
}

export interface StatsResponseDto {
  date: string;
  source: 'redis' | 'missing' | 'sql';
  payload: JsonValue;
}

export interface StatsSummaryDto {
  totalSessions: number;
  totalAnomalies: number;
  anomalousSessions: number;
  activeSessionsNow: number;
  eventsToday: number;
  anomalyRate: number;
  anomaliesByType: Record<string, number>;
  usersByRiskTier: Record<string, number>;
  sessionsByPersonaCluster: Record<number, number>;
  generatedAt: string;
}

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
  nextActions?: NextActionScoreDto[];
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

export interface CommandCenterDto {
  liveStats: StatsResponseDto | null;
  trendForecast: StatsResponseDto | null;
  alertFeed: JsonValue | null;
  riskySessions: JsonValue | null;
  clusterMix: JsonValue | null;
  dropOffs: JsonValue | null;
  pathDeviations: JsonValue | null;
  forecastDetails: JsonValue | null;
}

export interface AnomalyInvestigationDto {
  anomalyEventId: number;
  anomaly: AnomalyEventDto | null;
  sessionAnalysis: SessionAnalysisDto | null;
  liveSession: ActiveSessionDto | null;
  riskProfile: UserRiskProfileDto | null;
  nextActions: NextActionPredictionDto | null;
  activeAnomaly: AnomalyAlertDto | null;
}

export interface UserDashboardDto {
  riskProfile: UserRiskProfileDto | null;
  recentSessions: SessionAnalysisDto[];
  recentAnomalies: AnomalyEventDto[];
  nextActions: NextActionPredictionDto | null;
  activeAnomaly: AnomalyAlertDto | null;
}