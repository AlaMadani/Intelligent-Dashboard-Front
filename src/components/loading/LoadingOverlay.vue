<template>
  <Transition name="noveo-loader-overlay">
    <div
      v-if="visible"
      class="noveo-loading-overlay"
      :class="`noveo-loading-overlay--${placement}`"
      aria-live="polite"
      aria-busy="true"
    >
      <noveocare-kinetic-loader
        :active="visible"
        :messages="resolvedMessages"
        :cycle-duration-ms="cycleDurationMs"
      />
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import {
  acquireLoaderScrollLock,
  releaseLoaderScrollLock,
} from 'src/composables/useLoaderScrollLock';
import { i18n } from 'src/boot/i18n';
import NoveocareKineticLoader from './NoveocareKineticLoader.vue';

type LoaderContext = 'auth' | 'fetch' | 'llm';
type LoaderPlacement = 'viewport' | 'panel';

const props = withDefaults(
  defineProps<{
    show?: boolean;
    context?: LoaderContext;
    placement?: LoaderPlacement;
    messages?: string[];
    cycleDurationMs?: number;
  }>(),
  {
    show: false,
    context: 'fetch',
    placement: 'viewport',
    cycleDurationMs: 2400,
  },
);

const { t } = useI18n();

const visible = ref(false);

const resolvedMessages = computed(() => {
  if (props.messages?.length) {
    return props.messages;
  }

  const translated = i18n.global.tm(`loader.context.${props.context}`);
  if (Array.isArray(translated) && translated.length) {
    return translated.map((entry) => String(entry));
  }

  return [t('loader.defaultStatus')];
});

watch(
  () => props.show,
  (shouldShow) => {
    if (shouldShow) {
      visible.value = true;
      return;
    }

    if (!visible.value) {
      return;
    }

    visible.value = false;
  },
  { immediate: true },
);

watch(visible, (isVisible) => {
  if (isVisible) {
    acquireLoaderScrollLock();
    return;
  }

  releaseLoaderScrollLock();
});

onBeforeUnmount(() => {
  if (visible.value) {
    visible.value = false;
    releaseLoaderScrollLock();
  }
});

</script>

<style scoped>
.noveo-loading-overlay {
  z-index: 12;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  border-radius: inherit;
  background: transparent;
  backdrop-filter: blur(var(--neo-loader-blur, 16px)) saturate(1.08);
  -webkit-backdrop-filter: blur(var(--neo-loader-blur, 16px)) saturate(1.08);
  pointer-events: all;
  touch-action: none;
  overscroll-behavior: contain;
}

.noveo-loading-overlay--viewport {
  position: sticky;
  top: 0;
  height: var(--neo-loader-viewport-height);
  margin-bottom: calc(-1 * var(--neo-loader-viewport-height));
}

.noveo-loading-overlay--panel {
  position: absolute;
  inset: 0;
  min-height: 100%;
}

.noveo-loader-overlay-enter-active,
.noveo-loader-overlay-leave-active {
  transition: opacity 300ms ease;
}

.noveo-loader-overlay-enter-from,
.noveo-loader-overlay-leave-to {
  opacity: 0;
}
</style>
