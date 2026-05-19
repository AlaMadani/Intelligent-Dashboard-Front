// Axios boot file: configure the shared HTTP clients used across the dashboard.
import { defineBoot } from '#q-app/wrappers';
import axios, { type InternalAxiosRequestConfig } from 'axios';
import { environment } from 'src/config/environment';
import { SESSION_EXPIRED_NOTICE_KEY, SESSION_EXPIRED_QUERY_VALUE } from 'src/constants/auth';
import type { AuthResponse } from 'src/types/auth';

type RetriableRequestConfig = InternalAxiosRequestConfig & { _retry?: boolean };

const asError = (error: unknown, fallbackMessage: string) =>
  error instanceof Error ? error : new Error(fallbackMessage);

const isAuthEndpoint = (url: string | undefined) => url?.startsWith('/api/auth/') ?? false;

const clearStoredAuth = () => {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('user');
};

const redirectToExpiredSessionLogin = () => {
  localStorage.setItem(SESSION_EXPIRED_NOTICE_KEY, 'true');

  const target = `/login?session=${SESSION_EXPIRED_QUERY_VALUE}`;
  if (
    window.location.pathname !== '/login' ||
    window.location.search !== `?session=${SESSION_EXPIRED_QUERY_VALUE}`
  ) {
    window.location.assign(target);
  }
};

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

// Add JWT token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
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
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) {
          clearStoredAuth();
          redirectToExpiredSessionLogin();
          return Promise.reject(new Error('Session expired'));
        }

        const response = await axios.post<AuthResponse>(
          `${environment.apiBaseUrl}/api/auth/refresh`,
          {},
          {
            headers: {
              Authorization: `Bearer ${refreshToken}`,
            },
          },
        );

        const { accessToken, refreshToken: newRefreshToken } = response.data;
        if (!accessToken || !newRefreshToken) {
          throw new Error('Refresh response did not include tokens');
        }

        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', newRefreshToken);

        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        clearStoredAuth();
        redirectToExpiredSessionLogin();
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
