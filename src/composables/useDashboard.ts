// Shared dashboard composable: centralize data fetching, live streams, and cross-page selection state.
import { computed, onMounted, onUnmounted, ref, shallowRef, watch } from 'vue';
import { storeToRefs } from 'pinia';
import {
  getActiveAnomaly,
  getActiveSessions,
  getAnomalyInvestigation,
  getAnomalyExplanation,
  getCommandCenter,
  getLiveStatsStreamUrl,
  getLiveStats,
  getNextActions,
  getRiskProfile,
  getSessionInsight,
  getTrendStats,
  getStatsSummary,
  getHealth,
  getDashboardSnapshot,
  listAnomalyEvents,
  listSessions,
} from 'src/services/analytics';
import type {
  ActiveSessionDto,
  AnomalyAlertDto,
  AnomalyEventDto,
  AnomalyExplanationDto,
  AnomalyInvestigationDto,
  CommandCenterDto,
  NextActionPredictionDto,
  SessionAnalysisDto,
  StatsResponseDto,
  StatsSummaryDto,
  UserRiskProfileDto,
} from 'src/types/analytics';
import type { PaginationMeta } from 'src/types/api';
import type { JsonValue } from 'src/types/api';
import { i18n } from 'src/boot/i18n';
import { anomalyEventKey } from 'src/utils/dashboard';
import { formatDurationSeconds, formatNumber, formatPercent } from 'src/utils/format';
import { useLiveStreamStore } from 'src/stores/live-stream';

const ANALYTICS_PAGE_SIZE = 200;
const COLLECTION_LIMIT = 200;
const STREAM_REFRESH_DEBOUNCE_MS = 400;
const FULL_REFRESH_FALLBACK_MS = 60000;

const translate = (key: string, params?: Record<string, unknown>) =>
  params ? i18n.global.t(key, params) : i18n.global.t(key);

const formatRiskLevel = (value: unknown) => {
  if (typeof value !== 'string' || value.trim().length === 0) {
    return translate('common.low');
  }

  switch (value.trim().toUpperCase()) {
    case 'CRITICAL':
      return translate('common.critical');
    case 'HIGH':
      return translate('common.high');
    case 'MEDIUM':
      return translate('common.medium');
    case 'LOW':
      return translate('common.low');
    default: {
      const normalized = value.trim().toLowerCase();
      return normalized.charAt(0).toUpperCase() + normalized.slice(1);
    }
  }
};

// Factory creates the singleton dashboard store shared across the routed dashboard pages.
const createDashboardStore = () => {
  // Core analytics datasets and pagination metadata backing the overview, tables, and workbench.
  const sessions = shallowRef<SessionAnalysisDto[]>([]);
  const anomalies = shallowRef<AnomalyEventDto[]>([]);
  const liveStream = useLiveStreamStore();
  const {
    alerts: streamAlerts,
    connected: streamConnected,
    error: streamError,
    latestAlert: streamLatestAlert,
    latestKey: streamLatestKey,
  } = storeToRefs(liveStream);
  const sessionMeta = ref<PaginationMeta | null>(null);
  const anomalyMeta = ref<PaginationMeta | null>(null);
  const anomalousSessionsTotal = ref(0);

  // Loading and error flags for analytics and stats requests.
  const analyticsLoading = ref(false);
  const analyticsError = ref('');

  const commandCenter = shallowRef<CommandCenterDto | null>(null);
  const commandCenterLoading = ref(false);
  const liveStats = shallowRef<StatsResponseDto | null>(null);
  const trendStats = shallowRef<StatsResponseDto | null>(null);
  const clusterMix = shallowRef<JsonValue>(null);
  const dropOffs = shallowRef<JsonValue>(null);
  const pathDeviations = shallowRef<JsonValue>(null);
  const statsError = ref('');
  const activeSessionRows = shallowRef<ActiveSessionDto[]>([]);
  const activeSessionsLoading = ref(false);
  const activeSessionsError = ref('');

  const statsSummary = ref<StatsSummaryDto | null>(null);
  const statsSummaryLoading = ref(false);
  const healthStatus = ref<Record<string, unknown> | null>(null);
  const healthLoading = ref(false);

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
  const selectedInvestigation = shallowRef<AnomalyInvestigationDto | null>(null);
  const selectedSessionDetail = shallowRef<SessionAnalysisDto | null>(null);
  /** When SQL session row is missing, Redis may still hold `session:insight:*` for active sessions. */
  const liveSessionInsight = ref<Record<string, unknown> | null>(null);
  const selectedSessionLoading = ref(false);
  const anomalyExplanation = shallowRef<AnomalyExplanationDto | null>(null);
  const explanationLoading = ref(false);
  const explanationError = ref('');

  // Live stream connection state and ephemeral UI feedback.
  const latestStreamAlert = ref<AnomalyEventDto | null>(null);

  let liveStatsStream: EventSource | null = null;
  let refreshInterval: number | null = null;
  let refreshDebounceId: number | null = null;
  let liveToastTimeoutId: number | null = null;
  let liveUpdateTimeoutId: number | null = null;
  let started = false;
  let hasLoadedOnce = false;
  const eventsSinceLoad = ref(0);
  const lastUpdated = ref<Date | null>(null);
  let pendingRefresh = {
    analytics: false,
    stats: false,
    activeSessions: false,
  };

  const setLiveUpdate = () => {
    document.body.setAttribute('data-live-update', 'true');
    if (liveUpdateTimeoutId != null) window.clearTimeout(liveUpdateTimeoutId);
    liveUpdateTimeoutId = window.setTimeout(() => {
      document.body.removeAttribute('data-live-update');
      liveUpdateTimeoutId = null;
    }, 400);
  };

  // Summary metrics derived from the loaded sessions, anomalies, and live stats payloads.
  const totalSessions = computed(() => sessionMeta.value?.totalElements ?? sessions.value.length);
  const totalAnomalies = computed(() => anomalyMeta.value?.totalElements ?? anomalies.value.length);
  const anomalousSessions = computed(() => anomalousSessionsTotal.value);

  const avgSessionDuration = computed(() => {
    if (!sessions.value.length) return translate('common.notAvailable');
    let total = 0;
    for (const session of sessions.value) {
      total += session.sessionDurationSeconds ?? 0;
    }
    return formatDurationSeconds(total / sessions.value.length);
  });

  const liveStatsPayload = computed(() => {
    const payload = liveStats.value?.payload;
    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return null;
    return payload as Record<string, unknown>;
  });

  const readLiveStat = (...keys: string[]) => {
    const payload = liveStatsPayload.value;
    if (!payload) return null;
    for (const key of keys) {
      if (key in payload && payload[key] != null) {
        return payload[key];
      }
    }
    return null;
  };

  const activeSessions = computed(() => {
    const value = numberOrNa(readLiveStat('active_sessions', 'activeSessions'));
    return value ?? '0';
  });
  const eventsPerMinute = computed(() => {
    const value = numberOrNa(readLiveStat('events_per_minute', 'eventsPerMinute'));
    return value ?? '0';
  });
  const anomalyRate = computed(() =>
    formatPercent(
      toNumber(
        readLiveStat(
          'current_anomaly_rate',
          'currentAnomalyRate',
          'anomaly_alert_rate_last_hour',
          'anomalyAlertRateLastHour',
        ),
      ) ??
        0,
      1,
    ),
  );
  const globalRiskLevel = computed(() => {
    return formatRiskLevel(readLiveStat('global_risk_level', 'globalRiskLevel'));
  });

  // Selection helpers resolve the active anomaly and its matching session detail.
  const selectedAnomaly = computed<AnomalyEventDto | null>(() => {
    const key = selectedAnomalyKey.value;
    if (!key) return null;
    for (const event of anomalies.value) {
      if (anomalyEventKey(event) === key) return event;
    }
    for (const event of streamAlerts.value) {
      if (anomalyEventKey(event) === key) return event;
    }
    return null;
  });

  const selectedSession = shallowRef<SessionAnalysisDto | null>(null);

  const syncSelectedSession = () => {
    const anomaly = selectedAnomaly.value;
    if (!anomaly) {
      selectedSession.value = null;
      return;
    }

    if (selectedSessionDetail.value) {
      selectedSession.value = selectedSessionDetail.value;
      return;
    }

    for (const session of sessions.value) {
      if (session.insuredId === anomaly.insuredId && session.sessionId === anomaly.sessionId) {
        selectedSession.value = session;
        return;
      }
    }

    selectedSession.value = null;
  };

  watch(selectedAnomalyKey, syncSelectedSession);
  watch(selectedSessionDetail, syncSelectedSession);
  watch(sessions, syncSelectedSession);

  // Initial analytics loaders fetch tables and aggregate counts from the REST API.
  const loadAnalytics = async () => {
    setLiveUpdate();
    if (!hasLoadedOnce) analyticsLoading.value = true;
    analyticsError.value = '';

    try {
      const [sessionsResponse, anomaliesResponse, anomalousSessionsResponse] = await Promise.all([
        listSessions({ page: 0, size: ANALYTICS_PAGE_SIZE }),
        listAnomalyEvents({ page: 0, size: ANALYTICS_PAGE_SIZE }),
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
      analyticsError.value = translate('dashboardState.errors.analyticsLoad');
    } finally {
      analyticsLoading.value = false;
    }
  };

  // Stats loader hydrates the live overview counters and trend forecast panel.
  const isStatsSource = (value: unknown): value is StatsResponseDto['source'] =>
    value === 'redis' || value === 'missing' || value === 'sql';

  const isStatsResponseDto = (value: unknown): value is StatsResponseDto => {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      return false;
    }

    const record = value as Record<string, unknown>;

    return typeof record.date === 'string' && isStatsSource(record.source) && 'payload' in record;
  };

  const normalizeStatsDto = (value: unknown): StatsResponseDto | null => {
    if (isStatsResponseDto(value)) {
      return value;
    }

    if (value && typeof value === 'object' && !Array.isArray(value)) {
      const record = value as Record<string, unknown>;
      if (isStatsResponseDto(record.data)) {
        return record.data;
      }
    }

    return null;
  };

  const hasNonEmptyTrendPayload = (stats: StatsResponseDto | null): boolean => {
    const payload = stats?.payload;

    if (Array.isArray(payload)) {
      return payload.length > 0;
    }

    if (!payload || typeof payload !== 'object') {
      return false;
    }

    const record = payload as Record<string, unknown>;

    const direct =
      record.total_events &&
      typeof record.total_events === 'object' &&
      !Array.isArray(record.total_events)
        ? (record.total_events as Record<string, unknown>).points
        : null;

    if (Array.isArray(direct)) {
      return direct.length > 0;
    }

    const wrappedItems =
      record.items && typeof record.items === 'object' && !Array.isArray(record.items)
        ? (record.items as Record<string, unknown>).total_events
        : null;

    const wrappedPoints =
      wrappedItems && typeof wrappedItems === 'object' && !Array.isArray(wrappedItems)
        ? (wrappedItems as Record<string, unknown>).points
        : null;

    return Array.isArray(wrappedPoints) && wrappedPoints.length > 0;
  };

  // Stats loader hydrates the live overview counters and trend forecast panel.
  const loadStats = async () => {
    setLiveUpdate();
    if (!hasLoadedOnce) commandCenterLoading.value = true;
    statsError.value = '';

    try {
      const today = new Date().toISOString().slice(0, 10);

      const [commandCenterResponse, liveResponse, trendResponse, clusterResponse, dropoffsResponse, pathsResponse] = await Promise.all([
        getCommandCenter(today),
        getLiveStats(today),
        getTrendStats(today),
        getDashboardSnapshot('cluster-mix').catch(() => null),
        getDashboardSnapshot('drop-offs').catch(() => null),
        getDashboardSnapshot('path-deviations').catch(() => null),
      ]);

      commandCenter.value = commandCenterResponse.data ?? null;
      const commandCenterData = commandCenter.value;

      const commandCenterLive = normalizeStatsDto(commandCenterData?.liveStats ?? null);
      const commandCenterTrend = normalizeStatsDto(
        commandCenterData?.trendForecast ?? null,
      );

      const dedicatedLive = normalizeStatsDto(liveResponse.data);
      const dedicatedTrend = normalizeStatsDto(trendResponse.data);

      liveStats.value = dedicatedLive ?? commandCenterLive ?? null;

      // IMPORTANT: prefer the dedicated forecast endpoint because commandCenter trendForecast may be empty
      trendStats.value = hasNonEmptyTrendPayload(dedicatedTrend)
        ? dedicatedTrend
        : hasNonEmptyTrendPayload(commandCenterTrend)
          ? commandCenterTrend
          : (dedicatedTrend ?? commandCenterTrend ?? null);

      if (liveStats.value) {
        lastUpdated.value = new Date();
      }

      clusterMix.value = clusterResponse?.data ?? commandCenterData?.clusterMix ?? null;
      dropOffs.value = dropoffsResponse?.data ?? commandCenterData?.dropOffs ?? null;
      pathDeviations.value = pathsResponse?.data ?? commandCenterData?.pathDeviations ?? null;
    } catch {
      statsError.value = translate('dashboardState.errors.liveStatsLoad');
    } finally {
      commandCenterLoading.value = false;
    }
  };

  const loadActiveSessions = async () => {
    setLiveUpdate();
    if (!hasLoadedOnce) activeSessionsLoading.value = true;
    activeSessionsError.value = '';

    try {
      const response = await getActiveSessions({ limit: 60 });
      activeSessionRows.value = response.data ?? [];
    } catch {
      activeSessionsError.value = translate('dashboardState.errors.activeSessionsLoad');
    } finally {
      activeSessionsLoading.value = false;
    }
  };

  const scheduleRefresh = (request: {
    analytics?: boolean;
    stats?: boolean;
    activeSessions?: boolean;
  }) => {
    pendingRefresh.analytics ||= Boolean(request.analytics);
    pendingRefresh.stats ||= Boolean(request.stats);
    pendingRefresh.activeSessions ||= Boolean(request.activeSessions);

    if (refreshDebounceId != null) {
      return;
    }

    refreshDebounceId = window.setTimeout(() => {
      const next = pendingRefresh;
      pendingRefresh = {
        analytics: false,
        stats: false,
        activeSessions: false,
      };
      refreshDebounceId = null;

      if (next.analytics) {
        void loadAnalytics();
      }
      if (next.stats) {
        void loadStats();
      }
      if (next.activeSessions) {
        void loadActiveSessions();
      }
    }, STREAM_REFRESH_DEBOUNCE_MS);
  };

  const loadStatsSummary = async () => {
    setLiveUpdate();
    if (!hasLoadedOnce) statsSummaryLoading.value = true;
    try {
      const response = await getStatsSummary();
      statsSummary.value = response.data ?? null;
    } catch {
      // silently fail — summary is non-critical
    } finally {
      statsSummaryLoading.value = false;
    }
  };

  const loadHealth = async () => {
    setLiveUpdate();
    if (!hasLoadedOnce) healthLoading.value = true;
    try {
      const response = await getHealth();
      healthStatus.value = response.data ?? null;
    } catch {
      healthStatus.value = { status: 'DOWN', checks: {}, timestamp: new Date().toISOString() };
    } finally {
      healthLoading.value = false;
    }
  };

  // User lookup loader enriches the currently selected or searched insured.
  const loadUserInsights = async () => {
    const insuredId = insuredIdInput.value.trim();
    if (!insuredId) {
      userError.value = translate('dashboardState.errors.insuredRequired');
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
        userError.value = translate('dashboardState.errors.insuredNotFound');
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
          size: ANALYTICS_PAGE_SIZE,
        });

        const matchedSession =
          response.data.find((session) => session.sessionId === event.sessionId) ?? null;

        if (matchedSession) {
          selectedSessionDetail.value = matchedSession;
          sessions.value = upsertSession(sessions.value, matchedSession, COLLECTION_LIMIT);
          return;
        }

        totalPages = response.meta?.totalPages ?? page + 1;
        page += 1;
      }

      try {
        const insight = await getSessionInsight(event.insuredId, event.sessionId);
        if (
          insight.data != null &&
          typeof insight.data === 'object' &&
          !Array.isArray(insight.data)
        ) {
          liveSessionInsight.value = insight.data as Record<string, unknown>;
        }
      } catch {
        liveSessionInsight.value = null;
      }
    } finally {
      selectedSessionLoading.value = false;
    }
  };

  const loadSelectedInvestigation = async (event: AnomalyEventDto) => {
    selectedSessionLoading.value = true;
    selectedInvestigation.value = null;
    liveSessionInsight.value = null;
    selectedSessionDetail.value = null;

    if (event.id == null) {
      try {
        await Promise.all([loadUserInsights(), loadSelectedSession(event)]);
      } finally {
        anomalyExplanation.value = hydrateExplanation(event, selectedSessionDetail.value, null);
        selectedSessionLoading.value = false;
      }
      return;
    }

    try {
      const response = await getAnomalyInvestigation(event.id);
      const investigation = response.data ?? null;
      selectedInvestigation.value = investigation;
      selectedSessionDetail.value = investigation?.sessionAnalysis ?? null;
      riskProfile.value = investigation?.riskProfile ?? null;
      nextActions.value = investigation?.nextActions ?? null;
      activeAnomaly.value = investigation?.activeAnomaly ?? null;
      liveSessionInsight.value = toRecord(investigation?.liveSession ?? null);
      anomalyExplanation.value = hydrateExplanation(
        investigation?.anomaly ?? event,
        investigation?.sessionAnalysis ?? null,
        investigation?.liveSession ?? null,
      );

      if (investigation?.anomaly) {
        anomalies.value = upsertNewest(anomalies.value, investigation.anomaly, 40);
      }
    } catch {
      await Promise.all([loadUserInsights(), loadSelectedSession(event)]);
      anomalyExplanation.value = hydrateExplanation(event, selectedSessionDetail.value, null);
    } finally {
      selectedSessionLoading.value = false;
    }
  };

  // Selection orchestration keeps the anomaly, insured lookup, and session context aligned.
  const selectAnomaly = async (event: AnomalyEventDto) => {
    const nextKey = anomalyEventKey(event);
    if (selectedAnomalyKey.value !== nextKey) {
      selectedInvestigation.value = null;
      selectedSessionDetail.value = null;
      liveSessionInsight.value = null;
      anomalyExplanation.value = null;
      explanationError.value = '';
    }

    selectedAnomalyKey.value = nextKey;
    insuredIdInput.value = event.insuredId;
    await loadSelectedInvestigation(event);
  };

  // AI explanation requests are only allowed for anomalies that already exist in persistent storage.
  const generateExplanation = async () => {
    const selected = selectedAnomaly.value;
    if (!selected || selected.id == null) {
      explanationError.value = translate('dashboardState.errors.liveAlertPending');
      return;
    }

    explanationLoading.value = true;
    explanationError.value = '';

    try {
      const response = await getAnomalyExplanation(selected.id);
      anomalyExplanation.value =
        response.data ??
        hydrateExplanation(
          selected,
          selectedSessionDetail.value,
          toActiveSession(liveSessionInsight.value),
        );

      if (!response.data) {
        explanationError.value = translate('dashboardState.errors.explanationMissing');
      }
    } catch {
      explanationError.value = translate('dashboardState.errors.explanationLoad');
    } finally {
      explanationLoading.value = false;
    }
  };

// Bridge live STOMP alerts from Pinia into local anomaly/session state.
  let lastHandledAlertKey = '';
  watch(streamLatestKey, () => {
    const key = streamLatestKey.value;
    if (!key || key === lastHandledAlertKey || !streamLatestAlert.value) return;
    handleStreamAlert(streamLatestAlert.value);
    lastHandledAlertKey = key;
  });

  const connectLiveStatsStream = () => {
    closeLiveStatsStream();

    try {
      liveStatsStream = new EventSource(getLiveStatsStreamUrl());
    } catch {
      statsError.value = translate('dashboardState.errors.liveStatsStreamConnect');
      return;
    }

liveStatsStream.addEventListener('stats', (event) => {
      setLiveUpdate();
      try {
        const stats = JSON.parse(event.data);
        liveStats.value = stats;
        lastUpdated.value = new Date();
        eventsSinceLoad.value += 1;
      } catch {
        statsError.value = translate('dashboardState.errors.liveStatsParse');
      }
    });

liveStatsStream.addEventListener('refresh', (event) => {
      setLiveUpdate();
      const refreshTarget = resolveRefreshTarget(event.data);
      if (!refreshTarget) {
        return;
      }

      if (refreshTarget === 'stats') {
        scheduleRefresh({ activeSessions: true });
        return;
      }

      if (refreshTarget === 'alerts') {
        scheduleRefresh({ analytics: true, stats: true, activeSessions: true });
        return;
      }

      if (refreshTarget === 'risky-sessions') {
        scheduleRefresh({ analytics: true, stats: true, activeSessions: true });
        return;
      }

      scheduleRefresh({ stats: true });
    });

    liveStatsStream.onerror = () => {
      // It will auto-reconnect
      console.warn(translate('dashboardState.logs.liveStatsInterrupted'));
    };
  };

  const closeLiveStatsStream = () => {
    liveStatsStream?.close();
    liveStatsStream = null;
  };

  // Streamed alerts are merged into memory and surfaced to the UI as a temporary toast.
  const handleStreamAlert = (event: AnomalyEventDto) => {
    setLiveUpdate();
    anomalies.value = upsertNewest(anomalies.value, event, COLLECTION_LIMIT);
    latestStreamAlert.value = event;
    scheduleRefresh({ analytics: true, stats: true, activeSessions: true });

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

    void loadAnalytics().then(() => { hasLoadedOnce = true; });
    void loadStats();
    void loadStatsSummary();
    void loadHealth();
    void loadActiveSessions();
    liveStream.connect();
    connectLiveStatsStream();
    
    // Keep a low-frequency fallback refresh in case a tab misses live events.
    refreshInterval = window.setInterval(() => {
      setLiveUpdate();
      void loadStatsSummary();
      void loadHealth();
      scheduleRefresh({ analytics: true, stats: true, activeSessions: true });
    }, FULL_REFRESH_FALLBACK_MS);
  };

  const stop = () => {
    if (!started) return;
    started = false;

    liveStream.disconnect();
    closeLiveStatsStream();
    
    if (refreshInterval != null) {
      window.clearInterval(refreshInterval);
      refreshInterval = null;
    }

    if (refreshDebounceId != null) {
      window.clearTimeout(refreshDebounceId);
      refreshDebounceId = null;
    }

    pendingRefresh = {
      analytics: false,
      stats: false,
      activeSessions: false,
    };

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
    clusterMix,
    dropOffs,
    pathDeviations,
    commandCenter,
    commandCenterLoading,
    statsError,
    activeSessionRows,
    activeSessionsLoading,
    activeSessionsError,
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
    selectedInvestigation,
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
    globalRiskLevel,
    statsSummary,
    statsSummaryLoading,
    healthStatus,
    healthLoading,
    lastUpdated,
    eventsSinceLoad,
    loadAnalytics,
    loadStats,
    loadStatsSummary,
    loadActiveSessions,
    loadHealth,
    loadUserInsights,
    selectAnomaly,
    generateExplanation,
    start,
    stop,
  };
};;

// Singleton bookkeeping keeps one shared store instance alive across multiple route consumers.
type DashboardStore = ReturnType<typeof createDashboardStore>;
type DashboardPublicApi = Omit<DashboardStore, 'start' | 'stop'>;
type ExplanationEventContext = Pick<AnomalyEventDto, 'id' | 'eventContext'>;
type ExplanationSessionContext = Pick<SessionAnalysisDto, 'explainabilityText'>;
type ExplanationLiveSessionContext = Pick<ActiveSessionDto, 'explainabilityText'>;

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
    merged = upsertNewest(merged, item, COLLECTION_LIMIT);
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
  return parsed == null ? null : formatNumber(parsed);
};

const toRecord = (value: unknown): Record<string, unknown> | null => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
};

const readExplanationText = (
  event: ExplanationEventContext | null,
  session: ExplanationSessionContext | null,
  liveSession: ExplanationLiveSessionContext | null,
) => {
  if (session?.explainabilityText) return session.explainabilityText;
  if (liveSession?.explainabilityText) return liveSession.explainabilityText;
  const eventContext =
    toRecord(event?.eventContext) ?? null;
  const text = eventContext?.explainabilityText;
  return typeof text === 'string' && text.trim().length > 0 ? text : null;
};

const hydrateExplanation = (
  event: ExplanationEventContext | null,
  session: ExplanationSessionContext | null,
  liveSession: ExplanationLiveSessionContext | null,
): AnomalyExplanationDto | null => {
  const explanation = readExplanationText(event, session, liveSession);
  if (!explanation) return null;
  return {
    anomalyEventId: event?.id ?? 0,
    source: session?.explainabilityText ? 'session-analysis' : liveSession?.explainabilityText ? 'session-insight' : 'anomaly-context',
    model: 'data-processor',
    generatedAt: new Date().toISOString(),
    cached: true,
    explanation,
  };
};

const toActiveSession = (value: Record<string, unknown> | null): ExplanationLiveSessionContext | null => {
  if (!value) return null;
  return value as unknown as ExplanationLiveSessionContext;
};

const resolveRefreshTarget = (payload: string) => {
  if (!payload) {
    return '';
  }

  try {
    const parsed = JSON.parse(payload) as Record<string, unknown>;
    return typeof parsed.refresh === 'string' ? parsed.refresh : '';
  } catch {
    return '';
  }
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
