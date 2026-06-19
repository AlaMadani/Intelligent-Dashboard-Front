<template>
  <q-page class="neo-page neo-loading-scope">
    <loading-overlay :show="loading" context="fetch" />
    <section class="neo-section">
      <div class="neo-section-header">
        <div>
          <div class="neo-kicker">{{ t('v36.common.schema') }}</div>
          <h1 class="neo-section-title">{{ t('v36.securityOverview.title') }}</h1>
          <p class="neo-section-subtitle">{{ t('v36.securityOverview.subtitle') }}</p>
        </div>
        <div class="neo-section-actions">
          <LiveConnectionBadge
            :connected="sseConnected"
            :connecting="sseConnecting"
            :last-event-at="sseLastEventAt"
          />
          <div v-if="source" class="neo-analytics-chip">{{ t('v36.common.source') }}: {{ source }}</div>
          <q-btn
            unelevated
            color="primary"
            icon="refresh"
            :disable="loading"
            :label="t('v36.common.refresh')"
            @click="() => refresh()"
          >
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
        <div class="neo-v36-warning-list">
          <span v-for="warning in warnings" :key="warning">{{ warning }}</span>
        </div>
      </q-banner>
    </section>

    <section class="neo-section neo-v36-kpis">
      <article v-for="metric in metrics" :key="metric.key" class="neo-kpi-card neo-kpi-card--explainable">
        
        <div class="neo-kpi-head">
          <div class="neo-kpi-icon"><q-icon :name="metric.icon" /></div>
          <div class="neo-kpi-copy">
            <div class="neo-kpi-label">{{ metric.label }} <InfoTooltip v-if="metric.help" :text="metric.help" /></div>
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
            <h3>{{ t('v36.securityOverview.topAnomalyTypes') }} <InfoTooltip :text="t('v36.help.securityOverview.topAnomalyTypes')" /></h3>
            <p>{{ t('v36.securityOverview.topAnomalyTypesSubtitle') }}</p>
          </div>
          <ai-explain-button context-key="security-overview-top-anomalies" variant="prominent" />
        </div>
        <bar-list-chart :items="topAnomalyRows" :empty-message="t('v36.common.noData')" />
      </article>

      <article class="neo-analytics-panel">
        <div class="neo-analytics-head">
          <div>
            <h3>{{ t('v36.securityOverview.topTriggeredRules') }} <InfoTooltip :text="t('v36.help.securityOverview.topTriggeredRules')" /></h3>
            <p>{{ t('v36.securityOverview.topTriggeredRulesSubtitle') }}</p>
          </div>
          <ai-explain-button context-key="security-overview-top-rules" variant="prominent" />
        </div>
        <bar-list-chart :items="topRuleRows" :empty-message="t('v36.common.noData')" />
      </article>

      <article class="neo-analytics-panel">
        <div class="neo-analytics-head">
          <div>
            <h3>{{ t('v36.securityOverview.modelHealth') }}</h3>
            <p>{{ runtimeHealth?.status ?? t('common.unknown') }}</p>
          </div>
          <div class="neo-section-actions">
            
            <q-badge :color="runtimeTone" rounded>{{ runtimeHealth?.status ?? t('common.unknown') }}</q-badge>
          </div>
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
            <h3>{{ t('v36.securityOverview.fieldCoverage') }} <InfoTooltip :text="t('v36.help.securityOverview.fieldCoverage')" /></h3>
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

      <article v-if="sessionFinalizationSummary" class="neo-analytics-panel">
        <div class="neo-analytics-head">
          <div>
            <h3>{{ t('v36.sessionFinalization.title') }}</h3>
            <p>{{ runtimeHealth?.status ?? t('common.unknown') }}</p>
          </div>
            
        </div>
        <div class="neo-v36-model-grid">
          <div class="neo-v36-mini-card">
            <strong>{{ formatNumber(sessionFinalizationSummary.openSessions) }}</strong>
            <span>{{ t('v36.sessionFinalization.openSessions') }}</span>
          </div>
          <div class="neo-v36-mini-card">
            <strong>{{ formatNumber(sessionFinalizationSummary.explicitFinalized) }}</strong>
            <span>{{ t('v36.sessionFinalization.finalizedByExplicitEnd') }}</span>
          </div>
          <div class="neo-v36-mini-card">
            <strong>{{ formatNumber(sessionFinalizationSummary.timeoutFinalized) }}</strong>
            <span>{{ t('v36.sessionFinalization.finalizedByInactivityTimeout') }}</span>
          </div>
        </div>
      </article>

      <article class="neo-analytics-panel neo-v36-wide">
        <div class="neo-analytics-head">
          <div>
            <h3>{{ t('v36.securityOverview.criticalPreview') }}</h3>
            <p>{{ t('v36.securityOverview.criticalPreviewSubtitle') }}</p>
          </div>
          <ai-explain-button context-key="security-overview-critical-preview" variant="prominent" />
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
                <th>{{ t('v36.common.action') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="!criticalAlerts.length">
                <td colspan="7">{{ t('v36.common.noData') }}</td>
              </tr>
              <tr v-for="alert in criticalAlerts" :key="alert.eventId ?? alert.recordId">
                <td><q-badge :color="riskTone(alert.riskLevel)" rounded>{{ alert.riskLevel }}</q-badge></td>
                <td class="neo-mono">{{ alert.eventId ?? t('common.notAvailable') }}</td>
                <td>{{ alert.insuredId ?? t('common.notAvailable') }}</td>
                <td>{{ alert.anomalyType ?? t('common.unknown') }}</td>
                <td>{{ formatNullableScore(alert.finalRiskScore) }}</td>
                <td>{{ formatDate(alert.timestamp) }}</td>
                <td>
                  <ai-explain-button
                    v-if="alert.eventId"
                    context-key="alert-row"
                    variant="compact"
                    :event-id="alert.eventId"
                    :params="{
                      eventId: alert.eventId,
                      riskLevel: alert.riskLevel,
                      anomalyType: alert.anomalyType,
                      finalRiskScore: formatNullableScore(alert.finalRiskScore),
                    }"
                  />
                </td>
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
import InfoTooltip from 'src/components/common/InfoTooltip.vue';
import BarListChart from 'src/components/dashboard/BarListChart.vue';
import AiExplainButton from 'src/components/ai/AiExplainButton.vue';
import LiveConnectionBadge from 'src/components/common/LiveConnectionBadge.vue';
import LoadingOverlay from 'src/components/loading/LoadingOverlay.vue';
import { useSecurityOverview } from 'src/composables/v36/useSecurityOverview';
import { useV36SseState } from 'src/composables/v36/useV36SseRefresh';
import {
  formatDate,
  formatNullableScore,
  formatNumber,
  formatPercent,
  riskTone,
  safeArray,
  sourceInfoBanner,
} from 'src/utils/format';

const { connected: sseConnected, connecting: sseConnecting, lastEventAt: sseLastEventAt } = useV36SseState();
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
    explainContextKey: 'security-overview-total-events',
    help: t('v36.help.securityOverview.totalEventsToday'),
  },
  {
    key: 'active-users',
    label: t('v36.securityOverview.activeUsersToday'),
    value: metricValue(data.value?.activeUsersToday),
    meta: t('v36.common.today'),
    description: t('v36.securityOverview.activeUsersMeta'),
    icon: 'groups',
    explainContextKey: 'security-overview-active-users',
    help: t('v36.help.securityOverview.activeUsersToday'),
  },
  {
    key: 'anomaly-rate',
    label: t('v36.securityOverview.anomalyRateToday'),
    value: metricValue(data.value?.anomalyRateToday, true),
    meta: t('v36.common.today'),
    description: t('v36.securityOverview.anomalyRateMeta'),
    icon: 'warning',
    explainContextKey: 'security-overview-anomaly-rate',
    help: t('v36.help.securityOverview.anomalyRateToday'),
  },
  {
    key: 'critical-alerts',
    label: t('v36.securityOverview.criticalAlertsToday'),
    value: metricValue(data.value?.criticalAlertsToday),
    meta: t('v36.common.today'),
    description: t('v36.securityOverview.criticalAlertsMeta'),
    icon: 'notification_important',
    explainContextKey: 'security-overview-critical-alerts',
    help: t('v36.help.securityOverview.criticalAlertsToday'),
  },
  {
    key: 'high-risk-alerts',
    label: t('v36.securityOverview.highRiskAlertsToday'),
    value: metricValue(data.value?.highRiskAlertsToday),
    meta: t('v36.common.today'),
    description: t('v36.securityOverview.highRiskMeta'),
    icon: 'shield',
    explainContextKey: 'security-overview-high-risk-alerts',
    help: t('v36.help.securityOverview.highRiskAlertsToday'),
  },
  {
    key: 'average-risk',
    label: t('v36.securityOverview.averageRiskScore'),
    value: formatNullableScore(data.value?.averageRiskScoreToday),
    meta: t('v36.common.today'),
    description: t('v36.securityOverview.averageRiskMeta'),
    icon: 'speed',
    explainContextKey: 'security-overview-average-risk',
    help: t('v36.help.securityOverview.averageRiskScore'),
  },
  {
    key: 'predicted-anomaly-rate',
    label: t('v36.securityOverview.predictedAnomalyRateTomorrow'),
    value: metricValue(data.value?.predictedAnomalyRateTomorrow, true),
    meta: 'Ridge',
    description: t('v36.securityOverview.ridgeForecastMeta'),
    icon: 'show_chart',
    explainContextKey: 'security-overview-predicted-anomaly',
    help: t('v36.help.securityOverview.predictedAnomalyRate'),
  },
  {
    key: 'predicted-events',
    label: t('v36.securityOverview.predictedTotalEventsTomorrow'),
    value: metricValue(data.value?.predictedTotalEventsTomorrow),
    meta: 'XGBoost',
    description: t('v36.securityOverview.xgboostForecastMeta'),
    icon: 'query_stats',
    explainContextKey: 'security-overview-predicted-events',
    help: t('v36.help.securityOverview.predictedTotalEvents'),
  },
  {
    key: 'expected-alert-volume',
    label: t('v36.securityOverview.expectedAlertVolumeTomorrow'),
    value: metricValue(data.value?.expectedAlertVolumeTomorrow),
    meta: t('v36.forecast.expectedAlertVolume'),
    description: t('v36.securityOverview.expectedAlertsMeta'),
    icon: 'campaign',
    explainContextKey: 'security-overview-expected-alerts',
    help: t('v36.help.securityOverview.expectedAlertVolume'),
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
    status: state.lastInferenceSucceeded === true
      ? t('v36.runtime.inferenceSucceeded')
      : state.lastInferenceSucceeded === false
        ? state.unavailableReason || state.lastInferenceError || t('v36.runtime.inferenceFailed')
        : t('v36.runtime.noInferenceRecorded'),
  })),
);

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

const sessionFinalizationSummary = computed(() => {
  const sf = runtimeHealth.value?.sessionFinalization;
  if (!sf) return null;
  return {
    openSessions: sf.openSessionCount,
    explicitFinalized: sf.sessionsFinalizedByExplicitEnd,
    timeoutFinalized: sf.sessionsFinalizedByInactivityTimeout,
  };
});
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
  border: 1px solid rgba(251, 191, 36, 0.28);
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
  background: var(--neo-card-bg-tint);
}

.neo-v36-model-grid {
  display: grid;
  gap: var(--neo-space-3);
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 220px), 1fr));
  align-items: stretch;
}

.neo-v36-mini-card {
  min-width: 0;
  min-height: 98px;
  padding: var(--neo-space-3);
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  border: var(--neo-border);
  border-radius: var(--neo-radius-card);
  background: var(--neo-card-bg-tint);
  overflow: hidden;
}

.neo-v36-mini-card strong,
.neo-v36-mini-card span {
  display: block;
  max-width: 100%;
  min-width: 0;
  white-space: normal;
  overflow-wrap: anywhere;
  word-break: break-word;
  hyphens: auto;
  line-height: 1.35;
}

.neo-v36-mini-card strong {
  color: var(--neo-ink);
  font-size: 13px;
}

.neo-v36-mini-card span {
  margin-top: 8px;
  color: var(--neo-ink-muted);
  font-size: 12px;
}

@media (max-width: 520px) {
  .neo-v36-model-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 900px) {
  .neo-v36-grid > .neo-analytics-panel {
    grid-column: 1 / -1;
  }
}

.neo-kpi-card--explainable {
  position: relative;
}

.neo-kpi-explain {
  position: absolute;
  top: 12px;
  right: 12px;
  z-index: 1;
}
</style>
