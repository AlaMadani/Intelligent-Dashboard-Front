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
          <LiveConnectionBadge
            :connected="sseConnected"
            :connecting="sseConnecting"
            :last-event-at="sseLastEventAt"
          />
          <div v-if="source" class="neo-analytics-chip">{{ t('v36.common.source') }}: {{ source }}</div>
          <ai-explain-button context-key="alerts-feed" variant="prominent" />
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
              <td colspan="8">{{ t('v36.common.noData') }}</td>
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
        <q-btn flat icon="chevron_left" :label="t('v36.common.previous')" :disable="(params.offset ?? 0) <= 0" @click="previousPage" />
        <span>{{ t('v36.alerts.offsetLabel', { offset: params.offset ?? 0, limit: params.limit ?? 50 }) }}</span>
        <q-btn flat icon-right="chevron_right" :label="t('v36.common.next')" :disable="!hasMore" @click="nextPage" />
      </div>
    </section>
  </q-page>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import InfoTooltip from 'src/components/common/InfoTooltip.vue';
import LoadingOverlay from 'src/components/loading/LoadingOverlay.vue';
import AiExplainButton from 'src/components/ai/AiExplainButton.vue';
import LiveConnectionBadge from 'src/components/common/LiveConnectionBadge.vue';
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
  lastUpdated,
  source,
  warnings,
  count,
  hasMore,
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
  border: 1px solid rgba(251, 191, 36, 0.28);
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
