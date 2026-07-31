import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { getLiveStatsStreamUrl } from 'src/services/analytics';

export type V36RefreshTarget =
  | 'stats'
  | 'refresh'
  | 'alerts'
  | 'security-overview'
  | 'runtime-health'
  | 'churn'
  | 'forecast';

type RefreshHandler = (target: V36RefreshTarget, payload: Record<string, unknown>) => void;

export interface UseV36SseRefreshOptions {
  pollIntervalMs?: number;
  pollAction?: () => void;
}

// ---- Module-Level State ----
const listeners = new Map<V36RefreshTarget, Set<RefreshHandler>>();
const eventNames: V36RefreshTarget[] = [
  'stats',
  'alerts',
  'security-overview',
  'runtime-health',
  'churn',
  'forecast',
];

let eventSource: EventSource | null = null;
let refCount = 0;
let pollTimer: ReturnType<typeof setInterval> | null = null;
let globalPollAction: (() => void) | null = null;
let globalPollIntervalMs = 30000;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;

const connected = ref(false);
const connecting = ref(false);
const error = ref('');
const lastEventAt = ref<Date | null>(null);

// ---- Core Functions ----
const parsePayload = (data: string): Record<string, unknown> => {
  if (!data) return {};
  try {
    const parsed = JSON.parse(data) as unknown;
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : {};
  } catch {
    return {};
  }
};

const dispatch = (target: V36RefreshTarget, payload: Record<string, unknown>) => {
  lastEventAt.value = new Date();
  listeners.get(target)?.forEach((handler) => {
    handler(target, payload);
  });
};

const dispatchRefreshPayload = (payload: Record<string, unknown>) => {
  const refresh = payload.refresh;
  if (typeof refresh !== 'string') return;

  if (eventNames.includes(refresh as V36RefreshTarget)) {
    dispatch(refresh as V36RefreshTarget, payload);
  }
};

const startPolling = () => {
  stopPolling();
  if (!globalPollAction) return;
  pollTimer = setInterval(globalPollAction, globalPollIntervalMs);
};

const stopPolling = () => {
  if (pollTimer !== null) {
    clearInterval(pollTimer);
    pollTimer = null;
  }
};

const disconnect = () => {
  if (reconnectTimer !== null) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
  eventSource?.close();
  eventSource = null;
  connected.value = false;
  connecting.value = false;
};

const connect = () => {
  if (typeof EventSource === 'undefined') {
    startPolling();
    return;
  }

  try {
    eventSource = new EventSource(getLiveStatsStreamUrl());
  } catch {
    connected.value = false;
    connecting.value = false;
    error.value = 'Unable to connect to V3.6.1 refresh stream.';
    startPolling();
    return;
  }

  connecting.value = true;

  eventSource.onopen = () => {
    connected.value = true;
    connecting.value = false;
    error.value = '';
    stopPolling();
  };

  eventNames.forEach((eventName) => {
    eventSource?.addEventListener(eventName, (event) => {
      const payload = parsePayload((event as MessageEvent<string>).data);
      dispatch(eventName, payload);
    });
  });

  eventSource.addEventListener('refresh', (event) => {
    const payload = parsePayload((event as MessageEvent<string>).data);
    dispatch('refresh', payload);
    dispatchRefreshPayload(payload);
  });

  eventSource.onerror = () => {
    connected.value = false;
    connecting.value = true;
    error.value = 'V3.6.1 refresh stream interrupted. Auto-reconnecting…';
    startPolling();

    if (reconnectTimer !== null) {
      clearTimeout(reconnectTimer);
    }
    reconnectTimer = setTimeout(() => {
      if (!connected.value && eventSource === null) {
        connect();
      }
    }, 5000);
  };
};

const reconnect = () => {
  disconnect();
  connect();
};

// ---- Composable ----
export const useV36SseRefresh = (
  targets: V36RefreshTarget[],
  handler: RefreshHandler,
  options?: UseV36SseRefreshOptions,
) => {
  if (options?.pollIntervalMs) {
    globalPollIntervalMs = options.pollIntervalMs;
  }
  if (options?.pollAction) {
    globalPollAction = options.pollAction;
  }

  onMounted(() => {
    refCount += 1;
    targets.forEach((target) => {
      const targetListeners = listeners.get(target) ?? new Set<RefreshHandler>();
      targetListeners.add(handler);
      listeners.set(target, targetListeners);
    });
    connect();
  });

  onBeforeUnmount(() => {
    targets.forEach((target) => {
      const targetListeners = listeners.get(target);
      targetListeners?.delete(handler);
      if (targetListeners?.size === 0) {
        listeners.delete(target);
      }
    });

    refCount = Math.max(0, refCount - 1);
    if (refCount === 0) {
      disconnect();
      stopPolling();
      globalPollAction = null;
    }
  });

  // ---- Return ----
  return {
    connected,
    connecting,
    disconnected: computed(() => !connected.value && !connecting.value),
    error,
    lastEventAt,
    reconnect,
    close: disconnect,
  };
};

// ---- State Accessor ----
export const useV36SseState = () => ({
  connected,
  connecting,
  disconnected: computed(() => !connected.value && !connecting.value),
  error,
  lastEventAt,
  reconnect,
});


