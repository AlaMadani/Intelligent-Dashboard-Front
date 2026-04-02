<template>
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

    <div v-else class="neo-bar-empty">{{ emptyMessage }}</div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

interface ChartRow {
  label: string;
  value: number;
  display?: string;
}

const props = withDefaults(
  defineProps<{
    items: ChartRow[];
    emptyMessage?: string;
  }>(),
  {
    emptyMessage: 'No chart data available.',
  }
);

const rows = computed(() => {
  const max = Math.max(...props.items.map((item) => item.value), 0);
  return props.items.map((item) => ({
    ...item,
    width: max > 0 ? Math.max(10, Math.round((item.value / max) * 100)) : 0,
    display: item.display ?? item.value.toLocaleString('en-GB'),
  }));
});
</script>

<style scoped>
.neo-bar-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.neo-bar-list-rows {
  display: flex;
  flex-direction: column;
  gap: 14px;
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
}

.neo-bar-row-value {
  font-size: 13px;
  color: var(--neo-ink);
}

.neo-bar-track {
  height: 10px;
  border-radius: 999px;
  background: rgba(23, 43, 58, 0.08);
  overflow: hidden;
}

.neo-bar-fill {
  display: block;
  height: 100%;
  border-radius: 999px;
  background: linear-gradient(90deg, #2f8f83 0%, #e3a548 100%);
  box-shadow: 0 6px 14px rgba(47, 143, 131, 0.2);
}

.neo-bar-empty {
  color: var(--neo-ink-muted);
  font-size: 13px;
  min-height: 120px;
  display: grid;
  place-items: center;
}
</style>
