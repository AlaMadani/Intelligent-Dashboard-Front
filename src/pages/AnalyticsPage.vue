<template>
  <q-page class="neo-page">
    <AnalyticsSection
      :sessions="sessions"
      :anomalies="anomalies"
      :live-stats="liveStats"
      :trend-stats="trendStats"
      :loading="analyticsLoading"
      :error="analyticsError || statsError"
    />
  </q-page>
</template>

<script setup lang="ts">
import AnalyticsSection from 'src/components/dashboard/AnalyticsSection.vue';
import { useDashboard } from 'src/composables/useDashboard';

const {
  sessions,
  anomalies,
  liveStats,
  trendStats,
  analyticsLoading,
  analyticsError,
  statsError,
} = useDashboard();
</script>
