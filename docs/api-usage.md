# API Usage Reference — V3.6.1 Frontend

## Overview

All endpoints are called through `src/services/analytics.ts`, which wraps axios via `src/services/api-client.ts`. Every response is unwrapped with `unwrapEnvelope()` (`src/services/http.ts`) — the frontend reads business fields from `response.data`, never from the response root.

The `ApiResponse<T>` envelope:

```json
{ "data": {}, "meta": null }
```

Paginated endpoints return pagination fields **inside** `data`:

```json
{ "data": { "items": [], "limit": 100, "offset": 0, "count": 0, "hasMore": false }, "meta": null }
```

---

## Endpoints

### 1. Security Overview

| Property | Value |
|----------|-------|
| **HTTP** | `GET /api/v1/security/overview` |
| **Service** | `getV36SecurityOverview()` |
| **Composable** | `src/composables/v36/useSecurityOverview.ts` |
| **Page(s)** | `src/pages/SecurityOverviewPage.vue` |

#### Data extracted

| Field | Used in | Display |
|-------|---------|---------|
| `totalEventsToday` | KPI card | Formatted number |
| `activeUsersToday` | KPI card | Formatted number |
| `anomalyRateToday` | KPI card | `formatPercent(,1)` |
| `criticalAlertsToday` | KPI card | Formatted number |
| `highRiskAlertsToday` | KPI card | Formatted number |
| `averageRiskScoreToday` | KPI card | `formatNullableScore` |
| `predictedAnomalyRateTomorrow` | KPI card | `formatPercent(,1)` |
| `predictedTotalEventsTomorrow` | KPI card | Formatted number |
| `expectedAlertVolumeTomorrow` | KPI card | Formatted number |
| `topAnomalyTypes` | BarListChart | Top 8 entries by value |
| `topTriggeredRules` | BarListChart | Top 8 entries by value |
| `fieldCoverageWarnings` | Warning list | Strings displayed as list |
| `source` | Chip + banner | `formatSource()` / `sourceInfoBanner()` |
| `warnings` | Banner | Joined string |

---

### 2. Live Alerts

| Property | Value |
|----------|-------|
| **HTTP** | `GET /api/v1/alerts/live?limit=&offset=&riskLevel=&anomalyType=&insuredId=&sessionId=&from=&to=` |
| **Service** | `getV36LiveAlerts(params)` |
| **Composable** | `src/composables/v36/useLiveAlerts.ts` |
| **Page(s)** | `src/pages/AlertsPage.vue` |

#### Data extracted (per item)

| Field | Used in | Display |
|-------|---------|---------|
| `riskTier ?? riskLevel` | Risk badge | `riskLevelDisplay()` + `riskTone()` |
| `finalRiskScore` | Table cell | `formatNullableScore` |
| `timestamp` | Table cell | `formatDate` |
| `eventAction` | Table cell | Raw string or `'n/a'` |
| `apiTemplate` | Table cell | Raw string or `'n/a'` |
| `apiFamily` | Table cell | Raw string or `'n/a'` |
| `insuredId` | Table cell → link | Link to User 360 |
| `sessionId` | Table cell | Mono string |
| `country` | Table cell | Raw string or `'n/a'` |
| `device` | Table cell | Raw string or `'n/a'` |
| `anomalyType` | Table cell | Raw string or `'UNKNOWN'` |
| `xgboostAnomalyScore100` | Table cell | `formatNullableScore` |
| `lightgbmAlertScore100` | Table cell | `formatNullableScore` |
| `transformerRiskScore100` | Table cell | `formatNullableScore` |
| `tcnRiskScore100` | Table cell | `'Not run'` if null, else `formatNullableScore` |
| `ruleRiskScore` | Table cell | `formatNullableScore` |
| `triggeredRuleCodes` | Table cell | Comma-joined |
| `sessionEndReason` | Table cell | `formatSessionEndReason` badge |
| `sessionEndedExplicitly` | Table cell | Yes/No badge |
| `churnProbability` + `churnRiskLevel` | Table cell | `"{level} / {percent}"` |
| `source` | Table cell + banner | Raw string / `sourceInfoBanner()` |
| `warnings` | Table cell | Comma-joined |
| `eventId` | Action buttons | Routes to investigation |

---

### 3. Critical Alerts

| Property | Value |
|----------|-------|
| **HTTP** | `GET /api/v1/alerts/critical?limit=&offset=` |
| **Service** | `getV36CriticalAlerts(params)` |
| **Composable(s)** | `useSecurityOverview.ts`, `useLiveAlerts.ts` |
| **Page(s)** | Security Overview (preview table), Live Alerts (summary count) |

#### Data extracted

Same per-item fields as Live Alerts. The overview page extracts: `riskLevel`, `eventId`, `insuredId`, `anomalyType`, `finalRiskScore`, `timestamp` for a compact preview table.

---

### 4. Alert Investigation

| Property | Value |
|----------|-------|
| **HTTP** | `GET /api/v1/alerts/{eventId}` |
| **Service** | `getV36AlertInvestigation(eventId)` |
| **Composable** | `src/composables/v36/useAlertInvestigation.ts` |
| **Page(s)** | `src/pages/AlertInvestigationPage.vue` |

#### Data extracted

| Section | Fields used |
|---------|-------------|
| Header | `riskTier ?? riskLevel`, `eventId`, `anomalyType`, `timestamp`, `finalRiskScore` |
| Event Metadata | `eventMetadata` — `eventAction`, `apiTemplate`, `apiFamily`, `country`, `device`, `browser`, `os`, `httpMethod`, `status`. Falls back to `'Metadata not available'` if null. |
| Model Scores | `modelScores.xgboostAnomalyScore100`, `.lightgbmAlertScore100`, `.transformerRiskScore100`, `.tcnRiskScore100` (null → `'Not run'`), `.ruleRiskScore`, `.finalRiskScore`, plus V3.6.1 fields: `.sequenceRunBoth`, `.sequenceActuallyRanModels`, `.transformerUsedInFusion`, `.tcnUsedInFusion`, plus legacy raw-score fields: `.xgboostAnomalyScore`, `.lightgbmAlertScore`, `.transformerSurpriseScore`, `.businessContextScore`, `.aggregationBoost` |
| Model Contributions | `modelContributions` — all numeric keys except `raw`, displayed as bar chart |
| Sequence Evidence | Two possible shapes (both handled): **Hydrated V3.6.1**: `selectedSequenceModel`, `.contextAvailable`, `.windowSize`, `.sequenceActuallyRanModels`, `.sequenceRunBoth`, `.transformerUsedInFusion`, `.tcnUsedInFusion`, `.transformerRiskScore100`, `.tcnRiskScore100` (null → `'Not run'`), `.topSurpriseFields` (string[]). **Non-hydrated legacy**: same common fields plus `.sequenceModelArtifact`, `.sequenceCatScore`, `.sequenceContScore`, `.sequenceCtxScore`, `.topSequenceSurpriseFields` ({field, value, score}[]). |
| Tabular Evidence | `tabularEvidence.availableModels`, `.unavailableModels`, `.featureWarnings` |
| Rule Evidence | `ruleEvidence.ruleContributions` — bar chart |
| Anomaly Attribution | `anomalyTypeAttribution.anomalyType`, `.confidence`, `.source` |
| Churn Context | `churnContext.probability`, `.riskLevel`, `.modelArtifact` |
| Forecast Context | `forecastContext.predictedTotalEvents`, `.predictedAnomalyRate`, `.expectedAlertVolume`, `.forecastModelNames` |
| Persona | `persona.source`, `.label` |
| Session Lifecycle | `sessionLifecycle.sessionEndReason`, `.sessionEndedExplicitly`, `.sessionEndedAt`, `.sessionDurationMs`, `.sessionEventCount` |
| LLM Links | `llm.evidenceAvailable`, `.evidenceEndpoint`, `.cachedExplanationEndpoint`, `.generateExplanationEndpoint` |
| Source/Warnings | `source`, `warnings`, `runtimeWarnings` |

---

### 5. LLM Evidence Payload

| Property | Value |
|----------|-------|
| **HTTP** | `GET /api/v1/explanations/alerts/{eventId}/evidence` |
| **Service** | `getV36LlmEvidence(eventId)` |
| **Composable** | `src/composables/v36/useLlmExplanation.ts` |
| **Page(s)** | Alert Investigation — evidence dialog (`openEvidence`) |

#### Data extracted

Rendered as raw JSON in a `pre` block via `JSON.stringify(evidence, null, 2)`. Key fields for debug/display:

| Field | Purpose |
|-------|---------|
| `evidenceHash` | Evidence fingerprint (debug) |
| `evidenceVersion` | Schema version of payload |
| `evidenceCreatedAt` | Timestamp of evidence creation |
| `eventMetadata` | Hydrated event metadata snapshot |
| `modelScores` | Snapshot of all model scores |
| `modelContributions` | Snapshot of contributions |
| `triggeredRules` | Rules that fired |
| `sequenceEvidence` | Sequence context snapshot |
| `tabularEvidence` | Tabular model context |
| `evidenceSummary` | Compact summary string |

---

### 6. LLM Explanation — GET (cached)

| Property | Value |
|----------|-------|
| **HTTP** | `GET /api/v1/explanations/alerts/{eventId}` |
| **Service** | `getV36CachedExplanation(eventId)` |
| **Composable(s)** | `useLlmExplanation.ts`, `useAiExplainer.ts` |
| **Page(s)** | Alert Investigation, AI Explainer modal |

#### Data extracted

| Field | Display |
|-------|---------|
| `cached` | Badge — `'Cached explanation'` / `'New explanation'` |
| `source` | Badge via `formatSource()` |
| `forceRefresh` | Badge if true |
| `summary` | Heading / main text |
| `evidenceBullets` | Bullet list |
| `possibleInterpretation` | Paragraph |
| `recommendedActions` | Ordered list |
| `modelScoreExplanation` | Optional map |
| `disclaimer` | Small footer text |
| `provider` + `model` | Badge detail |
| `generatedAt` | Timestamp |
| `evidenceHash` | Fingerprint |

---

### 7. LLM Explanation — POST (generate/force-regenerate)

| Property | Value |
|----------|-------|
| **HTTP** | `POST /api/v1/explanations/alerts/{eventId}` |
| **Service** | `generateV36Explanation(eventId, request)` |
| **Composable(s)** | `useLlmExplanation.ts`, `useAiExplainer.ts` |
| **Page(s)** | Alert Investigation |

#### Request body

```json
{
  "forceRefresh": false,
  "style": "security_analyst",
  "language": "fr",
  "includeRecommendedActions": true
}
```

- Normal generation: `forceRefresh: false`
- Force regenerate: `forceRefresh: true` (with confirmation dialog)

#### Response

Same shape as the GET response. `cached: false`, `source: "generated"` or `"force_generated"`.

#### Error handling

| HTTP Status | UI behavior |
|-------------|-------------|
| `404 EXPLANATION_NOT_FOUND` | `'No explanation generated yet'` |
| `404 EVIDENCE_NOT_FOUND` | `'Cannot generate because evidence is unavailable'` |
| `409 GENERATION_IN_PROGRESS` | `'Generation already in progress'` |
| 5xx/timeout | `normalizeApiError` message + retry |

---

### 8. Churn Dashboard

| Property | Value |
|----------|-------|
| **HTTP** | `GET /api/v1/churn/dashboard` |
| **Service** | `getV36ChurnDashboard()` |
| **Composable** | `src/composables/v36/useChurnDashboard.ts` |
| **Page(s)** | `src/pages/ChurnPage.vue` |

#### Data extracted

| Field | Display |
|-------|---------|
| `totalUsers` | KPI — formatted number |
| `highChurnRiskUsers` | KPI — formatted number |
| `mediumChurnRiskUsers` | KPI — formatted number |
| `lowChurnRiskUsers` | KPI — formatted number |
| `averageChurnProbability` | KPI — `formatPercent(,1)` |
| `churnRiskDistribution` | Donut chart segments |
| `source` | Chip + banner |
| `warnings` | Banner |

---

### 9. Churn Users

| Property | Value |
|----------|-------|
| **HTTP** | `GET /api/v1/churn/users?limit=&offset=&riskLevel=` |
| **Service** | `getV36ChurnUsers(params)` |
| **Composable** | `src/composables/v36/useChurnDashboard.ts` |
| **Page(s)** | Churn Page — table |

#### Data extracted (per user)

| Field | Display |
|-------|---------|
| `insuredId` | Table cell → link to User 360 |
| `churnProbability` | `formatPercent(,1)` |
| `churnRiskLevel` | Risk badge |
| `averageRiskScore` | `formatNullableScore` |
| `alertCount` | Formatted number |

---

### 10. Forecast Dashboard

| Property | Value |
|----------|-------|
| **HTTP** | `GET /api/v1/forecast/dashboard` |
| **Service** | `getV36ForecastDashboard()` |
| **Composable** | `src/composables/v36/useForecastDashboard.ts` |
| **Page(s)** | `src/pages/ForecastPage.vue` |

#### Data extracted

| Field | Display |
|-------|---------|
| `forecastDate` | KPI — string |
| `predictedTotalEvents` | KPI — formatted number |
| `predictedAnomalyRate` | KPI — `formatPercent(,1)` |
| `expectedAlertVolume` | KPI — formatted number |
| `forecastModelNames` | Chart subtitles |
| `historicalTotalEvents` | SparkAreaChart (values filtered to non-null) |
| `historicalAnomalyRate` | SparkAreaChart (values filtered to non-null) |
| `forecastWarnings` | Warning banner |
| `source` | Chip + banner |
| `warnings` | Banner |

---

### 11. Runtime Health

| Property | Value |
|----------|-------|
| **HTTP** | `GET /api/v1/ai/runtime-health` |
| **Service** | `getV36RuntimeHealth()` |
| **Composable(s)** | `src/composables/v36/useRuntimeHealth.ts`, `src/composables/v36/useSecurityOverview.ts` |
| **Page(s)** | `src/pages/RuntimeHealthPage.vue`, Security Overview |

#### Data extracted

| Section | Fields |
|---------|--------|
| KPI cards | `status`, `runtimeVersion`, `personaEnabled`, `llmEvidencePayloadEnabled`, `artifactBasePath`, `llmExplanationInDataprocessor`, `fallbackMode` (displayed as Sequence mode via `formatSequenceMode()` which maps `transformer`→`Transformer`, `tcn`→`TCN`, `insufficient_context`→`Insufficient sequence context`, `normal`→`Normal`, `rules_only`→`Rules only`, `degraded`→`Degraded`) |
| Model Health | `modelHealth` — per-model with model-aware statuses: `persona` with `unavailableReason` containing "intentionally skipped" → `'Disabled by design'`; `llmCall` with reason "api-service" → `'Handled by api-service'`; `llmEvidencePayload` with all artifacts OK → `'Ready / Available'`; `tcnOnnx` with no inference yet → `'No inference recorded yet'` |
| Session Finalization | `sessionFinalization.openSessionCount`, `.sessionsFinalizedByExplicitEnd`, `.sessionsFinalizedByInactivityTimeout`, `.sessionsFinalizedByMaxDuration`, `.expiredSessionFlushLastRunAt`, `.expiredSessionFlushLastFinalizedCount`, `.lateEventsForFinalizedSessions`, `.duplicateFinalizationSkipped` |
| Kafka | `kafka.consumerGroupId`, `.topic`, `.configuredConcurrency`, `.assignedPartitions` (API returns array or number; displayed via `formatAssignedPartitions()`), `.assignedPartitionCount`, `.effectiveConsumerParallelism`, `.topicPartitionCount`, `.autoOffsetReset`, `.maxPollRecords`, `.maxPollIntervalMs`, `.lastConsumedAt`, `.lastAckAt`, `.recordsProcessedTotal`, `.processingFailuresTotal`, `.lastProcessingError`, `.performance` — fallback source for performance when `data.performance` is null |
| Idempotency | `idempotency.duplicateEventsSkipped`, `.duplicateSequenceAppendsSkipped`, `.duplicateAlertsSkipped`, `.duplicateSqlWritesSkipped` |
| Performance | **Primary**: `data.performance`; **Fallback**: `data.kafka.performance`. Union of both shapes supports: `eventProcessingMsAvg/P95`, `.redisWriteMsAvg/P95`, `.modelInferenceMsAvg/P95`, `.sequenceMsAvg/P95`, `.tabularMsAvg/P95`, `.historyFetchMsAvg/P95`, `.rulesMsAvg/P95`, `.finalizationMsAvg/P95`, `.alertPublishMsAvg/P95`, `.kafkaEventAgeReceiveMsAvg/P95`, `.sqlWriteMsAvg/P95`, `.dashboardRefreshMsAvg/P95`, `.recordsProcessedPerSecond` (displayed via `formatThroughput()` as `0.00/s`), `.dashboardLastRefreshAt`, `.dashboardRefreshSkippedDueToRateLimit`, `.kafkaLagCached`, `.loadSheddingMode`, `.sequenceMode`, plus kafka-specific: `.performanceSummaryRunCount`, `.performanceSummaryLastRunAt`, `.kafka_listener_hot_path_blocked`. Values `normal`/`rules_only`/`degraded`/`transformer`/`tcn`/`insufficient_context` in `.loadSheddingMode`/`.sequenceMode` are mapped to user-friendly labels via `formatSequenceMode()`/`formatLoadSheddingMode()`. |
| Stats | `stats.liveTimeBasis` |
| Next Action Prediction | `nextActionPrediction.enabled`, `.mode`, `.lastSkipReason`, `.predictionsGeneratedTotal`, `.predictionsSkippedTotal` |
| Source/Warnings | `source`, `warnings` |

---

### 12. Security Diagnostics

| Property | Value |
|----------|-------|
| **HTTP** | `GET /api/v1/security/diagnostics` |
| **Service** | `getV36Diagnostics()` |
| **Composable(s)** | `useSecurityOverview.ts`, `useRuntimeHealth.ts` |
| **Page(s)** | Security Overview, Runtime Health |

#### Data extracted

| Field | Used where |
|-------|-----------|
| `fieldCoverage` | Runtime Health — displays section count, sequence coverage details (`totalEvents`, `highUnknownFieldWarnings.length`), tabular coverage details (`unknownCategoricalRatio` via `formatUnknownRatio()`, `missingFeatureCount`, `defaultedFeatureCount`, `nanInfinityReplacements`) |
| `modelLatency` | Runtime Health — displays `available` boolean, `benchmarkLastRunAt` timestamp, and per-model entries (`xgboostMs`, `lightgbmMs`, `catboostMs`, `oneclasssvmMs`, `churnMs`) rendered via `formatModelLatencyName()` and `formatModelLatencyValue()` (0ms → `<1ms`) |
| `fallbackMode` | Runtime Health — mapped via `formatSequenceMode()` |
| `sessionFinalization` | Runtime Health — fallback source for session finalization data |
| `kafka` | Runtime Health — fallback source for Kafka data |
| `idempotency` | Runtime Health — fallback source for idempotency data |
| `performance` | Runtime Health — fallback source for performance data |
| `stats` | Runtime Health — fallback source for live stats |
| `warnings` | Banner merged with overview/runtime warnings |

---

### 13. User 360

| Property | Value |
|----------|-------|
| **HTTP** | `GET /api/v1/users/{insuredId}/360` |
| **Service** | `getV36User360(insuredId)` |
| **Composable** | `src/composables/v36/useUser360.ts` |
| **Page(s)** | `src/pages/User360Page.vue` |

#### Data extracted

| Field | Display |
|-------|---------|
| `insuredId` | Page title |
| `churn.probability` | KPI — `formatPercent` |
| `churn.riskLevel` | KPI — risk level string |
| `risk.averageRiskScoreLast30d` | KPI — `formatNullableScore` (null → `'n/a'`) |
| `risk.alertCountLast30d` | KPI — formatted number (null → `'n/a'`) |
| `risk.criticalAlertCountLast30d` | KPI — formatted number |
| `persona.source`, `.label` | Persona disabled panel |
| `baseline.usualCountry` | Baseline grid |
| `baseline.usualActiveHours` | Baseline grid — number array |
| `baseline.topApiFamilies` | Baseline grid — empty array shows `'No API families available'` instead of `'n/a'` |
| `recentSessions` | Session list — shows `sessionId`, `riskLevel`, `finalRiskScore`. Risk level inferred from score via `riskLevelFromScore()` if missing. Up to 8 items. |
| `riskTimeline` | Timeline list — shows `timestamp`, `finalRiskScore`. Risk level optionally inferred as display-only. Up to 8 items. |
| `source`, `warnings` | Chip + banner |

---

### 14. User Alerts

| Property | Value |
|----------|-------|
| **HTTP** | `GET /api/v1/users/{insuredId}/alerts?limit=&offset=` |
| **Service** | `getV36UserAlerts(insuredId, params)` |
| **Composable** | `src/composables/v36/useUser360.ts` |
| **Page(s)** | User 360 — alerts table |

#### Data extracted

Same per-item fields as Live Alerts (section 2). Displayed in a compact table: `riskLevel`, `finalRiskScore`, `timestamp`, `anomalyType`, `eventAction`, action button.

---

### 15. Final Winners

| Property | Value |
|----------|-------|
| **HTTP** | `GET /api/v1/ai/final-winners` |
| **Service** | `getV36FinalWinners()` |
| **Composable** | `src/composables/v36/useRuntimeHealth.ts` |
| **Page(s)** | Runtime Health |

#### Data extracted

| Field | Display |
|-------|---------|
| `payload[]` | Array of `V36FinalWinnerItem`. Each item shows: `use_case` (primary), `recommended_approach`, `family`, `selection_metric`, `metric_value`. Displayed as `use_case → recommended_approach` with `family | metric=value` detail. |
| `available` | If `false`, shows "Diagnostics not available yet". |
| Empty `payload` | Shows "No data" empty state. |

#### Important notes

- API returns **snake_case** fields: `use_case`, `recommended_approach`, `family`, `selection_metric`, `metric_value`.
- Previous frontend code expected **camelCase** (`useCase`, `winner`, `model`) showing fake `winner-1` labels. Now reads actual API fields.
- Old camelCase fields (`useCase`, `winner`, `model`) are kept in the type as fallback for backward compat.

---

### 16. Reports Metadata

| Property | Value |
|----------|-------|
| **HTTP** | `GET /api/v1/ai/reports` |
| **Service** | `getV36Reports()` |
| **Composable** | `src/composables/v36/useRuntimeHealth.ts` |
| **Page(s)** | Runtime Health |

#### Data extracted

`items ?? reports` — array of `V36ReportMetadata` displayed in a table: `name`, `available`, `generatedAt`, `resource`/`path`.

---

### 17. SSE Live Stream

| Property | Value |
|----------|-------|
| **HTTP** | `GET /api/v1/stream/live` (EventSource) |
| **Service** | `getLiveStatsStreamUrl()` — appends `?access_token=<token>` |
| **Composable** | `src/composables/v36/useV36SseRefresh.ts` (ref-counted singleton) |
| **All pages** | Auto-refresh on SSE events |

#### Architecture

The SSE composable follows a **ref-counted singleton** pattern:
- A single `EventSource` connection is shared across all pages.
- `refCount` tracks how many composable consumers are mounted.
- The connection stays open while ≥1 consumer is mounted.
- When the last consumer unmounts, the connection is closed.

On **connection loss**, the native `EventSource` auto-reconnect is relied on.
If SSE is unavailable or fails repeatedly, a **polling fallback** activates (see [Live Update Strategy](#live-update-strategy)).

#### Connection state

`useV36SseState()` exposes shared reactive state without registering a consumer:
- `connected` — `Ref<boolean>`
- `connecting` — `Ref<boolean>` (true between disconnect and successful reconnection)
- `disconnected` — `ComputedRef<boolean>`
- `lastEventAt` — `Ref<Date | null>`
- `error` — `Ref<string>`
- `reconnect()` — manually forces reconnection

#### Auth

The SSE endpoint receives the JWT as a query parameter (`?access_token=<token>`) because the native `EventSource` API does not support custom `Authorization` headers.

#### Events consumed

| Event name | Pages that refresh |
|------------|-------------------|
| `stats` | (reserved) |
| `alerts` | Live Alerts, Alert Investigation, User 360 |
| `security-overview` | Security Overview |
| `runtime-health` | Security Overview, Runtime Health |
| `churn` | Churn Dashboard |
| `forecast` | Forecast Dashboard |
| `refresh` | Dispatches to the matching target based on payload |

#### Throttling

To avoid excessive REST API calls, each page composable throttles its SSE-triggered refresh:

| Page | Throttle interval |
|------|------------------|
| Live Alerts | 2s |
| User 360 | 2s |
| Security Overview | 5s |
| Runtime Health | 5s |
| Churn Dashboard | 10s |
| Forecast Dashboard | 10s |

The throttle utility (`src/utils/throttle.ts`) uses a timestamp-based approach: the first call fires immediately, subsequent calls within the window are queued and fire after the cooldown expires.

---

## Live Update Strategy

| Layer | Behaviour |
|-------|-----------|
| **Primary** | SSE (`/api/v1/stream/live`) — instant push from backend |
| **Fallback** | Polling at configurable interval if SSE fails to connect |
| **Manual** | Refresh buttons kept as recovery; tooltip explains auto-update is normal |

### Connection indicator

`LiveConnectionBadge.vue` (`src/components/common/LiveConnectionBadge.vue`) displays the current state:

| State | Chip color | Icon | Label |
|-------|-----------|------|-------|
| Connected | Positive (green) | `signal_wifi_4_bar` | `live.connected` |
| Connecting | Warning (orange) | `signal_wifi_off` | `live.connecting` |
| Disconnected | Negative (red) | `wifi_off` | `live.disconnected` |

When connected, a timestamp of the last SSE event is shown alongside the badge.
When disconnected, a tooltip offers a manual reconnect action.

### Polling fallback

If the `EventSource` constructor fails or the endpoint is unreachable, polling starts at 30s intervals.
Polling stops when SSE reconnects.
The polling action is set globally by whichever page composable is mounted.

### Visibility handling

The SSE connection is unaffected by page visibility (native EventSource works in background tabs).
If the polling fallback is active, no additional visibility check is applied since SSE auto-reconnect is the primary recovery path.

### Manual refresh buttons

All 6 data pages retain their refresh buttons. The button now includes:
- A `q-tooltip` showing `live.manualRefreshTooltip` ("Manual refresh. Live updates are normally automatic.")
- The button remains functional at all times as a recovery mechanism.

### Pages using automatic refresh

| Page | SSE events | Refresh on |
|------|-----------|------------|
| `AlertsPage.vue` | `alerts` | New/updated alerts |
| `SecurityOverviewPage.vue` | `security-overview`, `runtime-health` | Overview or runtime change |
| `RuntimeHealthPage.vue` | `runtime-health` | Runtime state change |
| `ChurnPage.vue` | `churn` | Churn dashboard update |
| `ForecastPage.vue` | `forecast` | Forecast update |
| `User360Page.vue` | `alerts` | New alert (refetches current user) |
| `AlertInvestigationPage.vue` | `alerts` | New/updated alerts |

---

## Null handling rules

| Scenario | Frontend behavior | Helper |
|----------|------------------|--------|
| `tcnRiskScore100 = null` | `'Not run'` | `t('common.notRun')` or `formatModelRunStatus(null, false)` |
| `tcnContribution = 0.0` | `'0.00'` (explicit zero) | `formatNullableScore(0)` |
| `eventMetadata = null` | `'Metadata not available'` | `t('v36.investigation.metadataNotAvailable')` |
| `sequenceEvidence = null` | Section shows nothing | `v-if` guard on computed |
| `tabularEvidence = null` | Section shows empty state | `v-if` guard |
| `forecast predicted = null` | Skipped from chart array | `pointValue()` returns `null`, filtered out |
| `lastInferenceSucceeded = null` | `'No inference recorded yet'` | `t('v36.runtime.noInferenceRecorded')` |
| `risk.averageRiskScoreLast30d = null` | `'n/a'` | `formatNullableScore` |
| `riskLevel = null` | `'UNKNOWN'` | `riskLevelDisplay(riskTier, riskLevel) ?? 'UNKNOWN'` |
| `eventProcessingMsP95 = null` | `'N/A'` | `formatLatencyMs` returns `'N/A'` |
| `assignedPartitions = [...]` | Partition list | `formatAssignedPartitions()` |
| `recordsProcessedPerSecond = 0` | `'0.00/s'` | `formatThroughput(0)` |
| `recordsProcessedPerSecond = null` | `'No recent throughput'` | `formatThroughput(null)` |
| `modelLatency value = 0` | `'<1ms'` | `formatModelLatencyValue(0)` |
| `modelLatency value = null` | `'n/a'` | `formatModelLatencyValue(null)` |
| `unknownCategoricalRatio = 0.019` | `'1.9%'` | `formatUnknownRatio(0.019)` |
| `fallbackMode = 'insufficient_context'` | `'Insufficient sequence context'` | `formatSequenceMode('insufficient_context')` |
| `loadSheddingMode = 'insufficient_context'` | `'Insufficient sequence context'` | `formatLoadSheddingMode('insufficient_context')` |
| `topApiFamilies = []` | `'No API families available'` | `t('v36.user360.noApiFamilies')` |
| `finalRiskScore` exists in timeline | Shown as formatted score, not `'n/a'` | `formatNullableNumber()` |
| `riskLevel` missing from timeline point | Inferred display-only from `finalRiskScore`: `<35 LOW, <60 MEDIUM, <80 HIGH, >=80 CRITICAL` | `riskLevelFromScore()` |

## Source display

| `source` value | Banner type | Message |
|---------------|-------------|---------|
| `redis` | None (normal) | — |
| `sql_fallback` | info | "Loaded from durable SQL fallback because Redis cache was unavailable." |
| `generated_fallback` | warning | "Live snapshot not available. Showing generated fallback/default values." |
| `sql` | info | "Loaded from persisted SQL history." |
| `sql-payload` | info | "Loaded from stored investigation/evidence payload." |
| `generated` | Badge only | — |
| `force_generated` | Badge only | — |

Implemented via `sourceInfoBanner()` in `src/utils/format.ts`.

## Metric help tooltips

### Overview
A reusable `InfoTooltip` component (`src/components/common/InfoTooltip.vue`) renders a small `info_outline` icon that shows a short explanation on hover/focus/tap. It uses Quasar's `q-icon` + `q-tooltip`.

Props:
- `text` (required) — tooltip content
- `size` — icon size, default `16px`
- `maxWidth` — tooltip max-width, default `300px`
- `ariaLabel` — accessibility label, defaults to `text`

### Pages with help icons

| Page | Coverage |
|------|----------|
| **RuntimeHealthPage.vue** | KPI cards, model health fields, Kafka section, performance section, idempotency, session finalization, final winners |
| **SecurityOverviewPage.vue** | KPI cards (total events, anomaly rate, etc.), section titles (top anomaly types, top triggered rules, field coverage) |
| **AlertsPage.vue** | Table headers: risk level, final risk score |
| **AlertInvestigationPage.vue** | Section titles: model scores, contributions, sequence/tabular/rule evidence, anomaly attribution, churn risk, forecast context |
| **User360Page.vue** | KPI cards (churn probability, average risk, alert counts), baseline fields, risk timeline, persona |
| **ChurnPage.vue** | KPI cards (total users, high/medium/low risk, average probability), distribution/top users sections, table headers |
| **ForecastPage.vue** | KPI cards (forecast date, predicted events, anomaly rate, alert volume), chart section titles |

### Tooltip text storage
All tooltip texts are stored under `v36.help` in i18n locale files:
- `src/i18n/messages/en-US.ts` — full English keys
- `src/i18n/messages/fr-FR.ts` — inherits English via `...enUS.v36` spread

Structure:
```ts
v36: {
  help: {
    runtime: { /* runtime health labels */ },
    alerts: { /* risk scores, source */ },
    investigation: { /* evidence types, force generate */ },
    user360: { /* churn probability, baseline */ },
    churn: { /* risk breakdown */ },
    forecast: { /* predicted values */ },
    securityOverview: { /* KPI cards */ },
  }
}
```

### Adding new tooltips
1. Add the i18n key under `v36.help.<page>` in `en-US.ts`.
2. Import `InfoTooltip` from `src/components/common/InfoTooltip.vue`.
3. Use `<InfoTooltip :text="t('v36.help.<page>.<key>')" />` inline next to the label.
4. For dynamic fields (model rows), add a `help` property to the field object and render conditionally.

### Styling
- `.metric-info-icon` — opacity 0.7, cursor help, vertical-align middle
- `.metric-info-icon:hover, .metric-info-icon:focus-visible` — opacity 1
- Defined in `src/css/app.scss`

### Accessibility
- `tabindex="0"` on the `q-icon` for keyboard focus
- `aria-label` bound to text or custom `ariaLabel` prop
- `q-tooltip` shows on hover/focus
- Mobile tap works via `q-tooltip` touch events
