// ---- Type Aliases ----
export type V36SchemaVersion = string;
export type V36RiskLevel = string;
export type V36Source = string;
export type V36UnknownMap = Record<string, unknown>;
export type V36NumberMap = Record<string, number>;

// ---- Paged Response ----
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

// ---- Request Parameters ----
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

// ---- Diagnostics ----
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

export interface V36KafkaPerformance {
  eventProcessingMsAvg?: number | null;
  eventProcessingMsP95?: number | null;
  performanceSummaryRunCount?: number | null;
  performanceSummaryLastRunAt?: string | null;
  kafka_listener_hot_path_blocked?: boolean | null;
  redisWriteMsAvg?: number | null;
  redisWriteMsP95?: number | null;
  modelInferenceMsAvg?: number | null;
  modelInferenceMsP95?: number | null;
  sqlWriteMsAvg?: number | null;
  sqlWriteMsP95?: number | null;
  dashboardRefreshMsAvg?: number | null;
  dashboardRefreshMsP95?: number | null;
  recordsProcessedPerSecond?: number | null;
  dashboardLastRefreshAt?: string | null;
  dashboardRefreshSkippedDueToRateLimit?: number | null;
  kafkaLagCached?: number | null;
  loadSheddingMode?: string | null;
  sequenceMsAvg?: number | null;
  sequenceMsP95?: number | null;
  tabularMsAvg?: number | null;
  tabularMsP95?: number | null;
  historyFetchMsAvg?: number | null;
  historyFetchMsP95?: number | null;
  rulesMsAvg?: number | null;
  rulesMsP95?: number | null;
  finalizationMsAvg?: number | null;
  finalizationMsP95?: number | null;
  alertPublishMsAvg?: number | null;
  alertPublishMsP95?: number | null;
  kafkaEventAgeReceiveMsAvg?: number | null;
  kafkaEventAgeReceiveMsP95?: number | null;
  sequenceMode?: string | null;
}

export interface V36KafkaDiagnostics {
  consumerGroupId?: string | null;
  topic?: string | null;
  configuredConcurrency?: number | null;
  assignedPartitions?: string | number | number[] | null;
  topicPartitionCount?: number | null;
  autoOffsetReset?: string | null;
  maxPollRecords?: number | null;
  maxPollIntervalMs?: number | null;
  lastConsumedAt?: string | null;
  lastAckAt?: string | null;
  lastProcessingError?: string | null;
  recordsProcessedTotal?: number | null;
  processingFailuresTotal?: number | null;
  assignedPartitionCount?: number | null;
  effectiveConsumerParallelism?: number | null;
  performance?: V36KafkaPerformance | null;
}

export interface V36IdempotencyDiagnostics {
  duplicateEventsSkipped?: number | null;
  duplicateSequenceAppendsSkipped?: number | null;
  duplicateAlertsSkipped?: number | null;
  duplicateSqlWritesSkipped?: number | null;
}

export interface V36PerformanceDiagnostics {
  eventProcessingMsAvg?: number | null;
  eventProcessingMsP95?: number | null;
  redisWriteMsAvg?: number | null;
  redisWriteMsP95?: number | null;
  modelInferenceMsAvg?: number | null;
  modelInferenceMsP95?: number | null;
  sqlWriteMsAvg?: number | null;
  sqlWriteMsP95?: number | null;
  dashboardRefreshMsAvg?: number | null;
  dashboardRefreshMsP95?: number | null;
  recordsProcessedPerSecond?: number | null;
  dashboardLastRefreshAt?: string | null;
  dashboardRefreshSkippedDueToRateLimit?: number | null;
  kafkaLagCached?: number | null;
  loadSheddingMode?: string | null;
  performanceSummaryRunCount?: number | null;
  performanceSummaryLastRunAt?: string | null;
  kafka_listener_hot_path_blocked?: boolean | null;
  sequenceMsAvg?: number | null;
  sequenceMsP95?: number | null;
  tabularMsAvg?: number | null;
  tabularMsP95?: number | null;
  historyFetchMsAvg?: number | null;
  historyFetchMsP95?: number | null;
  rulesMsAvg?: number | null;
  rulesMsP95?: number | null;
  finalizationMsAvg?: number | null;
  finalizationMsP95?: number | null;
  alertPublishMsAvg?: number | null;
  alertPublishMsP95?: number | null;
  kafkaEventAgeReceiveMsAvg?: number | null;
  kafkaEventAgeReceiveMsP95?: number | null;
  sequenceMode?: string | null;
}

export interface V36StatsDiagnostics {
  liveTimeBasis?: string | null;
}

export interface V36NextActionPredictionDiagnostics {
  enabled?: boolean | null;
  mode?: string | null;
  lastSkipReason?: string | null;
  predictionsGeneratedTotal?: number | null;
  predictionsSkippedTotal?: number | null;
}

export interface V36NextEventPredictionHeadItem {
  value: string;
  probability: number;
  rank: number;
}

export interface V36NextEventPredictionDeviation {
  deviationScore?: number | null;
  actual?: Record<string, string>;
  actualProbabilities?: Record<string, number>;
  predictionMatch?: Record<string, boolean>;
  previousPrediction?: V36NextEventPrediction;
  evaluatedEventId?: string;
  previousPredictionContextEventId?: string;
}

export interface V36NextEventPrediction {
  schemaVersion?: string;
  insuredId?: string;
  sessionId?: string;
  contextEventId?: string;
  contextSize?: number;
  model?: string;
  heads?: Record<string, V36NextEventPredictionHeadItem[]>;
  deviation?: V36NextEventPredictionDeviation | null;
  createdAt?: string;
  source?: string;
  warnings?: string[];
}

export interface V36NextEventPredictionEvidence {
  prediction?: V36NextEventPrediction;
  deviation?: V36NextEventPredictionDeviation | null;
  predictionAfterEvent?: V36NextEventPrediction;
}

export interface V36NextEventPredictionDiagnostics {
  enabled?: boolean | null;
  model?: string | null;
  topK?: number | null;
  minimumContextEvents?: number | null;
  heads?: string[];
  affectsRiskScore?: boolean | null;
  redisWrite?: boolean | null;
  sqlWrite?: boolean | null;
  deviationEvaluation?: boolean | null;
}

export interface V36SessionFinalizationDiagnostics {
  openSessionCount?: number | null;
  sessionsFinalizedByExplicitEnd?: number | null;
  sessionsFinalizedByInactivityTimeout?: number | null;
  sessionsFinalizedByMaxDuration?: number | null;
  expiredSessionFlushLastRunAt?: string | null;
  expiredSessionFlushLastFinalizedCount?: number | null;
  lateEventsForFinalizedSessions?: number | null;
  duplicateFinalizationSkipped?: number | null;
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
  sessionFinalization?: V36SessionFinalizationDiagnostics | null;
  kafka?: V36KafkaDiagnostics | null;
  idempotency?: V36IdempotencyDiagnostics | null;
  performance?: V36PerformanceDiagnostics | null;
  stats?: V36StatsDiagnostics | null;
  nextActionPrediction?: V36NextActionPredictionDiagnostics | null;
  nextEventPrediction?: V36NextEventPredictionDiagnostics | null;
  warnings?: string[];
  source?: V36Source;
  raw?: V36UnknownMap;
}

// ---- Security Overview ----
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
  sessionFinalization?: V36SessionFinalizationDiagnostics | null;
  kafka?: V36KafkaDiagnostics | null;
  idempotency?: V36IdempotencyDiagnostics | null;
  performance?: V36PerformanceDiagnostics | null;
  stats?: V36StatsDiagnostics | null;
  fieldCoverage?: V36UnknownMap;
  modelLatency?: V36UnknownMap;
  fallbackMode?: string;
  warnings?: string[];
  source?: V36Source;
  raw?: V36UnknownMap;
}

// ---- Alert Details ----
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
  riskTier?: V36RiskLevel;
  riskScale?: string;
  finalRiskScore?: number;
  anomalyType?: string;
  anomalyTypeConfidence?: number;
  xgboostAnomalyScore?: number;
  xgboostAnomalyScore100?: number;
  lightgbmAlertScore?: number;
  lightgbmAlertScore100?: number;
  transformerRiskScore100?: number | null;
  tcnRiskScore100?: number | null;
  ruleRiskScore?: number;
  modelContributions?: V36ModelContributions;
  triggeredRuleCodes?: string[];
  churnProbability?: number;
  churnRiskLevel?: V36RiskLevel;
  personaLabel?: string;
  eventMetadata?: V36EventMetadata | null;
  llmEvidencePayload?: V36LlmEvidencePayload | null;
  llmEvidencePayloadAvailable?: boolean;
  llmEvidenceRedisKey?: string;
  alertStatus?: string;
  createdAt?: string;
  sessionEndReason?: string | null;
  sessionEndedExplicitly?: boolean | null;
  source?: V36Source;
  warnings?: string[];
  rawPayload?: V36UnknownMap;
}

export type V36LiveAlertsResponse = V36PagedResponse<V36LiveAlertItem>;
export type V36CriticalAlertsResponse = V36LiveAlertsResponse;

// ---- Evidence / Explanations ----
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
  transformerRiskScore100?: number | null;
  tcnRiskScore100?: number | null;
  businessContextScore?: number;
  aggregationBoost?: number;
  finalRiskScore?: number;
  ruleRiskScore?: number;
  sequenceRunBoth?: boolean;
  sequenceActuallyRanModels?: string[];
  transformerUsedInFusion?: boolean;
  tcnUsedInFusion?: boolean;
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
  sequenceRunBoth?: boolean;
  sequenceActuallyRanModels?: string[];
  transformerUsedInFusion?: boolean;
  tcnUsedInFusion?: boolean;
  transformerRiskScore100?: number | null;
  tcnRiskScore100?: number | null;
  sequenceCatScore?: number;
  sequenceContScore?: number;
  sequenceCtxScore?: number;
  topSurpriseFields?: string[];
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

export interface V36SessionLifecycle {
  sessionEndReason?: string | null;
  sessionEndedExplicitly?: boolean | null;
  sessionEndedAt?: string | null;
  sessionDurationMs?: number | null;
  sessionEventCount?: number | null;
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
  eventMetadata?: V36EventMetadata | null;
  riskLevel?: V36RiskLevel;
  riskTier?: V36RiskLevel;
  riskScale?: string;
  finalRiskScore?: number;
  anomalyType?: string;
  anomalyTypeConfidence?: number;
  triggeredRules?: string[];
  modelScores?: V36ModelScores;
  modelContributions?: V36ModelContributions;
  sequenceEvidence?: V36SequenceEvidence | null;
  tabularEvidence?: V36TabularEvidence | null;
  ruleEvidence?: V36RuleEvidence | null;
  anomalyTypeAttribution?: V36AnomalyTypeAttribution;
  churnContext?: V36ChurnContext;
  forecastContext?: V36ForecastContext;
  persona?: V36PersonaDisabled;
  nextEventPredictionEvidence?: V36NextEventPredictionEvidence;
  runtimeWarnings?: string[];
  llmEvidencePayloadAvailable?: boolean;
  llmEvidenceRedisKey?: string;
  llm?: V36LlmLinkInfo;
  sessionEndReason?: string | null;
  sessionEndedExplicitly?: boolean | null;
  sessionEndedAt?: string | null;
  sessionDurationMs?: number | null;
  sessionEventCount?: number | null;
  sessionLifecycle?: V36SessionLifecycle | null;
  source?: V36Source;
  warnings?: string[];
  rawPayload?: V36UnknownMap;
}

export interface V36LlmEvidencePayload {
  schemaVersion?: V36SchemaVersion;
  eventId?: string;
  insuredId?: string;
  sessionId?: string;
  evidenceHash?: string;
  evidenceVersion?: string;
  evidenceCreatedAt?: string;
  eventMetadata?: V36EventMetadata | null;
  userMetadata?: V36UnknownMap | null;
  sessionMetadata?: V36UnknownMap | null;
  risk?: V36UnknownMap;
  modelScores?: V36ModelScores | V36UnknownMap;
  modelContributions?: V36ModelContributions;
  triggeredRules?: string[];
  sequenceEvidence?: V36SequenceEvidence | V36UnknownMap;
  tabularEvidence?: V36TabularEvidence | V36UnknownMap;
  ruleEvidence?: V36RuleEvidence | V36UnknownMap;
  anomalyTypeAttribution?: V36AnomalyTypeAttribution | V36UnknownMap;
  churnContext?: V36ChurnContext | V36UnknownMap;
  forecastContext?: V36ForecastContext | V36UnknownMap;
  runtimeWarnings?: string[];
  evidenceSummary?: string;
  llmInstruction?: V36UnknownMap;
  llmExplanationInDataprocessor?: boolean;
  rawPayload?: V36UnknownMap;
  source?: V36Source;
  warnings?: string[];
  [key: string]: unknown;
}

// ---- LLM Explanations ----
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
  forceRefresh?: boolean;
  evidenceHash?: string;
  style?: string;
  language?: string;
  summary?: string;
  riskNarrative?: string;
  behaviorNarrative?: string;
  modelNarrative?: string;
  rulesNarrative?: string;
  sequenceNarrative?: string;
  keyEvidenceBullets?: string[];
  evidenceBullets?: string[];
  possibleInterpretation?: string;
  recommendedActions?: string[];
  limitations?: string;
  modelScoreExplanation?: V36UnknownMap;
  triggeredRulesExplanation?: Array<Record<string, unknown>>;
  disclaimer?: string;
  fallback?: boolean;
  source?: V36Source;
  warnings?: string[];
  rawPayload?: V36UnknownMap;
}

export interface NormalizedLlmExplanation {
  schemaVersion?: string | null;
  eventId?: string | null;
  generatedAt?: string | null;
  provider?: string | null;
  model?: string | null;
  cached?: boolean | null;
  source?: string | null;
  forceRefresh?: boolean | null;
  fallback?: boolean | null;
  evidenceHash?: string | null;

  summary?: string | null;
  riskNarrative?: string | null;
  behaviorNarrative?: string | null;
  modelNarrative?: string | null;
  rulesNarrative?: string | null;
  sequenceNarrative?: string | null;
  possibleInterpretation?: string | null;
  limitations?: string | null;

  keyEvidenceBullets?: string[] | null;
  evidenceBullets?: string[] | null;
  recommendedActions?: string[] | null;
  triggeredRulesExplanation?: Array<Record<string, unknown>> | null;
  modelScoreExplanation?: Record<string, unknown> | null;

  disclaimer?: string | null;
  raw?: unknown;
}

// ---- User 360 / Risk ----
export interface V36UserRiskSummary {
  averageRiskScoreLast30d?: number;
  alertCountLast30d?: number;
  criticalAlertCountLast30d?: number;
  [key: string]: unknown;
}

export interface V36UserRecentSession {
  sessionId?: string;
  finalRiskScore?: number | null;
  riskLevel?: string | null;
}

export interface V36UserRiskTimelinePoint {
  timestamp?: string | null;
  finalRiskScore?: number | null;
  riskLevel?: string | null;
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
  nextEventPrediction?: V36NextEventPrediction;
  recentSessions?: V36UserRecentSession[];
  riskTimeline?: V36UserRiskTimelinePoint[];
  source?: V36Source;
  warnings?: string[];
  rawPayload?: V36UnknownMap;
}

export type V36UserAlertsResponse = V36PagedResponse<V36LiveAlertItem>;

// ---- Churn ----
export interface V36ChurnRiskUser {
  insuredId?: string;
  churnProbability?: number;
  churnRiskLevel?: V36RiskLevel;
  averageRiskScoreLast30d?: number;
  alertCountLast30d?: number;
  criticalAlertCountLast30d?: number;
  latestFinalRiskScore?: number;
  latestRiskLevel?: V36RiskLevel;
  /** @deprecated use averageRiskScoreLast30d */
  averageRiskScore?: number;
  /** @deprecated use alertCountLast30d */
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

// ---- Forecast ----
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

// ---- Final Winners ----
export interface V36FinalWinnerItem {
  use_case?: string;
  recommended_approach?: string;
  family?: string;
  selection_metric?: string;
  metric_value?: number;
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

// ---- Report Metadata ----
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
