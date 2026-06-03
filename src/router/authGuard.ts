import { useAuthStore } from 'src/stores/auth';
import { hasIdleSessionExpired, isJwtExpired, markSessionExpired } from 'src/services/session';
import { ROUTE_NAMES } from 'src/router/route-names';
import type { Router } from 'vue-router';

export function setupAuthGuard(router: Router) {
  router.beforeEach((to) => {
    const authStore = useAuthStore();

    if (!authStore.hasHydrated) {
      authStore.initialize();
    }

    const idleSessionExpired = hasIdleSessionExpired();
    if (authStore.isAuthenticated && (idleSessionExpired || isJwtExpired(authStore.refreshToken))) {
      markSessionExpired(idleSessionExpired ? 'idle' : 'token_expired');
      authStore.clearAuthenticatedState();
    }

    const isPublicRoute = to.meta.public === true;
    const isAuthenticated = authStore.isAuthenticated;

    // Redirect to login if accessing protected route without auth
    if (!isPublicRoute && !isAuthenticated) {
      return { name: ROUTE_NAMES.LOGIN };
    }

    // Redirect to dashboard if accessing auth pages while already authenticated
    if (isPublicRoute && isAuthenticated) {
      return { name: ROUTE_NAMES.SECURITY_OVERVIEW };
    }

    return true;
  });
}
