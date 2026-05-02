<template>
  <article v-if="!flat" class="neo-analytics-panel">
    <div class="neo-analytics-head">
      <div>
        <h3>User Persona Clusters</h3>
        <p>Behaviour segmentation distribution across active sessions</p>
      </div>
      <div class="neo-analytics-chip">
        {{ segments.length }} clusters
      </div>
    </div>
    <DonutBreakdownChart
      :segments="segments"
      center-label="Clusters"
      :center-value="totalUsers.toString()"
    />
  </article>
  <DonutBreakdownChart v-else
    :segments="segments"
    center-label="Clusters"
    :center-value="totalUsers.toString()"
  />
</template>

<script setup lang="ts">
import { computed } from 'vue';
import DonutBreakdownChart from 'src/components/dashboard/DonutBreakdownChart.vue';
import type { StatsSummaryDto } from 'src/types/analytics';

const props = defineProps<{
  data: Array<Record<string, unknown>> | null;
  statsSummary?: StatsSummaryDto | null;
  flat?: boolean;
}>();

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

const CLUSTER_NAMES: Record<number, string> = {
  0: 'High Risk',
  1: 'Normal Explorer',
  2: 'Power User',
  3: 'Quick Visitor',
  4: 'Downloader',
  5: 'Form Filler',
  6: 'Navigator',
  7: 'Idle User',
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
  const rawData = (Array.isArray(props.data) && props.data.length > 0)
    ? props.data
    : buildFallbackClusters(props.statsSummary);

  return rawData.flatMap((item, index) => {
    if (!item || typeof item !== 'object' || Array.isArray(item)) return [];

    const clusterId = toNumber(
      item.cluster_id ??
        item.clusterId ??
        item.cluster ??
        item.persona_cluster ??
        item.personaCluster,
    );
    const share = toNumber(item.traffic_share ?? item.trafficShare ?? item.share ?? item.percentage);
    const count = toNumber(
      item.count ?? item.user_count ?? item.userCount ?? item.session_count ?? item.sessionCount,
    );
    const value = count ?? (share != null ? normalizeShare(share) : null);
    if (value == null) return [];

    const label =
      typeof item.label === 'string' && item.label.trim().length > 0
        ? item.label
        : clusterId != null
          ? CLUSTER_NAMES[clusterId] ?? `Cluster ${clusterId}`
          : `Cluster ${index + 1}`;

    return [
      {
        label,
        value,
        count,
        display: share != null ? `${Math.round(normalizeShare(share))}%` : `${Math.round(value)}`,
        color: clusterId != null ? CLUSTER_COLORS[clusterId] ?? '#666' : '#666',
      },
    ];
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
</script>

<style scoped>
/* Any custom styles here if needed */
</style>
