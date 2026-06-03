<template>
  <q-page class="neo-page">
    <section class="neo-section">
      <div class="neo-section-header">
        <div>
          <div class="neo-kicker">{{ t('v36.common.schema') }}</div>
          <h1 class="neo-section-title">{{ t('v36.forecast.title') }}</h1>
          <p class="neo-section-subtitle">{{ t('v36.forecast.subtitle') }}</p>
        </div>
        <div class="neo-section-actions">
          <div v-if="source" class="neo-analytics-chip">{{ t('v36.common.source') }}: {{ source }}</div>
          <q-btn unelevated color="primary" icon="refresh" :loading="loading" :label="t('v36.common.refresh')" @click="refresh" />
        </div>
      </div>

      <q-banner v-if="error" class="neo-banner">
        <template #avatar><q-icon name="error_outline" /></template>
        {{ error }}
      </q-banner>

      <q-banner v-if="warnings.length" class="neo-v36-warning">
        <template #avatar><q-icon name="warning" /></template>
        {{ warnings.join(' | ') }}
      </q-banner>
    </section>

    <section class="neo-section neo-v36-kpis">
      <article v-for="metric in metrics" :key="metric.label" class="neo-kpi-card">
        <div class="neo-kpi-label">{{ metric.label }}</div>
        <div class="neo-kpi-value">{{ metric.value }}</div>
        <div class="neo-kpi-meta">{{ metric.meta }}</div>
        <div class="neo-kpi-accent" aria-hidden="true"></div>
      </article>
    </section>

    <section class="neo-section neo-v36-grid">
      <article class="neo-analytics-panel">
        <div class="neo-analytics-head">
          <div>
            <h3>{{ t('v36.forecast.totalEventsHistory') }}</h3>
            <p>{{ totalEventsModel }}</p>
          </div>
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
            <h3>{{ t('v36.forecast.anomalyRateHistory') }}</h3>
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
import SparkAreaChart from 'src/components/dashboard/SparkAreaChart.vue';
import { useForecastDashboard } from 'src/composables/v36/useForecastDashboard';
import type { V36ForecastPoint } from 'src/types/analytics';
import { formatNumber, formatPercent, safeArray } from 'src/utils/format';

const { t } = useI18n();
const { data, loading, error, refresh, source, warnings } = useForecastDashboard();

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
  },
  {
    label: t('v36.forecast.predictedTotalEvents'),
    value: formatNumber(data.value?.predictedTotalEvents),
    meta: totalEventsModel.value,
  },
  {
    label: t('v36.forecast.predictedAnomalyRate'),
    value: formatPercent(data.value?.predictedAnomalyRate, 1),
    meta: anomalyRateModel.value,
  },
  {
    label: t('v36.forecast.expectedAlertVolume'),
    value: formatNumber(data.value?.expectedAlertVolume),
    meta: t('v36.forecast.expectedAlertVolumeMeta'),
  },
]);

const pointValue = (point: V36ForecastPoint) =>
  point.value ?? point.actual ?? point.forecast ?? point.predicted ?? 0;

const pointLabel = (point: V36ForecastPoint, index: number) =>
  point.label ?? point.date ?? point.timestamp ?? `P${index + 1}`;

const totalEventValues = computed(() => safeArray<V36ForecastPoint>(data.value?.historicalTotalEvents).map(pointValue));
const totalEventLabels = computed(() =>
  safeArray<V36ForecastPoint>(data.value?.historicalTotalEvents).map(pointLabel),
);
const anomalyRateValues = computed(() => safeArray<V36ForecastPoint>(data.value?.historicalAnomalyRate).map(pointValue));
const anomalyRateLabels = computed(() =>
  safeArray<V36ForecastPoint>(data.value?.historicalAnomalyRate).map(pointLabel),
);

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
  border: 1px solid rgba(167, 101, 24, 0.2);
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
