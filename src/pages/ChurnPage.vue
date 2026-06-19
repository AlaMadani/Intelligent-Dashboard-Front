<template>
  <q-page class="neo-page neo-loading-scope">
    <loading-overlay :show="loading" context="fetch" />
    <section class="neo-section">
      <div class="neo-section-header">
        <div>
          <div class="neo-kicker">{{ t('v36.common.schema') }}</div>
          <h1 class="neo-section-title">{{ t('v36.churn.title') }}</h1>
          <p class="neo-section-subtitle">{{ t('v36.churn.subtitle') }}</p>
        </div>
        <div class="neo-section-actions">
          <LiveConnectionBadge
            :connected="sseConnected"
            :connecting="sseConnecting"
            :last-event-at="sseLastEventAt"
          />
          <div v-if="source" class="neo-analytics-chip">{{ t('v36.common.source') }}: {{ source }}</div>
          <ai-explain-button context-key="churn-dashboard" variant="prominent" />
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
            <h3>{{ t('v36.churn.distribution') }} <InfoTooltip :text="t('v36.help.churn.distribution')" /></h3>
            <p>{{ t('v36.churn.distributionSubtitle') }}</p>
          </div>
          
        </div>
        <donut-breakdown-chart
          :segments="distributionSegments"
          :center-label="t('v36.churn.users')"
          :center-value="formatNumber(data?.totalUsers)"
        />
      </article>

      <article class="neo-analytics-panel neo-v36-wide">
        <div class="neo-analytics-head">
          <div>
            <h3>{{ t('v36.churn.topUsers') }} <InfoTooltip :text="t('v36.help.churn.topUsers')" /></h3>
            <p>{{ t('v36.churn.topUsersSubtitle') }}</p>
          </div>
          <div class="neo-section-actions">
            
            <q-select
            v-model="params.riskLevel"
            dense
            outlined
            clearable
            emit-value
            map-options
            :options="riskOptions"
            :label="t('v36.common.riskLevel')"
            @update:model-value="applyFilter"
          />
          </div>
        </div>

          <div class="neo-table-wrapper">
          <table class="neo-table">
            <thead>
              <tr>
                <th>{{ t('v36.common.insuredId') }}</th>
                <th>{{ t('v36.churn.churnProbability') }} <InfoTooltip :text="t('v36.help.user360.churnProbability')" /></th>
                <th>{{ t('v36.common.riskLevel') }} <InfoTooltip :text="t('v36.help.alerts.riskLevel')" /></th>
                <th>{{ t('v36.user360.averageRiskLast30d') }} <InfoTooltip :text="t('v36.help.user360.averageRiskLast30d')" /></th>
                <th>{{ t('v36.user360.alertCountLast30d') }} <InfoTooltip :text="t('v36.help.user360.alertCountLast30d')" /></th>
                <th>{{ t('v36.common.action') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="!userItems.length">
                <td colspan="6">{{ t('v36.common.noData') }}</td>
              </tr>
              <tr v-for="user in userItems" :key="user.insuredId">
                <td>{{ user.insuredId ?? t('common.notAvailable') }}</td>
                <td>{{ formatPercent(user.churnProbability, 1) }}</td>
                <td><q-badge :color="riskTone(user.churnRiskLevel)" rounded>{{ user.churnRiskLevel ?? t('common.unknown') }}</q-badge></td>
                <td>{{ formatNullableScore(user.averageRiskScore) }}</td>
                <td>{{ formatNumber(user.alertCount) }}</td>
                <td>
                  <div class="neo-v36-row-actions">
                    <ai-explain-button
                      v-if="user.insuredId"
                      context-key="churn-user-row"
                      variant="compact"
                      :params="{
                        insuredId: user.insuredId,
                        riskLevel: user.churnRiskLevel,
                        probability: formatPercent(user.churnProbability, 1),
                        averageRisk: formatNullableScore(user.averageRiskScore),
                        alertCount: formatNumber(user.alertCount),
                      }"
                    />
                    <q-btn
                      flat
                      icon="person_search"
                      :disable="!user.insuredId"
                      class="neo-v36-user-btn"
                      @click="openUser(user.insuredId)"
                    >
                      <q-tooltip>{{ t('v36.user360.openUser360') }}</q-tooltip>
                    </q-btn>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="neo-v36-pagination">
          <q-btn flat icon="chevron_left" :label="t('v36.common.previous')" :disable="(params.offset ?? 0) <= 0" @click="previousPage" />
          <span>{{ t('v36.alerts.offsetLabel', { offset: params.offset ?? 0, limit: params.limit ?? 20 }) }}</span>
          <q-btn flat icon-right="chevron_right" :label="t('v36.common.next')" :disable="!hasMore" @click="nextPage" />
        </div>
      </article>
    </section>
  </q-page>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import InfoTooltip from 'src/components/common/InfoTooltip.vue';
import DonutBreakdownChart from 'src/components/dashboard/DonutBreakdownChart.vue';
import AiExplainButton from 'src/components/ai/AiExplainButton.vue';
import LiveConnectionBadge from 'src/components/common/LiveConnectionBadge.vue';
import LoadingOverlay from 'src/components/loading/LoadingOverlay.vue';
import { useChurnDashboard } from 'src/composables/v36/useChurnDashboard';
import { useV36SseState } from 'src/composables/v36/useV36SseRefresh';
import { ROUTE_NAMES } from 'src/router/route-names';
import {
  formatNullableScore,
  formatNumber,
  formatPercent,
  riskTone,
  sourceInfoBanner,
} from 'src/utils/format';

const { connected: sseConnected, connecting: sseConnecting, lastEventAt: sseLastEventAt } = useV36SseState();
const router = useRouter();
const { t } = useI18n();
const { data, userItems, hasMore, params, loading, error, refresh, nextPage, previousPage, source, warnings } =
  useChurnDashboard();

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

const metrics = computed(() => [
  {
    label: t('v36.churn.totalUsers'),
    value: formatNumber(data.value?.totalUsers),
    meta: t('v36.churn.totalUsersMeta'),
    help: t('v36.help.churn.totalUsers'),
  },
  {
    label: t('v36.churn.highRiskUsers'),
    value: formatNumber(data.value?.highChurnRiskUsers),
    meta: t('common.high'),
    help: t('v36.help.churn.highRiskUsers'),
  },
  {
    label: t('v36.churn.mediumRiskUsers'),
    value: formatNumber(data.value?.mediumChurnRiskUsers),
    meta: t('common.medium'),
    help: t('v36.help.churn.mediumRiskUsers'),
  },
  {
    label: t('v36.churn.lowRiskUsers'),
    value: formatNumber(data.value?.lowChurnRiskUsers),
    meta: t('common.low'),
    help: t('v36.help.churn.lowRiskUsers'),
  },
  {
    label: t('v36.churn.averageProbability'),
    value: formatPercent(data.value?.averageChurnProbability, 1),
    meta: 'ExtraTrees',
    help: t('v36.help.churn.averageProbability'),
  },
]);

const riskOptions = ['HIGH', 'MEDIUM', 'LOW'].map((value) => ({ label: value, value }));

const distributionSegments = computed(() =>
  Object.entries(data.value?.churnRiskDistribution ?? {}).map(([label, value]) => ({
    label,
    value,
    color:
      label.toUpperCase() === 'HIGH'
        ? '#ef4444'
        : label.toUpperCase() === 'MEDIUM'
          ? '#fbbf24'
          : '#34d399',
  })),
);

const applyFilter = () => {
  params.value = { ...params.value, offset: 0 };
  void refresh();
};

const openUser = async (insuredId: string | undefined) => {
  if (!insuredId) return;
  await router.push({ name: ROUTE_NAMES.USER_360_DETAIL, params: { insuredId } });
};
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
  grid-template-columns: 1fr 1fr;
  align-items: stretch;
}

.neo-v36-grid > .neo-analytics-panel {
  display: flex;
  flex-direction: column;
}

.neo-v36-grid > .neo-analytics-panel :deep(.donut-breakdown-chart) {
  flex: 1;
  min-height: 0;
}

.neo-v36-grid > .neo-v36-wide {
  grid-column: 2;
}

.neo-v36-grid > .neo-v36-wide .neo-table-wrapper {
  max-height: 480px;
  overflow-y: auto;
}

.neo-v36-warning {
  margin-top: var(--neo-space-4);
  border: 1px solid rgba(251, 191, 36, 0.28);
  border-radius: var(--neo-radius-card);
  background: var(--neo-warning-bg);
  color: var(--neo-warning-contrast);
}

.neo-v36-row-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}

.neo-v36-user-btn {
  background: var(--neo-accent) !important;
  color: #fff !important;
  border: none;
  border-radius: 8px;
  height: 28px;
  min-width: 28px;
  padding: 0 10px;
}

.neo-v36-user-btn .q-icon {
  font-size: 14px;
}

.neo-v36-user-btn[disabled] {
  opacity: 0.4;
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

@media (max-width: 1000px) {
  .neo-v36-grid {
    grid-template-columns: 1fr;
  }

  .neo-v36-grid > .neo-analytics-panel,
  .neo-v36-grid > .neo-v36-wide {
    grid-column: auto;
  }

  .neo-v36-grid > .neo-v36-wide .neo-table-wrapper {
    overflow-x: auto;
  }

  .neo-v36-pagination {
    justify-content: stretch;
    flex-direction: column;
    align-items: stretch;
  }
}
</style>
