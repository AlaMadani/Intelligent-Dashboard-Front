# Noveo Care Insights — Dashboard Frontend

A **Quasar 2 + Vue 3 + TypeScript** single-page application that serves as the behavior intelligence cockpit for live session operations. Connects to the **API Service** (port 8081) for real-time analytics, session data, anomaly events, risk profiles, and AI-powered explanations. Features 4-language internationalization, SSE live streaming, ECharts visualizations, and a CSS-first design system.

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Technology Stack](#technology-stack)
3. [Project Structure](#project-structure)
4. [Pages & Routes](#pages--routes)
5. [Data Flow & State Management](#data-flow--state-management)
6. [Component Library](#component-library)
7. [API Integration](#api-integration)
8. [SSE & Live Streaming](#sse--live-streaming)
9. [Internationalization](#internationalization)
10. [Design System](#design-system)
11. [Configuration Reference](#configuration-reference)
12. [Development Setup](#development-setup)
13. [Build & Deploy](#build--deploy)

---

## Architecture Overview

`
Browser
  |
  +-- Quasar / Vue 3 (hash router on port 9008)
  |     |
  |     +-- App.vue -> router-view
  |     |     |
  |     |     +-- MainLayout.vue (q-layout + header + drawer)
  |     |           |
  |     |           +-- 7 page components
  |     |                 |
  |     |                 +-- 21 dashboard section components
  |     |
  |     +-- useDashboard.ts (singleton composable, ref-counted lifecycle)
  |     |     |
  |     |     +-- Axios REST calls -> api-service :8081
  |     |     +-- EventSource SSE   -> api-service :8081/stream/live
  |     |     +-- Pinia liveStream store -> EventSource for alerts
  |     |
  |     +-- Boot files:
  |           +-- i18n (vue-i18n, 4 locales)
  |           +-- axios (shared HTTP client)
  |           +-- logger (global error handler -> Logstash :5001)
  |
  +-- External links:
        +-- Grafana :3000/dashboards
        +-- Kibana :5601/app/kibana_overview
`

The frontend is a **hash-routed SPA** that communicates with the backend API service via HTTP REST and Server-Sent Events. There is no direct communication with the Data Processor worker — all data flows through the API Service's Redis bridge and SQL read layer.

---

## Technology Stack

| Layer | Technology | Version | Purpose |
|-------|-----------|---------|---------|
| Framework | Quasar 2 | ^2.16.0 | UI framework with Vite build tool |
| Core | Vue 3 | ^3.5.22 | Reactive component framework |
| Language | TypeScript | ^5.9.2 | Type-safe development |
| State | Pinia | ^3.0.1 | Centralized store (live-stream alerts) |
| Routing | vue-router | ^5.0.0 | Hash-mode client-side routing |
| HTTP | Axios | ^1.2.1 | REST API calls |
| Charts | ECharts + vue-echarts | ^6.0.0 / ^8.0.1 | Complex charting (forecast, radar) |
| i18n | vue-i18n | ^11.3.2 | Multi-language support (4 locales) |
| CSS | SCSS + Quasar variables | -- | Custom design system |
| Lint | ESLint 9 + Prettier | -- | Flat config, strict TypeScript rules |
| Build | Vite (via @quasar/app-vite) | ^2.1.0 | Fast dev server + optimized builds |
| Type Check | vue-tsc | ^3.0.7 | Vue SFC type checking |

---

## Project Structure

`
src/
+-- App.vue                              # Root component (<router-view />)
+-- boot/
|   +-- axios.ts                         # Shared Axios client, env base URL
|   +-- i18n.ts                          # vue-i18n setup, 4 locales
|   +-- logger.ts                        # Global error handler -> Logstash
+-- components/dashboard/
|   +-- OverviewHero.vue                 # Hero section with live posture
|   +-- KpiStrip.vue                     # 4 KPI cards (sessions, rate, risk, events)
|   +-- LivePulse.vue                    # Connection indicator (pulsing dot)
|   +-- TrendForecastChart.vue           # ECharts Prophet forecast visualization
|   +-- AnomalyEventsSection.vue         # Anomaly search table
|   +-- AnomalyWorkbenchSection.vue      # 3-column investigation surface
|   +-- SessionsSection.vue              # Paginated session analysis table
|   +-- LiveSessionsSection.vue          # Redis-backed active session cards
|   +-- AnalyticsSection.vue             # 12-column analytics grid
|   +-- UserInsightsSection.vue          # Risk profile lookup + predictions
|   +-- ClusterMixPanel.vue              # Persona cluster donut chart
|   +-- DropOffsPanel.vue                # Session abandonment funnel
|   +-- PathDeviationsPanel.vue          # Unusual navigation transitions
|   +-- JourneyPathMap.vue               # Action sequence flow diagram
|   +-- FeatureRadarChart.vue            # ECharts ML feature importance radar
|   +-- CountryActivityMap.vue           # SVG world map + country ranking
|   +-- CountryActivityMapSvg.vue        # Pure SVG map (grid, continents, markers)
|   +-- BarListChart.vue                 # Ranked horizontal bar list
|   +-- DonutBreakdownChart.vue          # CSS conic-gradient donut chart
|   +-- SparkAreaChart.vue               # Pure SVG sparkline with gradient
|   +-- DashboardCardActions.vue         # Reusable expand + export buttons
|   +-- SkeletonCard.vue                 # Shimmer placeholder card
+-- composables/
|   +-- useDashboard.ts                  # Central singleton (1013 lines)
+-- config/
|   +-- environment.ts                   # Vite env var reader
+-- constants/
|   +-- dashboard/anomaly.ts             # Anomaly tier color mapping
|   +-- dashboard/country-map.ts         # 43 country coordinates, aliases, SVG paths
|   +-- layout/navigation.ts             # 6 navigation item configs
+-- css/
|   +-- app.scss                         # Full design system (1034 lines)
|   +-- quasar.variables.scss            # Quasar SCSS variable overrides
+-- i18n/
|   +-- locale.ts                        # Browser locale auto-detection (142 lines)
|   +-- messages/
|       +-- en-US.ts                     # English (539 keys, canonical)
|       +-- fr-FR.ts                     # French (554 keys)
|       +-- es-ES.ts                     # Spanish (563 keys)
|       +-- ar.ts                        # Arabic (546 keys)
|       +-- merge.ts                     # Deep merge utility
+-- layouts/
|   +-- MainLayout.vue                   # Shell: header + drawer + page container
+-- models/
|   +-- chart.ts                         # ForecastPoint, ForecastSeries, etc.
|   +-- country-map.ts                   # Country coordinate models
+-- pages/
|   +-- OverviewPage.vue                 # Main dashboard (963 lines)
|   +-- AnomaliesPage.vue                # Anomaly search page
|   +-- WorkbenchPage.vue                # Investigation workbench
|   +-- SessionsPage.vue                 # Session history page
|   +-- InsightsPage.vue                 # User insights page
|   +-- AnalyticsPage.vue                # Analytics deep-dive page
|   +-- ErrorNotFound.vue                # 404 page
+-- router/
|   +-- index.ts                         # Router initialization
|   +-- routes.ts                        # Route definitions
+-- services/
|   +-- analytics.ts                     # 21 REST API wrapper functions
|   +-- http.ts                          # ApiResponse unwrapper
+-- stores/
|   +-- index.ts                         # Pinia creation
|   +-- live-stream.ts                   # Live alert EventSource store
+-- types/
|   +-- analytics.ts                     # 20+ DTO interfaces (329 lines)
|   +-- api.ts                           # ApiResponse, PaginationMeta, JsonValue
|   +-- dashboard.ts                     # Dashboard-specific types
|   +-- navigation.ts                    # Navigation item types
+-- utils/
    +-- dashboard.ts                     # Payload normalizers, key generators (154 lines)
    +-- format.ts                        # Number, date, duration formatters (64 lines)
`

---

## Pages & Routes

| Path | Page | Description |
|------|------|-------------|
| / or /overview | OverviewPage.vue (963 lines) | Main dashboard: hero, KPI strip, forecasts, analytics grid, live sessions, alerts feed, health checks |
| /anomalies | AnomaliesPage.vue | Searchable anomaly events table with row selection |
| /workbench | WorkbenchPage.vue | Three-column investigation surface with AI explanations |
| /sessions | SessionsPage.vue | Active sessions (Redis) + persisted session analysis (SQL) |
| /insights | InsightsPage.vue | User risk profile lookup + next actions + active anomaly |
| /analytics | AnalyticsPage.vue | Deep-dive analytics grid (tier mix, types, actions, geo, trends) |
| /* | ErrorNotFound.vue | Styled 404 page |

Router mode is **hash** (ueRouterMode: 'hash'), configured in quasar.config.ts.

---

## Data Flow & State Management

### Singleton Composable Pattern

The application uses a **singleton composable with reference counting** pattern. useDashboard.ts creates a single reactive store instance that all pages share:

`
useDashboard() called by page onMounted
  -> increments reference counter (first caller creates the store)
  -> starts REST fetches + SSE streams

useDashboard() cleanup on onUnmounted
  -> decrements reference counter (last caller tears down streams)
`

### State

50+ reactive values exposed by the composable, organized by domain:

**Core Data:**
- sessions, nomalies — shallowRef arrays for paginated results
- commandCenter, liveStats, 	rendStats, clusterMix, dropOffs, pathDeviations
- ctiveSessionRows — live Redis session radar
- statsSummary — aggregate DB counts
- healthStatus — API health check

**User Insights:**
- iskProfile — 30-day risk tier + metrics
- 
extActions — Markov top-3 action predictions
- ctiveAnomaly — ongoing anomaly alert

**Selection State:**
- selectedAnomalyKey, selectedAnomaly, selectedInvestigation, selectedSession
- liveSessionInsight — Redis-backed real-time session context
- nomalyExplanation, explanationLoading, explanationError

**Computed Metrics:**
- 	otalSessions, 	otalAnomalies, nomalousSessions, vgSessionDuration
- ctiveSessions, eventsPerMinute, nomalyRate, globalRiskLevel

### Data Loading Strategy

`
loadStats() (called on start + every 60s fallback)
  |
  +-- Promise.all:
  |     +-- getCommandCenter(today)       -> full dashboard snapshot
  |     +-- getLiveStats(today)           -> live stats
  |     +-- getTrendStats(today)          -> Prophet forecast
  |     +-- getDashboardSnapshot('cluster-mix')
  |     +-- getDashboardSnapshot('drop-offs')
  |     +-- getDashboardSnapshot('path-deviations')
  |
  +-- hasNonEmptyTrendPayload() decides:
        dedicated trend endpoint preferred
        -> fallback: commandCenter.trendForecast
        -> fallback: dedicated endpoint
`

### Refresh Strategy

| Mechanism | Frequency | Description |
|-----------|-----------|-------------|
| SSE live stream | Every 10s | Pushes live stats to connected clients |
| SSE refresh events | On PubSub | Triggers specific view refresh (alerts, stats, risky-sessions) |
| Debounced manual refresh | 400ms | Batches multiple scheduleRefresh() calls on user interaction |
| Full fallback refresh | 60s | setInterval full reload of all stats |
| Live stream alerts | Real-time | Pinia liveStream store via EventSource (with 30s REST fallback) |

---

## Component Library

### Chart Components

| Component | Technology | Description |
|-----------|-----------|-------------|
| TrendForecastChart.vue | ECharts (LineChart + ScatterChart) | Prophet forecast with confidence band, trend line, zoom slider, live marker |
| FeatureRadarChart.vue | ECharts (RadarChart) | ML feature importance spider chart |
| DonutBreakdownChart.vue | CSS conic-gradient | Proportional segments with legend (cluster mix, tier mix) |
| SparkAreaChart.vue | Pure SVG | Lightweight area sparkline with gradient fill |
| BarListChart.vue | CSS-only | Ranked horizontal bar list |
| CountryActivityMap.vue | SVG + CSS | World map with country dots and ranked list |

### Dashboard Panels

All panels follow the same contract: receive typed props, emit events upward, no direct store access:

| Component | Props | Events | Description |
|-----------|-------|--------|-------------|
| OverviewHero.vue | sessions, anomalies, commandCenter, healthStatus, statsSummary | -- | Hero with live posture + action buttons |
| KpiStrip.vue | sessions, liveStats, commandCenter, loading | @inspect | 4 KPI cards with state animation |
| AnomalyEventsSection.vue | anomalies, loading, error, search | @update:search, @select | Searchable anomaly table |
| AnomalyWorkbenchSection.vue | 15+ props (anomaly, session, risk, etc.) | @select-alert, @generate-explanation | 3-column investigation surface |
| LiveSessionsSection.vue | activeSessionRows, loading | -- | Live session card grid |
| SessionsSection.vue | sessions, loading, error | @update:search | Paginated session table |
| AnalyticsSection.vue | 10+ props | -- | 12-column analytics grid |
| UserInsightsSection.vue | riskProfile, nextActions, activeAnomaly, loading | @lookup | User insight panels |
| ClusterMixPanel.vue | clusterMix, statsSummary, data, flat | -- | Persona donut chart |
| DropOffsPanel.vue | dropOffs, sessions, flat | -- | Abandonment funnel |
| PathDeviationsPanel.vue | pathDeviations, flat | -- | Unusual transitions list |
| JourneyPathMap.vue | selectedAnomaly, selectedInvestigation | -- | Action sequence flow |
| LivePulse.vue | eventsPerMinute | -- | Connection status dot |

### Shared Components

| Component | Description |
|-----------|-------------|
| DashboardCardActions.vue | Expand + export button pair for every panel |
| SkeletonCard.vue | Shimmer loading placeholder |

---

## API Integration

### Service Layer (src/services/analytics.ts)

21 functions wrapping every backend endpoint:

| Function | Method | Endpoint | Used By |
|----------|--------|----------|---------|
| listSessions | GET | /api/v1/sessions | Session tables |
| getSession | GET | /api/v1/sessions/{id} | Session detail |
| listAnomalyEvents | GET | /api/v1/anomalies | Anomaly tables |
| getAnomalyEvent | GET | /api/v1/anomalies/{id} | Anomaly detail |
| getAnomalyExplanation | GET | /api/v1/anomalies/{id}/explain | AI explanation |
| getAnomalyInvestigation | GET | /api/v1/anomalies/{id}/investigation | Deep-dive |
| getRiskProfile | GET | /api/v1/risk-profiles/{insuredId} | User insights |
| listRiskProfiles | GET | /api/v1/risk-profiles | Risk profile list |
| getNextActions | GET | /api/v1/next-actions/{insuredId} | Next actions |
| getLiveStats | GET | /api/v1/stats/live | KPI strip, live stats |
| getStatsSummary | GET | /api/v1/stats/summary | Overview summary |
| getTrendStats | GET | /api/v1/trends/forecast | Forecast chart |
| getActiveAnomaly | GET | /api/v1/anomalies/active/{insuredId} | Active alert |
| getDashboardSnapshot | GET | /api/v1/dashboard/{view} | Dashboard panels |
| getCommandCenter | GET | /api/v1/dashboard/command-center | Aggregated dashboard |
| getActiveSessions | GET | /api/v1/sessions/active | Live sessions |
| getSessionInsight | GET | /api/v1/sessions/{insuredId}/{sessionId}/insight | Live insight |
| getUserDashboard | GET | /api/v1/users/{insuredId}/dashboard | User dashboard |
| getUserSessions | GET | /api/v1/users/{insuredId}/sessions | User sessions |
| getHealth | GET | /api/v1/health | Health check |
| getAnomalyStreamUrl | -- | baseUrl + /topic/alerts | STOMP (legacy) |
| getLiveStatsStreamUrl | -- | baseUrl + /api/v1/stream/live | SSE |

### HTTP Client

- **Base URL:** configured via VITE_API_BASE_URL env var (default http://localhost:8081)
- **Response unwrapper:** unwrapEnvelope(payload) converts ApiResponse<T> to ApiEnvelope<T> (normalizes data + meta fields)

---

## SSE & Live Streaming

### Event Sources

Two parallel streaming mechanisms keep the UI live:

| Stream | Technology | Purpose | Implementation |
|--------|-----------|---------|----------------|
| Live stats | EventSource | Real-time stats push | useDashboard.ts opens SSE to /api/v1/stream/live |
| Anomaly alerts | EventSource (via Pinia store) | Real-time alert push | liveStream Pinia store |

### Live Stats SSE

- **Endpoint:** VITE_API_BASE_URL + /api/v1/stream/live
- **Events consumed:** stats and efresh
- stats event: updates liveStats with latest snapshot
- efresh event: triggers targeted re-fetch (lerts, isky-sessions, stats)
- On connection error: falls back to 30s REST polling

### Anomaly Alert SSE (Pinia Store live-stream.ts)

- **State:** lerts[], connected, error, eventsReceived, latestAlert, latestKey
- **connect():** opens EventSource, parses incoming messages
- **disconnect():** ref-counted — only tears down when last consumer leaves
- **Deduplication:** nomalyEventKey() utility creates unique keys from insuredId:sessionId:eventId
- **Fallback:** 30s REST polling via listAnomalyEvents
- **Integration:** useDashboard.ts watches streamLatestKey from store, merges new alerts into anomalies array, shows toast, schedules refresh

---

## Internationalization

### Locale Support

| Locale | File | Keys | Direction |
|--------|------|------|-----------|
| English | en-US.ts | 539 | LTR (canonical) |
| French | r-FR.ts | 554 | LTR |
| Spanish | es-ES.ts | 563 | LTR |
| Arabic | r.ts | 546 | RTL (bidirectional) |

### Auto-Detection

src/i18n/locale.ts (142 lines):
- Checks 
avigator.languages then 
avigator.language
- Maps regions to locales (AE -> ar, FR -> fr-FR, ES -> es-ES)
- Falls back to VITE_I18N_FALLBACK_LOCALE (default en-US)
- Configurable via VITE_I18N_LOCALE=auto (browser detection) or explicit locale

### i18n Key Structure

`
common (41 keys)           — Shared terms (yes, no, high, low, etc.)
layout (26 keys)           — Navigation, drawer, header
overviewHero (21 keys)     — Hero section
kpiStrip (12 keys)         — 4 KPI metrics x 3
trendForecastChart (6 keys) — Forecast chart labels
anomalyEventsSection (12 keys) — Anomaly table
anomalyWorkbenchSection (33 keys) — Investigation workbench
sessionsSection (12 keys)  — Session table
liveSessionsSection (12 keys) — Live session cards
analyticsSection (27 keys) — Analytics grid
userInsightsSection (24 keys) — User lookup
clusterMixPanel (7 keys)   — Persona cluster
dropOffsPanel (7 keys)     — Drop-off funnel
pathDeviationsPanel (8 keys) — Path deviations
journeyPathMap (4 keys)    — Journey flow
featureRadarChart (4 keys) — Feature radar
liveStreamStore (3 keys)   — SSE error messages
overviewPage (46 keys)     — Overview page strings
errorNotFound (2 keys)     — 404 page
countryActivityMap (5 keys) — Geo map
sparkAreaChart (1 key)     — Spark chart
donutBreakdownChart (2 keys) — Donut chart
barListChart (1 key)       — Bar chart
dashboardState (10 keys)   — Error states
`

---

## Design System

Comprehensive CSS design system defined in src/css/app.scss (1034 lines).

### Design Tokens

All exposed as CSS custom properties on :root:

| Token Group | Examples |
|-------------|---------|
| Ink (text) | --neo-ink, --neo-ink-soft, --neo-ink-muted |
| Surfaces | --neo-page-bg, --neo-surface-bg, --neo-card-bg |
| Shell | --neo-shell-bg (dark drawer), --neo-shell-surface |
| Accent | --neo-accent, --neo-accent-soft, --neo-accent-contrast |
| Semantic | --neo-success, --neo-warning, --neo-danger, --neo-info (each with bg/contrast/border variants) |
| Borders | --neo-radius-card, --neo-radius-control, --neo-radius-pill |
| Transitions | --neo-transition-fast, --neo-transition-med |
| Shadows | --neo-shadow-sm, --neo-shadow-md, --neo-shadow-lg |
| Spacing | --neo-space-1 through --neo-space-8 |

### Component Styles

| Component | Style Class | Description |
|-----------|-------------|-------------|
| Card | .neo-card | Rounded card with subtle shadow, optional hover lift |
| Panel | .neo-panel | Glassmorphism panel with translucent background |
| Analytics Panel | .neo-analytics-panel | Larger card with head/section/footer slots |
| Drawer | .neo-drawer | Dark sidebar with navigation items |
| Header | .neo-header / .neo-toolbar | Top bar with branding and controls |
| KPI | .neo-kpi-card | Metric card with tone-based coloring |
| Hero | .neo-hero | Welcome section with gradient accent line |
| Button | .neo-series-btn | Small toggle buttons for chart series |

### Responsive Breakpoints

| Breakpoint | Width | Behavior |
|------------|-------|----------|
| Desktop | > 1220px | Full 12-column grid |
| Medium | 1000–1220px | Reduced margins, tighter grid |
| Tablet | 820–1000px | 2-column layout, smaller KPI cards |
| Mobile | 480–820px | Single column, compact cards |
| Small | < 480px | Minimal padding, tiny text |

### Accessibility

- prefers-reduced-motion disables all animations
- Semantic color contrast (ink-muted on card-background, etc.)
- Quasar's built-in ARIA support for form controls
- Loading states via SkeletonCard.vue shimmer placeholders

---

## Configuration Reference

### Environment Variables (.env)

| Variable | Default | Description |
|----------|---------|-------------|
| VITE_API_BASE_URL | http://localhost:8081 | Backend API service URL |
| VITE_LOGGER_ENDPOINT | http://localhost:5001 | Logstash error logging endpoint |
| VITE_LOGGER_APPLICATION | dashboard-frontend | Application name in error logs |
| VITE_GRAFANA_DASHBOARDS_URL | http://localhost:3000/dashboards | Grafana external link |
| VITE_KIBANA_OVERVIEW_URL | http://localhost:5601/app/kibana_overview#/ | Kibana external link |
| VITE_I18N_LOCALE | uto | Locale: uto (browser detect) or explicit code |
| VITE_I18N_FALLBACK_LOCALE | en-US | Fallback when auto-detection fails |

### Quasar Config (quasar.config.ts)

| Setting | Value |
|---------|-------|
| Dev port | 9008 |
| Router mode | hash |
| Boot files | i18n, xios, logger |
 | CSS entry | pp.scss |
| Extras | oboto-font, material-icons |
| TypeScript | strict, vueShim enabled |
| Build target | es2022, firefox115, chrome115, safari14 |

---

## Development Setup

### Prerequisites

- **Node.js** ^28 \|\| ^26 \|\| ^24 \|\| ^22 \|\| ^20
- **npm** >= 6.13.4

### Install

`ash
cd Dashboard
npm install
`

### Development

`ash
# Start dev server on port 9008 with hot-reload
npm run dev

# Environment expects:
# - API service running on VITE_API_BASE_URL (default :8081)
# - Redis and SQL Server shared with backend
`

### Code Quality

`ash
# Lint all source files
npm run lint

# Format with Prettier
npm run format
`

### Production Build

`ash
# Build for production
npm run build

# Output: dist/spa/ directory
# Served as a static SPA (hash routing, no server-side config needed)
`

---

## Build & Deploy

### Build

`ash
npm run build
`

Produces optimized output in dist/spa/:
- Minified HTML, CSS, JS
- Code-split chunks (ECharts, page components)
- Locale message files included in bundle
- Source maps (configurable)

### Deployment

The built SPA is a **static hash-routed application**:
- No server-side URL rewriting needed (hash routing)
- Serve from any static file server or CDN
- Point VITE_API_BASE_URL to the backend API service
- Configure CORS on the API service to allow the frontend origin

### Docker

No Dockerfile included. Deploy by:
1. Building locally: 
pm run build
2. Serving dist/spa/ via nginx, Caddy, or similar
3. Passing environment variables at build time (Vite embeds them at build time)

---

## Dependencies

### Runtime (11 packages)

| Package | Version | Bundle Size Impact | Purpose |
|---------|---------|-------------------|---------|
| ue | ^3.5.22 | Core | Reactive framework |
| quasar | ^2.16.0 | Large | UI components (tree-shakable) |
| @quasar/extras | ^1.16.4 | Small | Icon sets |
| ue-router | ^5.0.0 | Small | Client routing |
| pinia | ^3.0.1 | Small | State management |
| ue-i18n | ^11.3.2 | Medium | Internationalization |
| xios | ^1.2.1 | Small | HTTP client |
| echarts | ^6.0.0 | Large | Chart library |
| ue-echarts | ^8.0.1 | Small | Vue integration for ECharts |
| @stomp/stompjs | ^7.3.0 | Medium | STOMP WebSocket (not actively used) |
| sockjs-client | ^1.6.1 | Medium | WebSocket fallback (not actively used) |

### Dev Dependencies (15 packages)

Build tooling: @quasar/app-vite, 	ypescript, ite-plugin-checker, ue-tsc
Linting: eslint 9, eslint-plugin-vue, @vue/eslint-config-typescript, @vue/eslint-config-prettier
Formatting: prettier
CSS: utoprefixer, postcss

---

## Key Files Reference

| File | Size/Lines | Purpose |
|------|-----------|---------|
| src/composables/useDashboard.ts | 1013 lines | Central orchestrator: state, fetching, SSE, lifecycle |
| src/pages/OverviewPage.vue | 963 lines | Main dashboard page with all sections |
| src/css/app.scss | 1034 lines | Full visual design system (design tokens, cards, layout) |
| src/components/dashboard/AnomalyWorkbenchSection.vue | 852 lines | 3-column investigation surface |
| src/components/dashboard/TrendForecastChart.vue | 455 lines | ECharts Prophet forecast chart |
| src/components/dashboard/AnalyticsSection.vue | 641 lines | 12-column analytics grid |
| src/services/analytics.ts | 198 lines | All 21 REST API wrappers |
| src/i18n/messages/en-US.ts | 539 lines | Canonical English translations |
| src/types/analytics.ts | 329 lines | All DTO interfaces |
| src/components/dashboard/KpiStrip.vue | 336 lines | 4 KPI cards with state logic |
| src/components/dashboard/LiveSessionsSection.vue | 272 lines | Live session card grid |
| src/config/environment.ts | 25 lines | Vite env var reader |
| src/router/routes.ts | 27 lines | 7 route definitions |

---

## Notes & Limitations

1. **STOMP/SockJS dependencies installed but unused**: @stomp/stompjs and sockjs-client are in package.json but the application uses EventSource (native SSE) for all real-time communication.

2. **Hash routing**: The application uses hash mode, so the # appears in URLs (e.g., http://localhost:9008/#/anomalies). No server-side URL rewriting needed.

3. **SSE not EventSource polyfilled**: The application relies on native EventSource support. Very old browsers (IE) would need a polyfill.

4. **Environment variables at build time**: All VITE_* environment variables are embedded at build time. Runtime configuration requires rebuilding.

5. **Error logging fire-and-forget**: The logger boot file sends errors to Logstash via HTTP POST with no retry mechanism.

6. **No unit tests**: The package.json 	est script is echo "No test specified" && exit 0. The project has no test framework configured.
