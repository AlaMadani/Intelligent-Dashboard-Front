<template>
  <section class="neo-section neo-kpis">
    <article v-for="card in cards" :key="card.label" class="neo-kpi-card">
      <div class="neo-kpi-head">
        <div class="neo-kpi-icon">
          <q-icon :name="card.icon" />
        </div>
        <div class="neo-kpi-label">{{ card.label }}</div>
      </div>
      <div class="neo-kpi-value">{{ card.value }}</div>
      <div class="neo-kpi-meta">{{ card.meta }}</div>
      <div class="neo-kpi-accent"></div>
    </article>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  activeSessions: string;
  eventsPerMinute: string;
  anomalyRate: string;
  koRate: string;
}>();

const cards = computed(() => [
  {
    label: 'Active sessions',
    value: props.activeSessions,
    meta: 'Current Redis session buffers',
    icon: 'motion_photos_on',
  },
  {
    label: 'Events per minute',
    value: props.eventsPerMinute,
    meta: 'Rolling 60 second behavior throughput',
    icon: 'timeline',
  },
  {
    label: 'Anomaly alert rate',
    value: props.anomalyRate,
    meta: 'Confirmed alerts during the last hour',
    icon: 'notification_important',
  },
  {
    label: 'KO rate',
    value: props.koRate,
    meta: 'Recent drop off pressure in the last 15 minutes',
    icon: 'trending_down',
  },
]);
</script>

<style scoped>
.neo-kpi-head {
  display: flex;
  align-items: center;
  gap: 10px;
}

.neo-kpi-icon {
  width: 40px;
  height: 40px;
  border-radius: 14px;
  display: grid;
  place-items: center;
  background: rgba(47, 143, 131, 0.1);
  color: var(--neo-accent);
}

.neo-kpi-accent {
  margin-top: 16px;
  height: 5px;
  border-radius: 999px;
  background: linear-gradient(90deg, rgba(47, 143, 131, 0.95), rgba(227, 165, 72, 0.85));
}
</style>
