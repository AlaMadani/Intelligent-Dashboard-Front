<template>
  <div class="neo-live-pulse-container row items-center no-wrap">
    <div class="neo-pulse-dot" :class="statusClass"></div>
    <div class="neo-pulse-text q-ml-sm text-caption">
      <span v-if="status === 'connected'" class="text-teal-3 text-weight-medium">
        LIVE · {{ eventsRate }} evt/min
      </span>
      <span v-else-if="status === 'reconnecting'" class="text-amber-4 text-weight-medium">
        RECONNECTING...
      </span>
      <span v-else class="text-red-4 text-weight-medium">
        DISCONNECTED
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  status: 'connected' | 'reconnecting' | 'disconnected';
  eventsRate: number | string;
}>();

const statusClass = computed(() => {
  return {
    'pulse-green': props.status === 'connected',
    'pulse-amber': props.status === 'reconnecting',
    'pulse-red': props.status === 'disconnected',
  };
});
</script>

<style scoped lang="scss">
.neo-live-pulse-container {
  background: rgba(15, 23, 42, 0.4);
  padding: 4px 12px;
  border-radius: 100px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(8px);
}

.neo-pulse-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.pulse-green {
  background-color: #2dd4bf;
  box-shadow: 0 0 8px #2dd4bf;
  animation: pulse-animation-green 2s infinite;
}

.pulse-amber {
  background-color: #fbbf24;
  box-shadow: 0 0 8px #fbbf24;
  animation: pulse-animation-amber 1s infinite alternate;
}

.pulse-red {
  background-color: #f87171;
  box-shadow: 0 0 4px #f87171;
}

@keyframes pulse-animation-green {
  0% { box-shadow: 0 0 0 0 rgba(45, 212, 191, 0.7); }
  70% { box-shadow: 0 0 0 6px rgba(45, 212, 191, 0); }
  100% { box-shadow: 0 0 0 0 rgba(45, 212, 191, 0); }
}

@keyframes pulse-animation-amber {
  from { opacity: 1; }
  to { opacity: 0.3; }
}

.neo-pulse-text {
  letter-spacing: 0.05em;
  font-family: monospace;
}
</style>
