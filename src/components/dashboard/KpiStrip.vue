<template>
  <section class="neo-section neo-kpis">
    <div class="neo-kpi-card">
      <div class="neo-kpi-label">Active sessions</div>
      <div class="neo-kpi-value">{{ activeSessions }}</div>
      <div class="neo-kpi-meta">Current Redis session buffers</div>
    </div>
    <div class="neo-kpi-card">
      <div class="neo-kpi-label">Events per minute</div>
      <div class="neo-kpi-value">{{ eventsPerMinute }}</div>
      <div class="neo-kpi-meta">Rolling 60s window</div>
    </div>
    <div class="neo-kpi-card">
      <div class="neo-kpi-label">Anomaly alert rate</div>
      <div class="neo-kpi-value">{{ anomalyRate }}</div>
      <div class="neo-kpi-meta">Last hour snapshot</div>
    </div>
    <div class="neo-kpi-card">
      <div class="neo-kpi-label">KO rate</div>
      <div class="neo-kpi-value">{{ koRate }}</div>
      <div class="neo-kpi-meta">Last 15m window</div>
    </div>
  </section>
</template>

<script setup lang="ts">
// KPI values rendered in the summary strip.
defineProps<{
  activeSessions: string;
  eventsPerMinute: string;
  anomalyRate: string;
  koRate: string;
}>();
</script>
