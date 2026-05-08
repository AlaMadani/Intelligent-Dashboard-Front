<template>
  <!-- Connection indicator: summarize the live stream state and current event throughput. -->
  <div class="neo-live-pulse-container row items-center no-wrap">
    <div class="neo-pulse-dot" :class="statusClass"></div>
    <div class="neo-pulse-text q-ml-sm text-caption">
      <span v-if="status === 'connected'" class="neo-pulse-label neo-pulse-label--connected">
        {{ connectedLabel }}
      </span>
      <span v-else-if="status === 'reconnecting'" class="neo-pulse-label neo-pulse-label--reconnecting">
        {{ t('common.reconnecting') }}
      </span>
      <span v-else class="neo-pulse-label neo-pulse-label--disconnected">{{ t('common.disconnected') }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
// Compute the color treatment from the connection state passed in by the parent.
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

const props = defineProps<{
  status: 'connected' | 'reconnecting' | 'disconnected';
  eventsRate: number | string;
}>();

const { t } = useI18n();

// CSS classes let the dot switch between connected, reconnecting, and disconnected states.
const statusClass = computed(() => {
  return {
    'pulse-green': props.status === 'connected',
    'pulse-amber': props.status === 'reconnecting',
    'pulse-red': props.status === 'disconnected',
  };
});

const connectedLabel = computed(() =>
  t('common.eventsPerMinute', { rate: props.eventsRate }),
);
</script>

<style scoped lang="scss">
/* Capsule styling and status animations for the live-connection indicator. */
.neo-live-pulse-container {
  background: rgba(23, 33, 43, 0.06);
  padding: 4px 12px;
  border-radius: 100px;
  border: 1px solid rgba(23, 33, 43, 0.1);
  backdrop-filter: blur(8px);
}

.neo-pulse-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.pulse-green {
  background-color: var(--neo-success);
  box-shadow: 0 0 8px rgba(46, 125, 99, 0.45);
  animation: pulse-animation-green 2s infinite;
}

.pulse-amber {
  background-color: var(--neo-warning);
  box-shadow: 0 0 8px rgba(167, 101, 24, 0.45);
  animation: pulse-animation-amber 1s infinite alternate;
}

.pulse-red {
  background-color: var(--neo-critical);
  box-shadow: 0 0 4px rgba(179, 75, 60, 0.45);
}

.neo-pulse-label {
  font-weight: 700;
}

.neo-pulse-label--connected {
  color: var(--neo-success-contrast);
}

.neo-pulse-label--reconnecting {
  color: var(--neo-warning-contrast);
}

.neo-pulse-label--disconnected {
  color: var(--neo-critical-contrast);
}

@keyframes pulse-animation-green {
  0% {
    box-shadow: 0 0 0 0 rgba(46, 125, 99, 0.35);
  }
  70% {
    box-shadow: 0 0 0 6px rgba(46, 125, 99, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(45, 212, 191, 0);
  }
}

@keyframes pulse-animation-amber {
  from {
    opacity: 1;
  }
  to {
    opacity: 0.3;
  }
}

.neo-pulse-text {
  letter-spacing: 0.05em;
  font-family: monospace;
}
</style>
