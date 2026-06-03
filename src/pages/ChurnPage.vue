<template>
  <q-page class="neo-page">
    <section class="neo-section">
      <div class="neo-section-header">
        <div>
          <div class="neo-kicker">{{ t('v36.common.schema') }}</div>
          <h1 class="neo-section-title">{{ t('v36.churn.title') }}</h1>
          <p class="neo-section-subtitle">{{ t('v36.churn.subtitle') }}</p>
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
            <h3>{{ t('v36.churn.distribution') }}</h3>
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
            <h3>{{ t('v36.churn.topUsers') }}</h3>
            <p>{{ t('v36.churn.topUsersSubtitle') }}</p>
          </div>
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

        <div class="neo-table-wrapper">
          <table class="neo-table">
            <thead>
              <tr>
                <th>{{ t('v36.common.insuredId') }}</th>
                <th>{{ t('v36.churn.churnProbability') }}</th>
                <th>{{ t('v36.common.riskLevel') }}</th>
                <th>{{ t('v36.user360.averageRiskLast30d') }}</th>
                <th>{{ t('v36.user360.alertCountLast30d') }}</th>
                <th>{{ t('v36.common.action') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="loading">
                <td colspan="6">{{ t('v36.common.loading') }}</td>
              </tr>
              <tr v-else-if="!userItems.length">
                <td colspan="6">{{ t('v36.common.noData') }}</td>
              </tr>
              <tr v-for="user in userItems" :key="user.insuredId">
                <td>{{ user.insuredId ?? t('common.notAvailable') }}</td>
                <td>{{ formatPercent(user.churnProbability, 1) }}</td>
                <td><q-badge :color="riskTone(user.churnRiskLevel)" rounded>{{ user.churnRiskLevel ?? t('common.unknown') }}</q-badge></td>
                <td>{{ formatNullableScore(user.averageRiskScore) }}</td>
                <td>{{ formatNumber(user.alertCount) }}</td>
                <td>
                  <q-btn
                    dense
                    unelevated
                    color="primary"
                    icon="person_search"
                    :disable="!user.insuredId"
                    :label="t('v36.user360.openUser360')"
                    @click="openUser(user.insuredId)"
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
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import DonutBreakdownChart from 'src/components/dashboard/DonutBreakdownChart.vue';
import { useChurnDashboard } from 'src/composables/v36/useChurnDashboard';
import { ROUTE_NAMES } from 'src/router/route-names';
import {
  formatNullableScore,
  formatNumber,
  formatPercent,
  riskTone,
} from 'src/utils/format';

const router = useRouter();
const { t } = useI18n();
const { data, userItems, params, loading, error, refresh, source, warnings } =
  useChurnDashboard();

const metrics = computed(() => [
  {
    label: t('v36.churn.totalUsers'),
    value: formatNumber(data.value?.totalUsers),
    meta: t('v36.churn.totalUsersMeta'),
  },
  {
    label: t('v36.churn.highRiskUsers'),
    value: formatNumber(data.value?.highChurnRiskUsers),
    meta: t('common.high'),
  },
  {
    label: t('v36.churn.mediumRiskUsers'),
    value: formatNumber(data.value?.mediumChurnRiskUsers),
    meta: t('common.medium'),
  },
  {
    label: t('v36.churn.lowRiskUsers'),
    value: formatNumber(data.value?.lowChurnRiskUsers),
    meta: t('common.low'),
  },
  {
    label: t('v36.churn.averageProbability'),
    value: formatPercent(data.value?.averageChurnProbability, 1),
    meta: 'ExtraTrees',
  },
]);

const riskOptions = ['HIGH', 'MEDIUM', 'LOW'].map((value) => ({ label: value, value }));

const distributionSegments = computed(() =>
  Object.entries(data.value?.churnRiskDistribution ?? {}).map(([label, value]) => ({
    label,
    value,
    color:
      label.toUpperCase() === 'HIGH'
        ? '#b34b3c'
        : label.toUpperCase() === 'MEDIUM'
          ? '#a76518'
          : '#2e7d63',
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
.neo-v36-kpis,
.neo-v36-grid {
  display: grid;
  gap: var(--neo-space-4);
}

.neo-v36-kpis {
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
}

.neo-v36-grid {
  grid-template-columns: repeat(12, minmax(0, 1fr));
}

.neo-v36-grid > .neo-analytics-panel {
  grid-column: span 5;
}

.neo-v36-grid > .neo-v36-wide {
  grid-column: span 7;
}

.neo-v36-warning {
  margin-top: var(--neo-space-4);
  border: 1px solid rgba(167, 101, 24, 0.2);
  border-radius: var(--neo-radius-card);
  background: var(--neo-warning-bg);
  color: var(--neo-warning-contrast);
}

@media (max-width: 1000px) {
  .neo-v36-grid > .neo-analytics-panel,
  .neo-v36-grid > .neo-v36-wide {
    grid-column: 1 / -1;
  }
}
</style>
