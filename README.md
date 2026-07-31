# NoveoCare Dashboard

Telemedicine security & analytics monitoring dashboard built with [Quasar](https://quasar.dev/) (Vue 3 + Vite).

**Author:** Ala Eddine Madani

---

## Tech Stack

| Category | Technology |
|----------|-----------|
| **Core** | Vue 3 (Composition API, `<script setup>`) |
| **UI Framework** | Quasar 2 (Vite CLI) |
| **Build** | Vite via `@quasar/app-vite` |
| **State** | Pinia 3 |
| **Routing** | Vue Router 5 (hash mode) |
| **HTTP** | Axios 1.x |
| **Charts** | ECharts 6 + vue-echarts 8 |
| **i18n** | vue-i18n 11 (en, fr, es, ar) |
| **AI Assistant** | Driver.js (walkthroughs) |
| **PWA** | Workbox 7 (GenerateSW) |
| **Lint** | ESLint 9 (flat config) + Prettier 3 |
| **CSS** | SCSS + PostCSS + Autoprefixer |
| **TypeScript** | Strict mode, ^5.9 |

---

## Project Structure

```
Dashboard/
├── quasar.config.ts          # Quasar CLI config (boot, build, plugins, PWA)
├── .env.example              # Environment variable template
├── eslint.config.js          # ESLint 9 flat config
├── postcss.config.js         # PostCSS with autoprefixer
│
├── src/
│   ├── App.vue               # Root component
│   ├── env.d.ts              # Vite/NodeJS env types
│   ├── global.d.ts           # Global Vue/Axios augmentations
│   │
│   ├── assets/               # Brand logos
│   ├── models/               # Chart data models (chart.ts)
│   ├── config/               # Runtime env config (environment.ts)
│   ├── types/                # TypeScript type definitions
│   │   ├── analytics.ts      # Analytics data structures (21 KB)
│   │   ├── api.ts            # API envelope types
│   │   ├── auth.ts           # Auth DTOs
│   │   ├── aiExplainer.ts    # AI explainer types
│   │   ├── dashboardAssistant.ts  # Assistant framework types
│   │   └── navigation.ts     # Navigation types
│   │
│   ├── constants/
│   │   ├── auth.ts           # Storage keys, default values
│   │   ├── events.ts         # Event bus names
│   │   └── layout/navigation.ts  # Sidebar menu structure
│   │
│   ├── router/
│   │   ├── index.ts          # Router factory (hash history)
│   │   ├── routes.ts         # Route definitions
│   │   ├── route-names.ts    # Named route constants
│   │   └── authGuard.ts      # Auth navigation guard
│   │
│   ├── stores/
│   │   ├── index.ts          # Pinia initialization + persistence
│   │   ├── auth.ts           # Auth store (login, refresh, logout)
│   │   └── auth-persistence.ts  # localStorage auth persistence
│   │
│   ├── services/
│   │   ├── api-client.ts     # Axios instance factory
│   │   ├── http.ts           # Envelope unwrapping utilities
│   │   ├── auth.ts           # Auth API calls
│   │   ├── analytics.ts      # Analytics data fetching
│   │   ├── session.ts        # Session/idle management
│   │   ├── dashboardAssistant.ts           # Assistant API calls
│   │   ├── dashboardAssistantCommandExecutor.ts  # Command execution engine (20 KB)
│   │   └── asrService.ts     # Speech recognition for voice commands
│   │
│   ├── boot/                 # Quasar boot files (run before mount)
│   │   ├── axios.ts          # Axios config + JWT interceptor
│   │   ├── i18n.ts           # vue-i18n setup (4 locales)
│   │   ├── logger.ts         # Global error logger (Logstash)
│   │   └── theme.ts          # Dark mode initialization
│   │
│   ├── composables/          # Vue 3 composables
│   │   ├── useTheme.ts
│   │   ├── useAiExplainer.ts
│   │   ├── useNoveoCompanionChat.ts
│   │   ├── useLoaderScrollLock.ts
│   │   └── v36/              # API v36 page composables
│   │       ├── useV36SseRefresh.ts     # SSE real-time refresh engine
│   │       ├── useSecurityOverview.ts
│   │       ├── useLiveAlerts.ts
│   │       ├── useAlertInvestigation.ts
│   │       ├── useUser360.ts
│   │       ├── useChurnDashboard.ts
│   │       ├── useForecastDashboard.ts
│   │       ├── useRuntimeHealth.ts
│   │       └── useLlmExplanation.ts
│   │
│   ├── pages/                # Route-level page components
│   │   ├── LoginPage.vue / SignUpPage.vue / VerifyEmailPage.vue
│   │   ├── ForgotPasswordPage.vue / ResetPasswordCodePage.vue / ResetPasswordPage.vue
│   │   ├── SecurityOverviewPage.vue    # Main landing dashboard (25 KB)
│   │   ├── AlertsPage.vue              # Live alerts list (19 KB)
│   │   ├── AlertInvestigationPage.vue  # Detailed alert view (50 KB)
│   │   ├── User360Page.vue             # User 360-degree view (23 KB)
│   │   ├── ChurnPage.vue               # Churn prediction (15 KB)
│   │   ├── ForecastPage.vue            # Forecasting (10 KB)
│   │   ├── RuntimeHealthPage.vue       # System runtime health (58 KB)
│   │   ├── AccountPage.vue             # User account settings (8 KB)
│   │   └── ErrorNotFound.vue           # 404 page
│   │
│   ├── components/           # Reusable UI components
│   │   ├── auth/AuthShell.vue
│   │   ├── brand/BrandLogo.vue
│   │   ├── theme/ThemeToggle.vue
│   │   ├── loading/LoadingOverlay.vue / NoveocareKineticLoader.vue
│   │   ├── common/InfoTooltip.vue / LiveConnectionBadge.vue
│   │   ├── dashboard/SkeletonCard.vue / BarListChart.vue / DonutBreakdownChart.vue / SparkAreaChart.vue
│   │   ├── ai/AiExplainButton.vue / AiExplainerModal.vue / NoveoCompanionChat.vue
│   │   └── llm/LlmExplanationPanel.vue
│   │
│   ├── layouts/
│   │   ├── AuthLayout.vue    # Auth pages layout (side panel)
│   │   └── MainLayout.vue    # Dashboard shell (sidebar + header)
│   │
│   ├── i18n/
│   │   ├── locale.ts         # Locale resolution + RTL detection
│   │   └── messages/
│   │       ├── en-US.ts      # English (97 KB — complete)
│   │       ├── fr-FR.ts      # French (86 KB — complete)
│   │       ├── es-ES.ts      # Spanish (8 KB — partial)
│   │       ├── ar.ts         # Arabic (10 KB — partial)
│   │       └── merge.ts      # Translation merge utility
│   │
│   ├── css/
│   │   ├── quasar.variables.scss  # Quasar SCSS overrides
│   │   └── app.scss               # Global styles (35 KB)
│   │
│   ├── utils/
│   │   ├── format.ts         # Number/date/risk formatting (14 KB)
│   │   ├── theme.ts          # Theme detection + application
│   │   └── throttle.ts       # Throttle/debounce utilities
│   │
│   └── assistant/            # AI Dashboard Assistant framework
│       ├── genManifest.cjs   # Manifest compilation script
│       ├── dashboardAssistantManifest.ts   # Core manifest (commands, intents)
│       ├── dashboardAssistantManifest.json # Compiled manifest
│       ├── useAssistantVisibleElements.ts  # Visible element tracking
│       └── manifests/        # Per-page assistant manifests
│           ├── navigation.assistant.json
│           ├── security-overview.assistant.json
│           ├── alerts.assistant.json
│           ├── alert-investigation.assistant.json
│           ├── user360.assistant.json
│           ├── churn.assistant.json
│           ├── forecast.assistant.json
│           ├── runtime-health.assistant.json
│           └── account.assistant.json
│
├── src-pwa/                  # PWA service worker + manifest
├── public/                   # Favicon, auth backgrounds, PWA icons
└── docs/
    └── api-usage.md          # API integration reference (32 KB)
```

---

## Setup

### Prerequisites

- Node.js >= 20
- npm >= 6.13

### Installation

```bash
# 1. Clone the repository
git clone <repo-url>
cd Dashboard

# 2. Install dependencies
npm install

# 3. Configure environment
Copy-Item .env.example .env      # PowerShell
# cp .env.example .env           # Linux/macOS

# 4. Start development server
npm run dev
```

Opens at `http://localhost:9008` by default.

---

## Available Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server (hot-reload) |
| `npm run build` | Production build to `dist/` |
| `npm run lint` | Run ESLint on all source files |
| `npm run format` | Format code with Prettier |
| `npm test` | Test placeholder (no tests configured) |

---

## Configuration

All runtime configuration is sourced from `VITE_*` environment variables (see `.env.example`):

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_API_BASE_URL` | `http://localhost:8081` | Backend API root |
| `VITE_LOGGER_ENDPOINT` | `http://localhost:5001` | Logstash endpoint |
| `VITE_LOGGER_APPLICATION` | `dashboard-frontend` | App name in logs |
| `VITE_GRAFANA_DASHBOARDS_URL` | `http://localhost:3000/dashboards` | Grafana link |
| `VITE_KIBANA_OVERVIEW_URL` | `http://localhost:5601/app/kibana_overview#/` | Kibana link |
| `VITE_I18N_LOCALE` | `auto` | Locale (`auto`, `en-US`, `fr-FR`, `es-ES`, `ar`) |
| `VITE_I18N_FALLBACK_LOCALE` | `en-US` | Fallback locale |
| `VITE_AUTH_PANEL_IMAGE_URL` | `/2.jpg` | Auth page background |
| `VITE_SESSION_IDLE_TIMEOUT_MS` | `900000` (15 min) | Idle session timeout |

---

## Architecture

### Authentication Flow

JWT-based auth with automatic token refresh. The Axios interceptor in `boot/axios.ts`:
1. Attaches `Authorization: Bearer <token>` to every request
2. On 401, attempts a silent token refresh via `/api/v1/auth/refresh`
3. On refresh failure, redirects to login

Auth state is persisted to `localStorage` with expiration tracking (`stores/auth-persistence.ts`).

### Routing

Hash-mode routing (`/#/`) with two layout groups:
- **AuthLayout** — Login, SignUp, VerifyEmail, ForgotPassword, ResetPassword
- **MainLayout** — All authenticated dashboard pages (guarded by `authGuard.ts`)

Route names are centralized in `router/route-names.ts` for type-safe usage.

### Real-Time Updates (SSE)

Pages receive live data via Server-Sent Events (`/api/v1/stream/live`) using a ref-counted singleton pattern (`useV36SseRefresh.ts`):

- Single `EventSource` connection shared across all pages
- Connection stays open while at least one consumer is mounted
- Auto-fallback to polling (30s) if SSE fails
- Each page throttles refresh at different intervals (2-10s)

| Page | SSE Event | Throttle |
|------|-----------|----------|
| Security Overview | `security-overview`, `runtime-health` | 5s |
| Live Alerts | `alerts` | 2s |
| Alert Investigation | `alerts` | — |
| User 360 | `alerts` | 2s |
| Churn Dashboard | `churn` | 10s |
| Forecast Dashboard | `forecast` | 10s |
| Runtime Health | `runtime-health` | 5s |

### State Management

Pinia stores handle:
- **Auth** (`stores/auth.ts`) — tokens, user info, login/logout/refresh actions
- **Auth Persistence** (`stores/auth-persistence.ts`) — localStorage hydration + plugin

Page-level data is managed by composables (not Pinia) using `ref`/`reactive` with lifecycle-aware fetching.

### AI Dashboard Assistant

A built-in voice/text assistant framework (`assistant/`) that provides:
- Per-page manifests describing available UI elements, commands, and filters
- NLP intent matching for natural language control
- Voice command support via ASR (`services/asrService.ts`)
- Command execution engine (`services/dashboardAssistantCommandExecutor.ts` — 20 KB)
- Visible element tracking composable (`useAssistantVisibleElements.ts`)
- Companion chat widget (`components/ai/NoveoCompanionChat.vue`)

### i18n & RTL

Four locales supported with automatic detection from browser settings:
- **en-US** — full translation (~97 KB)
- **fr-FR** — full translation (~86 KB)
- **es-ES** — partial (~8 KB)
- **ar** — partial with RTL support (~10 KB)

Set `VITE_I18N_LOCALE=auto` to detect from browser, or pin to a specific locale.

### Theming

Dark/light theme with:
- System preference detection (`prefers-color-scheme`)
- Manual toggle (`ThemeToggle.vue`)
- Persistent user preference in localStorage
- Quasar SCSS variable overrides in `css/quasar.variables.scss`

---

## API Integration

All API calls flow through:

```
Page Component
  → Composable (src/composables/v36/)
    → Service (src/services/analytics.ts)
      → api-client.ts (Axios instance)
        → Backend API
```

Responses follow a standard envelope (`ApiResponse<T>`):

```json
{ "data": { ... }, "meta": null }
```

Paginated endpoints include `{ items, limit, offset, count, hasMore }` inside `data`.

### Key Endpoints

| Endpoint | Service Method | Page |
|----------|---------------|------|
| `GET /api/v1/security/overview` | `getV36SecurityOverview()` | Security Overview |
| `GET /api/v1/alerts/live` | `getV36LiveAlerts(params)` | Live Alerts |
| `GET /api/v1/alerts/critical` | `getV36CriticalAlerts(params)` | Overview + Alerts |
| `GET /api/v1/alerts/{eventId}` | `getV36AlertInvestigation(eventId)` | Alert Investigation |
| `GET /api/v1/users/{insuredId}/360` | `getV36User360(insuredId)` | User 360 |
| `GET /api/v1/users/{insuredId}/alerts` | `getV36UserAlerts(insuredId, params)` | User 360 (alerts table) |
| `GET /api/v1/churn/dashboard` | `getV36ChurnDashboard()` | Churn Dashboard |
| `GET /api/v1/churn/users` | `getV36ChurnUsers(params)` | Churn (users table) |
| `GET /api/v1/forecast/dashboard` | `getV36ForecastDashboard()` | Forecast Dashboard |
| `GET /api/v1/ai/runtime-health` | `getV36RuntimeHealth()` | Runtime Health |
| `GET /api/v1/security/diagnostics` | `getV36Diagnostics()` | Runtime Health + Overview |
| `GET /api/v1/ai/final-winners` | `getV36FinalWinners()` | Runtime Health |
| `GET /api/v1/ai/reports` | `getV36Reports()` | Runtime Health |
| `GET /api/v1/explanations/alerts/{eventId}/evidence` | `getV36LlmEvidence(eventId)` | Alert Investigation |
| `GET /api/v1/explanations/alerts/{eventId}` | `getV36CachedExplanation(eventId)` | AI Explainer |
| `POST /api/v1/explanations/alerts/{eventId}` | `generateV36Explanation(eventId, body)` | AI Explainer |
| `GET /api/v1/stream/live` | SSE (EventSource) | All dashboard pages |

See `docs/api-usage.md` for detailed field mappings, null handling rules, and display logic.

---

## Key Features

- **Security Overview** — KPI cards, top anomaly/rule charts, field coverage warnings
- **Live Alerts** — Real-time paginated table with multi-model risk scores, churn context, filters
- **Alert Investigation** — Deep-dive view: model scores, contributions, sequence/tabular/rule evidence, anomaly attribution, session lifecycle, LLM-generated explanations
- **User 360** — Holistic user view: churn risk, risk history, recent sessions, risk timeline, next-event prediction, persona info
- **Churn Prediction** — Risk distribution donut chart, paginated user table with churn probabilities
- **Forecasting** — Historical trend charts with anomaly rate and event volume projections
- **Runtime Health** — System status: model health, Kafka consumer stats, performance latency (avg/P95), session finalization, idempotency, diagnostics
- **AI Explainability** — LLM-generated explanations for alerts with evidence payloads, cached results, force-regeneration
- **AI Companion Chat** — Natural language assistant for navigation, data queries, and dashboard control
- **Multi-language** — English, French, Spanish, Arabic with RTL support
- **PWA** — Offline-capable with service worker caching
