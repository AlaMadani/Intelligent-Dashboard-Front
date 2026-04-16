// Shared dashboard composable: centralize data fetching, live streams, and cross-page selection state.
import { computed, onMounted, onUnmounted, ref, shallowRef, watch } from 'vue';
import { storeToRefs } from 'pinia';
import {
  getActiveAnomaly,
  getAnomalyExplanation,
  getLiveStatsStreamUrl,
  getLiveStats,
  getNextActions,
  getRiskProfile,
  getSessionInsight,
  getTrendStats,
  listAnomalyEvents,
  listSessions,
} from 'src/services/analytics';
import type {
  AnomalyAlertDto,
  AnomalyEventDto,
  AnomalyExplanationDto,
  NextActionPredictionDto,
  SessionAnalysisDto,
  StatsResponseDto,
  UserRiskProfileDto,
} from 'src/types/analytics';
import type { PaginationMeta } from 'src/types/api';
import { anomalyEventKey } from 'src/utils/dashboard';
import { formatDurationSeconds, formatPercent } from 'src/utils/format';
import { useLiveStreamStore } from 'src/stores/live-stream';

// Factory creates the singleton dashboard store shared across the routed dashboard pages.
const createDashboardStore = () => {
  // Core analytics datasets and pagination metadata backing the overview, tables, and workbench.
  const sessions = ref<SessionAnalysisDto[]>([]);
  const anomalies = ref<AnomalyEventDto[]>([]);
  const liveStream = useLiveStreamStore();
  const {
    alerts: streamAlerts,
    connected: streamConnected,
    error: streamError,
    latestAlert: streamLatestAlert,
    latestKey: streamLatestKey,
  } =
    storeToRefs(liveStream);
  const sessionMeta = ref<PaginationMeta | null>(null);
  const anomalyMeta = ref<PaginationMeta | null>(null);
  const anomalousSessionsTotal = ref(0);

  // Loading and error flags for analytics and stats requests.
  const analyticsLoading = ref(false);
  const analyticsError = ref('');

  const liveStats = shallowRef<StatsResponseDto | null>(null);
  const trendStats = shallowRef<StatsResponseDto | null>(null);
  const statsError = ref('');

  const anomalySearch = ref('');
  const sessionSearch = ref('');

  // User-focused context for insured lookup, risk enrichment, and active anomaly details.
  const insuredIdInput = ref('');
  const riskProfile = ref<UserRiskProfileDto | null>(null);
  const nextActions = ref<NextActionPredictionDto | null>(null);
  const activeAnomaly = ref<AnomalyAlertDto | null>(null);
  const userLoading = ref(false);
  const userError = ref('');

  const selectedAnomalyKey = ref('');
  const selectedSessionDetail = ref<SessionAnalysisDto | null>(null);
  /** When SQL session row is missing, Redis may still hold `session:insight:*` for active sessions. */
  const liveSessionInsight = ref<Record<string, unknown> | null>(null);
  const selectedSessionLoading = ref(false);
  const anomalyExplanation = shallowRef<AnomalyExplanationDto | null>(null);
  const explanationLoading = ref(false);
  const explanationError = ref('');

  // Live stream connection state and ephemeral UI feedback.
  const latestStreamAlert = ref<AnomalyEventDto | null>(null);

  let liveStatsStream: EventSource | null = null;
  let liveToastTimeoutId: number | null = null;
  let started = false;
  const eventsSinceLoad = ref(0);
  const lastUpdated = ref<Date | null>(null);

  // Summary metrics derived from the loaded sessions, anomalies, and live stats payloads.
  const totalSessions = computed(() => sessionMeta.value?.totalElements ?? sessions.value.length);
  const totalAnomalies = computed(() => anomalyMeta.value?.totalElements ?? anomalies.value.length);
  const anomalousSessions = computed(() => anomalousSessionsTotal.value);

  const avgSessionDuration = computed(() => {
    if (!sessions.value.length) return 'n/a';
    const total = sessions.value.reduce(
      (acc, session) => acc + (session.sessionDurationSeconds ?? 0),
      0,
    );
    return formatDurationSeconds(total / sessions.value.length);
  });

  const liveStatsPayload = computed(() => {
    const payload = liveStats.value?.payload;
    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return null;
    return payload as Record<string, unknown>;
  });

  const activeSessions = computed(() => numberOrNa(liveStatsPayload.value?.active_sessions));
  const eventsPerMinute = computed(() => numberOrNa(liveStatsPayload.value?.events_per_minute));
  const anomalyRate = computed(() =>
    formatPercent(toNumber(liveStatsPayload.value?.anomaly_alert_rate_last_hour), 1),
  );
  const koRate = computed(() =>
    formatPercent(toNumber(liveStatsPayload.value?.ko_rate_last_15m), 1),
  );

  // Selection helpers resolve the active anomaly and its matching session detail.
  const selectedAnomaly = computed(() => {
    const key = selectedAnomalyKey.value;
    if (!key) return null;
    return (
      anomalies.value.find((event) => anomalyEventKey(event) === key) ??
      streamAlerts.value.find((event) => anomalyEventKey(event) === key) ??
      null
    );
  });

  const selectedSession = computed(() => {
    const anomaly = selectedAnomaly.value;
    if (!anomaly) return null;
    return (
      selectedSessionDetail.value ??
      sessions.value.find(
        (session) =>
          session.insuredId === anomaly.insuredId && session.sessionId === anomaly.sessionId,
      ) ??
      null
    );
  });

  // Initial analytics loaders fetch tables and aggregate counts from the REST API.
  const loadAnalytics = async () => {
    analyticsLoading.value = true;
    analyticsError.value = '';

    try {
      const [sessionsResponse, anomaliesResponse, anomalousSessionsResponse] = await Promise.all([
        listSessions({ page: 0, size: 40 }),
        listAnomalyEvents({ page: 0, size: 40 }),
        listSessions({ page: 0, size: 1, isAnomaly: true }),
      ]);

      sessions.value = sessionsResponse.data ?? [];
      sessionMeta.value = sessionsResponse.meta ?? null;
      anomalies.value = mergeNewest(anomaliesResponse.data ?? [], streamAlerts.value);
      anomalyMeta.value = anomaliesResponse.meta ?? null;
      anomalousSessionsTotal.value = anomalousSessionsResponse.meta?.totalElements ?? 0;

      if (!selectedAnomalyKey.value && anomalies.value.length) {
        const firstAnomaly = anomalies.value[0];
        if (firstAnomaly) {
          await selectAnomaly(firstAnomaly);
        }
      }
    } catch {
      analyticsError.value = 'Unable to load analytics data. Check the API service.';
    } finally {
      analyticsLoading.value = false;
    }
  };

  // Stats loader hydrates the live overview counters and trend forecast panel.
  const loadStats = async () => {
    statsError.value = '';

    try {
      const today = new Date().toISOString().slice(0, 10);

      const [liveResponse, trendResponse] = await Promise.all([
        getLiveStats(today),
        getTrendStats(today),
      ]);

      liveStats.value = liveResponse.data ?? null;
      trendStats.value = trendResponse.data ?? null;
    } catch {
      statsError.value = 'Unable to load live stats.';
    }
  };

  // User lookup loader enriches the currently selected or searched insured.
  const loadUserInsights = async () => {
    const insuredId = insuredIdInput.value.trim();
    if (!insuredId) {
      userError.value = 'Enter an insured ID to load insights.';
      return;
    }

    userLoading.value = true;
    userError.value = '';

    try {
      const [risk, next, active] = await Promise.all([
        getRiskProfile(insuredId)
          .then((response) => response.data)
          .catch(() => null),
        getNextActions(insuredId)
          .then((response) => response.data)
          .catch(() => null),
        getActiveAnomaly(insuredId)
          .then((response) => response.data)
          .catch(() => null),
      ]);

      riskProfile.value = risk;
      nextActions.value = next;
      activeAnomaly.value = active;

      if (!risk && !next && !active) {
        userError.value = 'No data found for this insured.';
      }
    } finally {
      userLoading.value = false;
    }
  };

  // When an anomaly is selected, fetch the matching session if it is not already cached locally.
  const loadSelectedSession = async (event: AnomalyEventDto) => {
    liveSessionInsight.value = null;

    const existingSession =
      sessions.value.find(
        (session) => session.insuredId === event.insuredId && session.sessionId === event.sessionId,
      ) ?? null;

    if (existingSession) {
      selectedSessionDetail.value = existingSession;
      return;
    }

    selectedSessionLoading.value = true;
    selectedSessionDetail.value = null;

    try {
      let page = 0;
      let totalPages = 1;

      while (page < totalPages && page < 5) {
        const response = await listSessions({
          insuredId: event.insuredId,
          page,
          size: 100,
        });

        const matchedSession =
          response.data.find((session) => session.sessionId === event.sessionId) ?? null;

        if (matchedSession) {
          selectedSessionDetail.value = matchedSession;
          sessions.value = upsertSession(sessions.value, matchedSession, 60);
          return;
        }

        totalPages = response.meta?.totalPages ?? page + 1;
        page += 1;
      }

      try {
        const insight = await getSessionInsight(event.insuredId, event.sessionId);
        if (insight.data != null && typeof insight.data === 'object' && !Array.isArray(insight.data)) {
          liveSessionInsight.value = insight.data as Record<string, unknown>;
        }
      } catch {
        liveSessionInsight.value = null;
      }
    } finally {
      selectedSessionLoading.value = false;
    }
  };

  // Selection orchestration keeps the anomaly, insured lookup, and session context aligned.
  const selectAnomaly = async (event: AnomalyEventDto) => {
    const nextKey = anomalyEventKey(event);
    if (selectedAnomalyKey.value !== nextKey) {
      selectedSessionDetail.value = null;
      liveSessionInsight.value = null;
      anomalyExplanation.value = null;
      explanationError.value = '';
    }

    selectedAnomalyKey.value = nextKey;
    insuredIdInput.value = event.insuredId;
    await Promise.all([loadUserInsights(), loadSelectedSession(event)]);
  };

  // AI explanation requests are only allowed for anomalies that already exist in persistent storage.
  const generateExplanation = async () => {
    const selected = selectedAnomaly.value;
    if (!selected || selected.id == null) {
      explanationError.value = 'This live alert has not been persisted yet. Retry in a moment.';
      return;
    }

    explanationLoading.value = true;
    explanationError.value = '';

    try {
      const response = await getAnomalyExplanation(selected.id);
      anomalyExplanation.value = response.data ?? null;

      if (!response.data) {
        explanationError.value = 'The API returned no explanation for this anomaly.';
      }
    } catch {
      explanationError.value = 'Unable to explain this anomaly right now.';
    } finally {
      explanationLoading.value = false;
    }
  };

  // Bridge live STOMP alerts from Pinia into local anomaly/session state.
  let lastHandledAlertKey = '';
  watch(
    streamLatestKey,
    () => {
      const key = streamLatestKey.value;
      if (!key || key === lastHandledAlertKey || !streamLatestAlert.value) return;
      handleStreamAlert(streamLatestAlert.value);
      lastHandledAlertKey = key;
    },
  );

  const connectLiveStatsStream = () => {
    closeLiveStatsStream();

    try {
      liveStatsStream = new EventSource(getLiveStatsStreamUrl());
    } catch {
      statsError.value = 'Unable to connect to live stats stream.';
      return;
    }

    liveStatsStream.addEventListener('stats', (event) => {
      try {
        const stats = JSON.parse(event.data);
        liveStats.value = stats;
        lastUpdated.value = new Date();
        eventsSinceLoad.value += 1;
      } catch {
        statsError.value = 'Failed to parse live stats.';
      }
    });

    liveStatsStream.onerror = () => {
      // It will auto-reconnect
      console.warn('Live stats stream interrupted.');
    };
  };

  const closeLiveStatsStream = () => {
    liveStatsStream?.close();
    liveStatsStream = null;
  };

  // Streamed alerts are merged into memory and surfaced to the UI as a temporary toast.
  const handleStreamAlert = (event: AnomalyEventDto) => {
    anomalies.value = upsertNewest(anomalies.value, event, 40);
    latestStreamAlert.value = event;

    if (anomalyMeta.value) {
      const exceedsLoadedRows = anomalyMeta.value.totalElements > anomalies.value.length;
      if (!exceedsLoadedRows) {
        anomalyMeta.value = {
          ...anomalyMeta.value,
          totalElements: Math.max(anomalyMeta.value.totalElements, anomalies.value.length),
        };
      }
    }

    if (!selectedAnomalyKey.value) {
      void selectAnomaly(event);
    }

    if (liveToastTimeoutId != null) {
      window.clearTimeout(liveToastTimeoutId);
    }

    liveToastTimeoutId = window.setTimeout(() => {
      latestStreamAlert.value = null;
    }, 8000);
  };

  // Public lifecycle controls start background work once and tear it down safely when unused.
  const start = () => {
    if (started) return;
    started = true;

    void loadAnalytics();
    void loadStats();
    liveStream.connect();
    connectLiveStatsStream();
  };

  const stop = () => {
    if (!started) return;
    started = false;

    liveStream.disconnect();
    closeLiveStatsStream();

    if (liveToastTimeoutId != null) {
      window.clearTimeout(liveToastTimeoutId);
      liveToastTimeoutId = null;
    }

    latestStreamAlert.value = null;
  };

  // Expose reactive state and actions consumed by the routed dashboard pages.
  return {
    sessions,
    anomalies,
    streamAlerts,
    analyticsLoading,
    analyticsError,
    liveStats,
    trendStats,
    statsError,
    anomalySearch,
    sessionSearch,
    insuredIdInput,
    riskProfile,
    nextActions,
    activeAnomaly,
    userLoading,
    userError,
    selectedAnomalyKey,
    selectedAnomaly,
    selectedSession,
    liveSessionInsight,
    selectedSessionLoading,
    anomalyExplanation,
    explanationLoading,
    explanationError,
    latestStreamAlert,
    streamConnected,
    streamError,
    totalSessions,
    totalAnomalies,
    anomalousSessions,
    avgSessionDuration,
    activeSessions,
    eventsPerMinute,
    anomalyRate,
    koRate,
    lastUpdated,
    eventsSinceLoad,
    loadAnalytics,
    loadStats,
    loadUserInsights,
    selectAnomaly,
    generateExplanation,
    start,
    stop,
  };
};

// Singleton bookkeeping keeps one shared store instance alive across multiple route consumers.
type DashboardStore = ReturnType<typeof createDashboardStore>;
type DashboardPublicApi = Omit<DashboardStore, 'start' | 'stop'>;

let dashboardStore: DashboardStore | null = null;
let activeConsumers = 0;
let stopTimeoutId: number | null = null;

const getDashboardStore = () => {
  if (!dashboardStore) {
    dashboardStore = createDashboardStore();
  }
  return dashboardStore;
};

// Helper utilities keep anomaly and session collections deduplicated and consistently formatted.
const mergeNewest = (primary: AnomalyEventDto[], secondary: AnomalyEventDto[]) => {
  let merged = primary;
  for (const item of secondary) {
    merged = upsertNewest(merged, item, 40);
  }
  return merged;
};

const upsertNewest = (items: AnomalyEventDto[], event: AnomalyEventDto, limit: number) => {
  const key = anomalyEventKey(event);
  const next = items.filter((item) => anomalyEventKey(item) !== key);
  return [event, ...next].slice(0, limit);
};

const upsertSession = (items: SessionAnalysisDto[], session: SessionAnalysisDto, limit: number) => {
  const next = items.filter((item) => item.id !== session.id);
  return [session, ...next].slice(0, limit);
};

const toNumber = (value: unknown) => {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isNaN(parsed) ? null : parsed;
  }
  return null;
};

const numberOrNa = (value: unknown) => {
  const parsed = toNumber(value);
  return parsed == null ? 'n/a' : parsed.toLocaleString('en-GB');
};

// Route consumers subscribe to the shared store and automatically manage start/stop lifecycles.
export const useDashboard = (): DashboardPublicApi => {
  const store = getDashboardStore();

  // Start streams when the first consumer mounts and stop only after the last one unmounts.
  onMounted(() => {
    activeConsumers += 1;

    if (stopTimeoutId != null) {
      window.clearTimeout(stopTimeoutId);
      stopTimeoutId = null;
    }

    store.start();
  });

  onUnmounted(() => {
    activeConsumers = Math.max(0, activeConsumers - 1);

    if (activeConsumers > 0) return;

    stopTimeoutId = window.setTimeout(() => {
      if (activeConsumers === 0) {
        store.stop();
      }
      stopTimeoutId = null;
    }, 0);
  });

  return store;
};
