<template>
  <!-- Route wrapper: pass insured lookup state into the user intelligence section. -->
  <q-page class="neo-page">
    <UserInsightsSection
      :insured-id="insuredIdInput"
      :risk-profile="riskProfile"
      :next-actions="nextActions"
      :active-anomaly="activeAnomaly"
      :loading="userLoading"
      :error="userError"
      @update:insured-id="(value) => (insuredIdInput = value)"
      @load="loadUserInsights"
    />
  </q-page>
</template>

<script setup lang="ts">
// Consume only the user-insight slice of the shared dashboard store for this route.
import UserInsightsSection from 'src/components/dashboard/UserInsightsSection.vue';
import { useDashboard } from 'src/composables/useDashboard';

const {
  insuredIdInput,
  riskProfile,
  nextActions,
  activeAnomaly,
  userLoading,
  userError,
  loadUserInsights,
} = useDashboard();
</script>
