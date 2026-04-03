<template>
  <!-- KPI strip: show skeleton placeholders first, then animate live counters when data arrives. -->
  <section class="neo-section neo-kpis">
    <div v-if="!eventsSinceLoad || eventsSinceLoad === 0" class="row q-col-gutter-lg full-width">
      <div v-for="i in 4" :key="i" class="col-12 col-md-3">
        <SkeletonCard />
      </div>
    </div>
    <!-- Once live stats arrive, render the KPI cards with a brief change animation. -->
    <template v-else>
      <article
        v-for="card in cards"
        :key="card.label"
        class="neo-kpi-card"
        :class="{ 'neo-kpi-changed': animationTrigger }"
      >
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
    </template>
  </section>
</template>

<script setup lang="ts">
// KPI cards are derived from a small set of live counters passed in by the overview page.
import { computed, ref, watch } from 'vue';
import SkeletonCard from './SkeletonCard.vue';

const props = defineProps<{
  activeSessions: string;
  eventsPerMinute: string;
  anomalyRate: string;
  koRate: string;
  eventsSinceLoad?: number;
  lastUpdated?: Date | null;
}>();

const animationTrigger = ref(false);

// Briefly animate KPI changes whenever new live events have been processed.
watch(
  () => props.eventsSinceLoad,
  () => {
    animationTrigger.value = true;
    setTimeout(() => {
      animationTrigger.value = false;
    }, 500);
  },
);

// Card descriptors keep the template small while pairing each metric with copy and iconography.
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
/* KPI card header, accent, and value-change animation styling. */
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

.neo-kpi-changed .neo-kpi-value {
  animation: pop-value 0.5s ease-out;
  color: #2dd4bf;
}

/* The pulse animation draws attention to freshly updated counters. */
@keyframes pop-value {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
  100% {
    transform: scale(1);
    color: inherit;
  }
}
</style>
