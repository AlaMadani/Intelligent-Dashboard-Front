<template>
  <!-- Route wrapper: bind shared dashboard analytics state to the analytics section. -->
  <q-page class="neo-page">
    <AnalyticsSection
      :sessions="sessions"
      :anomalies="anomalies"
      :live-stats="liveStats"
      :trend-stats="trendStats"
      :cluster-mix="clusterMix"
      :drop-offs="dropOffs"
      :path-deviations="pathDeviations"
      :stats-summary="statsSummary"
      :loading="analyticsLoading"
      :error="analyticsError || statsError"
    />
  </q-page>
</template>

<script setup lang="ts">
// Pull only the shared dashboard state required by the analytics route.
import AnalyticsSection from 'src/components/dashboard/AnalyticsSection.vue';
import { useDashboard } from 'src/composables/useDashboard';

const {
  sessions,
  anomalies,
  liveStats,
  trendStats,
  clusterMix,
  dropOffs,
  pathDeviations,
  statsSummary,
  analyticsLoading,
  analyticsError,
  statsError,
} = useDashboard();
</script>
