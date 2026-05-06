export {};

import type { AxiosInstance } from 'axios';

declare module 'vue' {
  interface ComponentCustomProperties {
    $axios: AxiosInstance;
    $api: AxiosInstance;
  }
}

declare global {
  interface Window {
    global?: Window;
    globalThis?: Window;
  }
}
