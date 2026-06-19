# Noveo Care Insights - Dashboard Frontend

Quasar 2 + Vue 3 + TypeScript frontend for the V3.6.1 hybrid risk intelligence cockpit.

The frontend is presentation-only. It calls api-service through `VITE_API_BASE_URL` and never calls dataprocessor, Redis, SQL Server, Kafka, Gemini, or any LLM provider directly. It does not run ML inference, recompute risk scores, or generate explanations locally.

## Runtime Health New Sections

The **Runtime Health** page (`/runtime`) now displays optional diagnostic sections when `api-service` returns them:

| Section | Source | Fields |
|---------|--------|--------|
| **Kafka Consumer** | `runtimeHealth.kafka` or `diagnostics.kafka` | Consumer group, topic, concurrency, partitions, offset reset, poll config, consumed/ack timestamps, processing errors, records processed total |
| **Idempotency / Dedupe** | `runtimeHealth.idempotency` or `diagnostics.idempotency` | Duplicate events/sequence/alerts/SQL writes skipped |
| **Performance** | `runtimeHealth.performance` or `diagnostics.performance` | Event processing, Redis write, model inference, SQL write, dashboard refresh avg/p95 latencies, records/sec, dashboard last refresh, rate limit skips, cached Kafka lag, load shedding mode |
| **Live Stats** | `runtimeHealth.stats` or `diagnostics.stats` | `liveTimeBasis` (`ingestion` or `event`) with contextual note |
| **Next Action Prediction** | `runtimeHealth.nextActionPrediction` | Enabled flag, mode, last skip reason, generated/skipped totals |
| **Session Finalization** | `runtimeHealth.sessionFinalization` or `diagnostics.sessionFinalization` | Open sessions, finalized by explicit end/inactivity timeout/max duration, flush metadata, late events, duplicate finalization skipped |

All sections are optional and null-safe. If a section is absent from the API response, a small empty state message is shown instead of crashing.

### Visual Hints

- **Kafka**: If `assignedPartitions < configuredConcurrency`, a warning banner appears. If `lastProcessingError` is present, an error banner appears. High `maxPollRecords` (>100) shows a warning.
- **Idempotency**: Zero values show as neutral/good. Non-zero values are informational (idempotency layer activity, not necessarily fatal).
- **Performance**: High `kafkaLagCached` (>10000) shows a warning banner. Load shedding mode is color-coded: normal (positive), rules-only (warning), degraded (error).
- **Next Action Prediction**: When `enabled` is `false`, a neutral info box states "Next action prediction is disabled."
- **Session Finalization**: `duplicateFinalizationSkipped` counter added to the existing panel.

## Alert Investigation Session Lifecycle

The **Alert Investigation** page (`/alerts/:eventId`) displays a **Session Lifecycle** card that reads from:

1. `data.sessionLifecycle` (nested object) — preferred source
2. Flat fallback fields: `sessionEndReason`, `sessionEndedExplicitly`, `sessionEndedAt`, `sessionDurationMs`, `sessionEventCount`

End reasons are mapped to human-readable labels and color-coded badges:

| Reason | Badge Tone | Label |
|--------|-----------|-------|
| `explicit_logout` | `info` | Explicit logout |
| `explicit_sso_disconnect` | `info` | Explicit SSO disconnect |
| `inactivity_timeout` | `warning` | Inactivity timeout |
| `max_open_duration` | `warning` | Max open duration |
| null / unknown | `grey` | Unknown |

> Timeout finalization is lifecycle closure, not automatically an anomaly. Risk comes from the whole session evidence.

## Alert List Rows

The **Live Alerts** table (`/alerts`) includes two optional compact columns:

- **Session End Reason** — shown as a small badge when present
- **Ended Explicitly** — small yes/no badge when available

These columns do not overcrowd and are entirely optional (null-safe).

## V3.6.1 Architecture

- Dataprocessor receives audit events, runs AI/rules/risk/churn/forecast processing, stores results, publishes alerts, and creates LLM evidence payloads.
- Api-service reads SQL Server and Redis results, exposes REST/SSE endpoints, and calls the LLM provider only after an explicit explanation request.
- Frontend displays the V3.6.1 dashboards and requests explanations only through api-service.

API responses use the envelope `{ data, meta }`. Business fields are read from `response.data`. V3.6.1 list pagination fields (`items`, `limit`, `offset`, `count`, `hasMore`) also live inside `data`.

V3.6.1 alert investigation uses `eventId`:

- Frontend route: `/alerts/:eventId`
- Api-service endpoint: `/api/v1/alerts/{eventId}`

Numeric anomaly IDs belonged to the removed legacy anomaly screens.

## Routes

| Route | Page |
| --- | --- |
| `/` | Redirects to `/security-overview` |
| `/overview` | Redirects to `/security-overview` |
| `/security-overview` | Security overview command center |
| `/alerts` | Live and critical alerts |
| `/alerts/:eventId` | Alert investigation detail |
| `/users` | User 360 lookup entry |
| `/users/:insuredId/360` | User 360 detail |
| `/churn` | Churn dashboard |
| `/forecast` | Forecast dashboard |
| `/runtime` | Runtime health and diagnostics |
| `/account` | Account settings |

## Source Layout

```text
src/
  components/dashboard/
    BarListChart.vue
    DonutBreakdownChart.vue
    SkeletonCard.vue
    SparkAreaChart.vue
  composables/v36/
    useSecurityOverview.ts
    useLiveAlerts.ts
    useAlertInvestigation.ts
    useLlmExplanation.ts
    useUser360.ts
    useChurnDashboard.ts
    useForecastDashboard.ts
    useRuntimeHealth.ts
    useV36SseRefresh.ts
  pages/
    SecurityOverviewPage.vue
    AlertsPage.vue
    AlertInvestigationPage.vue
    User360Page.vue
    ChurnPage.vue
    ForecastPage.vue
    RuntimeHealthPage.vue
  services/
    analytics.ts
    http.ts
  types/
    analytics.ts
    api.ts
```

The old `useDashboard.ts`, legacy pages, legacy dashboard sections, and legacy endpoint wrappers were removed. The remaining analytics service exports V3.6.1 wrappers only.

## Api-Service Endpoints Used

- `GET /api/v1/ai/runtime-health`
- `GET /api/v1/security/overview`
- `GET /api/v1/security/diagnostics`
- `GET /api/v1/alerts/live`
- `GET /api/v1/alerts/critical`
- `GET /api/v1/alerts/{eventId}`
- `GET /api/v1/explanations/alerts/{eventId}/evidence`
- `GET /api/v1/explanations/alerts/{eventId}`
- `POST /api/v1/explanations/alerts/{eventId}`
- `GET /api/v1/users/{insuredId}/360`
- `GET /api/v1/users/{insuredId}/alerts`
- `GET /api/v1/churn/dashboard`
- `GET /api/v1/churn/users`
- `GET /api/v1/forecast/dashboard`
- `GET /api/v1/ai/final-winners`
- `GET /api/v1/ai/reports`
- `GET /api/v1/stream/live`

## SSE

The frontend uses `/api/v1/stream/live` as a refresh signal stream. Supported events:

- `stats`
- `refresh`
- `alerts`
- `security-overview`
- `runtime-health`
- `churn`
- `forecast`

SSE payloads are treated as invalidation signals; pages refetch their own REST data.

## LLM Explanation Behavior

The alert investigation page may load a cached explanation on page load. It calls `POST /api/v1/explanations/alerts/{eventId}` only when the analyst clicks **Generate Explanation**. Evidence payloads are shown through the evidence dialog.

## Session Finalization Metadata

The api-service exposes optional session lifecycle metadata in V3.6.1 alert investigation responses and optional session finalization counters in runtime health/diagnostics.

The dataprocessor supports hybrid session finalization:

- **Explicit finalization**: triggered by user logout (`Déconnexion`, `SSO Disconnect`). Reasons: `explicit_logout`, `explicit_sso_disconnect`.
- **Implicit finalization**: triggered by inactivity timeout or max-open-duration. Reasons: `inactivity_timeout`, `max_open_duration`.

Where fields appear:

- **Alert Investigation** (`/alerts/:eventId`): a **Session Lifecycle** card shows `sessionEndReason`, `sessionEndedExplicitly`, `sessionEndedAt`, `sessionDurationMs`, and `sessionEventCount` when available.
- **Runtime Health** (`/runtime`): a **Session Finalization** panel shows counters: open sessions, finalized by explicit end, inactivity timeout, max duration, flush metadata.
- **Security Overview**: a compact session finalization summary shows open sessions and explicit/timeout finalized counts.

All session lifecycle fields are optional and null-safe. Missing fields show a neutral empty state. Timeout finalization is lifecycle closure, not automatically an anomaly.

## Forecast and Persona Notes

- Forecast uses Ridge for anomaly-rate forecasting and XGBoost for total-events forecasting.
- Persona segmentation is displayed as disabled in V3.6.1.

## Development

```bash
npm install
npm run dev
```

The Quasar dev server runs on port `9008`.

## Validation

```bash
npm run lint
npm run build
```
