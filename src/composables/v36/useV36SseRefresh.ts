import { onBeforeUnmount, onMounted, ref } from 'vue';
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

const connected = ref(false);
const error = ref('');

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

const connect = () => {
  if (eventSource || typeof EventSource === 'undefined') return;

  try {
    eventSource = new EventSource(getLiveStatsStreamUrl());
  } catch {
    connected.value = false;
    error.value = 'Unable to connect to V3.6.1 refresh stream.';
    return;
  }

  eventSource.onopen = () => {
    connected.value = true;
    error.value = '';
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
    error.value = 'V3.6.1 refresh stream interrupted.';
  };
};

const disconnect = () => {
  eventSource?.close();
  eventSource = null;
  connected.value = false;
};

export const useV36SseRefresh = (targets: V36RefreshTarget[], handler: RefreshHandler) => {
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
    }
  });

  return {
    connected,
    error,
  };
};
