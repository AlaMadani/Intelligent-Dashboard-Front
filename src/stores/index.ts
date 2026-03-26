import { defineStore } from '#q-app/wrappers';
import { createPinia } from 'pinia';

// Extend this interface if you register custom Pinia properties.
declare module 'pinia' {
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  export interface PiniaCustomProperties {
    // add your custom properties here, if any
  }
}

export default defineStore((/* { ssrContext } */) => {
  // Create the shared Pinia store instance.
  const pinia = createPinia();

  // Register Pinia plugins here.

  return pinia;
});
