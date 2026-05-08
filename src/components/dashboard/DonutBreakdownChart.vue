<template>
  <!-- Donut summary: render proportional segments with a matching legend and center label. -->
  <div class="neo-donut-shell">
    <div class="neo-donut" :style="{ background: donutGradient }">
      <div class="neo-donut-core">
        <div class="neo-donut-core-label">{{ resolvedCenterLabel }}</div>
        <div class="neo-donut-core-value">{{ centerValue }}</div>
      </div>
    </div>

    <div class="neo-donut-legend">
      <div v-for="segment in normalizedSegments" :key="segment.label" class="neo-donut-legend-row">
        <span class="neo-donut-swatch" :style="{ background: segment.color }"></span>
        <span class="neo-donut-legend-label">{{ segment.label }}</span>
        <strong class="neo-donut-legend-value">{{ segment.display }}</strong>
      </div>
      <div v-if="!normalizedSegments.length" class="neo-donut-empty">
        {{ t('donutBreakdownChart.noAnomalyMix') }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// Convert labeled values into a CSS-driven donut chart with legend metadata.
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import type { DonutSegment } from 'src/models/chart';
import { formatNumber } from 'src/utils/format';

const props = withDefaults(
  defineProps<{
    segments: DonutSegment[];
    centerLabel?: string;
    centerValue?: string;
  }>(),
  {
    centerValue: '0',
  },
);

const { t } = useI18n();

// Provide default colors when callers omit segment styling.
const fallbackColors = ['#2f746b', '#a76518', '#b34b3c', '#3d6d8e', '#5f7f78'];

// Normalize legend text and segment colors before generating the donut.
const normalizedSegments = computed(() =>
  props.segments.map((segment, index) => ({
    ...segment,
    color: segment.color ?? fallbackColors[index % fallbackColors.length],
    display: segment.display ?? formatNumber(segment.value),
  })),
);

const resolvedCenterLabel = computed(() => props.centerLabel ?? t('donutBreakdownChart.signalMix'));

// Build the CSS conic-gradient string that paints the donut slices.
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
/* Donut chart layout and legend styling. */
.neo-donut-shell {
  display: grid;
  gap: 18px;
  grid-template-columns: minmax(150px, 176px) minmax(0, 1fr);
  align-items: center;
}

.neo-donut {
  width: min(176px, 100%);
  aspect-ratio: 1;
  border-radius: 50%;
  padding: 18px;
  box-shadow: inset 0 0 0 1px rgba(19, 32, 38, 0.08);
}

.neo-donut-core {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.94);
  display: grid;
  place-items: center;
  text-align: center;
  box-shadow: inset 0 0 0 1px rgba(19, 32, 38, 0.06);
}

.neo-donut-core-label {
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.06em;
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
