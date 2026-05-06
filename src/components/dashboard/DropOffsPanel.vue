<template>
  <article class="neo-analytics-panel">
    <div class="neo-analytics-head">
      <div>
        <h3>{{ t('dropOffsPanel.title') }}</h3>
        <p>{{ t('dropOffsPanel.subtitle') }}</p>
      </div>
    </div>

    <div v-if="!dropOffPoints.length" class="neo-analytics-empty">
      {{ t('dropOffsPanel.empty') }}
    </div>

    <div v-else class="neo-dropoffs-container">
      <div class="neo-dropoffs-funnel">
        <div
          v-for="(point, index) in dropOffPoints"
          :key="point.step"
          class="neo-dropoff-step"
          :style="{ width: `${Math.max(20, point.percentage)}%` }"
        >
          <div class="neo-dropoff-label">{{ point.step }}</div>
          <div class="neo-dropoff-count">{{ point.count }}</div>
          <div class="neo-dropoff-rate" v-if="index > 0">
            -{{ point.dropRate }}%
          </div>
        </div>
      </div>

      <div class="neo-dropoffs-legend">
        <div v-for="point in dropOffPoints" :key="point.step" class="neo-dropoff-legend-row">
          <span class="neo-dropoff-legend-label">{{ point.step }}</span>
          <span class="neo-dropoff-legend-value">
            {{ t('dropOffsPanel.usersLabel', { count: point.count }) }}
          </span>
        </div>
      </div>
    </div>
  </article>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import type { SessionAnalysisDto } from 'src/types/analytics';

const props = defineProps<{
  data: Array<Record<string, unknown>> | null;
  sessions?: SessionAnalysisDto[];
  flat?: boolean;
}>();

const { t } = useI18n();

const toNumber = (value: unknown) => {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isNaN(parsed) ? null : parsed;
  }
  return null;
};

const toPercent = (value: number | null) => {
  if (value == null) return null;
  return value <= 1 ? value * 100 : value;
};

const readStepLabel = (item: Record<string, unknown>, index: number) => {
  const candidates = [
    item.step,
    item.label,
    item.stage,
    item.action,
    item.route,
    item.fromAction,
  ];
  for (const candidate of candidates) {
    if (typeof candidate === 'string' && candidate.trim().length > 0) {
      return candidate;
    }
  }
  return t('dropOffsPanel.stepFallback', { index: index + 1 });
};

const dropOffPoints = computed(() => {
  const rawData = (Array.isArray(props.data) && props.data.length > 0)
    ? props.data
    : buildFallbackDropOffs(props.sessions);

  const points = rawData
    .slice(0, 6)
    .flatMap((item, index) => {
      if (!item || typeof item !== 'object' || Array.isArray(item)) return [];

      const count = toNumber(
        item.count ??
          item.users ??
          item.userCount ??
          item.session_count ??
          item.sessionCount ??
          item.drop_off_count ??
          item.value,
      );
      const percentage = toPercent(toNumber(item.percentage ?? item.share ?? item.rate));
      if (count == null && percentage == null) return [];

      return [
        {
          step: readStepLabel(item, index),
          count: count ?? 0,
          percentage,
        },
      ];
    });

  if (!points.length) return [];

  const maxCount = Math.max(...points.map((point) => point.count), 1);

  return points.map((point, index) => ({
    step: point.step,
    count: point.count,
    percentage: point.percentage ?? (point.count / maxCount) * 100,
    dropRate:
      index > 0
        ? Math.max(0, Math.round(100 - (point.count / Math.max(points[index - 1]?.count || 1, 1)) * 100))
        : 0,
  }));
});

const buildFallbackDropOffs = (sessions: SessionAnalysisDto[] | undefined): Array<Record<string, unknown>> => {
  if (!sessions || sessions.length === 0) return [];
  const total = sessions.length;
  const abruptEndings = sessions.filter((s) => s.endedAbruptly).length;
  return [
    { step: t('dropOffsPanel.fallbackSessionStart'), count: total },
    { step: t('dropOffsPanel.fallbackCompletedNormally'), count: total - abruptEndings },
    { step: t('dropOffsPanel.fallbackEndedAbruptly'), count: abruptEndings },
  ].filter((item) => item.count > 0);
};
</script>

<style scoped>
.neo-dropoffs-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-top: 8px;
}

.neo-dropoffs-funnel {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.neo-dropoff-step {
  height: 40px;
  background: linear-gradient(90deg, var(--neo-accent), var(--neo-accent-soft));
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 12px;
  transition: width 0.5s ease;
  position: relative;
}

.neo-dropoff-label {
  font-weight: 600;
  color: white;
  text-shadow: 0 1px 2px rgba(0,0,0,0.2);
}

.neo-dropoff-count {
  color: rgba(255,255,255,0.9);
  font-size: 13px;
}

.neo-dropoff-rate {
  position: absolute;
  right: -50px;
  font-size: 11px;
  font-weight: 700;
  color: var(--neo-danger);
}

.neo-dropoffs-legend {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 8px;
  margin-top: 8px;
}

.neo-dropoff-legend-row {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  padding: 4px 0;
  border-bottom: 1px solid var(--neo-shell-line);
}

.neo-dropoff-legend-label {
  color: var(--neo-ink-soft);
}

.neo-dropoff-legend-value {
  font-weight: 600;
  color: var(--neo-ink);
}

.neo-analytics-empty {
  text-align: center;
  padding: 32px;
  color: var(--neo-ink-muted);
  font-size: 13px;
}
</style>
