<template>
  <q-page class="neo-page">
    <section class="neo-section">
      <div class="neo-section-header">
        <div>
          <div class="neo-kicker">{{ t('v36.common.schema') }}</div>
          <h1 class="neo-section-title">{{ t('v36.securityOverview.title') }}</h1>
          <p class="neo-section-subtitle">{{ t('v36.securityOverview.subtitle') }}</p>
        </div>
        <div class="neo-section-actions">
          <div v-if="source" class="neo-analytics-chip">{{ t('v36.common.source') }}: {{ source }}</div>
          <q-btn
            unelevated
            color="primary"
            icon="refresh"
            :loading="loading"
            :label="t('v36.common.refresh')"
            @click="refresh"
          />
        </div>
      </div>

      <q-banner v-if="error" class="neo-banner">
        <template #avatar><q-icon name="error_outline" /></template>
        {{ error }}
      </q-banner>

      <q-banner v-if="warnings.length" class="neo-v36-warning">
        <template #avatar><q-icon name="warning" /></template>
        <div class="neo-v36-warning-list">
          <span v-for="warning in warnings" :key="warning">{{ warning }}</span>
        </div>
      </q-banner>
    </section>

    <section class="neo-section neo-v36-kpis">
      <article v-for="metric in metrics" :key="metric.key" class="neo-kpi-card">
        <div class="neo-kpi-head">
          <div class="neo-kpi-icon"><q-icon :name="metric.icon" /></div>
          <div class="neo-kpi-copy">
            <div class="neo-kpi-label">{{ metric.label }}</div>
            <div class="neo-kpi-state">{{ metric.meta }}</div>
          </div>
        </div>
        <div class="neo-kpi-value">{{ metric.value }}</div>
        <div class="neo-kpi-meta">{{ metric.description }}</div>
        <div class="neo-kpi-accent" aria-hidden="true"></div>
      </article>
    </section>

    <section class="neo-section neo-v36-grid">
      <article class="neo-analytics-panel">
        <div class="neo-analytics-head">
          <div>
            <h3>{{ t('v36.securityOverview.topAnomalyTypes') }}</h3>
            <p>{{ t('v36.securityOverview.topAnomalyTypesSubtitle') }}</p>
          </div>
        </div>
        <bar-list-chart :items="topAnomalyRows" :empty-message="t('v36.common.noData')" />
      </article>

      <article class="neo-analytics-panel">
        <div class="neo-analytics-head">
          <div>
            <h3>{{ t('v36.securityOverview.topTriggeredRules') }}</h3>
            <p>{{ t('v36.securityOverview.topTriggeredRulesSubtitle') }}</p>
          </div>
        </div>
        <bar-list-chart :items="topRuleRows" :empty-message="t('v36.common.noData')" />
      </article>

      <article class="neo-analytics-panel">
        <div class="neo-analytics-head">
          <div>
            <h3>{{ t('v36.securityOverview.modelHealth') }}</h3>
            <p>{{ runtimeHealth?.status ?? t('common.unknown') }}</p>
          </div>
          <q-badge :color="runtimeTone" rounded>{{ runtimeHealth?.status ?? t('common.unknown') }}</q-badge>
        </div>
        <div class="neo-v36-model-grid">
          <div v-for="model in modelHealthRows" :key="model.name" class="neo-v36-mini-card">
            <strong>{{ model.name }}</strong>
            <span>{{ model.status }}</span>
          </div>
        </div>
      </article>

      <article class="neo-analytics-panel">
        <div class="neo-analytics-head">
          <div>
            <h3>{{ t('v36.securityOverview.fieldCoverage') }}</h3>
            <p>{{ t('v36.securityOverview.fieldCoverageSubtitle') }}</p>
          </div>
        </div>
        <div v-if="!fieldWarnings.length" class="neo-analytics-empty">
          {{ t('v36.securityOverview.noFieldWarnings') }}
        </div>
        <div v-else class="neo-v36-list">
          <div v-for="warning in fieldWarnings" :key="warning" class="neo-v36-list-row">
            <q-icon name="warning" />
            <span>{{ warning }}</span>
          </div>
        </div>
      </article>

      <article class="neo-analytics-panel neo-v36-wide">
        <div class="neo-analytics-head">
          <div>
            <h3>{{ t('v36.securityOverview.criticalPreview') }}</h3>
            <p>{{ t('v36.securityOverview.criticalPreviewSubtitle') }}</p>
          </div>
        </div>
        <div class="neo-table-wrapper">
          <table class="neo-table">
            <thead>
              <tr>
                <th>{{ t('v36.common.riskLevel') }}</th>
                <th>{{ t('v36.common.eventId') }}</th>
                <th>{{ t('v36.common.insuredId') }}</th>
                <th>{{ t('v36.common.anomalyType') }}</th>
                <th>{{ t('v36.common.finalRiskScore') }}</th>
                <th>{{ t('v36.common.timestamp') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="!criticalAlerts.length">
                <td colspan="6">{{ t('v36.common.noData') }}</td>
              </tr>
              <tr v-for="alert in criticalAlerts" :key="alert.eventId ?? alert.recordId">
                <td><q-badge :color="riskTone(alert.riskLevel)" rounded>{{ alert.riskLevel }}</q-badge></td>
                <td class="neo-mono">{{ alert.eventId ?? t('common.notAvailable') }}</td>
                <td>{{ alert.insuredId ?? t('common.notAvailable') }}</td>
                <td>{{ alert.anomalyType ?? t('common.unknown') }}</td>
                <td>{{ formatNullableScore(alert.finalRiskScore) }}</td>
                <td>{{ formatDate(alert.timestamp) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </article>
    </section>
  </q-page>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import BarListChart from 'src/components/dashboard/BarListChart.vue';
import { useSecurityOverview } from 'src/composables/v36/useSecurityOverview';
import {
  formatDate,
  formatNullableScore,
  formatNumber,
  formatPercent,
  riskTone,
  safeArray,
} from 'src/utils/format';

const { t } = useI18n();
const {
  data,
  runtimeHealth,
  criticalAlerts,
  loading,
  error,
  refresh,
  source,
  warnings,
} = useSecurityOverview();

const metricValue = (value: number | undefined, percent = false) =>
  percent ? formatPercent(value, 1) : formatNumber(value);

const metrics = computed(() => [
  {
    key: 'total-events',
    label: t('v36.securityOverview.totalEventsToday'),
    value: metricValue(data.value?.totalEventsToday),
    meta: t('v36.common.today'),
    description: t('v36.securityOverview.totalEventsMeta'),
    icon: 'dataset',
  },
  {
    key: 'active-users',
    label: t('v36.securityOverview.activeUsersToday'),
    value: metricValue(data.value?.activeUsersToday),
    meta: t('v36.common.today'),
    description: t('v36.securityOverview.activeUsersMeta'),
    icon: 'groups',
  },
  {
    key: 'anomaly-rate',
    label: t('v36.securityOverview.anomalyRateToday'),
    value: metricValue(data.value?.anomalyRateToday, true),
    meta: t('v36.common.today'),
    description: t('v36.securityOverview.anomalyRateMeta'),
    icon: 'warning',
  },
  {
    key: 'critical-alerts',
    label: t('v36.securityOverview.criticalAlertsToday'),
    value: metricValue(data.value?.criticalAlertsToday),
    meta: t('v36.common.today'),
    description: t('v36.securityOverview.criticalAlertsMeta'),
    icon: 'notification_important',
  },
  {
    key: 'high-risk-alerts',
    label: t('v36.securityOverview.highRiskAlertsToday'),
    value: metricValue(data.value?.highRiskAlertsToday),
    meta: t('v36.common.today'),
    description: t('v36.securityOverview.highRiskMeta'),
    icon: 'shield',
  },
  {
    key: 'average-risk',
    label: t('v36.securityOverview.averageRiskScore'),
    value: formatNullableScore(data.value?.averageRiskScoreToday),
    meta: t('v36.common.today'),
    description: t('v36.securityOverview.averageRiskMeta'),
    icon: 'speed',
  },
  {
    key: 'predicted-anomaly-rate',
    label: t('v36.securityOverview.predictedAnomalyRateTomorrow'),
    value: metricValue(data.value?.predictedAnomalyRateTomorrow, true),
    meta: 'Ridge',
    description: t('v36.securityOverview.ridgeForecastMeta'),
    icon: 'show_chart',
  },
  {
    key: 'predicted-events',
    label: t('v36.securityOverview.predictedTotalEventsTomorrow'),
    value: metricValue(data.value?.predictedTotalEventsTomorrow),
    meta: 'XGBoost',
    description: t('v36.securityOverview.xgboostForecastMeta'),
    icon: 'query_stats',
  },
  {
    key: 'expected-alert-volume',
    label: t('v36.securityOverview.expectedAlertVolumeTomorrow'),
    value: metricValue(data.value?.expectedAlertVolumeTomorrow),
    meta: t('v36.forecast.expectedAlertVolume'),
    description: t('v36.securityOverview.expectedAlertsMeta'),
    icon: 'campaign',
  },
]);

const toBarRows = (record: Record<string, number> | undefined) =>
  Object.entries(record ?? {})
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([label, value]) => ({ label, value }));

const topAnomalyRows = computed(() => toBarRows(data.value?.topAnomalyTypes));
const topRuleRows = computed(() => toBarRows(data.value?.topTriggeredRules));
const fieldWarnings = computed(() => safeArray<string>(data.value?.fieldCoverageWarnings));

const runtimeTone = computed(() => {
  const status = runtimeHealth.value?.status?.toUpperCase();
  if (status === 'HEALTHY' || status === 'UP') return 'positive';
  if (status === 'UNKNOWN') return 'grey';
  return 'warning';
});

const modelHealthRows = computed(() =>
  Object.entries(runtimeHealth.value?.modelHealth ?? {}).map(([name, state]) => ({
    name,
    status: state.lastInferenceSucceeded
      ? t('v36.runtime.inferenceSucceeded')
      : state.unavailableReason || state.lastInferenceError || t('common.unknown'),
  })),
);
</script>

<style scoped>
.neo-v36-kpis {
  display: grid;
  gap: var(--neo-space-4);
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
}

.neo-v36-grid {
  display: grid;
  gap: var(--neo-space-4);
  grid-template-columns: repeat(12, minmax(0, 1fr));
}

.neo-v36-grid > .neo-analytics-panel {
  grid-column: span 6;
}

.neo-v36-grid > .neo-v36-wide {
  grid-column: 1 / -1;
}

.neo-v36-warning {
  margin-top: var(--neo-space-4);
  border: 1px solid rgba(167, 101, 24, 0.2);
  border-radius: var(--neo-radius-card);
  background: var(--neo-warning-bg);
  color: var(--neo-warning-contrast);
}

.neo-v36-warning-list,
.neo-v36-list {
  display: grid;
  gap: 8px;
}

.neo-v36-list-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  border: var(--neo-border);
  border-radius: var(--neo-radius-card);
  background: rgba(255, 255, 255, 0.66);
}

.neo-v36-model-grid {
  display: grid;
  gap: var(--neo-space-3);
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
}

.neo-v36-mini-card {
  min-height: 82px;
  padding: var(--neo-space-3);
  border: var(--neo-border);
  border-radius: var(--neo-radius-card);
  background: rgba(23, 33, 43, 0.035);
}

.neo-v36-mini-card strong,
.neo-v36-mini-card span {
  display: block;
}

.neo-v36-mini-card span {
  margin-top: 8px;
  color: var(--neo-ink-muted);
  font-size: 12px;
}

@media (max-width: 900px) {
  .neo-v36-grid > .neo-analytics-panel {
    grid-column: 1 / -1;
  }
}
</style>
