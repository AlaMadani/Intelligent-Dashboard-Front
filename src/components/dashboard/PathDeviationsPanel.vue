<template>
  <article v-if="!flat" class="neo-analytics-panel neo-analytics-panel--wide">
    <div class="neo-analytics-head">
      <div>
        <h3>Path Deviations</h3>
        <p>Unusual navigation patterns detected in recent sessions</p>
      </div>
      <div class="neo-analytics-chip">
        {{ deviations.length }} deviations
      </div>
    </div>

    <div v-if="!deviations.length" class="neo-analytics-empty">
      No path deviations detected in the last 24 hours.
    </div>

    <div v-else class="neo-path-deviations-feed">
      <div
        v-for="item in deviations"
        :key="item.key"
        class="neo-path-deviation-row"
      >
        <div class="neo-path-flow">
          <span class="neo-path-step neo-path-step--from">{{ item.fromAction }}</span>
          <span class="neo-path-arrow">-></span>
          <span class="neo-path-step neo-path-step--to">{{ item.toAction }}</span>
        </div>
        <div class="neo-path-meta">
          <div class="neo-path-probability">
            <div
              class="neo-path-probability-bar"
              :style="{ width: `${Math.max(5, 100 - item.probability * 100)}%` }"
            ></div>
          </div>
          <span class="neo-path-score">{{ item.score }}</span>
        </div>
        <div class="neo-path-details">
          <span>{{ item.sessionCount }} sessions</span>
          <span>|</span>
          <span>Confidence: {{ Math.round((1 - item.probability) * 100) }}%</span>
        </div>
      </div>
    </div>
  </article>
  <template v-else>
    <div v-if="!deviations.length" class="neo-overview-empty">
      No path deviations detected in the last 24 hours.
    </div>
    <div v-else class="neo-path-deviations-feed">
      <div
        v-for="item in deviations"
        :key="item.key"
        class="neo-path-deviation-row"
      >
        <div class="neo-path-flow">
          <span class="neo-path-step neo-path-step--from">{{ item.fromAction }}</span>
          <span class="neo-path-arrow">-></span>
          <span class="neo-path-step neo-path-step--to">{{ item.toAction }}</span>
        </div>
        <div class="neo-path-meta">
          <div class="neo-path-probability">
            <div
              class="neo-path-probability-bar"
              :style="{ width: `${Math.max(5, 100 - item.probability * 100)}%` }"
            ></div>
          </div>
          <span class="neo-path-score">{{ item.score }}</span>
        </div>
        <div class="neo-path-details">
          <span>{{ item.sessionCount }} sessions</span>
          <span>|</span>
          <span>Confidence: {{ Math.round((1 - item.probability) * 100) }}%</span>
        </div>
      </div>
    </div>
  </template>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  data: Array<Record<string, unknown>> | null;
  flat?: boolean;
}>();

const toNumber = (value: unknown) => {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isNaN(parsed) ? null : parsed;
  }
  return null;
};

const readText = (value: unknown, fallback: string) =>
  typeof value === 'string' && value.trim().length > 0 ? value : fallback;

const clampProbability = (value: number | null) => {
  if (value == null) return 1;
  return Math.max(0, Math.min(1, value));
};

const deviations = computed(() => {
  if (!props.data || !Array.isArray(props.data)) return [];

  return props.data
    .flatMap((item, index) => {
      if (!item || typeof item !== 'object' || Array.isArray(item)) return [];

      const probability = clampProbability(
        toNumber(item.train_probability ?? item.transition_probability ?? item.transitionProbability ?? item.probability),
      );
      const sessionCount =
        toNumber(item.session_count ?? item.sessionCount ?? item.sessions ?? item.count) ?? 0;
      const fromAction = readText(item.current_action ?? item.from_action ?? item.fromAction, 'unknown');
      const toAction = readText(item.actual_next_action ?? item.to_action ?? item.toAction, 'unknown');

      return [
        {
          key: `${fromAction}-${toAction}-${index}`,
          fromAction,
          toAction,
          probability,
          sessionCount,
          score:
            probability < 0.01
              ? 'CRITICAL'
              : probability < 0.05
                ? 'HIGH'
                : probability < 0.15
                  ? 'MEDIUM'
                  : 'LOW',
        },
      ];
    })
    .sort((a, b) => a.probability - b.probability)
    .slice(0, 6);
});
</script>

<style scoped>
.neo-path-deviations-feed {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 8px;
}

.neo-path-deviation-row {
  padding: 12px 14px;
  background: rgba(255, 255, 255, 0.6);
  border-radius: 8px;
  border: 1px solid rgba(16, 32, 43, 0.06);
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.neo-path-flow {
  display: flex;
  align-items: center;
  gap: 8px;
}

.neo-path-step {
  font-family: 'JetBrains Mono', monospace;
  font-size: 12px;
  padding: 4px 8px;
  border-radius: 4px;
  background: var(--neo-shell-soft);
  color: white;
}

.neo-path-step--from {
  background: var(--neo-accent-soft);
  color: var(--neo-ink);
}

.neo-path-arrow {
  color: var(--neo-ink-muted);
  font-weight: 600;
}

.neo-path-meta {
  display: flex;
  align-items: center;
  gap: 12px;
}

.neo-path-probability {
  flex: 1;
  height: 6px;
  background: var(--neo-surface-muted);
  border-radius: 3px;
  overflow: hidden;
}

.neo-path-probability-bar {
  height: 100%;
  background: linear-gradient(90deg, var(--neo-danger), var(--neo-warm), var(--neo-accent));
  border-radius: 3px;
  transition: width 0.3s ease;
}

.neo-path-score {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  min-width: 60px;
  text-align: right;
}

.neo-path-details {
  font-size: 11px;
  color: var(--neo-ink-muted);
  display: flex;
  gap: 8px;
}

.neo-analytics-empty {
  text-align: center;
  padding: 32px;
  color: var(--neo-ink-muted);
  font-size: 13px;
}
</style>
