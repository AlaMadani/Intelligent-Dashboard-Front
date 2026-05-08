<template>
  <!-- Compact ranked-bar chart used for top actions, anomaly types, and spike previews. -->
  <div class="neo-bar-list">
    <div v-if="rows.length" class="neo-bar-list-rows">
      <div v-for="row in rows" :key="row.label" class="neo-bar-row">
        <div class="neo-bar-row-head">
          <span class="neo-bar-row-label">{{ row.label }}</span>
          <strong class="neo-bar-row-value">{{ row.display }}</strong>
        </div>
        <div class="neo-bar-track">
          <span class="neo-bar-fill" :style="{ width: `${row.width}%` }"></span>
        </div>
      </div>
    </div>

    <div v-else class="neo-bar-empty">{{ emptyMessage ?? t('barListChart.empty') }}</div>
  </div>
</template>

<script setup lang="ts">
// Normalize incoming values into proportional bar rows for a lightweight display-only chart.
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import type { BarChartRow } from 'src/models/chart';
import { formatNumber } from 'src/utils/format';

const props = defineProps<{
  items: BarChartRow[];
  emptyMessage?: string;
}>();

const { t } = useI18n();

// Scale each value relative to the current maximum so the list reads like a mini chart.
const rows = computed(() => {
  const max = Math.max(...props.items.map((item) => item.value), 0);
  return props.items.map((item) => ({
    ...item,
    width: max > 0 ? Math.max(10, Math.round((item.value / max) * 100)) : 0,
    display: item.display ?? formatNumber(item.value),
  }));
});
</script>

<style scoped>
/* Shared ranked-bar chart styling. */
.neo-bar-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.neo-bar-list-rows {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.neo-bar-row-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 7px;
}

.neo-bar-row-label {
  color: var(--neo-ink-soft);
  font-size: 13px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.neo-bar-row-value {
  font-size: 13px;
  color: var(--neo-ink);
}

.neo-bar-track {
  height: 8px;
  border-radius: 999px;
  background: rgba(23, 33, 43, 0.08);
  overflow: hidden;
}

.neo-bar-fill {
  display: block;
  height: 100%;
  border-radius: 999px;
  background: linear-gradient(90deg, var(--neo-accent) 0%, var(--neo-info) 100%);
  box-shadow: 0 6px 14px rgba(47, 116, 107, 0.16);
  transition: width var(--neo-transition-med);
}

.neo-bar-empty {
  color: var(--neo-ink-muted);
  font-size: 13px;
  min-height: 120px;
  display: grid;
  place-items: center;
}
</style>
