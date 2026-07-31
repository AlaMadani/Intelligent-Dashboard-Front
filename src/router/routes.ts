// ---- Imports ----
import type { RouteRecordRaw } from 'vue-router';
import { ROUTE_NAMES } from 'src/router/route-names';

// ---- Layout Components ----
const authLayout = () => import('layouts/AuthLayout.vue');
const mainLayout = () => import('layouts/MainLayout.vue');

// ---- Route Definitions ----
const routes: RouteRecordRaw[] = [
  // -- Auth Routes --
  {
    path: '/login',
    name: ROUTE_NAMES.LOGIN,
    component: authLayout,
    meta: { public: true, authView: 'login' },
  },
  {
    path: '/signup',
    name: ROUTE_NAMES.SIGN_UP,
    component: authLayout,
    meta: { public: true, authView: 'signup' },
  },
  {
    path: '/verify-email',
    name: ROUTE_NAMES.VERIFY_EMAIL,
    component: authLayout,
    meta: { public: true, authView: 'verify-email' },
  },
  {
    path: '/forgot-password',
    name: ROUTE_NAMES.FORGOT_PASSWORD,
    component: authLayout,
    meta: { public: true, authView: 'forgot-password' },
  },
  {
    path: '/reset-password-code',
    name: ROUTE_NAMES.RESET_PASSWORD_CODE,
    component: authLayout,
    meta: { public: true, authView: 'reset-password-code' },
  },
  {
    path: '/reset-password',
    name: ROUTE_NAMES.RESET_PASSWORD,
    component: authLayout,
    meta: { public: true, authView: 'reset-password' },
  },

  // -- Protected Dashboard Routes --
  {
    path: '/',
    component: mainLayout,
    children: [
      { path: '', redirect: { name: ROUTE_NAMES.SECURITY_OVERVIEW } },
      { path: 'overview', redirect: { name: ROUTE_NAMES.SECURITY_OVERVIEW } },
      {
        path: 'security-overview',
        name: ROUTE_NAMES.SECURITY_OVERVIEW,
        component: () => import('pages/SecurityOverviewPage.vue'),
      },
      {
        path: 'alerts',
        name: ROUTE_NAMES.ALERTS,
        component: () => import('pages/AlertsPage.vue'),
      },
      {
        path: 'alerts/:eventId',
        name: ROUTE_NAMES.ALERT_INVESTIGATION,
        component: () => import('pages/AlertInvestigationPage.vue'),
      },
      {
        path: 'users',
        name: ROUTE_NAMES.USER_360,
        component: () => import('pages/User360Page.vue'),
      },
      {
        path: 'users/:insuredId/360',
        name: ROUTE_NAMES.USER_360_DETAIL,
        component: () => import('pages/User360Page.vue'),
      },
      {
        path: 'churn',
        name: ROUTE_NAMES.CHURN,
        component: () => import('pages/ChurnPage.vue'),
      },
      {
        path: 'forecast',
        name: ROUTE_NAMES.FORECAST,
        component: () => import('pages/ForecastPage.vue'),
      },
      {
        path: 'runtime',
        name: ROUTE_NAMES.RUNTIME_HEALTH,
        component: () => import('pages/RuntimeHealthPage.vue'),
      },
      {
        path: 'account',
        name: ROUTE_NAMES.ACCOUNT,
        component: () => import('pages/AccountPage.vue'),
      },
    ],
  },

  // -- Catch-All / 404 Route --
  {
    path: '/:catchAll(.*)*',
    component: () => import('pages/ErrorNotFound.vue'),
  },
];

export default routes;
