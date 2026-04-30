<template>
  <!-- Route wrapper: combine live Redis sessions with persisted session-analysis rows. -->
  <q-page class="neo-page neo-page-stack">
    <LiveSessionsSection
      :sessions="activeSessionRows"
      :loading="activeSessionsLoading"
      :error="activeSessionsError"
    />
    <SessionsSection
      :sessions="sessions"
      :loading="analyticsLoading"
      :error="analyticsError"
      :search="sessionSearch"
      @update:search="(value) => (sessionSearch = value)"
    />
  </q-page>
</template>

<script setup lang="ts">
// Combine live-session radar state with the persisted session analysis dataset.
import LiveSessionsSection from 'src/components/dashboard/LiveSessionsSection.vue';
import SessionsSection from 'src/components/dashboard/SessionsSection.vue';
import { useDashboard } from 'src/composables/useDashboard';

const {
  activeSessionRows,
  activeSessionsLoading,
  activeSessionsError,
  sessions,
  analyticsLoading,
  analyticsError,
  sessionSearch,
} = useDashboard();
</script>

<style scoped>
.neo-page-stack {
  display: grid;
  gap: 24px;
}
</style>
