import { useAuthStore } from 'src/stores/auth';
import type { Router } from 'vue-router';

export function setupAuthGuard(router: Router) {
  router.beforeEach((to) => {
    const authStore = useAuthStore();

    // Initialize auth state from localStorage on first load
    if (!authStore.user && !authStore.accessToken) {
      authStore.initialize();
    }

    // Public routes that don't require authentication
    const publicRoutes = [
      '/login',
      '/signup',
      '/verify-email',
      '/forgot-password',
      '/reset-password-code',
      '/reset-password',
    ];

    const isPublicRoute = publicRoutes.includes(to.path);
    const isAuthenticated = authStore.isAuthenticated;

    // Redirect to login if accessing protected route without auth
    if (!isPublicRoute && !isAuthenticated) {
      return '/login';
    }

    // Redirect to dashboard if accessing auth pages while already authenticated
    if (isPublicRoute && isAuthenticated) {
      return '/overview';
    }

    return true;
  });
}
