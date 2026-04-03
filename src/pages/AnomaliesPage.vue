<template>
  <!-- Route wrapper: connect anomaly table interactions to the shared dashboard store. -->
  <q-page class="neo-page">
    <AnomalyEventsSection
      :events="anomalies"
      :loading="analyticsLoading"
      :error="analyticsError"
      :search="anomalySearch"
      :selected-event-key="selectedAnomalyKey"
      @update:search="(value) => (anomalySearch = value)"
      @select="selectAnomaly"
    />
  </q-page>
</template>

<script setup lang="ts">
// Expose anomaly list state and selection handlers for the anomalies route.
import AnomalyEventsSection from 'src/components/dashboard/AnomalyEventsSection.vue';
import { useDashboard } from 'src/composables/useDashboard';

const {
  anomalies,
  analyticsLoading,
  analyticsError,
  anomalySearch,
  selectedAnomalyKey,
  selectAnomaly,
} = useDashboard();
</script>
