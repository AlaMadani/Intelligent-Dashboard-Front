export type V36SchemaVersion = string;
export type V36RiskLevel = string;
export type V36Source = string;
export type V36UnknownMap = Record<string, unknown>;
export type V36NumberMap = Record<string, number>;

export interface V36PagedResponse<T> {
  schemaVersion?: V36SchemaVersion;
  items?: T[];
  limit?: number;
  offset?: number;
  count?: number;
  hasMore?: boolean;
  source?: V36Source;
  warnings?: string[];
}

export interface V36AlertListParams {
  riskLevel?: string;
  anomalyType?: string;
  insuredId?: string;
  sessionId?: string;
  from?: string;
  to?: string;
  limit?: number;
  offset?: number;
}

export interface V36UserAlertsParams {
  riskLevel?: string;
  anomalyType?: string;
  sessionId?: string;
  limit?: number;
  offset?: number;
}

export interface V36ChurnUsersParams {
  riskLevel?: string;
  limit?: number;
  offset?: number;
}

export interface V36ModelRuntimeState {
  artifactExists?: boolean;
  artifactParsed?: boolean;
  runtimeInitialized?: boolean;
  inferenceEnabledByConfig?: boolean;
  lastInferenceSucceeded?: boolean;
  lastInferenceError?: string | null;
  lastInferenceTimestamp?: string | null;
  unavailableReason?: string | null;
  warnings?: string[];
  raw?: V36UnknownMap;
}

export interface V36RuntimeHealthResponse {
  schemaVersion?: V36SchemaVersion;
  runtimeVersion?: string;
  artifactBasePath?: string;
  personaEnabled?: boolean;
  llmExplanationInDataprocessor?: boolean;
  llmEvidencePayloadEnabled?: boolean;
  fallbackMode?: string;
  status?: string;
  message?: string;
  modelHealth?: Record<string, V36ModelRuntimeState>;
  warnings?: string[];
  source?: V36Source;
  raw?: V36UnknownMap;
}

export interface V36SecurityOverviewResponse {
  schemaVersion?: V36SchemaVersion;
  snapshotTimestamp?: string;
  totalEventsToday?: number;
  activeUsersToday?: number;
  anomalyRateToday?: number;
  criticalAlertsToday?: number;
  highRiskAlertsToday?: number;
  averageRiskScoreToday?: number;
  predictedAnomalyRateTomorrow?: number;
  predictedTotalEventsTomorrow?: number;
  expectedAlertVolumeTomorrow?: number;
  topAnomalyTypes?: V36NumberMap;
  topTriggeredRules?: V36NumberMap;
  modelHealthSummary?: V36UnknownMap;
  fieldCoverageWarnings?: string[];
  source?: V36Source;
  warnings?: string[];
  rawPayload?: V36UnknownMap;
}

export interface V36DiagnosticsResponse {
  schemaVersion?: V36SchemaVersion;
  runtimeHealth?: V36RuntimeHealthResponse | V36UnknownMap;
  fieldCoverage?: V36UnknownMap;
  modelLatency?: V36UnknownMap;
  fallbackMode?: string;
  warnings?: string[];
  source?: V36Source;
  raw?: V36UnknownMap;
}

export interface V36ModelContributions {
  xgboost?: number;
  lightgbm?: number;
  transformer?: number;
  tcn?: number;
  rules?: number;
  businessContext?: number;
  aggregationBoost?: number;
  raw?: V36UnknownMap;
  [key: string]: unknown;
}

export interface V36LiveAlertItem {
  schemaVersion?: V36SchemaVersion;
  id?: number | null;
  anomalyDbId?: number | null;
  eventId?: string;
  recordId?: string;
  insuredId?: string;
  sessionId?: string;
  timestamp?: string;
  eventAction?: string;
  apiTemplate?: string;
  apiFamily?: string;
  controller?: string;
  page?: string;
  country?: string;
  device?: string;
  browser?: string;
  os?: string;
  httpMethod?: string;
  status?: string;
  riskLevel?: V36RiskLevel;
  finalRiskScore?: number;
  anomalyType?: string;
  anomalyTypeConfidence?: number;
  xgboostAnomalyScore?: number;
  xgboostAnomalyScore100?: number;
  lightgbmAlertScore?: number;
  lightgbmAlertScore100?: number;
  transformerRiskScore100?: number;
  tcnRiskScore100?: number;
  ruleRiskScore?: number;
  modelContributions?: V36ModelContributions;
  triggeredRuleCodes?: string[];
  churnProbability?: number;
  churnRiskLevel?: V36RiskLevel;
  personaLabel?: string;
  llmEvidencePayloadAvailable?: boolean;
  llmEvidenceRedisKey?: string;
  alertStatus?: string;
  createdAt?: string;
  source?: V36Source;
  warnings?: string[];
  rawPayload?: V36UnknownMap;
}

export type V36LiveAlertsResponse = V36PagedResponse<V36LiveAlertItem>;
export type V36CriticalAlertsResponse = V36LiveAlertsResponse;

export interface V36EventMetadata {
  eventAction?: string;
  apiTemplate?: string;
  apiFamily?: string;
  controller?: string;
  page?: string;
  country?: string;
  device?: string;
  browser?: string;
  os?: string;
  httpMethod?: string;
  status?: string;
  [key: string]: unknown;
}

export interface V36ModelScores {
  xgboostAnomalyScore?: number;
  xgboostAnomalyScore100?: number;
  lightgbmAlertScore?: number;
  lightgbmAlertScore100?: number;
  transformerSurpriseScore?: number;
  transformerRiskScore100?: number;
  tcnRiskScore100?: number;
  businessContextScore?: number;
  aggregationBoost?: number;
  finalRiskScore?: number;
  ruleRiskScore?: number;
  [key: string]: unknown;
}

export interface V36SequenceSurpriseField {
  field?: string;
  value?: unknown;
  score?: number;
}

export interface V36SequenceEvidence {
  selectedSequenceModel?: string;
  sequenceModelArtifact?: string;
  contextAvailable?: boolean;
  windowSize?: number;
  sequenceCatScore?: number;
  sequenceContScore?: number;
  sequenceCtxScore?: number;
  topSequenceSurpriseFields?: V36SequenceSurpriseField[];
  raw?: V36UnknownMap;
}

export interface V36TabularEvidence {
  featureContract?: string;
  availableModels?: string[];
  unavailableModels?: string[];
  featureWarnings?: V36UnknownMap;
  raw?: V36UnknownMap;
}

export interface V36RuleEvidence {
  ruleRiskScore?: number;
  triggeredRules?: string[];
  ruleContributions?: V36NumberMap;
  raw?: V36UnknownMap;
}

export interface V36AnomalyTypeAttribution {
  anomalyType?: string;
  confidence?: number;
  source?: string;
  evidence?: V36UnknownMap;
}

export interface V36ChurnContext {
  probability?: number;
  riskLevel?: V36RiskLevel;
  modelName?: string;
  modelArtifact?: string;
  featureWarnings?: V36UnknownMap;
  raw?: V36UnknownMap;
}

export interface V36ForecastContext {
  predictedTotalEvents?: number;
  predictedAnomalyRate?: number;
  expectedAlertVolume?: number;
  forecastModelNames?: Record<string, string>;
  forecastWarnings?: string[];
  raw?: V36UnknownMap;
}

export interface V36PersonaDisabled {
  enabled?: boolean;
  cluster?: number | null;
  label?: string;
  source?: string;
  confidence?: number | null;
}

export interface V36LlmLinkInfo {
  evidenceAvailable?: boolean;
  evidenceRedisKey?: string;
  evidenceEndpoint?: string;
  cachedExplanationEndpoint?: string;
  generateExplanationEndpoint?: string;
}

export interface V36AlertInvestigationDetail {
  schemaVersion?: V36SchemaVersion;
  id?: number | null;
  anomalyDbId?: number | null;
  eventId?: string;
  recordId?: string;
  insuredId?: string;
  sessionId?: string;
  timestamp?: string;
  eventMetadata?: V36EventMetadata;
  riskLevel?: V36RiskLevel;
  finalRiskScore?: number;
  anomalyType?: string;
  anomalyTypeConfidence?: number;
  triggeredRules?: string[];
  modelScores?: V36ModelScores;
  modelContributions?: V36ModelContributions;
  sequenceEvidence?: V36SequenceEvidence;
  tabularEvidence?: V36TabularEvidence;
  ruleEvidence?: V36RuleEvidence;
  anomalyTypeAttribution?: V36AnomalyTypeAttribution;
  churnContext?: V36ChurnContext;
  forecastContext?: V36ForecastContext;
  persona?: V36PersonaDisabled;
  runtimeWarnings?: string[];
  llmEvidencePayloadAvailable?: boolean;
  llmEvidenceRedisKey?: string;
  llm?: V36LlmLinkInfo;
  source?: V36Source;
  warnings?: string[];
  rawPayload?: V36UnknownMap;
}

export interface V36LlmEvidencePayload {
  schemaVersion?: V36SchemaVersion;
  eventId?: string;
  insuredId?: string;
  sessionId?: string;
  risk?: V36UnknownMap;
  modelScores?: V36ModelScores | V36UnknownMap;
  sequenceEvidence?: V36SequenceEvidence | V36UnknownMap;
  tabularEvidence?: V36TabularEvidence | V36UnknownMap;
  ruleEvidence?: V36RuleEvidence | V36UnknownMap;
  anomalyTypeAttribution?: V36AnomalyTypeAttribution | V36UnknownMap;
  churnContext?: V36ChurnContext | V36UnknownMap;
  forecastContext?: V36ForecastContext | V36UnknownMap;
  llmInstruction?: V36UnknownMap;
  llmExplanationInDataprocessor?: boolean;
  rawPayload?: V36UnknownMap;
  source?: V36Source;
  warnings?: string[];
  [key: string]: unknown;
}

export interface V36LlmExplanationRequest {
  forceRefresh?: boolean;
  style?: string;
  language?: string;
  includeRecommendedActions?: boolean;
}

export interface V36LlmExplanationResponse {
  schemaVersion?: V36SchemaVersion;
  eventId?: string;
  generatedAt?: string;
  provider?: string;
  model?: string;
  cached?: boolean;
  evidenceHash?: string;
  style?: string;
  language?: string;
  summary?: string;
  evidenceBullets?: string[];
  possibleInterpretation?: string;
  recommendedActions?: string[];
  modelScoreExplanation?: V36UnknownMap;
  disclaimer?: string;
  fallback?: boolean;
  source?: V36Source;
  warnings?: string[];
  rawPayload?: V36UnknownMap;
}

export interface V36UserRiskSummary {
  averageRiskScoreLast30d?: number;
  alertCountLast30d?: number;
  criticalAlertCountLast30d?: number;
  [key: string]: unknown;
}

export interface V36UserBaseline {
  usualCountry?: string;
  usualActiveHours?: number[];
  topApiFamilies?: Array<string | V36UnknownMap>;
  [key: string]: unknown;
}

export interface V36User360Response {
  schemaVersion?: V36SchemaVersion;
  insuredId?: string;
  persona?: V36PersonaDisabled;
  churn?: V36ChurnContext;
  risk?: V36UserRiskSummary;
  baseline?: V36UserBaseline;
  recentSessions?: V36UnknownMap[];
  riskTimeline?: V36UnknownMap[];
  source?: V36Source;
  warnings?: string[];
  rawPayload?: V36UnknownMap;
}

export type V36UserAlertsResponse = V36PagedResponse<V36LiveAlertItem>;

export interface V36ChurnRiskUser {
  insuredId?: string;
  churnProbability?: number;
  churnRiskLevel?: V36RiskLevel;
  averageRiskScore?: number;
  alertCount?: number;
  source?: V36Source;
  warnings?: string[];
  rawPayload?: V36UnknownMap;
  [key: string]: unknown;
}

export interface V36ChurnDashboardResponse {
  schemaVersion?: V36SchemaVersion;
  totalUsers?: number;
  highChurnRiskUsers?: number;
  mediumChurnRiskUsers?: number;
  lowChurnRiskUsers?: number;
  averageChurnProbability?: number;
  topChurnRiskUsers?: V36ChurnRiskUser[];
  churnRiskDistribution?: V36NumberMap;
  source?: V36Source;
  warnings?: string[];
  rawPayload?: V36UnknownMap;
}

export type V36ChurnUsersResponse = V36PagedResponse<V36ChurnRiskUser>;

export interface V36ForecastPoint {
  date?: string;
  timestamp?: string;
  label?: string;
  value?: number;
  actual?: number;
  forecast?: number;
  predicted?: number;
  [key: string]: unknown;
}

export interface V36ForecastDashboardResponse {
  schemaVersion?: V36SchemaVersion;
  forecastDate?: string;
  predictedTotalEvents?: number;
  predictedAnomalyRate?: number;
  expectedAlertVolume?: number;
  historicalTotalEvents?: V36ForecastPoint[];
  historicalAnomalyRate?: V36ForecastPoint[];
  forecastModelNames?: Record<string, string>;
  forecastWarnings?: string[];
  source?: V36Source;
  warnings?: string[];
  rawPayload?: V36UnknownMap;
}

export interface V36FinalWinnerItem {
  useCase?: string;
  winner?: string;
  model?: string;
  reason?: string;
  source?: string;
  raw?: V36UnknownMap;
  [key: string]: unknown;
}

export interface V36FinalWinnersResponse {
  schemaVersion?: V36SchemaVersion;
  available?: boolean;
  resource?: string;
  generatedAt?: string;
  warnings?: string[];
  payload?: V36FinalWinnerItem[] | V36UnknownMap;
  source?: V36Source;
  rawPayload?: V36UnknownMap;
}

export interface V36ReportMetadata {
  name?: string;
  title?: string;
  path?: string;
  available?: boolean;
  resource?: string;
  generatedAt?: string;
  description?: string;
  [key: string]: unknown;
}

export interface V36ReportMetadataResponse {
  schemaVersion?: V36SchemaVersion;
  status?: string;
  reports?: V36ReportMetadata[];
  items?: V36ReportMetadata[];
  warnings?: string[];
  source?: V36Source;
  rawPayload?: V36UnknownMap;
}
