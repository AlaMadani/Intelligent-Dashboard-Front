<template>
  <div class="neo-donut-shell">
    <div class="neo-donut" :style="{ background: donutGradient }">
      <div class="neo-donut-core">
        <div class="neo-donut-core-label">{{ centerLabel }}</div>
        <div class="neo-donut-core-value">{{ centerValue }}</div>
      </div>
    </div>

    <div class="neo-donut-legend">
      <div v-for="segment in normalizedSegments" :key="segment.label" class="neo-donut-legend-row">
        <span class="neo-donut-swatch" :style="{ background: segment.color }"></span>
        <span class="neo-donut-legend-label">{{ segment.label }}</span>
        <strong class="neo-donut-legend-value">{{ segment.display }}</strong>
      </div>
      <div v-if="!normalizedSegments.length" class="neo-donut-empty">No anomaly mix yet.</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

interface Segment {
  label: string;
  value: number;
  display?: string;
  color?: string;
}

const props = withDefaults(
  defineProps<{
    segments: Segment[];
    centerLabel?: string;
    centerValue?: string;
  }>(),
  {
    centerLabel: 'Signal mix',
    centerValue: '0',
  }
);

const fallbackColors = ['#2f8f83', '#e3a548', '#cf5d4a', '#617ca8', '#78b385'];

const normalizedSegments = computed(() =>
  props.segments.map((segment, index) => ({
    ...segment,
    color: segment.color ?? fallbackColors[index % fallbackColors.length],
    display: segment.display ?? segment.value.toLocaleString('en-GB'),
  }))
);

const donutGradient = computed(() => {
  if (!normalizedSegments.value.length) {
    return 'conic-gradient(rgba(19, 32, 38, 0.12) 0deg 360deg)';
  }

  const total = normalizedSegments.value.reduce((sum, segment) => sum + segment.value, 0) || 1;
  let offset = 0;

  const stops = normalizedSegments.value.map((segment) => {
    const size = (segment.value / total) * 360;
    const start = offset;
    offset += size;
    return `${segment.color} ${start}deg ${offset}deg`;
  });

  return `conic-gradient(${stops.join(', ')})`;
});
</script>

<style scoped>
.neo-donut-shell {
  display: grid;
  gap: 18px;
  grid-template-columns: minmax(160px, 190px) minmax(0, 1fr);
  align-items: center;
}

.neo-donut {
  width: min(190px, 100%);
  aspect-ratio: 1;
  border-radius: 50%;
  padding: 20px;
  box-shadow: inset 0 0 0 1px rgba(19, 32, 38, 0.08);
}

.neo-donut-core {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: rgba(253, 248, 238, 0.96);
  display: grid;
  place-items: center;
  text-align: center;
  box-shadow: inset 0 0 0 1px rgba(19, 32, 38, 0.06);
}

.neo-donut-core-label {
  font-size: 12px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--neo-ink-muted);
}

.neo-donut-core-value {
  font-size: 28px;
  font-weight: 700;
  color: var(--neo-ink);
}

.neo-donut-legend {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.neo-donut-legend-row {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: 10px;
}

.neo-donut-swatch {
  width: 10px;
  height: 10px;
  border-radius: 999px;
}

.neo-donut-legend-label {
  font-size: 13px;
  color: var(--neo-ink-soft);
}

.neo-donut-legend-value {
  font-size: 13px;
}

.neo-donut-empty {
  color: var(--neo-ink-muted);
  font-size: 13px;
}

@media (max-width: 720px) {
  .neo-donut-shell {
    grid-template-columns: 1fr;
    justify-items: center;
  }

  .neo-donut-legend {
    width: 100%;
  }
}
</style>
