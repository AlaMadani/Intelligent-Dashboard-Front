<template>
  <div class="noveo-kinetic-loader" role="status" :aria-label="statusText">
    <div class="noveo-kinetic-loader__stage">
      <img
        v-if="showReferenceLogo"
        class="noveo-kinetic-loader__reference"
        :src="logoUrl"
        alt=""
        aria-hidden="true"
      />

      <svg
        class="noveo-kinetic-loader__svg noveo-kinetic-loader__svg--glow"
        viewBox="0 0 600 280"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <g
          class="noveo-kinetic-loader__charcoal"
          stroke-width="8.5"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path
            class="noveo-kinetic-loader__draw"
            d="M 45,120 L 45,55 C 45,30 60,20 77,20 C 94,20 109,30 109,55 L 109,120"
            style="animation-delay: 0s; animation-duration: 1.4s"
          />
          <path
            class="noveo-kinetic-loader__draw"
            d="M 173,20 A 50,50 0 1,1 172.9,20 Z"
            style="animation-delay: 0.15s; animation-duration: 1.4s"
          />
          <path
            class="noveo-kinetic-loader__draw"
            d="M 237,20 L 282,120 L 327,20"
            style="animation-delay: 0.3s; animation-duration: 1.4s"
          />
          <path
            class="noveo-kinetic-loader__draw"
            d="M 341,70 L 441,70 C 441,40 419,20 391,20 C 361,20 341,42 341,70 C 341,98 361,120 391,120 C 421,120 439,100 441,85"
            style="animation-delay: 0.45s; animation-duration: 1.5s"
          />
          <path
            class="noveo-kinetic-loader__draw"
            d="M 505,20 A 50,50 0 1,1 504.9,20 Z"
            style="animation-delay: 0.6s; animation-duration: 1.4s"
          />
        </g>

        <g
          class="noveo-kinetic-loader__coral"
          stroke-width="8.5"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path
            class="noveo-kinetic-loader__draw"
            d="M 328,175 C 319,165 308,160 295,160 C 273,160 260,178 260,200 C 260,222 273,240 295,240 C 308,240 319,235 328,225"
            style="animation-delay: 0.75s; animation-duration: 1.4s"
          />
          <path
            class="noveo-kinetic-loader__draw"
            d="M 415,200 C 415,178 399,160 380,160 C 361,160 345,178 345,200 C 345,222 361,240 380,240 C 399,240 415,222 415,200 L 415,160 L 415,240"
            style="animation-delay: 1.4s; animation-duration: 1.5s"
          />
          <path
            class="noveo-kinetic-loader__draw"
            d="M 435,240 L 435,160 M 435,185 C 442,168 454,160 475,160"
            style="animation-delay: 1.05s; animation-duration: 1.4s"
          />
          <path
            class="noveo-kinetic-loader__draw"
            d="M 485,200 L 555,200 C 555,174 537,160 520,160 C 498,160 485,178 485,200 C 485,222 498,240 520,240 C 540,240 552,228 555,212"
            style="animation-delay: 1.4s; animation-duration: 1.5s"
          />
        </g>
      </svg>
    </div>

    <div class="noveo-kinetic-loader__bar-track">
      <div class="noveo-kinetic-loader__bar" :style="{ width: `${progress}%` }" />
    </div>

    <span class="noveo-kinetic-loader__status">{{ statusText }}</span>
  </div>
</template>

<script setup lang="ts">
// ---- Imports ----
import { computed, onBeforeUnmount, ref, watch } from 'vue';
import logoUrl from 'src/assets/logo_noveocare.png';

// ---- Props ----
const props = withDefaults(
  defineProps<{
    active?: boolean;
    messages?: string[];
    showReferenceLogo?: boolean;
    cycleDurationMs?: number;
  }>(),
  {
    active: true,
    messages: () => [],
    showReferenceLogo: false,
    cycleDurationMs: 2400,
  },
);

// ---- State ----
const progress = ref(0);
const messageIndex = ref(0);

let progressTimer: number | undefined;
let messageTimer: number | undefined;

// ---- Computed ----
const statusText = computed(() => {
  if (!props.messages.length) {
    return '';
  }

  return props.messages[messageIndex.value % props.messages.length] ?? props.messages[0];
});

// ---- Methods ----
const clearTimers = () => {
  if (progressTimer) {
    window.clearInterval(progressTimer);
    progressTimer = undefined;
  }

  if (messageTimer) {
    window.clearInterval(messageTimer);
    messageTimer = undefined;
  }
};

const startAnimation = () => {
  clearTimers();
  progress.value = 0;
  messageIndex.value = 0;

  const stepTime = 20;
  const stepsCount = props.cycleDurationMs / stepTime;
  const stepIncrement = 92 / stepsCount;

  progressTimer = window.setInterval(() => {
    if (progress.value >= 92) {
      progress.value = 8;
      return;
    }

    progress.value = Math.min(92, progress.value + stepIncrement);
  }, stepTime);

  if (props.messages.length > 1) {
    messageTimer = window.setInterval(() => {
      messageIndex.value = (messageIndex.value + 1) % props.messages.length;
    }, Math.max(props.cycleDurationMs / 4, 600));
  }
};

const completeAnimation = () => {
  clearTimers();
  progress.value = 100;
};

watch(
  () => props.active,
  (isActive) => {
    if (isActive) {
      startAnimation();
      return;
    }

    completeAnimation();
  },
  { immediate: true },
);

// ---- Lifecycle ----
onBeforeUnmount(() => {
  clearTimers();
});
</script>

// ---- Styles ----
<style scoped>
.noveo-kinetic-loader {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: min(100%, clamp(280px, 88vw, 360px));
  padding: 0 clamp(8px, 3vw, 12px);
}

.noveo-kinetic-loader__stage {
  position: relative;
  width: min(100%, clamp(260px, 82vw, 340px));
  height: clamp(118px, 28vw, 160px);
  display: flex;
  align-items: center;
  justify-content: center;
}

.noveo-kinetic-loader__reference {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: contain;
  opacity: 0.3;
  pointer-events: none;
  user-select: none;
  z-index: 0;
}

.noveo-kinetic-loader__svg {
  position: relative;
  z-index: 1;
  width: 100%;
  height: 100%;
}

.noveo-kinetic-loader__svg--glow {
  animation: noveo-loader-pulse-glow 2.5s ease-in-out infinite;
}

.noveo-kinetic-loader__charcoal {
  stroke: var(--neo-loader-stroke);
}

.noveo-kinetic-loader__coral {
  stroke: var(--neo-loader-coral);
}

.noveo-kinetic-loader__draw {
  stroke-dasharray: 600;
  stroke-dashoffset: 600;
  animation-name: noveo-loader-stroke-draw;
  animation-iteration-count: infinite;
  animation-direction: alternate;
  animation-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
}

.noveo-kinetic-loader__bar-track {
  width: min(100%, clamp(148px, 52vw, 192px));
  height: 4px;
  margin-top: clamp(20px, 5vw, 32px);
  border-radius: 999px;
  overflow: hidden;
  border: 1px solid var(--neo-loader-track-border);
  background: var(--neo-loader-track-bg);
}

.noveo-kinetic-loader__bar {
  height: 100%;
  border-radius: inherit;
  background: var(--neo-loader-coral);
  transition: width 150ms ease-out;
}

.noveo-kinetic-loader__status {
  margin-top: clamp(12px, 3vw, 16px);
  color: var(--neo-loader-status);
  font-family: 'JetBrains Mono', 'Space Grotesk', monospace;
  font-size: clamp(9px, 2.4vw, 10px);
  font-weight: 600;
  letter-spacing: 0.16em;
  text-align: center;
  text-transform: uppercase;
}
</style>
