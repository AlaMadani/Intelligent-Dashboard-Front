<template>
  <div class="neo-trend-chart" :class="`tone-${tone}`">
    <svg viewBox="0 0 420 240" preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <linearGradient :id="fillId" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" :stop-color="palette.fill" stop-opacity="0.4" />
          <stop offset="100%" :stop-color="palette.fill" stop-opacity="0.04" />
        </linearGradient>
      </defs>

      <g v-if="points.length">
        <g class="neo-trend-grid">
          <line
            v-for="tick in yTicks"
            :key="tick.position"
            :x1="padding.left"
            :x2="chartWidth"
            :y1="tick.position"
            :y2="tick.position"
          />
          <line
            :x1="padding.left"
            :x2="padding.left"
            :y1="padding.top"
            :y2="chartHeight"
            class="neo-trend-axis"
          />
          <line
            :x1="padding.left"
            :x2="chartWidth"
            :y1="chartHeight"
            :y2="chartHeight"
            class="neo-trend-axis"
          />
        </g>

        <g class="neo-trend-y-labels">
          <text
            v-for="tick in yTicks"
            :key="`${tick.position}-${tick.value}`"
            :x="padding.left - 8"
            :y="tick.position + 4"
            text-anchor="end"
          >
            {{ formatValue(tick.value) }}
          </text>
        </g>

        <path v-if="areaPath" :d="areaPath" :fill="`url(#${fillId})`" />
        <path
          v-if="linePath"
          :d="linePath"
          :stroke="palette.stroke"
          stroke-width="4"
          stroke-linecap="round"
          stroke-linejoin="round"
          fill="none"
        />

        <circle
          v-for="point in points"
          :key="`${point.x}-${point.y}-${point.label}`"
          :cx="point.x"
          :cy="point.y"
          :r="point.isLast ? 6 : 4"
          :fill="point.isLast ? palette.glow : palette.stroke"
          :stroke="point.isLast ? '#fff9ef' : '#ffffff'"
          :stroke-width="point.isLast ? 3 : 1.5"
        />

        <g class="neo-trend-x-labels">
          <text
            v-for="tick in xTicks"
            :key="`${tick.index}-${tick.label}`"
            :x="tick.x"
            :y="chartHeight + 20"
            text-anchor="middle"
          >
            {{ tick.label }}
          </text>
        </g>
      </g>
    </svg>

    <div v-if="!points.length" class="neo-trend-empty">No signal yet.</div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

interface Point {
  x: number;
  y: number;
  value: number;
  label: string;
  isLast: boolean;
}

interface Tick {
  value: number;
  position: number;
}

const props = withDefaults(
  defineProps<{
    values: number[];
    labels?: string[];
    tone?: 'primary' | 'warning' | 'danger' | 'success';
    valueFormatter?: (value: number) => string;
    minValue?: number;
    maxValue?: number;
  }>(),
  {
    tone: 'primary',
  }
);

const padding = {
  top: 14,
  right: 12,
  bottom: 38,
  left: 54,
} as const;

const chartWidth = 408;
const chartHeight = 196;

const fillId = `neo-trend-fill-${Math.random().toString(36).slice(2, 10)}`;

const palettes = {
  primary: {
    stroke: '#2f8f83',
    fill: '#6fd0c2',
    glow: '#153e5c',
  },
  warning: {
    stroke: '#d38718',
    fill: '#f0b35b',
    glow: '#7b4200',
  },
  danger: {
    stroke: '#cf5d4a',
    fill: '#e89e86',
    glow: '#7f1d1d',
  },
  success: {
    stroke: '#1f9d67',
    fill: '#76d2a9',
    glow: '#155e43',
  },
} as const;

const palette = computed(() => palettes[props.tone]);

const series = computed(() =>
  props.values.map((rawValue, index) => ({
    value: Number.isFinite(rawValue) ? Number(rawValue) : 0,
    label: props.labels?.[index] ?? `${index + 1}`,
  }))
);

const valueRange = computed(() => {
  if (!series.value.length) {
    return { min: 0, max: 1 };
  }

  const values = series.value.map((item) => item.value);
  const actualMin = Math.min(...values);
  const actualMax = Math.max(...values);
  const min = props.minValue ?? Math.min(actualMin, 0);
  const max = props.maxValue ?? actualMax;

  if (max <= min) {
    return { min, max: min + 1 };
  }

  return { min, max };
});

const points = computed<Point[]>(() => {
  if (!series.value.length) return [];

  const width = chartWidth - padding.left - padding.right;
  const height = chartHeight - padding.top;
  const range = valueRange.value.max - valueRange.value.min || 1;
  const step = series.value.length > 1 ? width / (series.value.length - 1) : 0;

  return series.value.map((item, index) => ({
    x: padding.left + (series.value.length > 1 ? index * step : width / 2),
    y: chartHeight - ((item.value - valueRange.value.min) / range) * height,
    value: item.value,
    label: item.label,
    isLast: index === series.value.length - 1,
  }));
});

const linePath = computed(() => {
  if (!points.value.length) return '';
  return points.value
    .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`)
    .join(' ');
});

const areaPath = computed(() => {
  if (!points.value.length) return '';
  const first = points.value[0];
  const last = points.value[points.value.length - 1];
  if (!first || !last) return '';
  return `${linePath.value} L ${last.x} ${chartHeight} L ${first.x} ${chartHeight} Z`;
});

const yTicks = computed<Tick[]>(() => {
  const tickCount = 4;
  const range = valueRange.value.max - valueRange.value.min || 1;
  return Array.from({ length: tickCount }, (_, index) => {
    const ratio = index / (tickCount - 1);
    const value = valueRange.value.max - ratio * range;
    const position = padding.top + ratio * (chartHeight - padding.top);
    return { value, position };
  });
});

const xTicks = computed(() => {
  if (!points.value.length) return [];

  const lastIndex = points.value.length - 1;
  const indices =
    points.value.length <= 4
      ? points.value.map((_, index) => index)
      : [0, Math.round(lastIndex / 3), Math.round((lastIndex * 2) / 3), lastIndex];

  return Array.from(new Set(indices)).map((index) => {
    const point = points.value[index];
    return {
      index,
      x: point?.x ?? padding.left,
      label: point?.label ?? `${index + 1}`,
    };
  });
});

const formatValue = (value: number) => {
  if (props.valueFormatter) return props.valueFormatter(value);
  return value.toLocaleString('en-GB', { maximumFractionDigits: 1 });
};
</script>

<style scoped>
.neo-trend-chart {
  position: relative;
  min-height: 240px;
}

.neo-trend-chart svg {
  width: 100%;
  height: 240px;
  display: block;
}

.neo-trend-grid line {
  stroke: rgba(86, 103, 113, 0.14);
  stroke-width: 1;
}

.neo-trend-grid .neo-trend-axis {
  stroke: rgba(16, 32, 43, 0.26);
}

.neo-trend-y-labels text,
.neo-trend-x-labels text {
  font-size: 11px;
  fill: var(--neo-ink-muted);
}

.neo-trend-empty {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  color: var(--neo-ink-muted);
  font-size: 13px;
}
</style>
