// ---- Template ----
<template>
  <q-page class="neo-page neo-loading-scope">
    <loading-overlay :show="loading" context="fetch" />
    <section class="neo-section">
      <div class="neo-section-header">
        <div>
          <div class="neo-kicker">{{ t('v36.common.schema') }}</div>
          <h1 class="neo-section-title">{{ t('v36.alerts.title') }}</h1>
          <p class="neo-section-subtitle">{{ t('v36.alerts.subtitle') }}</p>
        </div>
        <div class="neo-section-actions">
          <span id="alerts-live-connection-badge" data-assistant-id="alerts-live-connection-badge" data-assistant-type="status-indicator" data-assistant-label="Live Connection Badge" data-assistant-description="Badge showing the SSE live connection status for real-time alert updates." data-assistant-actions="HIGHLIGHT_ELEMENT">
            <LiveConnectionBadge
              :connected="sseConnected"
              :connecting="sseConnecting"
              :last-event-at="sseLastEventAt"
            />
          </span>
          <div v-if="source" id="alerts-source-chip" class="neo-analytics-chip" data-assistant-id="alerts-source-chip" data-assistant-type="badge" data-assistant-label="Data Source Chip" data-assistant-description="Chip showing the data source for the alerts data." data-assistant-actions="HIGHLIGHT_ELEMENT">{{ t('v36.common.source') }}: {{ source }}</div>
          <q-btn
            id="alerts-refresh-button"
            unelevated
            color="primary"
            icon="refresh"
            :disable="loading"
            :label="t('v36.common.refresh')"
            data-assistant-id="alerts-refresh-button"
            data-assistant-type="button"
            data-assistant-label="Refresh Alerts"
            data-assistant-description="Refreshes the alerts dashboard data."
            data-assistant-actions="HIGHLIGHT_ELEMENT,CLICK_ELEMENT"
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

      <q-banner v-if="warnings.length" class="neo-v36-alert-warning">
        <template #avatar><q-icon name="warning" /></template>
        {{ warnings.join(' | ') }}
      </q-banner>
    </section>

    <section id="alerts-search-filters" class="neo-section neo-panel"
      data-assistant-id="alerts-search-filters"
      data-assistant-type="filters"
      data-assistant-label="Alerts Search Filters"
      data-assistant-description="Filter alerts by risk level, anomaly type, insured ID, session ID, and date range."
      data-assistant-actions="HIGHLIGHT_ELEMENT"
    >
      <div id="alerts-risk-filter" class="neo-v36-filters"
        data-assistant-id="alerts-risk-filter"
        data-assistant-type="dropdown"
        data-assistant-label="Risk Level Filter"
        data-assistant-description="Filters alerts by risk level."
        data-assistant-actions="HIGHLIGHT_ELEMENT,SET_FILTER"
      >
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
        <q-input id="alerts-filter-anomaly-type" v-model="params.anomalyType" dense outlined clearable :label="t('v36.common.anomalyType')" data-assistant-id="alerts-filter-anomaly-type" data-assistant-type="input" data-assistant-label="Anomaly Type Filter" data-assistant-description="Text input to filter alerts by anomaly type." data-assistant-actions="HIGHLIGHT_ELEMENT,SET_FILTER" />
        <q-input id="alerts-filter-insured-id" v-model="params.insuredId" dense outlined clearable :label="t('v36.common.insuredId')" data-assistant-id="alerts-filter-insured-id" data-assistant-type="input" data-assistant-label="Insured ID Filter" data-assistant-description="Text input to filter alerts by insured ID." data-assistant-actions="HIGHLIGHT_ELEMENT,SET_FILTER" />
        <q-input id="alerts-filter-session-id" v-model="params.sessionId" dense outlined clearable :label="t('v36.common.sessionId')" data-assistant-id="alerts-filter-session-id" data-assistant-type="input" data-assistant-label="Session ID Filter" data-assistant-description="Text input to filter alerts by session ID." data-assistant-actions="HIGHLIGHT_ELEMENT,SET_FILTER" />
        <q-input id="alerts-filter-date-from" v-model="params.from" dense outlined clearable type="date" :label="t('v36.common.from')" data-assistant-id="alerts-filter-date-from" data-assistant-type="input" data-assistant-label="Date From Filter" data-assistant-description="Date input to filter alerts from a start date." data-assistant-actions="HIGHLIGHT_ELEMENT,SET_FILTER" />
        <q-input id="alerts-filter-date-to" v-model="params.to" dense outlined clearable type="date" :label="t('v36.common.to')" data-assistant-id="alerts-filter-date-to" data-assistant-type="input" data-assistant-label="Date To Filter" data-assistant-description="Date input to filter alerts until an end date." data-assistant-actions="HIGHLIGHT_ELEMENT,SET_FILTER" />
        <q-btn id="alerts-filter-apply-button" unelevated color="secondary" icon="filter_alt" :label="t('v36.common.apply')" data-assistant-id="alerts-filter-apply-button" data-assistant-type="button" data-assistant-label="Apply Filters Button" data-assistant-description="Button that applies all alert filter criteria." data-assistant-actions="HIGHLIGHT_ELEMENT,CLICK_ELEMENT" @click="applyFilters" />
      </div>
    </section>

    <section class="neo-section neo-v36-alert-summary">
      <article id="alerts-summary-result-count" class="neo-analytics-card" data-assistant-id="alerts-summary-result-count" data-assistant-type="card" data-assistant-label="Alert Result Count" data-assistant-description="Card showing the total result count for the current alert query." data-assistant-actions="HIGHLIGHT_ELEMENT">
        <span>{{ t('v36.alerts.resultCount') }}</span>
        <strong>{{ formatNumber(count) }}</strong>
      </article>
      <article id="alerts-summary-critical-count" class="neo-analytics-card" data-assistant-id="alerts-summary-critical-count" data-assistant-type="card" data-assistant-label="Critical Alerts Count Summary" data-assistant-description="Card showing the number of critical alerts in the current result set." data-assistant-actions="HIGHLIGHT_ELEMENT">
        <span>{{ t('v36.alerts.criticalAlerts') }}</span>
        <strong>{{ formatNumber(criticalItems.length) }}</strong>
      </article>
      <article id="alerts-summary-last-updated" class="neo-analytics-card" data-assistant-id="alerts-summary-last-updated" data-assistant-type="card" data-assistant-label="Last Updated Timestamp" data-assistant-description="Card showing when the alerts data was last updated." data-assistant-actions="HIGHLIGHT_ELEMENT">
        <span>{{ t('v36.common.lastUpdated') }}</span>
        <strong>{{ lastUpdated ? formatDate(lastUpdated.toISOString()) : t('common.notAvailable') }}</strong>
      </article>
    </section>

    <section class="neo-section">
      <div id="alerts-table" class="neo-table-wrapper"
        data-assistant-id="alerts-table"
        data-assistant-type="table"
        data-assistant-label="Alerts Table"
        data-assistant-description="Displays security alerts with risk level, event ID, anomaly type, and score."
        data-assistant-actions="HIGHLIGHT_ELEMENT"
      >
        <table class="neo-table neo-v36-alert-table">
          <thead>
            <tr>
              <th>{{ t('v36.common.riskLevel') }} <InfoTooltip :text="t('v36.help.alerts.riskLevel')" /></th>
              <th>{{ t('v36.common.eventId') }}</th>
              <th>{{ t('v36.common.insuredId') }}</th>
              <th>{{ t('v36.common.anomalyType') }}</th>
              <th>{{ t('v36.common.sessionId') }}</th>
              <th>{{ t('v36.common.finalRiskScore') }} <InfoTooltip :text="t('v36.help.alerts.finalRiskScore')" /></th>
              <th>{{ t('v36.common.timestamp') }}</th>
              <th>{{ t('v36.common.action') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="!items.length">
              <td colspan="8">{{ emptyMessage }}</td>
            </tr>
            <tr v-for="alert in items" :key="alert.eventId ?? alert.recordId">
              <td><q-badge :color="riskTone(riskLevelDisplay(alert.riskTier, alert.riskLevel))" rounded>{{ riskLevelDisplay(alert.riskTier, alert.riskLevel) ?? t('common.unknown') }}</q-badge></td>
              <td class="neo-mono">{{ alert.eventId ?? t('common.notAvailable') }}</td>
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
              <td>{{ alert.anomalyType ?? t('common.unknown') }}</td>
              <td class="neo-mono">{{ alert.sessionId ?? t('common.notAvailable') }}</td>
              <td>{{ formatNullableScore(alert.finalRiskScore) }}</td>
              <td>{{ formatDate(alert.timestamp) }}</td>
              <td>
                <div class="neo-v36-row-actions">
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
                  <q-btn
                    dense
                    unelevated
                    color="primary"
                    icon="manage_search"
                    :disable="!alert.eventId"
                    :label="t('v36.common.investigate')"
                    @click="openInvestigation(alert.eventId)"
                  />
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="neo-v36-pagination">
        <div id="alerts-pagination-rows-per-page" class="neo-v36-rows-per-page" data-assistant-id="alerts-pagination-rows-per-page" data-assistant-type="select" data-assistant-label="Rows Per Page Selector" data-assistant-description="Dropdown selector to choose the number of rows per page (25, 50, 100)." data-assistant-actions="HIGHLIGHT_ELEMENT,SET_FILTER">
          <span>{{ t('v36.alerts.rowsPerPage') }}</span>
          <q-select
            :model-value="limit"
            dense
            outlined
            emit-value
            map-options
            style="min-width: 72px"
            :options="[
              { label: '25', value: 25 },
              { label: '50', value: 50 },
              { label: '100', value: 100 },
            ]"
            @update:model-value="setPageSize"
          />
        </div>
        <div class="neo-v36-page-info">
          <span v-if="totalPages > 0">{{ t('v36.alerts.pageLabel', { current: currentPage, total: totalPages }) }}</span>
          <span v-else>{{ t('v36.alerts.offsetLabel', { offset: currentOffset, limit }) }}</span>
        </div>
        <div class="neo-v36-page-nav">
          <q-btn id="alerts-pagination-previous" flat icon="chevron_left" :label="t('v36.common.previous')" :disable="currentPage <= 1" data-assistant-id="alerts-pagination-previous" data-assistant-type="button" data-assistant-label="Previous Page Button" data-assistant-description="Button to navigate to the previous page of alerts." data-assistant-actions="HIGHLIGHT_ELEMENT,CLICK_ELEMENT" @click="previousPage" />
          <q-btn id="alerts-pagination-next" flat icon-right="chevron_right" :label="t('v36.common.next')" :disable="!hasMore" data-assistant-id="alerts-pagination-next" data-assistant-type="button" data-assistant-label="Next Page Button" data-assistant-description="Button to navigate to the next page of alerts." data-assistant-actions="HIGHLIGHT_ELEMENT,CLICK_ELEMENT" @click="nextPage" />
        </div>
      </div>
    </section>
  </q-page>
</template>

// ---- Script Setup ----
<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import InfoTooltip from 'src/components/common/InfoTooltip.vue';
import LoadingOverlay from 'src/components/loading/LoadingOverlay.vue';
import AiExplainButton from 'src/components/ai/AiExplainButton.vue';
import LiveConnectionBadge from 'src/components/common/LiveConnectionBadge.vue';
import { ASSISTANT_REFRESH_ALERTS_EVENT } from 'src/constants/events';
import { useLiveAlerts } from 'src/composables/v36/useLiveAlerts';
import { useV36SseState } from 'src/composables/v36/useV36SseRefresh';
import { ROUTE_NAMES } from 'src/router/route-names';

import {
  formatDate,
  formatNullableScore,
  formatNumber,
  riskLevelDisplay,
  riskTone,
  sourceInfoBanner,
} from 'src/utils/format';

const router = useRouter();
const { t } = useI18n();
const { connected: sseConnected, connecting: sseConnecting, lastEventAt: sseLastEventAt } = useV36SseState();
const {
  params,
  items,
  criticalItems,
  loading,
  error,
  refresh,
  nextPage,
  previousPage,
  setPageSize,
  lastUpdated,
  source,
  warnings,
  count,
  hasMore,
  limit,
  currentOffset,
  currentPage,
  totalPages,
} = useLiveAlerts();

const sourceBannerInfo = computed(() => sourceInfoBanner(source.value));
const sourceBanner = computed(() => sourceBannerInfo.value?.message ?? '');
const sourceBannerClass = computed(() => {
  const type = sourceBannerInfo.value?.type;
  if (type === 'warning') return 'neo-v36-alert-warning';
  if (type === 'info') return 'neo-v36-info';
  return '';
});
const sourceBannerIcon = computed(() => {
  const type = sourceBannerInfo.value?.type;
  if (type === 'warning') return 'warning';
  if (type === 'info') return 'info';
  return '';
});

const riskOptions = [
  { label: 'All', value: null },
  ...['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map((value) => ({ label: value, value })),
];

const activeFilterLabel = computed(() => params.value.riskLevel ?? 'ALL');

const emptyMessage = computed(() => {
  const filter = activeFilterLabel.value;
  if (filter !== 'ALL') return t('v36.alerts.noFilteredAlerts', { filter });
  return t('v36.common.noData');
});

const applyFilters = () => {
  params.value = {
    ...params.value,
    offset: 0,
  };
  void refresh();
};

const openInvestigation = async (eventId: string | undefined) => {
  if (!eventId) return;
  await router.push({ name: ROUTE_NAMES.ALERT_INVESTIGATION, params: { eventId } });
};

const openUser = async (insuredId: string) => {
  await router.push({ name: ROUTE_NAMES.USER_360_DETAIL, params: { insuredId } });
};

const handleAlertsRefresh = () => {
  void refresh();
};

const handleFilterAlertsRisk = (event: Event) => {
  const detail = (event as CustomEvent).detail;
  if (detail?.value) {
    params.value = { ...params.value, riskLevel: detail.value, offset: 0 };
    void refresh();
  }
};

const handleFilterAlertsInsuredId = (event: Event) => {
  const detail = (event as CustomEvent).detail;
  if (detail?.value != null) {
    params.value = { ...params.value, insuredId: detail.value, offset: 0 };
    void refresh();
  }
};

const handleFilterAlertsSessionId = (event: Event) => {
  const detail = (event as CustomEvent).detail;
  if (detail?.value != null) {
    params.value = { ...params.value, sessionId: detail.value, offset: 0 };
    void refresh();
  }
};

const handleFilterAlertsAnomalyType = (event: Event) => {
  const detail = (event as CustomEvent).detail;
  if (detail?.value != null) {
    params.value = { ...params.value, anomalyType: detail.value, offset: 0 };
    void refresh();
  }
};

const handleFilterAlertsDateFrom = (event: Event) => {
  const detail = (event as CustomEvent).detail;
  if (detail?.value != null) {
    params.value = { ...params.value, from: detail.value, offset: 0 };
    void refresh();
  }
};

const handleFilterAlertsDateTo = (event: Event) => {
  const detail = (event as CustomEvent).detail;
  if (detail?.value != null) {
    params.value = { ...params.value, to: detail.value, offset: 0 };
    void refresh();
  }
};

onMounted(() => {
  document.addEventListener(ASSISTANT_REFRESH_ALERTS_EVENT, handleAlertsRefresh);
  window.addEventListener('assistant:filter-alerts-risk', handleFilterAlertsRisk);
  window.addEventListener('assistant:filter-alerts-insured-id', handleFilterAlertsInsuredId);
  window.addEventListener('assistant:filter-alerts-session-id', handleFilterAlertsSessionId);
  window.addEventListener('assistant:filter-alerts-anomaly-type', handleFilterAlertsAnomalyType);
  window.addEventListener('assistant:filter-alerts-date-from', handleFilterAlertsDateFrom);
  window.addEventListener('assistant:filter-alerts-date-to', handleFilterAlertsDateTo);
});

onBeforeUnmount(() => {
  document.removeEventListener(ASSISTANT_REFRESH_ALERTS_EVENT, handleAlertsRefresh);
  window.removeEventListener('assistant:filter-alerts-risk', handleFilterAlertsRisk);
  window.removeEventListener('assistant:filter-alerts-insured-id', handleFilterAlertsInsuredId);
  window.removeEventListener('assistant:filter-alerts-session-id', handleFilterAlertsSessionId);
  window.removeEventListener('assistant:filter-alerts-anomaly-type', handleFilterAlertsAnomalyType);
  window.removeEventListener('assistant:filter-alerts-date-from', handleFilterAlertsDateFrom);
  window.removeEventListener('assistant:filter-alerts-date-to', handleFilterAlertsDateTo);
});
</script>

// ---- Styles ----
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
  border: 1px solid rgba(251, 191, 36, 0.28);
  border-radius: var(--neo-radius-card);
  background: var(--neo-warning-bg);
  color: var(--neo-warning-contrast);
}

.neo-v36-pagination {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: var(--neo-space-4);
  margin-top: var(--neo-space-4);
  color: var(--neo-ink-muted);
  font-size: 13px;
  flex-wrap: wrap;
}

.neo-v36-rows-per-page {
  display: flex;
  align-items: center;
  gap: 6px;
  white-space: nowrap;
}

.neo-v36-page-info {
  white-space: nowrap;
}

.neo-v36-page-nav {
  display: flex;
  align-items: center;
  gap: 4px;
}

.neo-v36-row-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}

@media (max-width: 720px) {
  .neo-v36-pagination {
    justify-content: stretch;
    flex-direction: column;
    align-items: stretch;
  }
}
</style>
