// Route table: mount each dashboard surface under the shared main layout shell.
import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      { path: '', component: () => import('pages/OverviewPage.vue') },
      { path: 'overview', component: () => import('pages/OverviewPage.vue') },
      { path: 'anomalies', component: () => import('pages/AnomaliesPage.vue') },
      { path: 'workbench', component: () => import('pages/WorkbenchPage.vue') },
      { path: 'sessions', component: () => import('pages/SessionsPage.vue') },
      { path: 'insights', component: () => import('pages/InsightsPage.vue') },
      { path: 'analytics', component: () => import('pages/AnalyticsPage.vue') },
    ],
  },

  // Unknown URLs fall back to the dedicated 404 page.
  // Catch-all for unknown routes.
  {
    path: '/:catchAll(.*)*',
    component: () => import('pages/ErrorNotFound.vue'),
  },
];

export default routes;
