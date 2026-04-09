// Environment typing keeps Quasar router mode variables strongly typed in the app code.
declare namespace NodeJS {
  interface ProcessEnv {
    NODE_ENV: string;
    VUE_ROUTER_MODE: 'hash' | 'history' | 'abstract' | undefined;
    VUE_ROUTER_BASE: string | undefined;
  }
}

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string;
  readonly VITE_LOGGER_ENDPOINT?: string;
  readonly VITE_LOGGER_APPLICATION?: string;
  readonly VITE_GRAFANA_DASHBOARDS_URL?: string;
  readonly VITE_KIBANA_OVERVIEW_URL?: string;
  readonly VITE_I18N_LOCALE?: string;
  readonly VITE_I18N_FALLBACK_LOCALE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
