<template>
  <q-icon
    name="info_outline"
    :size="size"
    class="metric-info-icon"
    tabindex="0"
    :aria-label="ariaLabel || text"
  >
    <q-tooltip
      anchor="top middle"
      self="bottom middle"
      :max-width="maxWidth"
      class="text-body2"
    >
      {{ text }}
    </q-tooltip>
  </q-icon>
</template>

<script setup lang="ts">
// ---- Props ----
withDefaults(defineProps<{
  text: string
  size?: string
  maxWidth?: string
  ariaLabel?: string
}>(), {
  size: '16px',
  maxWidth: '300px',
});
</script>
