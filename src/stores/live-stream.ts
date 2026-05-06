import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import { i18n } from 'src/boot/i18n';
import type { AnomalyEventDto } from 'src/types/analytics';
import { getLiveStatsStreamUrl, listAnomalyEvents } from 'src/services/analytics';
import { anomalyEventKey } from 'src/utils/dashboard';

const MAX_ALERTS = 50;
const FALLBACK_REFRESH_MS = 30000;
const REFRESH_TARGETS = new Set(['alerts', 'risky-sessions']);

const resolveRefreshTarget = (payload: string) => {
  if (!payload) return '';
  try {
    const parsed = JSON.parse(payload) as Record<string, unknown>;
    return typeof parsed.refresh === 'string' ? parsed.refresh : '';
  } catch {
    return '';
  }
};

export const useLiveStreamStore = defineStore('liveStream', () => {
  const alerts = ref<AnomalyEventDto[]>([]);
  const connected = ref(false);
  const error = ref('');
  const eventsReceived = ref(0);
  const latestAlert = ref<AnomalyEventDto | null>(null);
  const latestKey = ref('');

  let eventSource: EventSource | null = null;
  let refreshInterval: number | null = null;
  let refCount = 0;
  let lastSeenKey = '';

  const connectionLabel = computed(() =>
    connected.value ? i18n.global.t('common.connected') : i18n.global.t('common.reconnecting'),
  );

  const ingestAlerts = (nextAlerts: AnomalyEventDto[]) => {
    alerts.value = nextAlerts.slice(0, MAX_ALERTS);

    const nextLatest = alerts.value[0] ?? null;
    const nextKey = nextLatest ? anomalyEventKey(nextLatest) : '';
    if (!nextKey || nextKey === lastSeenKey) {
      return;
    }

    lastSeenKey = nextKey;
    latestKey.value = nextKey;
    latestAlert.value = nextLatest;
    eventsReceived.value += 1;
  };

  const refreshAlerts = async () => {
    try {
      const response = await listAnomalyEvents({ page: 0, size: MAX_ALERTS });
      ingestAlerts(response.data ?? []);
      if (connected.value) {
        error.value = '';
      }
    } catch {
      error.value = i18n.global.t('liveStreamStore.errors.refreshAlerts');
    }
  };

  const startFallbackRefresh = () => {
    if (refreshInterval != null) return;
    refreshInterval = window.setInterval(() => {
      void refreshAlerts();
    }, FALLBACK_REFRESH_MS);
  };

  const stopFallbackRefresh = () => {
    if (refreshInterval == null) return;
    window.clearInterval(refreshInterval);
    refreshInterval = null;
  };

  const connect = () => {
    refCount += 1;
    if (refCount > 1) return;

    void refreshAlerts();
    startFallbackRefresh();

    try {
      eventSource = new EventSource(getLiveStatsStreamUrl());
    } catch {
      connected.value = false;
      error.value = i18n.global.t('liveStreamStore.errors.streamConnect');
      return;
    }

    eventSource.onopen = () => {
      connected.value = true;
      error.value = '';
    };

    eventSource.addEventListener('refresh', (event) => {
      const refreshTarget = resolveRefreshTarget((event as MessageEvent<string>).data);
      if (REFRESH_TARGETS.has(refreshTarget)) {
        void refreshAlerts();
      }
    });

    eventSource.onerror = () => {
      connected.value = false;
      error.value = i18n.global.t('liveStreamStore.errors.streamInterrupted');
    };
  };

  const disconnect = () => {
    refCount = Math.max(0, refCount - 1);
    if (refCount > 0) return;

    eventSource?.close();
    eventSource = null;
    stopFallbackRefresh();
    connected.value = false;
  };

  return {
    alerts,
    connected,
    error,
    eventsReceived,
    latestAlert,
    latestKey,
    connectionLabel,
    connect,
    disconnect,
  };
});
