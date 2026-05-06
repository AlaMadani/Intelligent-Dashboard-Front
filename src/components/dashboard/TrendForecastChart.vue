<template>
  <div class="neo-forecast-card">
    <div class="neo-forecast-head">
      <div>
        <h3>{{ t('trendForecastChart.title') }}</h3>
        <p>{{ t('trendForecastChart.subtitle') }}</p>
      </div>
      <div class="neo-forecast-controls">
        <q-btn
          v-for="s in availableSeries"
          :key="s.key"
          dense
          flat
          size="12px"
          :class="['neo-series-btn', { 'neo-series-btn--active': selectedSeries === s.key }]"
          @click="selectedSeries = s.key;"
        >
          {{ s.label }}
        </q-btn>
      </div>
      <q-icon name="help_outline" class="neo-forecast-hint">
        <q-tooltip anchor="top middle" self="bottom middle" :offset="[0, 8]">
          {{ t('trendForecastChart.help') }}
        </q-tooltip>
      </q-icon>
    </div>

    <div v-if="!resolvedTrendStats" class="neo-empty">{{ t('trendForecastChart.noStats') }}</div>
    <div v-else-if="!points.length" class="neo-empty">{{ t('trendForecastChart.emptyPayload') }}</div>
    <VChart v-else :option="option" autoresize class="neo-forecast-chart" />
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import VChart from 'vue-echarts';
import { use } from 'echarts/core';
import { CanvasRenderer } from 'echarts/renderers';
import { LineChart, ScatterChart } from 'echarts/charts';
import {
  GridComponent,
  LegendComponent,
  TooltipComponent,
  DataZoomComponent,
} from 'echarts/components';
import type { StatsResponseDto } from 'src/types/analytics';
import type { ForecastPoint, ForecastSeries } from 'src/models/chart';
import { formatNumber } from 'src/utils/format';

use([
  CanvasRenderer,
  LineChart,
  ScatterChart,
  GridComponent,
  LegendComponent,
  TooltipComponent,
  DataZoomComponent,
]);

const { t } = useI18n();

const props = defineProps<{
  trendStats: unknown;
  liveValue?: number | null;
}>();

const availableSeries = ref<{ key: string; label: string }[]>([
  { key: 'total_events', label: t('trendForecastChart.eventsSeries') },
]);

const selectedSeries = ref('total_events');

const isStatsDto = (value: unknown): value is StatsResponseDto => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const record = value as Record<string, unknown>;
  return 'date' in record && 'source' in record && 'payload' in record;
};

const unwrapTrendStats = (value: unknown): StatsResponseDto | null => {
  if (isStatsDto(value)) return value;
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    const record = value as Record<string, unknown>;
    if (isStatsDto(record.data)) return record.data;
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

const parsePoints = (rows: unknown[]): ForecastPoint[] =>
  rows
    .map((item, index) => {
      if (!item || typeof item !== 'object' || Array.isArray(item)) return null;
      const row = item as Record<string, unknown>;
      const label =
        (typeof row.ds === 'string' && row.ds) ||
        (typeof row.timestamp === 'string' && row.timestamp) ||
        t('trendForecastChart.pointFallback', { index: index + 1 });
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
    .filter((item): item is ForecastPoint => item != null);

const seriesMap = computed(() => {
  const payload = resolvedTrendStats.value?.payload;
  if (!payload || typeof payload !== 'object') return new Map<string, ForecastSeries>();
  const record = payload as Record<string, unknown>;

  const map = new Map<string, ForecastSeries>();

  const items =
    record.items && typeof record.items === 'object' && !Array.isArray(record.items)
      ? (record.items as Record<string, unknown>)
      : record;

  for (const [key, value] of Object.entries(items)) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) continue;
    const item = value as Record<string, unknown>;
    const rows = Array.isArray(item.points) ? item.points : [];
    if (!rows.length) continue;
    const label =
      typeof item.label === 'string' && item.label.trim() ? item.label : key.replace(/_/g, ' ');
    map.set(key, { key, label, points: parsePoints(rows) });
  }

  return map;
});

const computeSeriesItems = (payload: unknown): [string, string][] => {
  if (!payload || typeof payload !== 'object') return [];
  const record = payload as Record<string, unknown>;
  const items =
    record.items && typeof record.items === 'object' && !Array.isArray(record.items)
      ? (record.items as Record<string, unknown>)
      : record;
  const result: [string, string][] = [];
  for (const [key, value] of Object.entries(items)) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) continue;
    const item = value as Record<string, unknown>;
    if (!Array.isArray(item.points)) continue;
    const label =
      typeof item.label === 'string' && item.label.trim() ? item.label : key.replace(/_/g, ' ');
    result.push([key, label]);
  }
  return result;
};

watch(
  () => resolvedTrendStats.value?.payload,
  (payload) => {
    const entries = computeSeriesItems(payload);
    if (!entries.length) return;
    const updated = new Map(availableSeries.value.map((s) => [s.key, s.label]));
    for (const [key, label] of entries) {
      if (!updated.has(key)) {
        updated.set(key, label);
      }
    }
    availableSeries.value = Array.from(updated.entries()).map(([k, l]) => ({
      key: k,
      label: l,
    }));
    if (!updated.has(selectedSeries.value)) {
      selectedSeries.value = entries[0]![0];
    }
  },
  { immediate: true },
);

const points = computed<ForecastPoint[]>(() => {
  return seriesMap.value.get(selectedSeries.value)?.points ?? [];
});

const dateLabels = computed(() => points.value.map((p) => p.label));

const lowerBase = computed(() => points.value.map((p) => p.lower));

const bandRange = computed(() =>
  points.value.map((p) => (p.lower != null && p.upper != null ? p.upper - p.lower : null)),
);

const currentLiveMarker = computed(() => {
  if (!points.value.length || props.liveValue == null) return [];
  const data = new Array(points.value.length).fill(null);
  data[data.length - 1] = props.liveValue;
  return data;
});

const option = computed(() => ({
  backgroundColor: 'transparent',
  tooltip: {
    trigger: 'axis',
    valueFormatter: (v: number | null) =>
      v != null
        ? formatNumber(v, { minimumFractionDigits: 1, maximumFractionDigits: 1 })
        : '-',
  },
  legend: {
    textStyle: { color: '#CBD5E1', fontSize: 11 },
    top: 0,
    selected: {
      [t('common.lowerBase')]: false,
      [t('common.confidenceBand')]: false,
      [t('common.upperBound')]: false,
      [t('common.lowerBound')]: false,
    },
  },
  grid: { left: 48, right: 20, top: 36, bottom: 52 },
  xAxis: {
    type: 'category',
    data: dateLabels.value,
    axisLabel: { color: '#94A3B8', hideOverlap: true, fontSize: 10, rotate: 30 },
    axisLine: { lineStyle: { color: '#334155' } },
    boundaryGap: false,
  },
  yAxis: {
    type: 'value',
    axisLabel: { color: '#94A3B8', fontSize: 10 },
    splitLine: { lineStyle: { color: 'rgba(148, 163, 184, 0.15)' } },
  },
  dataZoom: [
    {
      type: 'slider',
      height: 20,
      bottom: 8,
      borderColor: '#334155',
      backgroundColor: 'rgba(30, 41, 59, 0.4)',
      fillerColor: 'rgba(34, 197, 94, 0.15)',
      handleStyle: { color: '#22C55E' },
      textStyle: { color: '#94A3B8', fontSize: 10 },
      labelFormatter: (_: number, value: string) => value,
    },
    {
      type: 'inside',
      zoomOnMouseWheel: true,
      moveOnMouseMove: true,
    },
  ],
  series: [
    {
      name: t('common.lowerBase'),
      type: 'line',
      data: lowerBase.value,
      stack: 'confidence-band',
      symbol: 'none',
      lineStyle: { opacity: 0 },
      itemStyle: { opacity: 0 },
      emphasis: { disabled: true },
      tooltip: { show: false },
    },
    {
      name: t('common.confidenceBand'),
      type: 'line',
      data: bandRange.value,
      stack: 'confidence-band',
      symbol: 'none',
      lineStyle: { opacity: 0 },
      itemStyle: { opacity: 0 },
      areaStyle: { color: 'rgba(100, 116, 139, 0.18)' },
      emphasis: { disabled: true },
    },
    {
      name: t('common.upperBound'),
      type: 'line',
      data: points.value.map((p) => p.upper),
      symbol: 'none',
      lineStyle: { width: 1, color: '#94A3B8' },
      itemStyle: { color: '#94A3B8' },
    },
    {
      name: t('common.lowerBound'),
      type: 'line',
      data: points.value.map((p) => p.lower),
      symbol: 'none',
      lineStyle: { width: 1, color: '#64748B' },
      itemStyle: { color: '#64748B' },
    },
    {
      name: t('common.forecast'),
      type: 'line',
      data: points.value.map((p) => p.forecast),
      smooth: true,
      symbol: 'circle',
      symbolSize: 3,
      lineStyle: { width: 2, color: '#22C55E' },
      itemStyle: { color: '#22C55E' },
    },
    {
      name: t('common.trend'),
      type: 'line',
      data: points.value.map((p) => p.trend),
      smooth: true,
      symbol: 'none',
      lineStyle: { width: 1.5, color: '#F59E0B', type: 'dashed' },
      itemStyle: { color: '#F59E0B' },
    },
    {
      name: t('common.currentLive'),
      type: 'scatter',
      data: currentLiveMarker.value,
      symbolSize: 10,
      itemStyle: { color: '#38BDF8', borderColor: '#E0F2FE', borderWidth: 2 },
      z: 10,
    },
  ],
}));
</script>

<style scoped>
.neo-forecast-card {
  padding: 18px;
  border-radius: 22px;
  background: #0f172a;
  border: 1px solid rgba(148, 163, 184, 0.18);
  overflow: hidden;
}
.neo-forecast-head {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}
.neo-forecast-head h3 {
  margin: 0;
  color: #f8fafc;
  font-size: 17px;
}
.neo-forecast-head p {
  margin: 2px 0 0;
  color: #94a3b8;
  font-size: 12px;
  flex: 1;
  min-width: 120px;
}
.neo-forecast-controls {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
}
.neo-series-btn {
  text-transform: none;
  color: #94a3b8;
  border-radius: 6px;
  padding: 2px 8px;
}
.neo-series-btn--active {
  background: rgba(34, 197, 94, 0.15);
  color: #22C55E;
}
.neo-forecast-hint {
  font-size: 14px;
  color: #94a3b8;
  cursor: help;
  opacity: 0.6;
}
.neo-forecast-hint:hover { opacity: 1; }
.neo-forecast-chart {
  margin-top: 10px;
  height: 300px;
  width: 100%;
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
