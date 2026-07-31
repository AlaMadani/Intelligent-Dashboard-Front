export {};

import type { AxiosInstance } from 'axios';

// ---- Vue Augmentation ----
declare module 'vue' {
  interface ComponentCustomProperties {
    $axios: AxiosInstance;
    $api: AxiosInstance;
  }
}

// ---- Global Window ----
declare global {
  interface Window {
    global?: Window;
    globalThis?: Window;
  }
}
