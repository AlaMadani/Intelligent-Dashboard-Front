<template>
  <!-- Hero section introduces the dashboard and surfaces headline status metrics. -->
  <section id="overview" class="neo-section neo-hero">
    <div class="neo-hero-content">
      <div class="neo-hero-copy">
        <div class="neo-kicker">Behavior intelligence</div>
        <h1 class="neo-hero-title">Operational clarity for insured behavior and risk.</h1>
        <p class="neo-hero-subtitle">
          Session analytics, anomaly detection, and live telemetry from the data processor pipeline.
          Track user risk, spot spikes, and keep response teams aligned from one command surface.
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
            label="Open workbench"
            icon="hub"
            @click="emit('navigate', 'workbench')"
          />
        </div>

        <div class="neo-hero-badges">
          <div class="neo-hero-badge">
            <span class="neo-hero-badge-dot"></span>
            Redis live cache
          </div>
          <div class="neo-hero-badge">
            <span class="neo-hero-badge-dot"></span>
            API anomaly stream
          </div>
          <div class="neo-hero-badge">
            <span class="neo-hero-badge-dot"></span>
            AI explanation workflow
          </div>
        </div>
      </div>

      <!-- Side panel summarizes the current live posture and overall operational counters. -->
      <div class="neo-hero-panel">
        <div class="neo-panel-header">
          <div>
            <div class="neo-panel-title">Live posture</div>
            <div class="neo-panel-footnote">Events updated {{ lastUpdatedFormatted }} ago</div>
          </div>
          <LivePulse
            :status="streamConnected ? 'connected' : 'disconnected'"
            :events-rate="eventsRate"
          />
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
            <div class="neo-panel-label">Average session</div>
          </div>
        </div>

        <div class="neo-hero-status-grid">
          <div class="neo-hero-status-card">
            <div class="neo-hero-status-label">Classifier</div>
            <div class="neo-hero-status-value">Active</div>
          </div>
          <div class="neo-hero-status-card">
            <div class="neo-hero-status-label">Response mode</div>
            <div class="neo-hero-status-value">Live triage</div>
          </div>
          <div class="neo-hero-status-card">
            <div class="neo-hero-status-label">Forecasts</div>
            <div class="neo-hero-status-value">Ready</div>
          </div>
        </div>

        <div class="neo-panel-footer">
          Live stats refresh automatically and anomaly alerts stream directly into the dashboard
          workbench.
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
// Hero props and emits keep the component focused on messaging and high-level status display.
const props = defineProps<{
  totalSessions: number;
  anomalousSessions: number;
  totalAnomalies: number;
  avgSessionDuration: string;
  streamConnected?: boolean;
  lastUpdated?: Date | null;
  eventsRate: number | string;
}>();

const emit = defineEmits<{
  (event: 'navigate', target: string): void;
}>();

import { computed, onMounted, onUnmounted, ref } from 'vue';
import LivePulse from './LivePulse.vue';

// A local timer keeps the "updated Xs ago" label fresh without making extra API calls.
const now = ref(new Date());
let interval: number;

onMounted(() => {
  interval = window.setInterval(() => {
    now.value = new Date();
  }, 1000);
});

onUnmounted(() => {
  window.clearInterval(interval);
});

// Convert the last stream timestamp into a continuously refreshed relative age label.
const lastUpdatedFormatted = computed(() => {
  if (!props.lastUpdated) return '0s';
  const diff = Math.max(0, Math.floor((now.value.getTime() - props.lastUpdated.getTime()) / 1000));
  return `${diff}s`;
});
</script>

<style scoped>
/* Hero-specific badges, status cards, and responsive layout details. */
.neo-hero-copy {
  position: relative;
  z-index: 1;
}

.neo-hero-badges {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 22px;
}

.neo-hero-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.08);
  color: rgba(248, 241, 230, 0.86);
  font-size: 12px;
  font-weight: 600;
}

.neo-hero-badge-dot {
  width: 8px;
  height: 8px;
  border-radius: 999px;
  background: #e3a548;
}

.neo-panel-footnote {
  margin-top: 4px;
  font-size: 12px;
  color: var(--neo-ink-muted);
}

.neo-hero-status-grid {
  display: grid;
  gap: 10px;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  margin-top: 16px;
}

.neo-hero-status-card {
  padding: 12px 14px;
  border-radius: 18px;
  background: rgba(14, 26, 34, 0.05);
  border: 1px solid rgba(14, 26, 34, 0.06);
}

.neo-hero-status-label {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--neo-ink-muted);
}

.neo-hero-status-value {
  margin-top: 6px;
  font-size: 15px;
  font-weight: 700;
  color: var(--neo-ink);
}

@media (max-width: 860px) {
  .neo-hero-status-grid {
    grid-template-columns: 1fr;
  }
}
</style>
