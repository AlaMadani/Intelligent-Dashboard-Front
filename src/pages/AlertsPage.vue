<template>
  <q-page class="neo-page">
    <section class="neo-section">
      <div class="neo-section-header">
        <div>
          <div class="neo-kicker">{{ t('v36.common.schema') }}</div>
          <h1 class="neo-section-title">{{ t('v36.alerts.title') }}</h1>
          <p class="neo-section-subtitle">{{ t('v36.alerts.subtitle') }}</p>
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

      <q-banner v-if="warnings.length" class="neo-v36-alert-warning">
        <template #avatar><q-icon name="warning" /></template>
        {{ warnings.join(' | ') }}
      </q-banner>
    </section>

    <section class="neo-section neo-panel">
      <div class="neo-v36-filters">
        <q-select
          v-model="params.riskLevel"
          dense
          outlined
          clearable
          emit-value
          map-options
          :options="riskOptions"
          :label="t('v36.common.riskLevel')"
        />
        <q-input v-model="params.anomalyType" dense outlined clearable :label="t('v36.common.anomalyType')" />
        <q-input v-model="params.insuredId" dense outlined clearable :label="t('v36.common.insuredId')" />
        <q-input v-model="params.sessionId" dense outlined clearable :label="t('v36.common.sessionId')" />
        <q-input v-model="params.from" dense outlined clearable type="date" :label="t('v36.common.from')" />
        <q-input v-model="params.to" dense outlined clearable type="date" :label="t('v36.common.to')" />
        <q-btn unelevated color="secondary" icon="filter_alt" :label="t('v36.common.apply')" @click="applyFilters" />
      </div>
    </section>

    <section class="neo-section neo-v36-alert-summary">
      <article class="neo-analytics-card">
        <span>{{ t('v36.alerts.resultCount') }}</span>
        <strong>{{ formatNumber(count) }}</strong>
      </article>
      <article class="neo-analytics-card">
        <span>{{ t('v36.alerts.criticalAlerts') }}</span>
        <strong>{{ formatNumber(criticalItems.length) }}</strong>
      </article>
      <article class="neo-analytics-card">
        <span>{{ t('v36.common.lastUpdated') }}</span>
        <strong>{{ lastUpdated ? formatDate(lastUpdated.toISOString()) : t('common.notAvailable') }}</strong>
      </article>
    </section>

    <section class="neo-section">
      <div class="neo-table-wrapper">
        <table class="neo-table neo-v36-alert-table">
          <thead>
            <tr>
              <th>{{ t('v36.common.riskLevel') }}</th>
              <th>{{ t('v36.common.finalRiskScore') }}</th>
              <th>{{ t('v36.common.timestamp') }}</th>
              <th>{{ t('v36.common.eventAction') }}</th>
              <th>{{ t('v36.common.apiTemplate') }}</th>
              <th>{{ t('v36.common.apiFamily') }}</th>
              <th>{{ t('v36.common.insuredId') }}</th>
              <th>{{ t('v36.common.sessionId') }}</th>
              <th>{{ t('v36.common.country') }}</th>
              <th>{{ t('v36.common.device') }}</th>
              <th>{{ t('v36.common.anomalyType') }}</th>
              <th>{{ t('v36.common.xgboostScore') }}</th>
              <th>{{ t('v36.common.lightgbmScore') }}</th>
              <th>{{ t('v36.common.transformerRisk') }}</th>
              <th>{{ t('v36.common.tcnRisk') }}</th>
              <th>{{ t('v36.common.ruleRisk') }}</th>
              <th>{{ t('v36.common.triggeredRules') }}</th>
              <th>{{ t('v36.common.churnRisk') }}</th>
              <th>{{ t('v36.common.source') }}</th>
              <th>{{ t('v36.common.warnings') }}</th>
              <th>{{ t('v36.common.action') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loading">
              <td colspan="21">{{ t('v36.common.loading') }}</td>
            </tr>
            <tr v-else-if="!items.length">
              <td colspan="21">{{ t('v36.common.noData') }}</td>
            </tr>
            <tr v-for="alert in items" :key="alert.eventId ?? alert.recordId">
              <td><q-badge :color="riskTone(alert.riskLevel)" rounded>{{ alert.riskLevel ?? t('common.unknown') }}</q-badge></td>
              <td>{{ formatNullableScore(alert.finalRiskScore) }}</td>
              <td>{{ formatDate(alert.timestamp) }}</td>
              <td>{{ alert.eventAction ?? t('common.notAvailable') }}</td>
              <td class="neo-mono">{{ alert.apiTemplate ?? t('common.notAvailable') }}</td>
              <td>{{ alert.apiFamily ?? t('common.notAvailable') }}</td>
              <td>
                <q-btn
                  v-if="alert.insuredId"
                  flat
                  dense
                  no-caps
                  color="primary"
                  :label="alert.insuredId"
                  @click="openUser(alert.insuredId)"
                />
                <span v-else>{{ t('common.notAvailable') }}</span>
              </td>
              <td class="neo-mono">{{ alert.sessionId ?? t('common.notAvailable') }}</td>
              <td>{{ alert.country ?? t('common.notAvailable') }}</td>
              <td>{{ alert.device ?? t('common.notAvailable') }}</td>
              <td>{{ alert.anomalyType ?? t('common.unknown') }}</td>
              <td>{{ formatNullableScore(alert.xgboostAnomalyScore100 ?? score100(alert.xgboostAnomalyScore)) }}</td>
              <td>{{ formatNullableScore(alert.lightgbmAlertScore100 ?? score100(alert.lightgbmAlertScore)) }}</td>
              <td>{{ formatNullableScore(alert.transformerRiskScore100) }}</td>
              <td>{{ formatNullableScore(alert.tcnRiskScore100) }}</td>
              <td>{{ formatNullableScore(alert.ruleRiskScore) }}</td>
              <td>{{ rulesLabel(alert.triggeredRuleCodes) }}</td>
              <td>{{ churnLabel(alert) }}</td>
              <td>{{ alert.source ?? t('common.notAvailable') }}</td>
              <td>{{ rulesLabel(alert.warnings) }}</td>
              <td>
                <q-btn
                  dense
                  unelevated
                  color="primary"
                  icon="manage_search"
                  :disable="!alert.eventId"
                  :label="t('v36.common.investigate')"
                  @click="openInvestigation(alert.eventId)"
                />
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="neo-v36-pagination">
        <q-btn flat icon="chevron_left" :label="t('v36.common.previous')" :disable="(params.offset ?? 0) <= 0" @click="previousPage" />
        <span>{{ t('v36.alerts.offsetLabel', { offset: params.offset ?? 0, limit: params.limit ?? 50 }) }}</span>
        <q-btn flat icon-right="chevron_right" :label="t('v36.common.next')" :disable="!hasMore" @click="nextPage" />
      </div>
    </section>
  </q-page>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useLiveAlerts } from 'src/composables/v36/useLiveAlerts';
import { ROUTE_NAMES } from 'src/router/route-names';
import type { V36LiveAlertItem } from 'src/types/analytics';
import {
  formatDate,
  formatNullableScore,
  formatNumber,
  formatPercent,
  riskTone,
} from 'src/utils/format';

const router = useRouter();
const { t } = useI18n();
const {
  params,
  items,
  criticalItems,
  loading,
  error,
  refresh,
  nextPage,
  previousPage,
  lastUpdated,
  source,
  warnings,
  count,
  hasMore,
} = useLiveAlerts();

const riskOptions = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map((value) => ({
  label: value,
  value,
}));

const applyFilters = () => {
  params.value = {
    ...params.value,
    offset: 0,
  };
  void refresh();
};

const score100 = (value: number | undefined) =>
  value == null ? undefined : value <= 1 ? value * 100 : value;

const rulesLabel = (value: string[] | undefined) =>
  value?.length ? value.join(', ') : t('common.none');

const churnLabel = (alert: V36LiveAlertItem) => {
  if (alert.churnProbability == null && !alert.churnRiskLevel) return t('common.notAvailable');
  return `${alert.churnRiskLevel ?? t('common.unknown')} / ${formatPercent(alert.churnProbability, 1)}`;
};

const openInvestigation = async (eventId: string | undefined) => {
  if (!eventId) return;
  await router.push({ name: ROUTE_NAMES.ALERT_INVESTIGATION, params: { eventId } });
};

const openUser = async (insuredId: string) => {
  await router.push({ name: ROUTE_NAMES.USER_360_DETAIL, params: { insuredId } });
};
</script>

<style scoped>
.neo-v36-filters {
  display: grid;
  gap: var(--neo-space-3);
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  align-items: end;
}

.neo-v36-alert-summary {
  display: grid;
  gap: var(--neo-space-4);
  grid-template-columns: repeat(auto-fit, minmax(190px, 1fr));
}

.neo-v36-alert-summary span,
.neo-v36-alert-summary strong {
  display: block;
}

.neo-v36-alert-summary span {
  color: var(--neo-ink-muted);
  font-size: 12px;
}

.neo-v36-alert-summary strong {
  margin-top: 8px;
  font-size: 24px;
  font-weight: 800;
}

.neo-v36-alert-table {
  min-width: 1900px;
}

.neo-v36-alert-warning {
  margin-top: var(--neo-space-4);
  border: 1px solid rgba(167, 101, 24, 0.2);
  border-radius: var(--neo-radius-card);
  background: var(--neo-warning-bg);
  color: var(--neo-warning-contrast);
}

.neo-v36-pagination {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: var(--neo-space-3);
  margin-top: var(--neo-space-4);
  color: var(--neo-ink-muted);
  font-size: 13px;
}

@media (max-width: 720px) {
  .neo-v36-pagination {
    justify-content: stretch;
    flex-direction: column;
    align-items: stretch;
  }
}
</style>
