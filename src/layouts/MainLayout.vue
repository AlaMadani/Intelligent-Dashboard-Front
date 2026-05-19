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
            <BrandLogo variant="header" />
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
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup lang="ts">
// Main layout state handles navigation, drawer visibility, and external monitoring links.
import { computed, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { environment } from 'src/config/environment';
import { LAYOUT_NAVIGATION_ITEMS } from 'src/constants/layout/navigation';
import { useAuthStore } from 'src/stores/auth';
import BrandLogo from 'src/components/brand/BrandLogo.vue';
import type { NavigationItem } from 'src/types/navigation';

const { t } = useI18n();
const leftDrawerOpen = ref(typeof window === 'undefined' ? true : window.innerWidth >= 1100);
const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();

// Sidebar destinations map each dashboard surface to its route, label, and icon.
const navigation = computed<NavigationItem[]>(() =>
  LAYOUT_NAVIGATION_ITEMS.map((item) => ({
    id: item.id,
    route: item.route,
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

function pathFor(id: string) {
  return LAYOUT_NAVIGATION_ITEMS.find((item) => item.id === id)?.route ?? '/';
}

function isActive(id: string) {
  const targetPath = pathFor(id);
  if (id === 'overview') {
    return route.path === '/' || route.path === '/overview';
  }
  return route.path === targetPath;
}

const navigateTo = async (id: string) => {
  const path = pathFor(id);
  if (route.path !== path) {
    await router.push(path);
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
  await router.push('/login');
};

const openAccountSettings = async () => {
  await router.push('/account');
};
</script>
