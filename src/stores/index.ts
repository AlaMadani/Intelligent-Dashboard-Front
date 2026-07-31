// ---- Imports ----
import { defineStore } from '#q-app/wrappers';
import { createPinia } from 'pinia';
import { setupAuthPersistence } from 'src/stores/auth-persistence';

// ---- Store Factory ----
export default defineStore((/* { ssrContext } */) => {
  const pinia = createPinia();

  setupAuthPersistence(pinia);

  return pinia;
});
