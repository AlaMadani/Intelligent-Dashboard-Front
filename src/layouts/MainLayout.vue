<template>
  <q-layout view="lHh Lpr lFf">
    <q-header class="neo-header" elevated>
      <q-toolbar class="neo-toolbar">
        <q-btn
          flat
          dense
          round
          icon="menu"
          aria-label="Menu"
          class="neo-menu-btn"
          @click="toggleLeftDrawer"
        />

        <q-toolbar-title>
          <div class="neo-title">
            <span class="neo-brand-noveo">Noveo</span>
            <span class="neo-brand-care">Care</span>
            <span class="neo-brand-soc">SOC</span>
          </div>
          <div class="neo-subtitle">Event-Driven Intelligence Console</div>
        </q-toolbar-title>

        <div class="neo-toolbar-meta">
          <q-chip dense color="positive" text-color="white" icon="sensors">Live</q-chip>
          <q-chip dense color="secondary" text-color="white" icon="verified_user">Entra ID</q-chip>

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
            icon="account_circle"
            aria-label="Profile"
            class="neo-avatar-btn"
          />
        </div>
      </q-toolbar>
    </q-header>

    <q-drawer v-model="leftDrawerOpen" show-if-above bordered class="neo-drawer">
      <q-list class="neo-nav">
        <q-item-label header class="neo-nav-header">Command</q-item-label>

        <q-item clickable class="neo-nav-item" @click="scrollToSection('overview')">
          <q-item-section avatar><q-icon name="dashboard" /></q-item-section>
          <q-item-section>Overview</q-item-section>
        </q-item>
        <q-item clickable class="neo-nav-item" @click="scrollToSection('alerts')">
          <q-item-section avatar><q-icon name="report" /></q-item-section>
          <q-item-section>Alerts</q-item-section>
        </q-item>
        <q-item clickable class="neo-nav-item" @click="scrollToSection('investigation')">
          <q-item-section avatar><q-icon name="manage_search" /></q-item-section>
          <q-item-section>Investigation</q-item-section>
        </q-item>
        <q-item clickable class="neo-nav-item" @click="scrollToSection('analytics')">
          <q-item-section avatar><q-icon name="insights" /></q-item-section>
          <q-item-section>Analytics</q-item-section>
        </q-item>
      </q-list>

      <div class="neo-drawer-footer">
        <div class="neo-drawer-label">Next up</div>
        <div class="neo-drawer-note">
          Behavior analytics and system telemetry will land here as the platform expands.
        </div>
      </div>
    </q-drawer>

    <q-page-container class="neo-page-container">
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup lang="ts">
import { nextTick, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

const leftDrawerOpen = ref(false);
const router = useRouter();
const route = useRoute();

// Toggle the navigation drawer on small screens.
function toggleLeftDrawer() {
  leftDrawerOpen.value = !leftDrawerOpen.value;
}

// Navigate to a section, accounting for the sticky header offset.
const scrollToSection = async (id: string) => {
  if (route.path !== '/') {
    await router.push('/');
  }
  await nextTick();
  const target = document.getElementById(id);
  if (target) {
    const header = document.querySelector<HTMLElement>('.neo-header');
    const headerOffset = header?.offsetHeight ?? 0;
    const offsetTop = target.getBoundingClientRect().top + window.scrollY - headerOffset - 12;
    window.scrollTo({ top: Math.max(0, offsetTop), behavior: 'smooth' });
  }
};

// External tooling shortcuts.
const openGrafana = () => {
  window.open('http://localhost:3000/dashboards', '_blank', 'noopener');
};

const openKibana = () => {
  window.open('http://localhost:5601/app/kibana_overview#/', '_blank', 'noopener');
};
</script>
