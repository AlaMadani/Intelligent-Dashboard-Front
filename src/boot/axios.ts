// Axios boot file: configure the shared HTTP clients used across the dashboard.
import { defineBoot } from '#q-app/wrappers';
import axios, { type InternalAxiosRequestConfig } from 'axios';
import { api, isAuthEndpoint } from 'src/services/api-client';
import { useAuthStore } from 'src/stores/auth';
import { markSessionExpired } from 'src/services/session';

type RetriableRequestConfig = InternalAxiosRequestConfig & { _retry?: boolean };

const asError = (error: unknown, fallbackMessage: string) =>
  error instanceof Error ? error : new Error(fallbackMessage);

// Polyfill `global` for browser bundles (some libs expect it).
try {
  if (typeof window !== 'undefined') {
    window.global = window.global || window;
    window.globalThis = window.globalThis || window;
  }
} catch {
  // ignore
}

// Add JWT token to requests
api.interceptors.request.use((config) => {
  const authStore = useAuthStore();
  const token = authStore.accessToken;
  if (token && !isAuthEndpoint(config.url)) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 responses by refreshing token
api.interceptors.response.use(
  (response) => response,
  async (error: unknown) => {
    if (!axios.isAxiosError(error)) {
      return Promise.reject(asError(error, 'An error occurred'));
    }

    const originalRequest = error.config as RetriableRequestConfig | undefined;
    if (!originalRequest) {
      return Promise.reject(error);
    }

    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !isAuthEndpoint(originalRequest.url)
    ) {
      originalRequest._retry = true;

      try {
        const authStore = useAuthStore();
        const tokens = await authStore.refreshAccessTokenAction();
        if (!tokens?.accessToken) {
          markSessionExpired('refresh_failed');
          return Promise.reject(new Error('Session expired'));
        }

        originalRequest.headers.Authorization = `Bearer ${tokens.accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        markSessionExpired('refresh_failed');
        return Promise.reject(asError(refreshError, 'Token refresh failed'));
      }
    }

    return Promise.reject(error);
  }
);

// Register the clients during application boot so they are available app-wide.
export default defineBoot(({ app }) => {
  // Expose axios clients for Options API usage (this.$axios / this.$api).
  app.config.globalProperties.$axios = axios;
  app.config.globalProperties.$api = api;
});

export { api };
