<template>
  <div class="neo-card-actions" aria-label="Card actions">
    <q-btn
      flat
      dense
      round
      :icon="expanded ? 'close_fullscreen' : 'open_in_full'"
      class="neo-card-action"
      :aria-label="`${expanded ? 'Collapse' : 'Expand'} ${label}`"
      @click.stop="emit('expand')"
    >
      <q-tooltip anchor="top middle" self="bottom middle">
        {{ expanded ? 'Collapse' : 'Expand' }}
      </q-tooltip>
    </q-btn>

    <q-btn
      flat
      dense
      round
      icon="ios_share"
      class="neo-card-action"
      :aria-label="`Export ${label}`"
      @click.stop="emit('export')"
    >
      <q-tooltip anchor="top middle" self="bottom middle">Export snapshot</q-tooltip>
    </q-btn>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  label: string;
  expanded?: boolean;
}>();

const emit = defineEmits<{
  (event: 'expand'): void;
  (event: 'export'): void;
}>();
</script>
