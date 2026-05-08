<template>
  <!-- KPI strip: at-a-glance counters with stable dimensions and semantic state. -->
  <section class="neo-section neo-kpis" data-live-update>
    <div v-if="showSkeleton" class="neo-kpi-skeleton-grid">
      <SkeletonCard v-for="i in 4" :key="i" />
    </div>

    <template v-else>
      <article
        v-for="card in cards"
        :key="card.key"
        class="neo-kpi-card"
        :class="[`neo-kpi-card--${card.state}`, { 'neo-kpi-changed': animationTrigger }]"
      >
        <div class="neo-kpi-head">
          <div class="neo-kpi-icon" aria-hidden="true">
            <q-icon :name="card.icon" />
          </div>

          <div class="neo-kpi-copy">
            <div class="neo-kpi-label">{{ card.label }}</div>
            <div class="neo-kpi-state">{{ card.stateLabel }}</div>
          </div>

          <div class="neo-card-actions" aria-label="Metric actions">
            <q-btn
              flat
              dense
              round
              icon="open_in_full"
              class="neo-card-action"
              :aria-label="`Inspect ${card.label}`"
              @click.stop="emit('inspect', card.key)"
            >
              <q-tooltip anchor="top middle" self="bottom middle">Inspect metric</q-tooltip>
            </q-btn>
            <q-btn
              flat
              dense
              round
              icon="ios_share"
              class="neo-card-action"
              :aria-label="`Export ${card.label}`"
              @click.stop="emit('export', card.key)"
            >
              <q-tooltip anchor="top middle" self="bottom middle">Export metric</q-tooltip>
            </q-btn>
          </div>

          <q-icon name="help_outline" class="neo-kpi-hint">
            <q-tooltip anchor="top middle" self="bottom middle" :offset="[0, 8]">
              {{ card.tooltip }}
            </q-tooltip>
          </q-icon>
        </div>

        <div class="neo-kpi-value" aria-live="polite">{{ card.value }}</div>
        <div class="neo-kpi-meta">{{ card.meta }}</div>
        <div class="neo-kpi-accent" aria-hidden="true"></div>
      </article>
    </template>
  </section>
</template>

<script setup lang="ts">
// KPI cards are derived from a small set of live counters passed in by the overview page.
import { computed, ref, watch, shallowRef } from 'vue';
import { useI18n } from 'vue-i18n';
import SkeletonCard from './SkeletonCard.vue';

type KpiState = 'success' | 'warning' | 'critical' | 'info';

const props = defineProps<{
  activeSessions: string;
  anomalyRate: string;
  globalRiskLevel: string;
  eventsPerMinute: string;
  eventsSinceLoad?: number;
  lastUpdated?: Date | null;
}>();

const emit = defineEmits<{
  (event: 'inspect', key: string): void;
  (event: 'export', key: string): void;
}>();

const { t } = useI18n();

const animationTrigger = ref(false);
const hasData = shallowRef(false);
watch(
  () => props.lastUpdated,
  (value) => {
    if (value) hasData.value = true;
  },
  { immediate: true },
);
const showSkeleton = computed(() => !hasData.value);

// Briefly highlight KPI changes without scaling text or moving surrounding cards.
watch(
  () => props.eventsSinceLoad,
  () => {
    animationTrigger.value = true;
    window.setTimeout(() => {
      animationTrigger.value = false;
    }, 520);
  },
);

const parsePercent = (value: string) => {
  const parsed = Number(value.replace('%', '').replace(',', '.').trim());
  return Number.isFinite(parsed) ? parsed : null;
};

const stateLabel = (state: KpiState) => {
  switch (state) {
    case 'success':
      return 'Healthy';
    case 'warning':
      return 'Watch';
    case 'critical':
      return 'Critical';
    default:
      return 'Live';
  }
};

const anomalyRateState = computed<KpiState>(() => {
  const value = parsePercent(props.anomalyRate);
  if (value == null) return 'info';
  if (value >= 15) return 'critical';
  if (value >= 5) return 'warning';
  return 'success';
});

const globalRiskState = computed<KpiState>(() => {
  const normalized = props.globalRiskLevel.toLowerCase();
  if (/(critical|high|tier3|severe)/.test(normalized)) return 'critical';
  if (/(medium|tier2|elevated|watch)/.test(normalized)) return 'warning';
  if (/(low|normal|healthy|none)/.test(normalized)) return 'success';
  return 'info';
});

// Card descriptors keep the template small while pairing each metric with copy and iconography.
const cards = computed(() => [
  {
    key: 'active-sessions',
    label: t('kpiStrip.activeSessions.label'),
    value: props.activeSessions,
    meta: t('kpiStrip.activeSessions.meta'),
    icon: 'motion_photos_on',
    tooltip: t('kpiStrip.activeSessions.tooltip'),
    state: 'info' as KpiState,
    stateLabel: stateLabel('info'),
  },
  {
    key: 'anomaly-rate',
    label: t('kpiStrip.anomalyRate.label'),
    value: props.anomalyRate,
    meta: t('kpiStrip.anomalyRate.meta'),
    icon: 'notification_important',
    tooltip: t('kpiStrip.anomalyRate.tooltip'),
    state: anomalyRateState.value,
    stateLabel: stateLabel(anomalyRateState.value),
  },
  {
    key: 'global-risk',
    label: t('kpiStrip.globalRisk.label'),
    value: props.globalRiskLevel,
    meta: t('kpiStrip.globalRisk.meta'),
    icon: 'shield',
    tooltip: t('kpiStrip.globalRisk.tooltip'),
    state: globalRiskState.value,
    stateLabel: stateLabel(globalRiskState.value),
  },
  {
    key: 'events-per-minute',
    label: t('kpiStrip.eventsPerMinute.label'),
    value: props.eventsPerMinute,
    meta: t('kpiStrip.eventsPerMinute.meta'),
    icon: 'timeline',
    tooltip: t('kpiStrip.eventsPerMinute.tooltip'),
    state: 'success' as KpiState,
    stateLabel: stateLabel('success'),
  },
]);
</script>

<style scoped>
/* KPI card header, semantic tone, and value-change animation styling. */
.neo-kpi-skeleton-grid {
  display: grid;
  gap: var(--neo-space-4);
  grid-column: 1 / -1;
  grid-template-columns: repeat(4, minmax(0, 1fr));
}

.neo-kpi-card {
  --kpi-tone: var(--neo-info);
  --kpi-tone-bg: var(--neo-info-bg);
  --kpi-tone-text: var(--neo-info-contrast);
  min-height: 172px;
  padding: 18px;
  overflow: hidden;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.92), rgba(248, 250, 249, 0.86)),
    var(--neo-card-bg);
}

.neo-kpi-card--success {
  --kpi-tone: var(--neo-success);
  --kpi-tone-bg: var(--neo-success-bg);
  --kpi-tone-text: var(--neo-success-contrast);
}

.neo-kpi-card--warning {
  --kpi-tone: var(--neo-warning);
  --kpi-tone-bg: var(--neo-warning-bg);
  --kpi-tone-text: var(--neo-warning-contrast);
}

.neo-kpi-card--critical {
  --kpi-tone: var(--neo-critical);
  --kpi-tone-bg: var(--neo-critical-bg);
  --kpi-tone-text: var(--neo-critical-contrast);
}

.neo-kpi-head {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto auto;
  align-items: start;
  gap: 10px;
}

.neo-kpi-icon {
  width: 38px;
  height: 38px;
  display: grid;
  place-items: center;
  border-radius: var(--neo-radius-control);
  background: var(--kpi-tone-bg);
  color: var(--kpi-tone-text);
}

.neo-kpi-copy {
  min-width: 0;
}

.neo-kpi-label {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.neo-kpi-state {
  display: inline-flex;
  width: fit-content;
  margin-top: 5px;
  padding: 3px 7px;
  border-radius: 999px;
  background: var(--kpi-tone-bg);
  color: var(--kpi-tone-text);
  font-size: 11px;
  font-weight: 700;
}

.neo-kpi-hint {
  margin-top: 7px;
  color: var(--neo-ink-muted);
  cursor: help;
  font-size: 14px;
  opacity: 0.55;
}

.neo-kpi-hint:hover {
  opacity: 1;
}

.neo-kpi-value {
  min-height: 42px;
  margin-top: 20px;
  font-variant-numeric: tabular-nums;
}

.neo-kpi-meta {
  min-height: 34px;
  margin-top: 8px;
}

.neo-kpi-accent {
  position: absolute;
  inset-inline: 18px;
  bottom: 14px;
  height: 3px;
  border-radius: 999px;
  background: linear-gradient(90deg, var(--kpi-tone), rgba(23, 33, 43, 0.08));
}

.neo-kpi-changed .neo-kpi-value {
  animation: kpi-value-update 520ms ease-out;
}

@keyframes kpi-value-update {
  0% {
    color: var(--neo-ink);
    text-shadow: none;
  }

  35% {
    color: var(--kpi-tone-text);
    text-shadow: 0 0 18px rgba(23, 33, 43, 0.12);
  }

  100% {
    color: var(--neo-ink);
    text-shadow: none;
  }
}

@media (max-width: 1220px) {
  .neo-kpi-skeleton-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 820px) {
  .neo-kpi-skeleton-grid {
    grid-template-columns: 1fr;
  }

  .neo-kpi-card {
    min-height: 156px;
  }
}
</style>
