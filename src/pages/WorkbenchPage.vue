<template>
  <q-page class="neo-page">
    <AnomalyWorkbenchSection
      :selected-event="selectedAnomaly"
      :selected-event-key="selectedAnomalyKey"
      :stream-alerts="streamAlerts"
      :stream-connected="streamConnected"
      :stream-error="streamError"
      :session-analysis="selectedSession"
      :session-analysis-loading="selectedSessionLoading"
      :risk-profile="riskProfile"
      :next-actions="nextActions"
      :active-anomaly="activeAnomaly"
      :explanation="anomalyExplanation"
      :explanation-loading="explanationLoading"
      :explanation-error="explanationError"
      @select-alert="selectAnomaly"
      @generate-explanation="generateExplanation"
    />
  </q-page>
</template>

<script setup lang="ts">
import AnomalyWorkbenchSection from 'src/components/dashboard/AnomalyWorkbenchSection.vue';
import { useDashboard } from 'src/composables/useDashboard';

const {
  selectedAnomaly,
  selectedAnomalyKey,
  streamAlerts,
  streamConnected,
  streamError,
  selectedSession,
  selectedSessionLoading,
  riskProfile,
  nextActions,
  activeAnomaly,
  anomalyExplanation,
  explanationLoading,
  explanationError,
  selectAnomaly,
  generateExplanation,
} = useDashboard();
</script>
