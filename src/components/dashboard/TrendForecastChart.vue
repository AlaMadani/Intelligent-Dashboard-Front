<template>
  <div class="neo-forecast-card">
    <div class="neo-forecast-head">
      <h3>Trend forecasting</h3>
      <p>Live traffic against Prophet expected bounds.</p>
    </div>
    <VChart :option="option" autoresize class="neo-forecast-chart" />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import VChart from 'vue-echarts';
import { use } from 'echarts/core';
import { CanvasRenderer } from 'echarts/renderers';
import { LineChart } from 'echarts/charts';
import { GridComponent, LegendComponent, TooltipComponent } from 'echarts/components';
import type { StatsResponseDto } from 'src/types/analytics';

use([CanvasRenderer, LineChart, GridComponent, LegendComponent, TooltipComponent]);

interface ForecastPoint {
  label: string;
  live: number | null;
  lower: number | null;
  upper: number | null;
}

const props = defineProps<{
  trendStats: StatsResponseDto | null;
  liveValue?: number | null;
}>();

const toNumber = (value: unknown) => {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isNaN(parsed) ? null : parsed;
  }
  return null;
};

const forecastRows = (payload: unknown) => {
  if (Array.isArray(payload)) {
    return payload;
  }
  if (!payload || typeof payload !== 'object') {
    return [];
  }
  const record = payload as Record<string, unknown>;
  const direct =
    record.total_events &&
    typeof record.total_events === 'object' &&
    !Array.isArray(record.total_events)
      ? (record.total_events as Record<string, unknown>).points
      : null;
  if (Array.isArray(direct)) {
    return direct;
  }
  const wrappedItems =
    record.items && typeof record.items === 'object' && !Array.isArray(record.items)
      ? (record.items as Record<string, unknown>).total_events
      : null;
  const wrappedPoints =
    wrappedItems && typeof wrappedItems === 'object' && !Array.isArray(wrappedItems)
      ? (wrappedItems as Record<string, unknown>).points
      : null;
  return Array.isArray(wrappedPoints) ? wrappedPoints : [];
};

const points = computed<ForecastPoint[]>(() => {
  const payload = props.trendStats?.payload;
  const rows = forecastRows(payload);
  if (!rows.length) return [];

  return rows
    .map((item, index) => {
      if (!item || typeof item !== 'object' || Array.isArray(item)) return null;
      const row = item as Record<string, unknown>;
      const label =
        (typeof row.ds === 'string' && row.ds) ||
        (typeof row.timestamp === 'string' && row.timestamp) ||
        `P${index + 1}`;
      const live = toNumber(row.y) ?? toNumber(row.actual) ?? null;
      const lower = toNumber(row.yhatLower) ?? toNumber(row.yhat_lower) ?? toNumber(row.lower) ?? null;
      const upper = toNumber(row.yhatUpper) ?? toNumber(row.yhat_upper) ?? toNumber(row.upper) ?? null;
      return { label, live, lower, upper };
    })
    .filter((item): item is ForecastPoint => item != null)
    .slice(-48);
});

const computedLive = computed(() => {
  if (!points.value.length) return [];
  return points.value.map((point, index) => {
    if (index === points.value.length - 1 && props.liveValue != null) return props.liveValue;
    return point.live;
  });
});

const outOfBoundsSegments = computed(() =>
  points.value.map((point, index) => {
    const value = computedLive.value[index];
    if (value == null || point.lower == null || point.upper == null) return 0;
    return value < point.lower || value > point.upper ? value : 0;
  }),
);

const option = computed(() => ({
  backgroundColor: 'transparent',
  tooltip: { trigger: 'axis' },
  legend: { textStyle: { color: '#CBD5E1' } },
  grid: { left: 42, right: 20, top: 30, bottom: 24 },
  xAxis: {
    type: 'category',
    data: points.value.map((point) => point.label),
    axisLabel: { color: '#94A3B8', hideOverlap: true },
    axisLine: { lineStyle: { color: '#334155' } },
  },
  yAxis: {
    type: 'value',
    axisLabel: { color: '#94A3B8' },
    splitLine: { lineStyle: { color: 'rgba(148, 163, 184, 0.2)' } },
  },
  series: [
    {
      name: 'Upper bound',
      type: 'line',
      data: points.value.map((point) => point.upper),
      lineStyle: { width: 1, color: '#64748B' },
      symbol: 'none',
      areaStyle: { color: 'rgba(71, 85, 105, 0.18)' },
      stack: 'bounds',
    },
    {
      name: 'Lower bound',
      type: 'line',
      data: points.value.map((point) => point.lower),
      lineStyle: { width: 1, color: '#64748B' },
      symbol: 'none',
      areaStyle: { color: 'rgba(15, 23, 42, 0.0)' },
      stack: 'bounds',
    },
    {
      name: 'Live traffic',
      type: 'line',
      data: computedLive.value,
      smooth: true,
      symbol: 'circle',
      symbolSize: 5,
      lineStyle: { width: 2, color: '#22C55E' },
      itemStyle: { color: '#22C55E' },
    },
    {
      name: 'Out of bounds',
      type: 'line',
      data: outOfBoundsSegments.value,
      smooth: true,
      symbol: 'none',
      lineStyle: { width: 3, color: '#DC2626' },
      z: 6,
    },
  ],
}));
</script>

<style scoped>
.neo-forecast-card {
  padding: 22px;
  border-radius: 24px;
  background: #0f172a;
  border: 1px solid rgba(148, 163, 184, 0.18);
}

.neo-forecast-head h3 {
  margin: 0;
  color: #f8fafc;
  font-size: 18px;
}

.neo-forecast-head p {
  margin: 4px 0 0;
  color: #94a3b8;
  font-size: 13px;
}

.neo-forecast-chart {
  margin-top: 14px;
  height: 320px;
}
</style>
