<template>
  <div class="neo-forecast-card">
    <div class="neo-forecast-head">
      <h3>Trend forecasting</h3>
      <p>Forecast, trend baseline, and expected confidence bounds.</p>
    </div>

    <div v-if="!resolvedTrendStats" class="neo-empty">
      No trend stats received
    </div>

    <div v-else-if="!points.length" class="neo-empty">
      Trend stats received, but payload is empty
    </div>

    <VChart v-else :option="option" autoresize class="neo-forecast-chart" />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import VChart from 'vue-echarts';
import { use } from 'echarts/core';
import { CanvasRenderer } from 'echarts/renderers';
import { LineChart, ScatterChart } from 'echarts/charts';
import { GridComponent, LegendComponent, TooltipComponent } from 'echarts/components';
import type { StatsResponseDto } from 'src/types/analytics';

use([CanvasRenderer, LineChart, ScatterChart, GridComponent, LegendComponent, TooltipComponent]);

interface ForecastPoint {
  label: string;
  forecast: number | null;
  trend: number | null;
  lower: number | null;
  upper: number | null;
}

const props = defineProps<{
  trendStats: unknown;
  liveValue?: number | null;
}>();

const isStatsDto = (value: unknown): value is StatsResponseDto => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const record = value as Record<string, unknown>;
  return 'date' in record && 'source' in record && 'payload' in record;
};

const unwrapTrendStats = (value: unknown): StatsResponseDto | null => {
  if (isStatsDto(value)) return value;

  if (value && typeof value === 'object' && !Array.isArray(value)) {
    const record = value as Record<string, unknown>;
    if (isStatsDto(record.data)) {
      return record.data;
    }
  }

  return null;
};

const resolvedTrendStats = computed<StatsResponseDto | null>(() =>
  unwrapTrendStats(props.trendStats),
);

const toNumber = (value: unknown) => {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isNaN(parsed) ? null : parsed;
  }
  return null;
};

const forecastRows = (payload: unknown) => {
  if (Array.isArray(payload)) return payload;

  if (!payload || typeof payload !== 'object') return [];

  const record = payload as Record<string, unknown>;

  const direct =
    record.total_events &&
    typeof record.total_events === 'object' &&
    !Array.isArray(record.total_events)
      ? (record.total_events as Record<string, unknown>).points
      : null;

  if (Array.isArray(direct)) return direct;

  const wrappedItems =
    record.items &&
    typeof record.items === 'object' &&
    !Array.isArray(record.items)
      ? (record.items as Record<string, unknown>).total_events
      : null;

  const wrappedPoints =
    wrappedItems &&
    typeof wrappedItems === 'object' &&
    !Array.isArray(wrappedItems)
      ? (wrappedItems as Record<string, unknown>).points
      : null;

  return Array.isArray(wrappedPoints) ? wrappedPoints : [];
};

const points = computed<ForecastPoint[]>(() => {
  const payload = resolvedTrendStats.value?.payload;
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

      const forecast = toNumber(row.yhat) ?? null;
      const trend = toNumber(row.trend) ?? null;

      const lower =
        toNumber(row.yhatLower) ??
        toNumber(row.yhat_lower) ??
        toNumber(row.lower) ??
        null;

      const upper =
        toNumber(row.yhatUpper) ??
        toNumber(row.yhat_upper) ??
        toNumber(row.upper) ??
        null;

      return { label, forecast, trend, lower, upper };
    })
    .filter((item): item is ForecastPoint => item != null)
    .slice(-48);
});

const lowerBase = computed(() => points.value.map((point) => point.lower));

const bandRange = computed(() =>
  points.value.map((point) => {
    if (point.lower == null || point.upper == null) return null;
    return point.upper - point.lower;
  }),
);

// One highlighted marker only on the last point
const currentLiveMarker = computed(() => {
  if (!points.value.length || props.liveValue == null) {
    return [];
  }

  const data = new Array(points.value.length).fill(null);
  data[data.length - 1] = props.liveValue;
  return data;
});

const option = computed(() => ({
  backgroundColor: 'transparent',
  tooltip: {
    trigger: 'axis',
  },
  legend: {
    textStyle: { color: '#CBD5E1' },
    top: 0,
  },
  grid: { left: 42, right: 20, top: 40, bottom: 24 },
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
    // Invisible lower base for stacked confidence band
    {
      name: 'Lower base',
      type: 'line',
      data: lowerBase.value,
      stack: 'confidence-band',
      symbol: 'none',
      lineStyle: { opacity: 0 },
      itemStyle: { opacity: 0 },
      emphasis: { disabled: true },
      tooltip: { show: false },
    },

    // Confidence band = upper - lower
    {
      name: 'Confidence band',
      type: 'line',
      data: bandRange.value,
      stack: 'confidence-band',
      symbol: 'none',
      lineStyle: { opacity: 0 },
      itemStyle: { opacity: 0 },
      areaStyle: { color: 'rgba(100, 116, 139, 0.18)' },
      emphasis: { disabled: true },
    },

    // Visible upper line
    {
      name: 'Upper bound',
      type: 'line',
      data: points.value.map((point) => point.upper),
      symbol: 'none',
      lineStyle: { width: 1, color: '#94A3B8' },
      itemStyle: { color: '#94A3B8' },
    },

    // Visible lower line
    {
      name: 'Lower bound',
      type: 'line',
      data: points.value.map((point) => point.lower),
      symbol: 'none',
      lineStyle: { width: 1, color: '#64748B' },
      itemStyle: { color: '#64748B' },
    },

    // Forecast
    {
      name: 'Forecast',
      type: 'line',
      data: points.value.map((point) => point.forecast),
      smooth: true,
      symbol: 'circle',
      symbolSize: 4,
      lineStyle: { width: 2, color: '#22C55E' },
      itemStyle: { color: '#22C55E' },
    },

    // Trend
    {
      name: 'Trend',
      type: 'line',
      data: points.value.map((point) => point.trend),
      smooth: true,
      symbol: 'none',
      lineStyle: { width: 2, color: '#F59E0B', type: 'dashed' },
      itemStyle: { color: '#F59E0B' },
    },

    // Current live value marker only
    {
      name: 'Current live',
      type: 'scatter',
      data: currentLiveMarker.value,
      symbolSize: 10,
      itemStyle: {
        color: '#38BDF8',
        borderColor: '#E0F2FE',
        borderWidth: 2,
      },
      z: 10,
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

.neo-empty {
  margin-top: 14px;
  padding: 18px;
  border-radius: 12px;
  background: rgba(15, 23, 42, 0.45);
  color: #cbd5e1;
  font-size: 14px;
}
</style>
