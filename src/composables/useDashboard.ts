import { computed, onMounted, onUnmounted, ref, shallowRef } from 'vue';
import {
  getActiveAnomaly,
  getAnomalyExplanation,
  getAnomalyStreamUrl,
  getLiveStatsStreamUrl,
  getLiveStats,
  getNextActions,
  getRiskProfile,
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
import { formatDurationSeconds, formatPercent } from 'src/utils/format';

const createDashboardStore = () => {
  const sessions = ref<SessionAnalysisDto[]>([]);
  const anomalies = ref<AnomalyEventDto[]>([]);
  const streamAlerts = ref<AnomalyEventDto[]>([]);
  const sessionMeta = ref<PaginationMeta | null>(null);
  const anomalyMeta = ref<PaginationMeta | null>(null);
  const anomalousSessionsTotal = ref(0);

  const analyticsLoading = ref(false);
  const analyticsError = ref('');

  const liveStats = shallowRef<StatsResponseDto | null>(null);
  const trendStats = shallowRef<StatsResponseDto | null>(null);
  const statsError = ref('');

  const anomalySearch = ref('');
  const sessionSearch = ref('');

  const insuredIdInput = ref('');
  const riskProfile = ref<UserRiskProfileDto | null>(null);
  const nextActions = ref<NextActionPredictionDto | null>(null);
  const activeAnomaly = ref<AnomalyAlertDto | null>(null);
  const userLoading = ref(false);
  const userError = ref('');

  const selectedAnomalyKey = ref('');
  const selectedSessionDetail = ref<SessionAnalysisDto | null>(null);
  const selectedSessionLoading = ref(false);
  const anomalyExplanation = shallowRef<AnomalyExplanationDto | null>(null);
  const explanationLoading = ref(false);
  const explanationError = ref('');

  const latestStreamAlert = ref<AnomalyEventDto | null>(null);
  const streamConnected = ref(false);
  const streamError = ref('');

  let anomalyStream: EventSource | null = null;
  let liveStatsStream: EventSource | null = null;
  let liveToastTimeoutId: number | null = null;
  let started = false;
  const eventsSinceLoad = ref(0);
  const lastUpdated = ref<Date | null>(null);

  const totalSessions = computed(
    () => sessionMeta.value?.totalElements ?? sessions.value.length
  );
  const totalAnomalies = computed(
    () => anomalyMeta.value?.totalElements ?? anomalies.value.length
  );
  const anomalousSessions = computed(() => anomalousSessionsTotal.value);

  const avgSessionDuration = computed(() => {
    if (!sessions.value.length) return 'n/a';
    const total = sessions.value.reduce(
      (acc, session) => acc + (session.sessionDurationSeconds ?? 0),
      0
    );
    return formatDurationSeconds(total / sessions.value.length);
  });

  const liveStatsPayload = computed(() => {
    const payload = liveStats.value?.payload;
    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return null;
    return payload as Record<string, unknown>;
  });

  const activeSessions = computed(() => numberOrNa(liveStatsPayload.value?.active_sessions));
  const eventsPerMinute = computed(() =>
    numberOrNa(liveStatsPayload.value?.events_per_minute)
  );
  const anomalyRate = computed(() =>
    formatPercent(toNumber(liveStatsPayload.value?.anomaly_alert_rate_last_hour), 1)
  );
  const koRate = computed(() =>
    formatPercent(toNumber(liveStatsPayload.value?.ko_rate_last_15m), 1)
  );

  const selectedAnomaly = computed(() => {
    const key = selectedAnomalyKey.value;
    if (!key) return null;
    return (
      anomalies.value.find((event) => anomalyKey(event) === key) ??
      streamAlerts.value.find((event) => anomalyKey(event) === key) ??
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
          session.insuredId === anomaly.insuredId && session.sessionId === anomaly.sessionId
      ) ?? null
    );
  });

  const loadAnalytics = async () => {
    analyticsLoading.value = true;
    analyticsError.value = '';

    try {
      const [sessionsResponse, anomaliesResponse, anomalousSessionsResponse] =
        await Promise.all([
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

  const loadStats = async () => {
    statsError.value = '';

    try {
      const today = new Date().toISOString().slice(0, 10);
      const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000)
        .toISOString()
        .slice(0, 10);

      const [liveResponse, trendResponse] = await Promise.all([
        getLiveStats(today),
        getTrendStats(tomorrow),
      ]);

      liveStats.value = liveResponse.data ?? null;
      trendStats.value = trendResponse.data ?? null;
    } catch {
      statsError.value = 'Unable to load live stats.';
    }
  };

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
        getRiskProfile(insuredId).then((response) => response.data).catch(() => null),
        getNextActions(insuredId).then((response) => response.data).catch(() => null),
        getActiveAnomaly(insuredId).then((response) => response.data).catch(() => null),
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

  const loadSelectedSession = async (event: AnomalyEventDto) => {
    const existingSession =
      sessions.value.find(
        (session) =>
          session.insuredId === event.insuredId && session.sessionId === event.sessionId
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
    } finally {
      selectedSessionLoading.value = false;
    }
  };

  const selectAnomaly = async (event: AnomalyEventDto) => {
    const nextKey = anomalyKey(event);
    if (selectedAnomalyKey.value !== nextKey) {
      selectedSessionDetail.value = null;
      anomalyExplanation.value = null;
      explanationError.value = '';
    }

    selectedAnomalyKey.value = nextKey;
    insuredIdInput.value = event.insuredId;
    await Promise.all([loadUserInsights(), loadSelectedSession(event)]);
  };

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

  const connectAnomalyStream = () => {
    closeAnomalyStream();

    try {
      anomalyStream = new EventSource(getAnomalyStreamUrl());
    } catch {
      streamConnected.value = false;
      streamError.value = 'Unable to connect to the live anomaly stream.';
      return;
    }

    anomalyStream.addEventListener('connected', () => {
      streamConnected.value = true;
      streamError.value = '';
    });

    anomalyStream.addEventListener('anomaly', (event) => {
      streamConnected.value = true;
      streamError.value = '';

      if (!(event instanceof MessageEvent) || typeof event.data !== 'string') return;

      try {
        handleStreamAlert(JSON.parse(event.data) as AnomalyEventDto);
      } catch {
        streamError.value = 'Live anomaly stream delivered an unreadable event.';
      }
    });

    anomalyStream.onerror = () => {
      streamConnected.value = false;
      streamError.value =
        'Live anomaly stream interrupted. The browser will retry automatically.';
    };
  };

  const closeAnomalyStream = () => {
    anomalyStream?.close();
    anomalyStream = null;
  };

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

  const handleStreamAlert = (event: AnomalyEventDto) => {
    streamAlerts.value = upsertNewest(streamAlerts.value, event, 8);
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

  const start = () => {
    if (started) return;
    started = true;

    void loadAnalytics();
    void loadStats();
    connectAnomalyStream();
    connectLiveStatsStream();
  };

  const stop = () => {
    if (!started) return;
    started = false;

    closeAnomalyStream();
    closeLiveStatsStream();

    if (liveToastTimeoutId != null) {
      window.clearTimeout(liveToastTimeoutId);
      liveToastTimeoutId = null;
    }

    latestStreamAlert.value = null;
  };

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

const anomalyKey = (event: AnomalyEventDto) =>
  event.id != null
    ? `id:${event.id}`
    : `${event.insuredId}:${event.sessionId}:${event.eventId}:${event.detectedAt ?? ''}`;

const mergeNewest = (primary: AnomalyEventDto[], secondary: AnomalyEventDto[]) => {
  let merged = primary;
  for (const item of secondary) {
    merged = upsertNewest(merged, item, 40);
  }
  return merged;
};

const upsertNewest = (items: AnomalyEventDto[], event: AnomalyEventDto, limit: number) => {
  const key = anomalyKey(event);
  const next = items.filter((item) => anomalyKey(item) !== key);
  return [event, ...next].slice(0, limit);
};

const upsertSession = (
  items: SessionAnalysisDto[],
  session: SessionAnalysisDto,
  limit: number
) => {
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

export const useDashboard = (): DashboardPublicApi => {
  const store = getDashboardStore();

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
