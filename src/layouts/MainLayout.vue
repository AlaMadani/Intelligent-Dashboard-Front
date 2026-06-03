<template>
  <!-- Global shell: top toolbar, persistent drawer, and routed page content. -->
  <q-layout view="lHh Lpr lFf">
    <!-- Header actions expose navigation, branding, and monitoring shortcuts. -->
    <q-header class="neo-header">
      <q-toolbar class="neo-toolbar">
        <div class="neo-toolbar-start">
          <q-btn
            flat
            dense
            round
            icon="menu"
            :aria-label="t('layout.aria.toggleNavigation')"
            class="neo-menu-btn"
            @click="toggleLeftDrawer"
          />

          <q-toolbar-title class="neo-toolbar-title">
            <brand-logo variant="header" />
            <div class="neo-subtitle">{{ t('layout.subtitle') }}</div>
          </q-toolbar-title>
        </div>

        <div class="neo-toolbar-status">
          <div class="neo-top-pill">
            <span class="neo-top-pill-dot"></span>
            {{ t('layout.topPillLiveTelemetry') }}
          </div>
          <div class="neo-top-pill neo-top-pill--soft">{{ t('layout.topPillStack') }}</div>
        </div>

        <div class="neo-toolbar-meta">
          <q-btn
            flat
            dense
            icon="timeline"
            :label="t('layout.grafanaButton')"
            :aria-label="t('layout.aria.openGrafana')"
            class="neo-external-btn"
            @click="openGrafana"
          >
            <q-tooltip anchor="bottom middle">{{ t('layout.grafanaTooltip') }}</q-tooltip>
          </q-btn>

          <q-btn
            flat
            dense
            icon="search"
            :label="t('layout.kibanaButton')"
            :aria-label="t('layout.aria.openKibana')"
            class="neo-external-btn"
            @click="openKibana"
          >
            <q-tooltip anchor="bottom middle">{{ t('layout.kibanaTooltip') }}</q-tooltip>
          </q-btn>

          <q-btn
            flat
            dense
            round
            icon="account_circle"
            :aria-label="t('layout.aria.profile')"
            class="neo-avatar-btn"
          >
            <q-menu anchor="bottom right" self="top right" class="neo-user-menu">
              <q-list>
                <q-item>
                  <q-item-section>
                    <q-item-label>{{ userDisplayName }}</q-item-label>
                    <q-item-label caption>{{ authStore.user?.email }}</q-item-label>
                  </q-item-section>
                </q-item>

                <q-separator />

                <q-item clickable @click="openAccountSettings">
                  <q-item-section avatar>
                    <q-icon name="manage_accounts" />
                  </q-item-section>
                  <q-item-section>{{ t('auth.accountSettings') }}</q-item-section>
                </q-item>

                <q-item clickable @click="handleSignOut">
                  <q-item-section avatar>
                    <q-icon name="logout" />
                  </q-item-section>
                  <q-item-section>{{ t('auth.signOut') }}</q-item-section>
                </q-item>
              </q-list>
            </q-menu>
          </q-btn>
        </div>
      </q-toolbar>
    </q-header>

    <!-- Drawer keeps section links and operating context visible while switching pages. -->
    <q-drawer v-model="leftDrawerOpen" show-if-above bordered :width="300" class="neo-drawer">
      <div class="neo-drawer-shell">
        <div class="neo-drawer-brand">
          <div class="neo-drawer-kicker">{{ t('layout.drawerKicker') }}</div>
          <div class="neo-drawer-title">{{ t('layout.drawerTitle') }}</div>
          <div class="neo-drawer-copy">{{ t('layout.drawerCopy') }}</div>
        </div>

        <q-list class="neo-nav">
          <q-item-label header class="neo-nav-header">{{ t('layout.navHeader') }}</q-item-label>

          <q-item
            v-for="item in navigation"
            :key="item.id"
            clickable
            class="neo-nav-item"
            :active="isActive(item.id)"
            active-class="neo-nav-item--active"
            @click="navigateTo(item.id)"
          >
            <q-item-section avatar>
              <div class="neo-nav-icon">
                <q-icon :name="item.icon" />
              </div>
            </q-item-section>
            <q-item-section>
              <q-item-label>{{ item.label }}</q-item-label>
              <q-item-label caption>{{ item.caption }}</q-item-label>
            </q-item-section>
          </q-item>
        </q-list>
      </div>
    </q-drawer>

    <!-- Routed page components render inside the shared layout container. -->
    <q-page-container class="neo-page-container">
      <Transition name="neo-session-expired">
        <q-banner
          v-if="sessionExpiredVisible"
          dense
          class="neo-session-expired-banner"
          role="alert"
        >
          <template #avatar>
            <q-icon name="schedule" />
          </template>

          <div class="neo-session-expired-copy">
            <strong>{{ t('auth.sessionExpiredTitle') }}</strong>
            <span>{{ t('auth.sessionExpiredNotice') }}</span>
          </div>

          <template #action>
            <q-btn
              unelevated
              color="primary"
              icon-right="login"
              :label="t('auth.sessionExpiredAction')"
              @click="goToLogin"
            />
          </template>
        </q-banner>
      </Transition>

      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup lang="ts">
// Main layout state handles navigation, drawer visibility, and external monitoring links.
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { environment } from 'src/config/environment';
import { SESSION_EXPIRED_EVENT } from 'src/constants/auth';
import { LAYOUT_NAVIGATION_ITEMS } from 'src/constants/layout/navigation';
import { ROUTE_NAMES, type RouteName } from 'src/router/route-names';
import { useAuthStore } from 'src/stores/auth';
import {
  clearSessionExpiredNotice,
  consumeSessionExpiredReason,
  hasIdleSessionExpired,
  markSessionActivity,
  markSessionExpired,
  millisecondsUntilIdleExpiration,
} from 'src/services/session';
import BrandLogo from 'src/components/brand/BrandLogo.vue';
import type { NavigationItem } from 'src/types/navigation';

const { t } = useI18n();
const leftDrawerOpen = ref(typeof window === 'undefined' ? true : window.innerWidth >= 1100);
const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();
const sessionExpiredVisible = ref(false);
let idleTimer: number | undefined;

// Sidebar destinations map each dashboard surface to its route, label, and icon.
const navigation = computed<NavigationItem[]>(() =>
  LAYOUT_NAVIGATION_ITEMS.map((item) => ({
    id: item.id,
    routeName: item.routeName,
    icon: item.icon,
    label: t(item.labelKey),
    caption: t(item.captionKey),
  })),
);

const userDisplayName = computed(() => authStore.user?.fullName || authStore.user?.email || '');

// Layout interactions and route helpers keep the shell synchronized with navigation.
function toggleLeftDrawer() {
  leftDrawerOpen.value = !leftDrawerOpen.value;
}

function routeNameFor(id: string): RouteName {
  return LAYOUT_NAVIGATION_ITEMS.find((item) => item.id === id)?.routeName ?? ROUTE_NAMES.SECURITY_OVERVIEW;
}

function isActive(id: string) {
  const targetRouteName = routeNameFor(id);
  if (targetRouteName === ROUTE_NAMES.USER_360) {
    return route.name === ROUTE_NAMES.USER_360 || route.name === ROUTE_NAMES.USER_360_DETAIL;
  }
  return route.name === targetRouteName;
}

const navigateTo = async (id: string) => {
  const targetRouteName = routeNameFor(id);
  if (!isActive(id)) {
    await router.push({ name: targetRouteName });
  }
};

// Monitoring shortcuts open the external observability tools in new tabs.
const openGrafana = () => {
  window.open(environment.grafanaDashboardsUrl, '_blank', 'noopener');
};

const openKibana = () => {
  window.open(environment.kibanaOverviewUrl, '_blank', 'noopener');
};

const handleSignOut = async () => {
  authStore.signOut();
  await router.replace({ name: ROUTE_NAMES.LOGIN });
};

const openAccountSettings = async () => {
  await router.push({ name: ROUTE_NAMES.ACCOUNT });
};

const clearIdleTimer = () => {
  if (idleTimer) {
    window.clearTimeout(idleTimer);
    idleTimer = undefined;
  }
};

const showExpiredSession = () => {
  clearIdleTimer();
  authStore.clearAuthenticatedState();
  sessionExpiredVisible.value = true;
  clearSessionExpiredNotice();
};

const expireForIdle = () => {
  markSessionExpired('idle');
  showExpiredSession();
};

const scheduleIdleCheck = () => {
  clearIdleTimer();

  if (!authStore.isAuthenticated || sessionExpiredVisible.value) {
    return;
  }

  idleTimer = window.setTimeout(
    checkIdleSession,
    Math.max(millisecondsUntilIdleExpiration(), 1000),
  );
};

const checkIdleSession = () => {
  if (!authStore.isAuthenticated || sessionExpiredVisible.value) {
    return;
  }

  if (hasIdleSessionExpired()) {
    expireForIdle();
    return;
  }

  scheduleIdleCheck();
};

const handleActivity = () => {
  if (!authStore.isAuthenticated || sessionExpiredVisible.value) {
    return;
  }

  if (hasIdleSessionExpired()) {
    expireForIdle();
    return;
  }

  markSessionActivity();
  scheduleIdleCheck();
};

const handleVisibilityChange = () => {
  if (document.visibilityState === 'visible') {
    checkIdleSession();
  }
};

const handleSessionExpiredEvent = (event: Event) => {
  void event;
  showExpiredSession();
};

const goToLogin = async () => {
  sessionExpiredVisible.value = false;
  clearSessionExpiredNotice();
  authStore.clearAuthenticatedState();
  await router.replace({ name: ROUTE_NAMES.LOGIN });
};

const activityEvents = ['pointerdown', 'keydown', 'wheel', 'touchstart', 'scroll'] as const;

onMounted(() => {
  const pendingReason = consumeSessionExpiredReason();
  if (pendingReason) {
    showExpiredSession();
  } else if (authStore.isAuthenticated) {
    if (hasIdleSessionExpired()) {
      expireForIdle();
    } else {
      markSessionActivity();
      scheduleIdleCheck();
    }
  }

  activityEvents.forEach((eventName) => {
    window.addEventListener(eventName, handleActivity, { passive: true });
  });
  document.addEventListener('visibilitychange', handleVisibilityChange);
  window.addEventListener('focus', checkIdleSession);
  window.addEventListener(SESSION_EXPIRED_EVENT, handleSessionExpiredEvent);
});

onBeforeUnmount(() => {
  clearIdleTimer();
  activityEvents.forEach((eventName) => {
    window.removeEventListener(eventName, handleActivity);
  });
  document.removeEventListener('visibilitychange', handleVisibilityChange);
  window.removeEventListener('focus', checkIdleSession);
  window.removeEventListener(SESSION_EXPIRED_EVENT, handleSessionExpiredEvent);
});

watch(
  () => authStore.isAuthenticated,
  (isAuthenticated) => {
    if (isAuthenticated) {
      sessionExpiredVisible.value = false;
      clearSessionExpiredNotice();
      markSessionActivity();
      scheduleIdleCheck();
      return;
    }

    clearIdleTimer();
  },
);
</script>

<style scoped>
.neo-session-expired-banner {
  position: sticky;
  top: 0;
  z-index: 12;
  margin: 0;
  padding: 12px clamp(18px, 3vw, 34px);
  border-bottom: 1px solid rgba(233, 75, 88, 0.24);
  color: #2f3337;
  background: #fff7f8;
  box-shadow: 0 8px 26px rgba(47, 51, 55, 0.1);
}

.neo-session-expired-banner :deep(.q-icon) {
  color: #e94b58;
}

.neo-session-expired-copy {
  display: grid;
  gap: 2px;
  font-size: 13px;
  line-height: 1.35;
}

.neo-session-expired-copy strong {
  font-size: 14px;
  color: var(--neo-ink);
}

.neo-session-expired-enter-active,
.neo-session-expired-leave-active {
  transition:
    opacity 180ms ease,
    transform 220ms cubic-bezier(0.2, 0, 0, 1);
}

.neo-session-expired-enter-from,
.neo-session-expired-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

@media (max-width: 640px) {
  .neo-session-expired-banner {
    padding: 12px 16px;
  }
}
</style>
