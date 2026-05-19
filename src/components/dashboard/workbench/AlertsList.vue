<template>
  <div class="neo-workbench-alerts">
    <div class="neo-panel neo-alerts-panel">
      <div class="neo-panel-header">
        <div>
          <div class="neo-panel-title">{{ t('anomalyWorkbenchSection.liveWireTitle') }}</div>
          <div class="neo-panel-subtitle">{{ t('anomalyWorkbenchSection.liveWireSubtitle') }}</div>
        </div>
        <div class="neo-live-pill" :class="{ 'is-loading': !streamConnected }">
          <span class="neo-live-dot"></span>
          {{ streamConnected ? t('common.connected') : t('common.reconnecting') }}
        </div>
      </div>

      <div v-if="streamError" class="neo-error">{{ streamError }}</div>
      <div v-else-if="!streamAlerts.length" class="neo-placeholder">
        {{ t('anomalyWorkbenchSection.waitingForAlerts') }}
      </div>
      <div v-else class="neo-alerts-list">
        <button
          v-for="alert in streamAlerts"
          :key="anomalyEventKey(alert)"
          type="button"
          class="neo-alert-item"
          :class="{ 'is-active': anomalyEventKey(alert) === selectedEventKey }"
          @click="emit('select-alert', alert)"
        >
          <span class="neo-alert-accent" :class="'neo-alert-accent--' + tierKey(alert.anomalyTier)"></span>
          <div class="neo-alert-body">
            <div class="neo-alert-head">
              <q-badge :color="tierColor(alert.anomalyTier)" text-color="white" class="neo-alert-badge">
                {{ alert.anomalyTier || t('common.unknown') }}
              </q-badge>
              <span class="neo-alert-time">{{ formatDate(alert.detectedAt) }}</span>
            </div>
            <div class="neo-alert-type">{{ alert.anomalyType || t('common.unknown') }}</div>
            <div class="neo-alert-meta">
              <span class="neo-alert-insured">{{ alert.insuredId }}</span>
              <span class="neo-alert-session">{{ alert.sessionId.slice(0, 8) }}&hellip;</span>
            </div>
          </div>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import type { AnomalyEventDto } from 'src/types/analytics';
import { formatDate } from 'src/utils/format';
import { anomalyEventKey } from 'src/utils/dashboard';

defineProps<{
  streamAlerts: AnomalyEventDto[];
  streamConnected: boolean;
  streamError: string;
  selectedEventKey: string;
}>();

const emit = defineEmits<{
  (event: 'select-alert', alert: AnomalyEventDto): void;
}>();

const { t } = useI18n();

const tierKey = (tier: string | null | undefined) => {
  if (tier === 'TIER3') return 'critical';
  if (tier === 'TIER2') return 'warning';
  if (tier === 'TIER1') return 'info';
  return 'default';
};

const tierColor = (tier: string | null | undefined) => {
  if (tier === 'TIER3') return 'negative';
  if (tier === 'TIER2') return 'warning';
  if (tier === 'TIER1') return 'primary';
  if (tier === 'SESSION_RUNTIME') return 'secondary';
  return 'grey';
};
</script>

<style scoped>
.neo-workbench-alerts {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.neo-alerts-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.neo-alerts-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
  overflow-y: auto;
  flex: 1;
  padding: 0;
  margin: 0;
}

.neo-alert-item {
  display: flex;
  align-items: stretch;
  gap: 8px;
  padding: 10px 12px;
  border: 1px solid var(--neo-border-color);
  border-radius: var(--neo-radius-control);
  background: rgba(255, 255, 255, 0.5);
  cursor: pointer;
  transition: all var(--neo-transition-fast);
  text-align: left;
  min-height: 70px;
}

.neo-alert-item:hover {
  border-color: var(--neo-border-strong);
  background: var(--neo-card-bg);
}

.neo-alert-item.is-active {
  border-color: var(--neo-accent);
  background: linear-gradient(135deg, var(--neo-accent-soft), rgba(47, 116, 107, 0.08));
}

.neo-alert-accent {
  width: 4px;
  border-radius: 999px;
  flex-shrink: 0;
}

.neo-alert-accent--critical {
  background: var(--neo-critical);
}

.neo-alert-accent--warning {
  background: var(--neo-warning);
}

.neo-alert-accent--info {
  background: var(--neo-info);
}

.neo-alert-accent--default {
  background: var(--neo-ink-muted);
}

.neo-alert-body {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
  min-width: 0;
}

.neo-alert-head {
  display: flex;
  align-items: center;
  gap: 8px;
}

.neo-alert-badge {
  font-size: 10px;
  letter-spacing: 0.04em;
  flex-shrink: 0;
}

.neo-alert-time {
  color: var(--neo-ink-muted);
  font-size: 11px;
  white-space: nowrap;
  margin-left: auto;
}

.neo-alert-type {
  color: var(--neo-ink);
  font-size: 13px;
  font-weight: 700;
  word-break: break-word;
}

.neo-alert-meta {
  display: flex;
  gap: 8px;
  font-size: 11px;
  color: var(--neo-ink-muted);
}

.neo-alert-insured {
  font-weight: 600;
  color: var(--neo-ink-soft);
}

.neo-alert-session {
  font-family: 'JetBrains Mono', monospace;
  opacity: 0.7;
}

.neo-error {
  padding: 12px 16px;
  border-radius: var(--neo-radius-card);
  background: var(--neo-critical-bg);
  color: var(--neo-critical-contrast);
  font-size: 13px;
  font-weight: 600;
}

.neo-placeholder {
  padding: 24px 16px;
  text-align: center;
  color: var(--neo-ink-muted);
  font-size: 13px;
}

.neo-live-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 999px;
  background: var(--neo-success-bg);
  color: var(--neo-success-contrast);
  font-size: 12px;
  font-weight: 600;
}

.neo-live-pill.is-loading {
  background: var(--neo-warning-bg);
  color: var(--neo-warning-contrast);
}

.neo-live-dot {
  width: 8px;
  height: 8px;
  border-radius: 999px;
  background: currentColor;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}
</style>
