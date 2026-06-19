<template>
  <q-page class="neo-page neo-loading-scope">
    <loading-overlay :show="loading" context="fetch" />
    <section class="neo-section">
      <div class="neo-section-header">
        <div>
          <div class="neo-kicker">{{ t('v36.common.schema') }}</div>
          <h1 class="neo-section-title">{{ t('v36.forecast.title') }}</h1>
          <p class="neo-section-subtitle">{{ t('v36.forecast.subtitle') }}</p>
        </div>
        <div class="neo-section-actions">
          <LiveConnectionBadge
            :connected="sseConnected"
            :connecting="sseConnecting"
            :last-event-at="sseLastEventAt"
          />
          <div v-if="source" class="neo-analytics-chip">{{ t('v36.common.source') }}: {{ source }}</div>
          <ai-explain-button context-key="forecast-dashboard" variant="prominent" />
          <q-btn unelevated color="primary" icon="refresh" :disable="loading" :label="t('v36.common.refresh')" @click="() => refresh()">
            <q-tooltip>{{ t('live.manualRefreshTooltip') }}</q-tooltip>
          </q-btn>
        </div>
      </div>

      <q-banner v-if="error" class="neo-banner">
        <template #avatar><q-icon name="error_outline" /></template>
        {{ error }}
      </q-banner>

      <q-banner v-if="sourceBanner" :class="sourceBannerClass">
        <template #avatar><q-icon :name="sourceBannerIcon" /></template>
        {{ sourceBanner }}
      </q-banner>

      <q-banner v-if="warnings.length" class="neo-v36-warning">
        <template #avatar><q-icon name="warning" /></template>
        {{ warnings.join(' | ') }}
      </q-banner>
    </section>

    <section class="neo-section neo-v36-kpis">
      <article v-for="metric in metrics" :key="metric.label" class="neo-kpi-card">
        <div class="neo-kpi-label">{{ metric.label }} <InfoTooltip v-if="metric.help" :text="metric.help" /></div>
        <div class="neo-kpi-value">{{ metric.value }}</div>
        <div class="neo-kpi-meta">{{ metric.meta }}</div>
        <div class="neo-kpi-accent" aria-hidden="true"></div>
      </article>
    </section>

    <section class="neo-section neo-v36-grid">
      <article class="neo-analytics-panel">
        <div class="neo-analytics-head">
          <div>
            <h3>{{ t('v36.forecast.totalEventsHistory') }} <InfoTooltip :text="t('v36.help.forecast.totalEventsHistory')" /></h3>
            <p>{{ totalEventsModel }}</p>
          </div>
          <ai-explain-button context-key="forecast-total-events" variant="prominent" />
        </div>
        <spark-area-chart
          :values="totalEventValues"
          :labels="totalEventLabels"
          tone="primary"
          :value-formatter="formatWhole"
        />
      </article>

      <article class="neo-analytics-panel">
        <div class="neo-analytics-head">
          <div>
            <h3>{{ t('v36.forecast.anomalyRateHistory') }} <InfoTooltip :text="t('v36.help.forecast.anomalyRateHistory')" /></h3>
            <p>{{ anomalyRateModel }}</p>
          </div>
          
        </div>
        <spark-area-chart
          :values="anomalyRateValues"
          :labels="anomalyRateLabels"
          tone="warning"
          :value-formatter="formatRateValue"
        />
      </article>
    </section>
  </q-page>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import InfoTooltip from 'src/components/common/InfoTooltip.vue';
import SparkAreaChart from 'src/components/dashboard/SparkAreaChart.vue';
import AiExplainButton from 'src/components/ai/AiExplainButton.vue';
import LiveConnectionBadge from 'src/components/common/LiveConnectionBadge.vue';
import LoadingOverlay from 'src/components/loading/LoadingOverlay.vue';
import { useForecastDashboard } from 'src/composables/v36/useForecastDashboard';
import { useV36SseState } from 'src/composables/v36/useV36SseRefresh';
import type { V36ForecastPoint } from 'src/types/analytics';
import { formatNumber, formatPercent, safeArray, sourceInfoBanner } from 'src/utils/format';

const { connected: sseConnected, connecting: sseConnecting, lastEventAt: sseLastEventAt } = useV36SseState();
const { t } = useI18n();
const { data, loading, error, refresh, source, warnings } = useForecastDashboard();

const sourceBannerInfo = computed(() => sourceInfoBanner(source.value));
const sourceBanner = computed(() => sourceBannerInfo.value?.message ?? '');
const sourceBannerClass = computed(() => {
  const type = sourceBannerInfo.value?.type;
  if (type === 'warning') return 'neo-v36-warning';
  if (type === 'info') return 'neo-v36-info';
  return '';
});
const sourceBannerIcon = computed(() => {
  const type = sourceBannerInfo.value?.type;
  if (type === 'warning') return 'warning';
  if (type === 'info') return 'info';
  return '';
});

const totalEventsModel = computed(
  () => data.value?.forecastModelNames?.totalEvents ?? 'XGBoost total-events forecast',
);
const anomalyRateModel = computed(
  () => data.value?.forecastModelNames?.anomalyRate ?? 'Ridge anomaly-rate forecast',
);

const metrics = computed(() => [
  {
    label: t('v36.forecast.forecastDate'),
    value: data.value?.forecastDate ?? t('common.notAvailable'),
    meta: t('v36.forecast.forecastDateMeta'),
    help: t('v36.help.forecast.forecastDate'),
  },
  {
    label: t('v36.forecast.predictedTotalEvents'),
    value: formatNumber(data.value?.predictedTotalEvents),
    meta: totalEventsModel.value,
    help: t('v36.help.forecast.predictedTotalEvents'),
  },
  {
    label: t('v36.forecast.predictedAnomalyRate'),
    value: formatPercent(data.value?.predictedAnomalyRate, 1),
    meta: anomalyRateModel.value,
    help: t('v36.help.forecast.predictedAnomalyRate'),
  },
  {
    label: t('v36.forecast.expectedAlertVolume'),
    value: formatNumber(data.value?.expectedAlertVolume),
    meta: t('v36.forecast.expectedAlertVolumeMeta'),
    help: t('v36.help.forecast.expectedAlertVolume'),
  },
]);

const pointValue = (point: V36ForecastPoint): number | null =>
  point.value ?? point.actual ?? point.forecast ?? point.predicted ?? null;

const pointLabel = (point: V36ForecastPoint, index: number) =>
  point.label ?? point.date ?? point.timestamp ?? `P${index + 1}`;

const totalEventPoints = computed(() => safeArray<V36ForecastPoint>(data.value?.historicalTotalEvents));
const totalEventValues = computed(() => totalEventPoints.value.map(pointValue).filter((v): v is number => v !== null));
const totalEventLabels = computed(() => totalEventPoints.value.map(pointLabel));
const anomalyRatePoints = computed(() => safeArray<V36ForecastPoint>(data.value?.historicalAnomalyRate));
const anomalyRateValues = computed(() => anomalyRatePoints.value.map(pointValue).filter((v): v is number => v !== null));
const anomalyRateLabels = computed(() => anomalyRatePoints.value.map(pointLabel));

const formatWhole = (value: number) => formatNumber(value, { maximumFractionDigits: 0 });
const formatRateValue = (value: number) => formatPercent(value, 1);
</script>

<style scoped>
.neo-v36-kpis,
.neo-v36-grid {
  display: grid;
  gap: var(--neo-space-4);
}

.neo-v36-kpis {
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
}

.neo-v36-grid {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.neo-v36-warning {
  margin-top: var(--neo-space-4);
  border: 1px solid rgba(251, 191, 36, 0.28);
  border-radius: var(--neo-radius-card);
  background: var(--neo-warning-bg);
  color: var(--neo-warning-contrast);
}

@media (max-width: 900px) {
  .neo-v36-grid {
    grid-template-columns: 1fr;
  }
}
</style>
