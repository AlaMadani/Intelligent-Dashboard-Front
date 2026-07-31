// ---- Imports ----
import { defineRouter } from '#q-app/wrappers';
import {
  createMemoryHistory,
  createRouter,
  createWebHashHistory,
  createWebHistory,
} from 'vue-router';
import routes from './routes';
import { setupAuthGuard } from './authGuard';

// ---- Router Factory ----
export default defineRouter(function (/* { store, ssrContext } */) {
  // Pick the right history implementation per runtime mode.
  const createHistory = process.env.SERVER
    ? createMemoryHistory
    : process.env.VUE_ROUTER_MODE === 'history'
      ? createWebHistory
      : createWebHashHistory;

  // ---- Router Instance ----
  // Build the router instance once the history implementation has been selected.
  const Router = createRouter({
    scrollBehavior: () => ({ left: 0, top: 0 }),
    routes,

    // Router history is configured by Quasar build options.
    history: createHistory(process.env.VUE_ROUTER_BASE),
  });

  // ---- Auth Guard Setup ----
  setupAuthGuard(Router);

  return Router;
});
