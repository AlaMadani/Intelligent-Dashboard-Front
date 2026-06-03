// Pinia boot file: create the application-wide store container used by Quasar.
import { defineStore } from '#q-app/wrappers';
import { createPinia } from 'pinia';
import { setupAuthPersistence } from 'src/stores/auth-persistence';

export default defineStore((/* { ssrContext } */) => {
  // Create the shared Pinia store instance.
  const pinia = createPinia();

  setupAuthPersistence(pinia);

  return pinia;
});
