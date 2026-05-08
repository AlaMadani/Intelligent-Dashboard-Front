<template>
  <div class="neo-radar-card">
    <div class="neo-radar-head">
      <h3>{{ t('featureRadarChart.title') }}</h3>
      <p>{{ t('featureRadarChart.subtitle') }}</p>
    </div>
    <div v-if="!chartItems.length" class="neo-radar-empty">
      {{ t('featureRadarChart.empty') }}
    </div>
    <VChart v-else :option="option" autoresize class="neo-radar-chart" />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import VChart from 'vue-echarts';
import { use } from 'echarts/core';
import { RadarChart } from 'echarts/charts';
import { CanvasRenderer } from 'echarts/renderers';
import { LegendComponent, TooltipComponent } from 'echarts/components';
import type { FeatureContributionDto } from 'src/types/analytics';

use([CanvasRenderer, RadarChart, LegendComponent, TooltipComponent]);

const { t } = useI18n();

const props = defineProps<{
  items?: FeatureContributionDto[] | null;
}>();

const chartItems = computed(() =>
  (props.items ?? [])
    .filter((item) => item?.feature)
    .slice(0, 6)
    .map((item) => ({
      feature: item.feature,
      importance: Math.max(0, Math.round((item.importance ?? 0) * 100)),
    })),
);

const option = computed(() => ({
  backgroundColor: 'transparent',
  tooltip: { trigger: 'item' },
  radar: {
    radius: '62%',
    splitNumber: 4,
    axisName: { color: '#667684', fontWeight: 600 },
    splitLine: { lineStyle: { color: 'rgba(102, 118, 132, 0.2)' } },
    splitArea: {
      areaStyle: {
        color: ['rgba(255,255,255,0.86)', 'rgba(232, 236, 233, 0.62)'],
      },
    },
    axisLine: { lineStyle: { color: 'rgba(102, 118, 132, 0.24)' } },
    indicator: chartItems.value.map((item) => ({
      name: item.feature,
      max: 100,
    })),
  },
  series: [
    {
      type: 'radar',
      data: [
        {
          value: chartItems.value.map((item) => item.importance),
          name: t('featureRadarChart.contribution'),
          areaStyle: { color: 'rgba(179, 75, 60, 0.2)' },
          lineStyle: { color: '#b34b3c', width: 2 },
          itemStyle: { color: '#b34b3c' },
          symbolSize: 6,
        },
      ],
    },
  ],
}));
</script>

<style scoped>
.neo-radar-card {
  padding: 20px;
  border-radius: var(--neo-radius-card);
  background: rgba(255, 255, 255, 0.74);
  border: var(--neo-border);
}

.neo-radar-head h3 {
  margin: 0;
  font-size: 18px;
}

.neo-radar-head p {
  margin: 4px 0 0;
  font-size: 13px;
  color: var(--neo-ink-muted);
}

.neo-radar-empty {
  margin-top: 16px;
  color: var(--neo-ink-muted);
  font-size: 13px;
}

.neo-radar-chart {
  margin-top: 12px;
  height: 320px;
}
</style>
