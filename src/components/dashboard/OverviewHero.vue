<template>
  <section id="overview" class="neo-section neo-hero">
    <div class="neo-hero-content">
      <div class="neo-hero-copy">
        <div class="neo-kicker">Behavior Intelligence</div>
        <h1 class="neo-hero-title">Operational clarity for insured behavior and risk.</h1>
        <p class="neo-hero-subtitle">
          Session analytics, anomaly detection, and live telemetry from the data-processor pipeline.
          Track user risk, spot spikes, and keep response teams aligned.
        </p>
        <div class="neo-hero-actions">
          <q-btn
            color="primary"
            unelevated
            label="Review anomalies"
            icon="warning"
            @click="emit('navigate', 'anomalies')"
          />
          <q-btn
            outline
            color="primary"
            label="Response workbench"
            icon="hub"
            @click="emit('navigate', 'workbench')"
          />
        </div>
      </div>
      <div class="neo-hero-panel">
        <div class="neo-panel-header">
          <div class="neo-panel-title">Live posture</div>
          <q-chip dense color="positive" text-color="white" icon="sensors">Streaming</q-chip>
        </div>
        <div class="neo-panel-body">
          <div class="neo-panel-metric">
            <div class="neo-panel-value">{{ totalSessions }}</div>
            <div class="neo-panel-label">Total sessions</div>
          </div>
          <div class="neo-panel-metric">
            <div class="neo-panel-value">{{ anomalousSessions }}</div>
            <div class="neo-panel-label">Anomalous sessions</div>
          </div>
          <div class="neo-panel-metric">
            <div class="neo-panel-value">{{ totalAnomalies }}</div>
            <div class="neo-panel-label">Anomaly events</div>
          </div>
          <div class="neo-panel-metric">
            <div class="neo-panel-value">{{ avgSessionDuration }}</div>
            <div class="neo-panel-label">Avg session</div>
          </div>
        </div>
        <div class="neo-panel-footer">
          <div class="neo-panel-note">
            Live stats refresh from Redis every minute and anomaly alerts stream from Kafka.
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
// Snapshot metrics for the hero panel.
defineProps<{
  totalSessions: number;
  anomalousSessions: number;
  totalAnomalies: number;
  avgSessionDuration: string;
}>();

// Navigation shortcuts to page sections.
const emit = defineEmits<{
  (event: 'navigate', target: string): void;
}>();
</script>
