<template>
  <!-- Hero section introduces the dashboard and surfaces headline status metrics. -->
  <section id="overview" class="neo-section neo-hero">
    <div class="neo-hero-content">
      <div class="neo-hero-copy">
        <div class="neo-kicker">{{ t('overviewHero.kicker') }}</div>
        <h1 class="neo-hero-title">{{ t('overviewHero.title') }}</h1>
        <p class="neo-hero-subtitle">{{ t('overviewHero.subtitle') }}</p>

        <div class="neo-hero-actions">
          <q-btn
            color="primary"
            unelevated
            :label="t('overviewHero.reviewAnomalies')"
            icon="warning"
            @click="emit('navigate', 'anomalies')"
          />
          <q-btn
            outline
            color="primary"
            :label="t('overviewHero.openWorkbench')"
            icon="hub"
            @click="emit('navigate', 'workbench')"
          />
        </div>

        <div class="neo-hero-badges">
          <div class="neo-hero-badge">
            <span class="neo-hero-badge-dot"></span>
            {{ t('overviewHero.redisLiveCache') }}
          </div>
          <div class="neo-hero-badge">
            <span class="neo-hero-badge-dot"></span>
            {{ t('overviewHero.apiAnomalyStream') }}
          </div>
          <div class="neo-hero-badge">
            <span class="neo-hero-badge-dot"></span>
            {{ t('overviewHero.aiExplanationWorkflow') }}
          </div>
        </div>
      </div>

      <!-- Side panel summarizes the current live posture and overall operational counters. -->
      <div class="neo-hero-panel">
        <div class="neo-panel-header">
          <div>
            <div class="neo-panel-title">{{ t('overviewHero.livePosture') }}</div>
            <div class="neo-panel-footnote">
              {{ t('overviewHero.eventsUpdatedAgo', { age: lastUpdatedFormatted }) }}
            </div>
          </div>
          <LivePulse
            :status="streamConnected ? 'connected' : 'disconnected'"
            :events-rate="eventsRate"
          />
        </div>

        <div class="neo-panel-body">
          <div class="neo-panel-metric">
            <div class="neo-panel-value">{{ totalSessions }}</div>
            <div class="neo-panel-label">{{ t('overviewHero.totalSessions') }}</div>
          </div>
          <div class="neo-panel-metric">
            <div class="neo-panel-value">{{ anomalousSessions }}</div>
            <div class="neo-panel-label">{{ t('overviewHero.anomalousSessions') }}</div>
          </div>
          <div class="neo-panel-metric">
            <div class="neo-panel-value">{{ totalAnomalies }}</div>
            <div class="neo-panel-label">{{ t('overviewHero.anomalyEvents') }}</div>
          </div>
          <div class="neo-panel-metric">
            <div class="neo-panel-value">{{ avgSessionDuration }}</div>
            <div class="neo-panel-label">{{ t('overviewHero.averageSession') }}</div>
          </div>
        </div>

        <div class="neo-hero-status-grid">
          <div class="neo-hero-status-card">
            <div class="neo-hero-status-label">{{ t('overviewHero.classifier') }}</div>
            <div class="neo-hero-status-value">{{ t('overviewHero.active') }}</div>
          </div>
          <div class="neo-hero-status-card">
            <div class="neo-hero-status-label">{{ t('overviewHero.responseMode') }}</div>
            <div class="neo-hero-status-value">{{ t('overviewHero.liveTriage') }}</div>
          </div>
          <div class="neo-hero-status-card">
            <div class="neo-hero-status-label">{{ t('overviewHero.forecasts') }}</div>
            <div class="neo-hero-status-value">{{ t('overviewHero.ready') }}</div>
          </div>
        </div>

        <div class="neo-panel-footer">{{ t('overviewHero.footer') }}</div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
// Hero props and emits keep the component focused on messaging and high-level status display.
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import LivePulse from './LivePulse.vue';

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

const { t } = useI18n();

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
