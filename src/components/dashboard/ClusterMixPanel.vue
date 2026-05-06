<template>
  <article v-if="!flat" class="neo-analytics-panel">
    <div class="neo-analytics-head">
      <div>
        <h3>{{ t('clusterMixPanel.title') }}</h3>
        <p>{{ t('clusterMixPanel.subtitle') }}</p>
      </div>
      <div class="neo-analytics-chip">
        {{ t('common.clusters', { count: segments.length }) }}
      </div>
    </div>
    <DonutBreakdownChart
      :segments="segments"
      :center-label="t('clusterMixPanel.centerLabel')"
      :center-value="totalUsers.toString()"
    />
  </article>
  <DonutBreakdownChart v-else
    :segments="segments"
    :center-label="t('clusterMixPanel.centerLabel')"
    :center-value="totalUsers.toString()"
  />
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import DonutBreakdownChart from 'src/components/dashboard/DonutBreakdownChart.vue';
import type { StatsSummaryDto } from 'src/types/analytics';
import { formatNumber } from 'src/utils/format';

const props = defineProps<{
  data: Array<Record<string, unknown>> | null;
  statsSummary?: StatsSummaryDto | null;
  flat?: boolean;
}>();

const { t } = useI18n();

const CLUSTER_COLORS: Record<number, string> = {
  0: '#2f8f83',
  1: '#e3a548',
  2: '#cf5d4a',
  3: '#617ca8',
  4: '#78b385',
  5: '#9b78c7',
  6: '#4aa8cf',
  7: '#c7789f',
};

const toNumber = (value: unknown) => {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isNaN(parsed) ? null : parsed;
  }
  return null;
};

const normalizeShare = (value: number) => (value <= 1 ? value * 100 : value);

const normalizedClusters = computed(() => {
  const raw = props.data?.length ? props.data : buildFallbackClusters(props.statsSummary);
  if (!raw?.length) return [];
  return raw.map((item, index) => {
    const clusterId =
      toNumber(item.cluster_id) ??
      toNumber(item.clusterId) ??
      toNumber(item.cluster) ??
      toNumber(item.persona_cluster) ??
      toNumber(item.personaCluster) ??
      index;
    const value = normalizeShare(
      toNumber(item.traffic_share) ??
        toNumber(item.trafficShare) ??
        toNumber(item.share) ??
        toNumber(item.percentage) ??
        toNumber(item.count) ??
        toNumber(item.user_count) ??
        toNumber(item.userCount) ??
        toNumber(item.session_count) ??
        toNumber(item.sessionCount) ??
        0,
    );

    const label =
      (item.label as string) ||
      clusterName(clusterId) ||
      t('clusterMixPanel.clusterFallback', { id: clusterId });
    const color = CLUSTER_COLORS[clusterId] ?? '#666';
    const display = typeof item.display === 'string' ? item.display : formatNumber(value);
    const count = toNumber(item.count) ?? toNumber(item.user_count) ?? toNumber(item.userCount) ?? toNumber(item.session_count) ?? toNumber(item.sessionCount) ?? null;
    return { clusterId, value, label, color, item, count, display };
  });
});

const totalUsers = computed(() => {
  if (!normalizedClusters.value.length) return '0';

  const hasCounts = normalizedClusters.value.every((item) => item.count != null);
  if (hasCounts) {
    const total = normalizedClusters.value.reduce((sum, item) => sum + (item.count ?? 0), 0);
    return Math.round(total).toString();
  }

  const totalShare = normalizedClusters.value.reduce((sum, item) => sum + item.value, 0);
  return `${Math.round(totalShare)}%`;
});

const segments = computed(() =>
  normalizedClusters.value.map(({ label, value, display, color }) => ({
    label,
    value,
    display,
    color,
  })),
);

const buildFallbackClusters = (summary: StatsSummaryDto | null | undefined): Array<Record<string, unknown>> => {
  if (!summary?.sessionsByPersonaCluster) return [];
  return Object.entries(summary.sessionsByPersonaCluster).map(([clusterId, count]) => ({
    cluster_id: Number(clusterId),
    count,
  }));
};

const clusterName = (clusterId: number) => {
  switch (clusterId) {
    case 0:
      return t('clusterMixPanel.names.selfService');
    case 1:
      return t('clusterMixPanel.names.aggressiveDownloader');
    case 2:
      return t('clusterMixPanel.names.accountSwitcher');
    case 3:
      return t('clusterMixPanel.names.zombieSession');
    default:
      return null;
  }
};
</script>

<style scoped>
/* Any custom styles here if needed */
</style>
