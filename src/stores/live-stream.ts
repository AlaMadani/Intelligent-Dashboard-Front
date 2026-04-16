import { Client, type IMessage } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import type { AnomalyEventDto } from 'src/types/analytics';
import { api } from 'boot/axios';
import { anomalyEventKey } from 'src/utils/dashboard';

const MAX_ALERTS = 50;

const buildSocketUrl = () => {
  const baseUrl =
    typeof api.defaults.baseURL === 'string' && api.defaults.baseURL
      ? api.defaults.baseURL
      : window.location.origin;
  const url = new URL('/websocket', baseUrl);
  // SockJS expects an HTTP(S) endpoint for the initial handshake.
  if (url.protocol === 'https:') {
    url.protocol = 'https:';
  } else {
    url.protocol = 'http:';
  }
  return url.toString();
};

const parseAlert = (message: IMessage): AnomalyEventDto | null => {
  if (!message.body) return null;
  try {
    return JSON.parse(message.body) as AnomalyEventDto;
  } catch {
    return null;
  }
};

export const useLiveStreamStore = defineStore('liveStream', () => {
  const alerts = ref<AnomalyEventDto[]>([]);
  const connected = ref(false);
  const error = ref('');
  const eventsReceived = ref(0);
  const latestAlert = ref<AnomalyEventDto | null>(null);
  const latestKey = ref('');

  let client: Client | null = null;
  let refCount = 0;

  const connectionLabel = computed(() => (connected.value ? 'connected' : 'reconnecting'));

  const ingestAlert = (event: AnomalyEventDto) => {
    const key = anomalyEventKey(event);
    latestKey.value = key;
    latestAlert.value = event;
    eventsReceived.value += 1;
    alerts.value = [event, ...alerts.value.filter((item) => anomalyEventKey(item) !== key)].slice(
      0,
      MAX_ALERTS,
    );
  };

  const connect = () => {
    refCount += 1;
    if (client?.active) return;

    client = new Client({
      // Use SockJS factory so STOMP works against the SockJS-enabled Spring endpoint.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      webSocketFactory: () => new SockJS(buildSocketUrl(), null, { withCredentials: true } as any),
      reconnectDelay: 3000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
      onConnect: () => {
        connected.value = true;
        error.value = '';
        client?.subscribe('/topic/alerts', (message) => {
          const parsed = parseAlert(message);
          if (!parsed) {
            error.value = 'Received an unreadable alert frame from WebSocket.';
            return;
          }
          ingestAlert(parsed);
        });
      },
      onStompError: (frame) => {
        connected.value = false;
        error.value = frame.headers.message || 'WebSocket broker reported an error.';
      },
      onWebSocketClose: () => {
        connected.value = false;
      },
      onWebSocketError: () => {
        connected.value = false;
        error.value = 'WebSocket connection interrupted.';
      },
    });

    client.activate();
  };

  const disconnect = () => {
    refCount = Math.max(0, refCount - 1);
    if (refCount > 0) return;
    void client?.deactivate();
    client = null;
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
