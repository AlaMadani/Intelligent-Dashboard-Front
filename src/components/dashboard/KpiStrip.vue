<template>
  <!-- KPI strip: show skeleton placeholders first, then animate live counters when data arrives. -->
  <section class="neo-section neo-kpis">
    <div v-if="showSkeleton" class="row q-col-gutter-lg full-width">
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
  anomalyRate: string;
  globalRiskLevel: string;
  eventsPerMinute: string;
  eventsSinceLoad?: number;
  lastUpdated?: Date | null;
}>();

const animationTrigger = ref(false);
const showSkeleton = computed(
  () => !props.lastUpdated && (!props.eventsSinceLoad || props.eventsSinceLoad === 0),
);

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
    label: 'Current anomaly rate',
    value: props.anomalyRate,
    meta: 'Live anomaly pressure from the worker',
    icon: 'notification_important',
  },
  {
    label: 'Global risk level',
    value: props.globalRiskLevel,
    meta: 'Platform-wide posture from Redis stats',
    icon: 'shield',
  },
  {
    label: 'Events per minute',
    value: props.eventsPerMinute,
    meta: 'Rolling 60 second behavior throughput',
    icon: 'timeline',
  },
]);
</script>

<style scoped>
/* KPI card header, accent, and value-change animation styling. */
.neo-kpis {
  --kpi-card-color-1: var(--neo-accent);
  --kpi-card-color-2: var(--neo-warm);
  --kpi-card-color-3: var(--neo-danger);
  --kpi-card-color-4: #617ca8;
}

.neo-kpi-card {
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(12px);
  border-radius: 16px;
  padding: 20px;
  border: 1px solid rgba(16, 32, 43, 0.06);
  transition: 
    transform 0.25s cubic-bezier(0.4, 0, 0.2, 1),
    box-shadow 0.25s cubic-bezier(0.4, 0, 0.2, 1),
    background 0.2s ease;
  cursor: default;
}

.neo-kpi-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--neo-shadow);
  background: rgba(255, 255, 255, 0.9);
}

.neo-kpi-card:nth-child(1) .neo-kpi-icon {
  background: rgba(47, 143, 131, 0.1);
  color: var(--kpi-card-color-1);
}

.neo-kpi-card:nth-child(2) .neo-kpi-icon {
  background: rgba(227, 165, 72, 0.1);
  color: var(--kpi-card-color-2);
}

.neo-kpi-card:nth-child(3) .neo-kpi-icon {
  background: rgba(200, 90, 76, 0.1);
  color: var(--kpi-card-color-3);
}

.neo-kpi-card:nth-child(4) .neo-kpi-icon {
  background: rgba(97, 124, 168, 0.1);
  color: var(--kpi-card-color-4);
}

.neo-kpi-card:nth-child(1) .neo-kpi-accent {
  background: linear-gradient(90deg, var(--kpi-card-color-1), rgba(47, 143, 131, 0.4));
}

.neo-kpi-card:nth-child(2) .neo-kpi-accent {
  background: linear-gradient(90deg, var(--kpi-card-color-2), rgba(227, 165, 72, 0.4));
}

.neo-kpi-card:nth-child(3) .neo-kpi-accent {
  background: linear-gradient(90deg, var(--kpi-card-color-3), rgba(200, 90, 76, 0.4));
}

.neo-kpi-card:nth-child(4) .neo-kpi-accent {
  background: linear-gradient(90deg, var(--kpi-card-color-4), rgba(97, 124, 168, 0.4));
}

.neo-kpi-head {
  display: flex;
  align-items: center;
  gap: 10px;
}

.neo-kpi-icon {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  display: grid;
  place-items: center;
  transition: transform 0.2s ease;
}

.neo-kpi-card:hover .neo-kpi-icon {
  transform: scale(1.1);
}

.neo-kpi-label {
  font-size: 13px;
  color: var(--neo-ink-muted);
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.neo-kpi-value {
  font-size: 32px;
  font-weight: 700;
  margin-top: 12px;
  color: var(--neo-ink);
  line-height: 1;
  transition: color 0.3s ease;
}

.neo-kpi-meta {
  font-size: 12px;
  color: var(--neo-ink-muted);
  margin-top: 6px;
}

.neo-kpi-accent {
  margin-top: 16px;
  height: 4px;
  border-radius: 999px;
  opacity: 0.8;
  transition: opacity 0.2s ease;
}

.neo-kpi-card:hover .neo-kpi-accent {
  opacity: 1;
}

.neo-kpi-changed .neo-kpi-value {
  animation: pop-value 0.5s ease-out;
  color: var(--neo-accent);
}

/* The pulse animation draws attention to freshly updated counters. */
@keyframes pop-value {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.08);
  }
  100% {
    transform: scale(1);
    color: inherit;
  }
}
</style>
