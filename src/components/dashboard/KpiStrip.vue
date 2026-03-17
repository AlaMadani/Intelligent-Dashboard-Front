<template>
  <section class="neo-section neo-kpis">
    <div class="neo-kpi-card">
      <div class="neo-kpi-label">Alert velocity</div>
      <div class="neo-kpi-value">{{ totalAlerts }} alerts</div>
      <div class="neo-kpi-meta">Rolling window from SQL + Redis</div>
    </div>
    <div class="neo-kpi-card">
      <div class="neo-kpi-label">AI readiness</div>
      <div class="neo-kpi-value">{{ explainedCount }} explained</div>
      <div class="neo-kpi-meta">Gemini summaries cached for speed</div>
    </div>
    <div class="neo-kpi-card">
      <div class="neo-kpi-label">Model guardrails</div>
      <div class="neo-kpi-value">{{ thresholdCoverage }}%</div>
      <div class="neo-kpi-meta">Alerts above configured threshold</div>
    </div>
    <div class="neo-kpi-card">
      <div class="neo-kpi-label">Investigations</div>
      <div class="neo-kpi-value">{{ historyCount }} events</div>
      <div class="neo-kpi-meta">Last pulled audit timeline</div>
    </div>
  </section>
</template>

<script setup lang="ts">
defineProps<{
  totalAlerts: number;
  explainedCount: number;
  thresholdCoverage: number;
  historyCount: number;
}>();
</script>
