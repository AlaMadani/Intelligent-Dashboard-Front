<template>
  <div class="neo-live-badge">
    <q-chip
      v-if="connected"
      size="sm"
      color="positive"
      text-color="white"
      icon="signal_wifi_4_bar"
      :label="t('live.connected')"
    />
    <q-chip
      v-else-if="connecting"
      size="sm"
      color="warning"
      text-color="white"
      icon="signal_wifi_off"
      :label="t('live.connecting')"
    >
      <q-tooltip>{{ t('live.reconnect') }}</q-tooltip>
    </q-chip>
    <q-chip
      v-else
      size="sm"
      color="negative"
      text-color="white"
      icon="wifi_off"
      :label="t('live.disconnected')"
    >
      <q-tooltip>{{ t('live.reconnect') }}</q-tooltip>
    </q-chip>
    <span
      v-if="lastEventAt && connected"
      class="neo-live-badge__timestamp text-caption text-grey"
    >
      {{ t('live.lastUpdate') }} {{ formatTime(lastEventAt) }}
    </span>
  </div>
</template>

<script setup lang="ts">
// ---- Imports ----
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

// ---- Props ----
defineProps<{
  connected: boolean;
  connecting?: boolean;
  lastEventAt?: Date | null;
}>();

// ---- Methods ----
const formatTime = (date: Date) => {
  const hh = String(date.getHours()).padStart(2, '0');
  const mm = String(date.getMinutes()).padStart(2, '0');
  const ss = String(date.getSeconds()).padStart(2, '0');
  return `${hh}:${mm}:${ss}`;
};
</script>

// ---- Styles ----
<style scoped>
.neo-live-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}
.neo-live-badge__timestamp {
  white-space: nowrap;
}
</style>
