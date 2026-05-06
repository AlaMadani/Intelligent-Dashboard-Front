// Axios boot file: configure the shared HTTP clients used across the dashboard.
import { defineBoot } from '#q-app/wrappers';
import axios from 'axios';
import { environment } from 'src/config/environment';

// Polyfill `global` for browser bundles (some libs expect it).
try {
  if (typeof window !== 'undefined') {
    window.global = window.global || window;
    window.globalThis = window.globalThis || window;
  }
} catch {
  // ignore
}

// Shared API client for the api-service backend.
const api = axios.create({ baseURL: environment.apiBaseUrl });

// Register the clients during application boot so they are available app-wide.
export default defineBoot(({ app }) => {
  // Expose axios clients for Options API usage (this.$axios / this.$api).
  app.config.globalProperties.$axios = axios;
  app.config.globalProperties.$api = api;
});

export { api };
