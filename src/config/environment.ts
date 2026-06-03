// Runtime configuration sourced from Vite environment variables.
const readEnv = (value: string | undefined, fallback: string) => {
  const trimmed = value?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : fallback;
};

const readEnvNumber = (value: string | undefined, fallback: number) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

export const environment = {
  apiBaseUrl: readEnv(import.meta.env.VITE_API_BASE_URL, 'http://localhost:8081'),
  loggerEndpoint: readEnv(import.meta.env.VITE_LOGGER_ENDPOINT, 'http://localhost:5001'),
  loggerApplication: readEnv(import.meta.env.VITE_LOGGER_APPLICATION, 'dashboard-frontend'),
  grafanaDashboardsUrl: readEnv(
    import.meta.env.VITE_GRAFANA_DASHBOARDS_URL,
    'http://localhost:3000/dashboards',
  ),
  kibanaOverviewUrl: readEnv(
    import.meta.env.VITE_KIBANA_OVERVIEW_URL,
    'http://localhost:5601/app/kibana_overview#/',
  ),
  // Use "auto" to resolve locale from the browser region/language.
  locale: readEnv(import.meta.env.VITE_I18N_LOCALE, 'auto'),
  fallbackLocale: readEnv(import.meta.env.VITE_I18N_FALLBACK_LOCALE, 'en-US'),
  authPanelImageUrl: readEnv(import.meta.env.VITE_AUTH_PANEL_IMAGE_URL, '/2.jpg'),
  sessionIdleTimeoutMs: readEnvNumber(import.meta.env.VITE_SESSION_IDLE_TIMEOUT_MS, 15 * 60 * 1000),
} as const;
