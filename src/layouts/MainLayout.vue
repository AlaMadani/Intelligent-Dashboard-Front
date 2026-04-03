<template>
  <!-- Global shell: top toolbar, persistent drawer, and routed page content. -->
  <q-layout view="lHh Lpr lFf">
    <!-- Header actions expose navigation, branding, and monitoring shortcuts. -->
    <q-header class="neo-header" elevated>
      <q-toolbar class="neo-toolbar">
        <div class="neo-toolbar-start">
          <q-btn
            flat
            dense
            round
            icon="menu"
            aria-label="Toggle navigation"
            class="neo-menu-btn"
            @click="toggleLeftDrawer"
          />

          <q-toolbar-title>
            <div class="neo-title">
              <span class="neo-brand-noveo">Noveo</span>
              <span class="neo-brand-care">Care</span>
              <span class="neo-brand-soc">Insights</span>
            </div>
            <div class="neo-subtitle">
              Behavior intelligence cockpit for live session operations
            </div>
          </q-toolbar-title>
        </div>

        <div class="neo-toolbar-status">
          <div class="neo-top-pill">
            <span class="neo-top-pill-dot"></span>
            Live telemetry
          </div>
          <div class="neo-top-pill neo-top-pill--soft">Redis + Kafka + AI context</div>
        </div>

        <div class="neo-toolbar-meta">
          <q-btn
            flat
            dense
            icon="timeline"
            label="Grafana"
            aria-label="Open Grafana dashboard in a new tab"
            class="neo-external-btn"
            text-color="black"
            @click="openGrafana"
          >
            <q-tooltip anchor="bottom middle">Grafana dashboards</q-tooltip>
          </q-btn>

          <q-btn
            flat
            dense
            icon="search"
            label="Kibana"
            aria-label="Open Kibana overview in a new tab"
            class="neo-external-btn"
            text-color="black"
            @click="openKibana"
          >
            <q-tooltip anchor="bottom middle">Kibana overview</q-tooltip>
          </q-btn>

          <q-btn
            flat
            dense
            round
            icon="account_circle"
            aria-label="Profile"
            class="neo-avatar-btn"
          />
        </div>
      </q-toolbar>
    </q-header>

    <!-- Drawer keeps section links and operating context visible while switching pages. -->
    <q-drawer v-model="leftDrawerOpen" show-if-above bordered :width="300" class="neo-drawer">
      <div class="neo-drawer-shell">
        <div class="neo-drawer-brand">
          <div class="neo-drawer-kicker">Command deck</div>
          <div class="neo-drawer-title">Navigate the live surfaces</div>
          <div class="neo-drawer-copy">
            Keep the stream, anomaly triage, session traces, and user intelligence aligned in one
            operational flow.
          </div>
        </div>

        <q-list class="neo-nav">
          <q-item-label header class="neo-nav-header">Control surfaces</q-item-label>

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

        <div class="neo-drawer-footer">
          <div class="neo-drawer-label">Operational note</div>
          <div class="neo-drawer-note">
            The sidebar stays open when you move between pages so the command context remains
            visible while you investigate.
          </div>

          <div class="neo-drawer-metrics">
            <div class="neo-drawer-metric">
              <span>Refresh</span>
              <strong>60s</strong>
            </div>
            <div class="neo-drawer-metric">
              <span>Mode</span>
              <strong>Live</strong>
            </div>
            <div class="neo-drawer-metric">
              <span>Focus</span>
              <strong>Risk ops</strong>
            </div>
          </div>
        </div>
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
import { ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

interface NavigationItem {
  id: string;
  label: string;
  caption: string;
  icon: string;
}

const leftDrawerOpen = ref(typeof window === 'undefined' ? true : window.innerWidth >= 1100);
const router = useRouter();
const route = useRoute();

// Sidebar destinations map each dashboard surface to its route, label, and icon.
const navigation: NavigationItem[] = [
  {
    id: 'overview',
    label: 'Overview',
    caption: 'Executive signal board',
    icon: 'dashboard',
  },
  {
    id: 'anomalies',
    label: 'Anomalies',
    caption: 'Investigate flagged events',
    icon: 'warning',
  },
  {
    id: 'workbench',
    label: 'Workbench',
    caption: 'Review live stream context',
    icon: 'hub',
  },
  {
    id: 'sessions',
    label: 'Sessions',
    caption: 'Inspect behavior traces',
    icon: 'analytics',
  },
  {
    id: 'insights',
    label: 'User insights',
    caption: 'Load insured risk context',
    icon: 'manage_search',
  },
  {
    id: 'analytics',
    label: 'Analytics',
    caption: 'Trend and geo graphics',
    icon: 'insights',
  },
];

// Layout interactions and route helpers keep the shell synchronized with navigation.
function toggleLeftDrawer() {
  leftDrawerOpen.value = !leftDrawerOpen.value;
}

function pathFor(id: string) {
  return id === 'overview' ? '/' : `/${id}`;
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
  window.open('http://localhost:3000/dashboards', '_blank', 'noopener');
};

const openKibana = () => {
  window.open('http://localhost:5601/app/kibana_overview#/', '_blank', 'noopener');
};
</script>
