// ---- Template ----
<template>
  <!-- Global shell: top toolbar, persistent drawer, and routed page content. -->
  <q-layout view="Hhh Lpr lFf">
    <!-- Header actions expose navigation, branding, and monitoring shortcuts. -->
    <q-header class="neo-header">
      <q-toolbar class="neo-toolbar">
        <div class="neo-toolbar-start">
          <q-btn
            id="sidebar-toggle"
            flat
            dense
            round
            :icon="leftDrawerOpen ? 'chevron_left' : 'menu'"
            :aria-label="t('layout.aria.toggleNavigation')"
            class="neo-menu-btn"
            data-assistant-id="sidebar-toggle"
            data-assistant-type="button"
            data-assistant-label="Sidebar Toggle"
            data-assistant-description="Toggle button that opens and closes the sidebar navigation drawer."
            data-assistant-actions="HIGHLIGHT_ELEMENT,CLICK_ELEMENT"
            @click="toggleLeftDrawer"
          />

          <q-toolbar-title class="neo-toolbar-title">
            <brand-logo variant="header" />
            <div class="neo-subtitle">{{ t('layout.subtitle') }}</div>
          </q-toolbar-title>
        </div>

        <div class="neo-toolbar-meta">
          <theme-toggle />

          <q-btn
            id="btn-grafana"
            flat
            dense
            :round="compactHeaderActions"
            icon="timeline"
            :label="compactHeaderActions ? undefined : t('layout.grafanaButton')"
            :aria-label="t('layout.aria.openGrafana')"
            class="neo-external-btn"
            data-assistant-id="btn-grafana"
            data-assistant-type="button"
            data-assistant-label="Grafana Dashboard"
            data-assistant-description="Opens the external Grafana monitoring dashboard."
            data-assistant-actions="HIGHLIGHT_ELEMENT,CLICK_ELEMENT"
            @click="openGrafana"
          >
            <q-tooltip anchor="bottom middle">{{ t('layout.grafanaTooltip') }}</q-tooltip>
          </q-btn>

          <q-btn
            id="btn-kibana"
            flat
            dense
            :round="compactHeaderActions"
            icon="search"
            :label="compactHeaderActions ? undefined : t('layout.kibanaButton')"
            :aria-label="t('layout.aria.openKibana')"
            class="neo-external-btn"
            data-assistant-id="btn-kibana"
            data-assistant-type="button"
            data-assistant-label="Kibana Dashboard"
            data-assistant-description="Opens the external Kibana monitoring dashboard."
            data-assistant-actions="HIGHLIGHT_ELEMENT,CLICK_ELEMENT"
            @click="openKibana"
          >
            <q-tooltip anchor="bottom middle">{{ t('layout.kibanaTooltip') }}</q-tooltip>
          </q-btn>

          <q-btn
            id="btn-user-avatar"
            flat
            dense
            round
            icon="account_circle"
            :aria-label="t('layout.aria.profile')"
            class="neo-avatar-btn"
            data-assistant-id="btn-user-avatar"
            data-assistant-type="button"
            data-assistant-label="User Avatar"
            data-assistant-description="Avatar button that opens the user dropdown menu with Account Settings and Sign Out options."
            data-assistant-actions="HIGHLIGHT_ELEMENT,CLICK_ELEMENT"
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

                <q-item
                  id="nav-account-settings"
                  clickable
                  data-assistant-id="nav-account-settings"
                  data-assistant-type="menu-item"
                  data-assistant-label="Account Settings"
                  data-assistant-description="Navigates to the Account Settings page."
                  data-assistant-actions="HIGHLIGHT_ELEMENT,CLICK_ELEMENT"
                  @click="openAccountSettings"
                >
                  <q-item-section avatar>
                    <q-icon name="manage_accounts" />
                  </q-item-section>
                  <q-item-section>{{ t('auth.accountSettings') }}</q-item-section>
                </q-item>

                <q-item
                  id="btn-sign-out"
                  clickable
                  data-assistant-id="btn-sign-out"
                  data-assistant-type="menu-item"
                  data-assistant-label="Sign Out"
                  data-assistant-description="Signs out of the application."
                  data-assistant-actions="HIGHLIGHT_ELEMENT"
                  @click="handleSignOut"
                >
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

      <Transition name="neo-session-expired">
        <div
          v-if="sessionExpiredVisible"
          class="neo-session-expired"
          role="alert"
          aria-live="assertive"
        >
          <div class="neo-session-expired__icon" aria-hidden="true">
            <q-icon name="schedule" />
          </div>

          <div class="neo-session-expired__copy">
            <strong>{{ t('auth.sessionExpiredTitle') }}</strong>
            <span>{{ t('auth.sessionExpiredNotice') }}</span>
          </div>

          <q-btn
            unelevated
            no-caps
            class="neo-session-expired__action"
            icon-right="login"
            :label="t('auth.sessionExpiredAction')"
            @click="goToLogin"
          />
        </div>
      </Transition>
    </q-header>

    <!-- Drawer keeps section links and operating context visible while switching pages. -->
    <q-drawer
      v-model="leftDrawerOpen"
      show-if-above
      bordered
      :breakpoint="drawerBreakpoint"
      :width="drawerWidth"
      class="neo-drawer"
    >
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
            :id="'nav-' + item.id"
            clickable
            class="neo-nav-item"
            :active="isActive(item.id)"
            active-class="neo-nav-item--active"
            :data-assistant-id="'nav-' + item.id"
            data-assistant-type="nav-item"
            :data-assistant-label="item.label"
            :data-assistant-description="'Navigates to the ' + item.label + ' page.'"
            data-assistant-actions="HIGHLIGHT_ELEMENT,CLICK_ELEMENT"
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
      <router-view />
    </q-page-container>

    <ai-explainer-modal />
    <noveo-companion-chat />
  </q-layout>
</template>

// ---- Script Setup ----
<script setup lang="ts">
// Main layout state handles navigation, drawer visibility, and external monitoring links.
// ---- Imports ----
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useQuasar } from 'quasar';
import { environment } from 'src/config/environment';
import { ASSISTANT_EXPLAIN_AI_EVENT } from 'src/constants/events';
import { SESSION_EXPIRED_EVENT } from 'src/constants/auth';
import { LAYOUT_NAVIGATION_ITEMS } from 'src/constants/layout/navigation';
import { ROUTE_NAMES, type RouteName } from 'src/router/route-names';
import { useAuthStore } from 'src/stores/auth';
import { useAiExplainer } from 'src/composables/useAiExplainer';
import {
  clearSessionExpiredNotice,
  consumeSessionExpiredReason,
  hasIdleSessionExpired,
  markSessionActivity,
  markSessionExpired,
  millisecondsUntilIdleExpiration,
} from 'src/services/session';
import BrandLogo from 'src/components/brand/BrandLogo.vue';
import ThemeToggle from 'src/components/theme/ThemeToggle.vue';
import AiExplainerModal from 'src/components/ai/AiExplainerModal.vue';
import NoveoCompanionChat from 'src/components/ai/NoveoCompanionChat.vue';
import type { NavigationItem } from 'src/types/navigation';

// ---- Composables & Reactive State ----
const { t } = useI18n();
const $q = useQuasar();
const drawerBreakpoint = 1024;
const leftDrawerOpen = ref(
  typeof window === 'undefined' ? true : window.innerWidth >= drawerBreakpoint,
);
const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();
const sessionExpiredVisible = ref(false);
let idleTimer: number | undefined;

const { open: openExplainer } = useAiExplainer();

const handleAssistantExplainAi = () => {
  const eventId = route.params.eventId ? String(route.params.eventId) : undefined;
  void openExplainer({
    contextKey: 'investigation-overview',
    ...(eventId ? { eventId } : {}),
  });
};

// ---- Computed Properties ----
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

const compactHeaderActions = computed(() => $q.screen.width < 640);

const drawerWidth = computed(() => {
  const viewportWidth = $q.screen.width;
  if (viewportWidth < 360) {
    return Math.max(248, viewportWidth - 20);
  }

  if (viewportWidth < 480) {
    return Math.min(280, viewportWidth - 24);
  }

  return 300;
});

// ---- Layout Navigation ----
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

  if ($q.screen.width < drawerBreakpoint) {
    leftDrawerOpen.value = false;
  }
};

// ---- External Links & Auth ----
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

// ---- Idle Session Management ----
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

// ---- Activity & Session Events ----
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

// ---- Lifecycle Hooks ----
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
  document.addEventListener(ASSISTANT_EXPLAIN_AI_EVENT, handleAssistantExplainAi);
});

onBeforeUnmount(() => {
  clearIdleTimer();
  activityEvents.forEach((eventName) => {
    window.removeEventListener(eventName, handleActivity);
  });
  document.removeEventListener('visibilitychange', handleVisibilityChange);
  window.removeEventListener('focus', checkIdleSession);
  window.removeEventListener(SESSION_EXPIRED_EVENT, handleSessionExpiredEvent);
  document.removeEventListener(ASSISTANT_EXPLAIN_AI_EVENT, handleAssistantExplainAi);
});

// ---- Watchers ----
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

// ---- Styles ----
<style scoped>
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
</style>
