import { defineBoot } from '#q-app/wrappers';
import axios, { type AxiosInstance } from 'axios';

declare module 'vue' {
  interface ComponentCustomProperties {
    $axios: AxiosInstance;
    $api: AxiosInstance;
  }
}

// Shared API client for the SOC backend.
const api = axios.create({ baseURL: 'http://localhost:8081/api/soc' });

export default defineBoot(({ app }) => {
  // Expose axios clients for Options API usage (this.$axios / this.$api).
  app.config.globalProperties.$axios = axios;
  app.config.globalProperties.$api = api;
});

export { api };
