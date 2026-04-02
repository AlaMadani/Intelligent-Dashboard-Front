<template>
  <q-page class="neo-page">
    <OverviewHero
      :total-sessions="totalSessions"
      :anomalous-sessions="anomalousSessions"
      :total-anomalies="totalAnomalies"
      :avg-session-duration="avgSessionDuration"
      @navigate="scrollToSection"
    />

    <div v-if="latestStreamAlert" class="neo-live-toast">
      <div class="neo-live-toast-title">Live anomaly alert received</div>
      <div class="neo-live-toast-body">
        {{ latestStreamAlert.insuredId }} · {{ latestStreamAlert.anomalyTier }} ·
        {{ latestStreamAlert.anomalyType || 'UNKNOWN' }} ·
        {{ formatDate(latestStreamAlert.detectedAt) }}
      </div>
    </div>

    <KpiStrip
      :active-sessions="activeSessions"
      :events-per-minute="eventsPerMinute"
      :anomaly-rate="anomalyRate"
      :ko-rate="koRate"
    />

    <AnomalyEventsSection
      :events="anomalies"
      :loading="analyticsLoading"
      :error="analyticsError"
      :search="anomalySearch"
      :selected-event-key="selectedAnomalyKey"
      @update:search="(value) => (anomalySearch = value)"
      @select="selectAnomaly"
    />

    <AnomalyWorkbenchSection
      :selected-event="selectedAnomaly"
      :selected-event-key="selectedAnomalyKey"
      :stream-alerts="streamAlerts"
      :stream-connected="streamConnected"
      :stream-error="streamError"
      :session-analysis="selectedSession"
      :session-analysis-loading="false"
      :risk-profile="riskProfile"
      :next-actions="nextActions"
      :active-anomaly="activeAnomaly"
      :explanation="anomalyExplanation"
      :explanation-loading="explanationLoading"
      :explanation-error="explanationError"
      @select-alert="selectAnomaly"
      @generate-explanation="generateExplanation"
    />

    <SessionsSection
      :sessions="sessions"
      :loading="analyticsLoading"
      :error="analyticsError"
      :search="sessionSearch"
      @update:search="(value) => (sessionSearch = value)"
    />

    <UserInsightsSection
      :insured-id="insuredIdInput"
      :risk-profile="riskProfile"
      :next-actions="nextActions"
      :active-anomaly="activeAnomaly"
      :loading="userLoading"
      :error="userError"
      @update:insured-id="(value) => (insuredIdInput = value)"
      @load="loadUserInsights"
    />

    <AnalyticsSection
      :sessions="sessions"
      :anomalies="anomalies"
      :live-stats="liveStats"
      :trend-stats="trendStats"
      :loading="analyticsLoading"
      :error="analyticsError || statsError"
    />
  </q-page>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, shallowRef } from 'vue';
import AnalyticsSection from 'src/components/dashboard/AnalyticsSection.vue';
import AnomalyEventsSection from 'src/components/dashboard/AnomalyEventsSection.vue';
import AnomalyWorkbenchSection from 'src/components/dashboard/AnomalyWorkbenchSection.vue';
import KpiStrip from 'src/components/dashboard/KpiStrip.vue';
import OverviewHero from 'src/components/dashboard/OverviewHero.vue';
import SessionsSection from 'src/components/dashboard/SessionsSection.vue';
import UserInsightsSection from 'src/components/dashboard/UserInsightsSection.vue';
import {
  getActiveAnomaly,
  getAnomalyExplanation,
  getAnomalyStreamUrl,
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
import { formatDate, formatDurationSeconds, formatPercent } from 'src/utils/format';

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
const anomalyExplanation = shallowRef<AnomalyExplanationDto | null>(null);
const explanationLoading = ref(false);
const explanationError = ref('');

const latestStreamAlert = ref<AnomalyEventDto | null>(null);
const streamConnected = ref(false);
const streamError = ref('');

let anomalyStream: EventSource | null = null;
let statsIntervalId: number | null = null;
let liveToastTimeoutId: number | null = null;

const totalSessions = computed(() => sessionMeta.value?.totalElements ?? sessions.value.length);
const totalAnomalies = computed(() => anomalyMeta.value?.totalElements ?? anomalies.value.length);
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
const eventsPerMinute = computed(() => numberOrNa(liveStatsPayload.value?.events_per_minute));
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
    sessions.value.find(
      (session) =>
        session.insuredId === anomaly.insuredId && session.sessionId === anomaly.sessionId
    ) ?? null
  );
});

const anomalyKey = (event: AnomalyEventDto) =>
  event.id != null
    ? `id:${event.id}`
    : `${event.insuredId}:${event.sessionId}:${event.eventId}:${event.detectedAt ?? ''}`;

const scrollToSection = (id: string) => {
  const target = document.getElementById(id);
  if (!target) return;
  const header = document.querySelector<HTMLElement>('.neo-header');
  const headerOffset = header?.offsetHeight ?? 0;
  const offsetTop = target.getBoundingClientRect().top + window.scrollY - headerOffset - 12;
  window.scrollTo({ top: Math.max(0, offsetTop), behavior: 'smooth' });
};

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

const loadStats = async () => {
  statsError.value = '';
  try {
    const today = new Date().toISOString().slice(0, 10);
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
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
      getRiskProfile(insuredId).then((res) => res.data).catch(() => null),
      getNextActions(insuredId).then((res) => res.data).catch(() => null),
      getActiveAnomaly(insuredId).then((res) => res.data).catch(() => null),
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

const selectAnomaly = async (event: AnomalyEventDto) => {
  const nextKey = anomalyKey(event);
  if (selectedAnomalyKey.value !== nextKey) {
    anomalyExplanation.value = null;
    explanationError.value = '';
  }
  selectedAnomalyKey.value = nextKey;
  insuredIdInput.value = event.insuredId;
  await loadUserInsights();
};

const generateExplanation = async () => {
  const selected = selectedAnomaly.value;
  if (!selected?.id) {
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
  anomalyStream = new EventSource(getAnomalyStreamUrl());

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
    streamError.value = 'Live anomaly stream interrupted. The browser will retry automatically.';
  };
};

const closeAnomalyStream = () => {
  anomalyStream?.close();
  anomalyStream = null;
};

const handleStreamAlert = (event: AnomalyEventDto) => {
  streamAlerts.value = upsertNewest(streamAlerts.value, event, 8);
  anomalies.value = upsertNewest(anomalies.value, event, 40);
  latestStreamAlert.value = event;

  if (anomalyMeta.value) {
    const exists = (anomalyMeta.value.totalElements ?? 0) > anomalies.value.length;
    if (!exists) {
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

onMounted(() => {
  void loadAnalytics();
  void loadStats();
  connectAnomalyStream();
  statsIntervalId = window.setInterval(() => {
    void loadStats();
  }, 60_000);
});

onUnmounted(() => {
  closeAnomalyStream();
  if (statsIntervalId != null) {
    window.clearInterval(statsIntervalId);
  }
  if (liveToastTimeoutId != null) {
    window.clearTimeout(liveToastTimeoutId);
  }
});
</script>
