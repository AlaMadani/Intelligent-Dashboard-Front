# Noveo Care Insights Dashboard

An operations-focused frontend dashboard for exploring insured behavior, anomaly detection, live session telemetry, and AI-assisted investigation workflows.

This repository contains the **Quasar + Vue 3** web application that turns backend analytics into a navigable command surface for analysts, engineers, and product stakeholders.

---

## What This Project Is

This app is the visual layer of a larger analytics platform. It helps a user:

- monitor live behavioral activity
- inspect anomaly events detected by the backend
- correlate anomalies with session traces and insured risk context
- view live and forecasted platform metrics
- request AI-generated explanations for selected anomalies

In practical terms, this is a **real-time monitoring and investigation dashboard** for behavior intelligence and risk operations.

---

## What You See In The UI

The dashboard is organized into multiple operational surfaces:

| Surface         | Purpose                                                                                 |
| --------------- | --------------------------------------------------------------------------------------- |
| `Overview`      | High-level posture, KPI cards, trend signals, anomaly mix, and country activity         |
| `Anomalies`     | Searchable anomaly event table for triage                                               |
| `Workbench`     | Live anomaly stream, selected anomaly context, and AI explanation panel                 |
| `Sessions`      | Session analysis table with behavioral metrics                                          |
| `User Insights` | Lookup an insured and load risk profile, next actions, and active anomaly               |
| `Analytics`     | Distribution charts, trend graphics, recent session/anomaly summaries, and geo activity |

---

## What The Frontend Talks To

This frontend is not standalone. It expects supporting services to be available locally.

### Primary integrations

- **API service** at `http://localhost:8081`
  - REST endpoints for sessions, anomaly events, risk profiles, stats, and explanations
  - Server-Sent Events streams for live anomalies and live stats
- **Logstash / logging endpoint** at `http://localhost:5001`
  - receives uncaught Vue error payloads from the frontend boot logger
- **Grafana** shortcut at `http://localhost:3000/dashboards`
- **Kibana** shortcut at `http://localhost:5601/app/kibana_overview#/`

If those services are not running, the app will still load, but parts of the UI will show empty states or error banners instead of live data.

---

## Architecture At A Glance

```text
Browser
  |
  v
Quasar / Vue 3 frontend
  |
  +-- Axios REST calls ------------------> API service (:8081)
  |
  +-- EventSource live streams ----------> anomaly stream / live stats stream
  |
  +-- Global error forwarding -----------> logging endpoint (:5001)
  |
  +-- External shortcuts ----------------> Grafana (:3000), Kibana (:5601)
```

### Important implementation idea

Most pages share one central reactive store-like composable:

- [`src/composables/useDashboard.ts`](src/composables/useDashboard.ts)

That file is the heart of the app. It:

- loads analytics data
- opens and closes live streams
- keeps selected anomaly/session state synchronized
- fetches user insights
- requests anomaly explanations
- exposes all shared state to the routed pages

---

## Tech Stack

- **Quasar** for app shell and UI components
- **Vue 3** with `<script setup>`
- **TypeScript** across the app
- **Vue Router** for page navigation
- **Axios** for backend communication
- **SCSS** for custom styling
- **Pinia** scaffolded in the project, though the main shared state currently lives in a composable
- **ESLint + Prettier** for code quality and formatting

---

## Repository Map

```text
src/
  boot/
    axios.ts         Shared API client configuration
    logger.ts        Global Vue error forwarding

  components/dashboard/
    ...              Reusable dashboard sections and charts

  composables/
    useDashboard.ts  Shared live dashboard state and data orchestration

  layouts/
    MainLayout.vue   Global shell: header, drawer, route container

  pages/
    OverviewPage.vue
    AnomaliesPage.vue
    WorkbenchPage.vue
    SessionsPage.vue
    InsightsPage.vue
    AnalyticsPage.vue

  router/
    routes.ts        Route definitions
    index.ts         Router creation

  services/
    analytics.ts     API wrappers for dashboard features
    http.ts          API envelope normalization

  types/
    analytics.ts     DTOs used across the app
    api.ts           Shared API and pagination types

  utils/
    dashboard.ts     Telemetry normalization helpers
    format.ts        Shared formatting utilities

  css/
    app.scss         Global design system and layout styling
    quasar.variables.scss
```

---

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Make sure the backend services are available

At minimum, this frontend expects:

- API service on `http://localhost:8081`
- logging endpoint on `http://localhost:5001`

Optional but linked from the UI:

- Grafana on `http://localhost:3000`
- Kibana on `http://localhost:5601`

### 3. Start the app

```bash
npm run dev
```

The Quasar dev server is configured to run on:

- `http://localhost:9008`

---

## Available Scripts

```bash
npm run dev      # start the Quasar dev server
npm run build    # build the frontend for production
npm run lint     # run ESLint
npm run format   # format files with Prettier
npm run test     # placeholder script (no real test suite yet)
```

---

## First Files To Read If You Are New

If this is your first time in the repository, start here:

1. [`src/composables/useDashboard.ts`](src/composables/useDashboard.ts)  
   Central app logic, API loading, streaming, selection, and shared state.

2. [`src/layouts/MainLayout.vue`](src/layouts/MainLayout.vue)  
   Defines the global shell and navigation model.

3. [`src/pages/OverviewPage.vue`](src/pages/OverviewPage.vue)  
   Best single page to understand how the dashboard comes together.

4. [`src/components/dashboard/AnomalyWorkbenchSection.vue`](src/components/dashboard/AnomalyWorkbenchSection.vue)  
   Most investigation-heavy surface in the UI.

5. [`src/services/analytics.ts`](src/services/analytics.ts)  
   Shows exactly what backend endpoints the frontend depends on.

6. [`src/css/app.scss`](src/css/app.scss)  
   Contains the visual language and most global styling rules.

---

## Product Behavior Summary

The current frontend supports:

- shared dashboard state across routes
- live anomaly streaming with `EventSource`
- live stats streaming
- anomaly selection and session lookup
- insured risk profile lookup
- predicted next-action display
- AI explanation rendering for persisted anomalies
- analytics visualizations built from backend payloads
- external observability shortcuts from the header

---

## Notes For Contributors

- This is a **frontend repository**; data richness depends heavily on backend availability.
- The app uses **hash routing** in the Quasar config.
- Styling is highly customized and intentionally dashboard-oriented, not stock Quasar.
- Pinia exists in the scaffold, but most important shared runtime state currently lives in the dashboard composable.
- There is no substantial automated test suite yet, so linting is the main built-in verification step.

---

## In One Sentence

This project is a real-time behavior intelligence dashboard that helps users monitor live activity, investigate anomalies, inspect insured risk context, and request AI-assisted explanations from a single operational interface.
