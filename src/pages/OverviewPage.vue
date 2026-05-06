<template>
  <!-- Overview route: combine hero, live KPI strip, and executive summary panels. -->
  <q-page class="neo-page">
    <!-- Hero banner exposes top-level navigation and live posture metrics. -->
    <OverviewHero
      :total-sessions="totalSessions"
      :anomalous-sessions="anomalousSessions"
      :total-anomalies="totalAnomalies"
      :avg-session-duration="avgSessionDuration"
      :stream-connected="streamConnected"
      :last-updated="lastUpdated"
      :events-rate="eventsPerMinute"
      @navigate="(id) => router.push(id === 'overview' ? '/' : `/${id}`)"
    />

    <!-- Sticky toast surfaces the most recent anomaly received from the live stream. -->
    <div v-if="latestStreamAlert" class="neo-live-toast">
      <div class="neo-live-toast-title">{{ t('overviewPage.liveAlertTitle') }}</div>
      <div class="neo-live-toast-body">
        {{ latestStreamAlert.insuredId }} / {{ latestStreamAlert.anomalyTier }} /
        {{ latestStreamAlert.anomalyType || t('common.unknown') }} /
        {{ formatDate(latestStreamAlert.detectedAt) }}
      </div>
    </div>

    <!-- KPI strip highlights the live operational counters. -->
    <KpiStrip
      :active-sessions="activeSessions"
      :anomaly-rate="anomalyRate"
      :global-risk-level="globalRiskLevel"
      :events-per-minute="eventsPerMinute"
      :events-since-load="eventsSinceLoad"
      :last-updated="lastUpdated"
    />

    <section class="neo-section">
      <TrendForecastChart :trend-stats="trendStats" :live-value="eventsPerMinuteValue" />
    </section>

    <!-- Overview grid mixes trend charts, maps, and anomaly breakdown cards. -->
    <section class="neo-section neo-overview-grid">
      <article class="neo-overview-panel neo-overview-panel--wide">
        <div class="neo-overview-head">
          <div>
            <h3>{{ t('overviewPage.behaviorMomentumTitle') }}</h3>
            <p>{{ t('overviewPage.behaviorMomentumSubtitle') }}</p>
          </div>
          <div class="neo-overview-pill">
            {{ t('overviewPage.recentSessionsLoaded', { count: sessions.length }) }}
          </div>
        </div>

        <div class="neo-overview-signal-grid">
          <div class="neo-overview-signal-card">
            <div class="neo-overview-signal-label">
              {{ t('overviewPage.sessionDurationPulseLabel') }}
            </div>
            <SparkAreaChart
              :values="sessionDurationTrend"
              :labels="sessionTimelineLabels"
              :value-formatter="formatChartDuration"
              tone="primary"
            />
          </div>
          <div class="neo-overview-signal-card">
            <div class="neo-overview-signal-label">
              {{ t('overviewPage.actionVolumePulseLabel') }}
            </div>
            <SparkAreaChart
              :values="sessionActionTrend"
              :labels="sessionTimelineLabels"
              tone="warning"
            />
          </div>
        </div>

        <div class="neo-overview-mini-grid">
          <div class="neo-overview-mini-card">
            <span>{{ t('overviewPage.averageActionsLabel') }}</span>
            <strong>{{ averageActionVolume }}</strong>
          </div>
          <div class="neo-overview-mini-card">
            <span>{{ t('overviewPage.averageUniqueActionsLabel') }}</span>
            <strong>{{ averageUniqueActions }}</strong>
          </div>
          <div class="neo-overview-mini-card">
            <span>{{ t('overviewPage.latestAnomalyScoreLabel') }}</span>
            <strong>{{ latestAnomalyScore }}</strong>
          </div>
        </div>

        <div class="neo-overview-feed">
          <div v-for="session in recentSessions" :key="session.id" class="neo-overview-feed-row">
            <div>
              <div class="neo-overview-feed-title">{{ session.sessionId }}</div>
              <div class="neo-overview-feed-meta">{{ session.insuredId }}</div>
            </div>
            <div class="neo-overview-feed-side">
              <strong>{{ formatDate(session.startTime) }}</strong>
              <span>{{ session.isAnomaly ? t('common.anomaly') : t('common.observed') }}</span>
            </div>
          </div>
        </div>
      </article>

      <article class="neo-overview-panel neo-overview-panel--map">
        <div class="neo-overview-head">
          <div>
            <h3>{{ t('overviewPage.geolocationTitle') }}</h3>
            <p>{{ t('overviewPage.geolocationSubtitle') }}</p>
          </div>
        </div>
        <CountryActivityMap :countries="topCountries" />
      </article>

      <article class="neo-overview-panel">
        <div class="neo-overview-head">
          <div>
            <h3>{{ t('overviewPage.liveActionsTitle') }}</h3>
            <p>{{ t('overviewPage.liveActionsSubtitle') }}</p>
          </div>
        </div>
        <BarListChart :items="topActionBars" :empty-message="t('overviewPage.liveActionsEmpty')" />
      </article>

      <article class="neo-overview-panel">
        <div class="neo-overview-head">
          <div>
            <h3>{{ t('overviewPage.anomalyTierMixTitle') }}</h3>
            <p>{{ t('overviewPage.anomalyTierMixSubtitle') }}</p>
          </div>
        </div>
        <DonutBreakdownChart
          :segments="tierMixSegments"
          :center-label="t('overviewPage.anomalyTierMixCenterLabel')"
          :center-value="String(totalAnomalies)"
        />
      </article>

      <article class="neo-overview-panel">
        <div class="neo-overview-head">
          <div>
            <h3>{{ t('overviewPage.priorityAnomalyTypesTitle') }}</h3>
            <p>{{ t('overviewPage.priorityAnomalyTypesSubtitle') }}</p>
          </div>
        </div>
        <BarListChart
          :items="topAnomalyTypeBars"
          :empty-message="t('overviewPage.priorityAnomalyTypesEmpty')"
        />
      </article>

      <article class="neo-overview-panel">
        <div class="neo-overview-head">
          <div>
            <h3>{{ t('overviewPage.liveAlertFeedTitle') }}</h3>
            <p>{{ t('overviewPage.liveAlertFeedSubtitle') }}</p>
          </div>
        </div>
        <div v-if="!alertFeedItems.length" class="neo-overview-empty">
          {{ t('overviewPage.liveAlertFeedEmpty') }}
        </div>
        <div v-else class="neo-overview-feed">
          <div
            v-for="item in alertFeedItems"
            :key="item.key"
            class="neo-overview-feed-row neo-overview-feed-row--alert"
          >
            <div>
              <div class="neo-overview-feed-title">{{ item.anomalyType }}</div>
              <div class="neo-overview-feed-meta">{{ item.insuredId }} / {{ item.sessionId }}</div>
            </div>
            <div class="neo-overview-feed-side">
              <strong>{{ item.riskScore }}</strong>
              <span>{{ item.detectedAt }}</span>
            </div>
          </div>
        </div>
      </article>

      <article class="neo-overview-panel">
        <div class="neo-overview-head">
          <div>
            <h3>{{ t('overviewPage.hotSessionsTitle') }}</h3>
            <p>{{ t('overviewPage.hotSessionsSubtitle') }}</p>
          </div>
        </div>
        <div v-if="!riskySessionPreview.length" class="neo-overview-empty">
          {{ t('overviewPage.hotSessionsEmpty') }}
        </div>
        <div v-else class="neo-overview-feed">
          <div
            v-for="session in riskySessionPreview"
            :key="session.key"
            class="neo-overview-feed-row"
          >
            <div>
              <div class="neo-overview-feed-title">{{ session.sessionId }}</div>
              <div class="neo-overview-feed-meta">{{ session.insuredId }}</div>
            </div>
            <div class="neo-overview-feed-side">
              <strong>{{ session.riskScore }}</strong>
              <span>{{ session.anomalyType }}</span>
            </div>
          </div>
        </div>
      </article>

      <!-- Stats summary panel: aggregate counts across all sessions, anomalies, and risk tiers. -->
      <article class="neo-overview-panel neo-overview-panel--wide">
        <div class="neo-overview-head">
          <div>
            <h3>{{ t('overviewPage.systemSnapshotTitle') }}</h3>
            <p>{{ t('overviewPage.systemSnapshotSubtitle') }}</p>
          </div>
          <q-icon name="info" class="neo-hint-icon">
            <q-tooltip anchor="top middle" self="bottom middle" :offset="[0, 8]">
              {{ t('overviewPage.systemSnapshotTooltip') }}
            </q-tooltip>
          </q-icon>
        </div>
        <div v-if="statsSummaryLoading" class="neo-overview-empty">{{ t('overviewPage.loadingSummary') }}</div>
        <div v-else-if="!statsSummary" class="neo-overview-empty">{{ t('overviewPage.summaryUnavailable') }}</div>
        <div v-else class="neo-summary-grid">
          <div class="neo-summary-card">
            <strong>{{ formatNumber(statsSummary.totalSessions) }}</strong>
            <span>{{ t('overviewPage.totalSessionsLabel') }} <q-icon name="help_outline" class="neo-hint-icon"><q-tooltip>{{ t('overviewPage.totalSessionsTooltip') }}</q-tooltip></q-icon></span>
          </div>
          <div class="neo-summary-card">
            <strong>{{ formatNumber(statsSummary.totalAnomalies) }}</strong>
            <span>{{ t('overviewPage.totalAnomaliesLabel') }} <q-icon name="help_outline" class="neo-hint-icon"><q-tooltip>{{ t('overviewPage.totalAnomaliesTooltip') }}</q-tooltip></q-icon></span>
          </div>
          <div class="neo-summary-card">
            <strong>{{ formatNumber(statsSummary.anomalousSessions) }}</strong>
            <span>{{ t('overviewPage.anomalousSessionsLabel') }} <q-icon name="help_outline" class="neo-hint-icon"><q-tooltip>{{ t('overviewPage.anomalousSessionsTooltip') }}</q-tooltip></q-icon></span>
          </div>
          <div class="neo-summary-card">
            <strong>{{ formatPercent(statsSummary.anomalyRate, 1) }}</strong>
            <span>{{ t('overviewPage.anomalyRateLabel') }} <q-icon name="help_outline" class="neo-hint-icon"><q-tooltip>{{ t('overviewPage.anomalyRateTooltip') }}</q-tooltip></q-icon></span>
          </div>
          <div class="neo-summary-card">
            <strong>{{ formatNumber(statsSummary.activeSessionsNow) }}</strong>
            <span>{{ t('overviewPage.activeNowLabel') }} <q-icon name="help_outline" class="neo-hint-icon"><q-tooltip>{{ t('overviewPage.activeNowTooltip') }}</q-tooltip></q-icon></span>
          </div>
          <div class="neo-summary-card">
            <strong>{{ formatNumber(statsSummary.eventsToday) }}</strong>
            <span>{{ t('overviewPage.eventsTodayLabel') }} <q-icon name="help_outline" class="neo-hint-icon"><q-tooltip>{{ t('overviewPage.eventsTodayTooltip') }}</q-tooltip></q-icon></span>
          </div>
          <div class="neo-summary-card" v-for="(count, type) in statsSummary.anomaliesByType" :key="type">
            <strong>{{ formatNumber(count) }}</strong>
            <span>{{ type }} <q-icon name="help_outline" class="neo-hint-icon"><q-tooltip>{{ t('overviewPage.anomalyTypeGroupTooltip') }}</q-tooltip></q-icon></span>
          </div>
          <div class="neo-summary-card" v-for="(count, tier) in statsSummary.usersByRiskTier" :key="tier">
            <strong>{{ formatNumber(count) }}</strong>
            <span>{{ t('overviewPage.riskUsersLabel', { tier: formatRiskTierLabel(tier) }) }} <q-icon name="help_outline" class="neo-hint-icon"><q-tooltip>{{ t('overviewPage.riskUsersTooltip') }}</q-tooltip></q-icon></span>
          </div>
        </div>
      </article>

      <!-- Health panel: service connectivity status. -->
      <article class="neo-overview-panel">
        <div class="neo-overview-head">
          <div>
            <h3>{{ t('overviewPage.serviceHealthTitle') }}</h3>
            <p>{{ t('overviewPage.serviceHealthSubtitle') }}</p>
          </div>
        </div>
        <div v-if="healthLoading" class="neo-overview-empty">{{ t('common.checking') }}</div>
        <div v-else-if="!healthStatus" class="neo-overview-empty">{{ t('overviewPage.healthNotChecked') }}</div>
        <div v-else class="neo-summary-grid">
          <div class="neo-summary-card">
            <strong :class="healthStatus.status === 'UP' ? 'neo-health-ok' : 'neo-health-warn'">{{ formatHealthStatus(healthStatus.status) }}</strong>
            <span>{{ t('overviewPage.overallLabel') }} <q-icon name="help_outline" class="neo-hint-icon"><q-tooltip>{{ t('overviewPage.overallTooltip') }}</q-tooltip></q-icon></span>
          </div>
          <template v-if="healthStatus.checks">
            <div class="neo-summary-card" v-for="(check, name, idx) in (healthStatus.checks as Record<string, unknown>)" :key="idx">
              <strong :class="check === 'UP' ? 'neo-health-ok' : 'neo-health-warn'">{{ formatHealthStatus(check) }}</strong>
              <span>{{ name }} <q-icon name="help_outline" class="neo-hint-icon"><q-tooltip>{{ t('overviewPage.healthCheckTooltip', { name }) }}</q-tooltip></q-icon></span>
            </div>
          </template>
        </div>
      </article>

      <!-- Deep-dive section: analytics panels not shown on overview elsewhere. -->
      <article class="neo-overview-panel neo-overview-panel--wide">
        <div class="neo-overview-head">
          <div>
            <h3>{{ t('clusterMixPanel.title') }}</h3>
            <p>{{ t('clusterMixPanel.subtitle') }}</p>
          </div>
        </div>
        <ClusterMixPanel :data="clusterMixRows" :stats-summary="statsSummary" flat />
      </article>

      <DropOffsPanel :data="dropOffRows" :sessions="sessions" />

      <article class="neo-overview-panel neo-overview-panel--wide">
        <PathDeviationsPanel :data="pathDeviationRows" flat />
      </article>
    </section>
  </q-page>
</template>

<script setup lang="ts">
// This page derives high-level overview metrics from the shared dashboard store.
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import BarListChart from 'src/components/dashboard/BarListChart.vue';
import CountryActivityMap from 'src/components/dashboard/CountryActivityMap.vue';
import DonutBreakdownChart from 'src/components/dashboard/DonutBreakdownChart.vue';
import KpiStrip from 'src/components/dashboard/KpiStrip.vue';
import OverviewHero from 'src/components/dashboard/OverviewHero.vue';
import SparkAreaChart from 'src/components/dashboard/SparkAreaChart.vue';
import TrendForecastChart from 'src/components/dashboard/TrendForecastChart.vue';
import ClusterMixPanel from 'src/components/dashboard/ClusterMixPanel.vue';
import DropOffsPanel from 'src/components/dashboard/DropOffsPanel.vue';
import PathDeviationsPanel from 'src/components/dashboard/PathDeviationsPanel.vue';
import { useDashboard } from 'src/composables/useDashboard';
import {
  ANOMALY_TIER_COLORS,
  FALLBACK_ANOMALY_TIER_COLOR,
} from 'src/constants/dashboard/anomaly';
import { formatTimelineLabel, mergeCountriesWithSessions } from 'src/utils/dashboard';
import { formatDate, formatNumber, formatPercent, formatScore } from 'src/utils/format';

// Router navigation lets the hero shortcuts jump between dashboard sections.
const router = useRouter();
const { t } = useI18n();
const {
  commandCenter,
  totalSessions,
  anomalousSessions,
  totalAnomalies,
  avgSessionDuration,
  latestStreamAlert,
  activeSessions,
  eventsPerMinute,
  anomalyRate,
  globalRiskLevel,
  sessions,
  activeSessionRows,
  liveStats,
  trendStats,
  anomalies,
  clusterMix,
  dropOffs,
  pathDeviations,
  streamConnected,
  lastUpdated,
  eventsSinceLoad,
  statsSummary,
  statsSummaryLoading,
  healthStatus,
  healthLoading,
} = useDashboard();

// Normalize raw stats payloads into chart- and card-friendly structures.
const liveStatsPayload = computed(() => {
  const payload = liveStats.value?.payload;
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return null;
  return payload as Record<string, unknown>;
});

const eventsPerMinuteValue = computed(() => {
  const value =
    liveStatsPayload.value?.events_per_minute ?? liveStatsPayload.value?.eventsPerMinute;
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isNaN(parsed) ? null : parsed;
  }
  return null;
});

const recentSessions = computed(() => sessions.value.slice(0, 5));

const topActions = computed(() => {
  const raw =
    liveStatsPayload.value?.top_actions_last_15m ?? liveStatsPayload.value?.topActionsLast15m;
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return [];
  return Object.entries(raw as Record<string, number>)
    .sort((a, b) => (b[1] ?? 0) - (a[1] ?? 0))
    .slice(0, 5)
    .map(([label, count]) => ({ label, count: Number(count) || 0 }));
});

const topCountries = computed(() => {
  const raw =
    liveStatsPayload.value?.top_countries_right_now ??
    liveStatsPayload.value?.topCountriesRightNow;
  return mergeCountriesWithSessions(raw, sessions.value, 10);
});

const extractItems = (payload: unknown) => {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload;
  if (typeof payload === 'object') {
    const items = (payload as Record<string, unknown>).items;
    return Array.isArray(items) ? items : [];
  }
  return [];
};

const clusterMixRows = computed(() => extractItems(clusterMix.value));
const dropOffRows = computed(() => extractItems(dropOffs.value));
const pathDeviationRows = computed(() => extractItems(pathDeviations.value));

const readText = (value: unknown, fallback: string) =>
  typeof value === 'string' && value.trim().length > 0 ? value : fallback;

const alertFeedItems = computed(() =>
  extractItems(commandCenter.value?.alertFeed)
    .slice(0, 6)
    .flatMap((item, index) => {
      if (!item || typeof item !== 'object' || Array.isArray(item)) return [];
      const row = item as Record<string, unknown>;
      const insuredId = readText(row.insuredId, t('overviewPage.unknownUser'));
      const sessionId = readText(row.sessionId, t('overviewPage.sessionFallback', { index }));
      const detectedAt = readText(row.detectedAt, '');
      const anomalyType = readText(row.anomalyType, t('common.unknown'));
      return [
        {
          key: `${insuredId}:${sessionId}:${detectedAt || index}`,
          insuredId,
          sessionId,
          anomalyType,
          riskScore: formatScore(
            typeof row.riskScore === 'number' ? row.riskScore : Number(row.riskScore ?? 0),
          ),
          detectedAt: formatDate(detectedAt || null),
        },
      ];
    }),
);

const riskySessionPreview = computed(() => {
  const commandCenterRows = extractItems(commandCenter.value?.riskySessions)
    .slice(0, 4)
    .flatMap((item, index) => {
      if (!item || typeof item !== 'object' || Array.isArray(item)) return [];
      const row = item as Record<string, unknown>;
      const insuredId = readText(row.insuredId, t('overviewPage.unknownUser'));
      const sessionId = readText(row.sessionId, t('overviewPage.sessionFallback', { index }));
      return [
        {
          key: `${insuredId}:${sessionId}`,
          insuredId,
          sessionId,
          riskScore: formatScore(
            typeof row.riskScore === 'number' ? row.riskScore : Number(row.riskScore ?? 0),
          ),
          anomalyType: readText(row.anomalyType, t('common.observed')),
        },
      ];
    });

  if (commandCenterRows.length) return commandCenterRows;

  return activeSessionRows.value.slice(0, 4).map((session) => ({
    key: `${session.insuredId}:${session.sessionId}`,
    insuredId: session.insuredId,
    sessionId: session.sessionId,
    riskScore: formatScore(session.riskScore ?? null),
    anomalyType: session.anomalyType ?? t('common.observed'),
  }));
});

const topAnomalyTypes = computed(() => {
  const counts = new Map<string, number>();
  for (const event of anomalies.value) {
    const label = event.anomalyType || t('common.unknown');
    counts.set(label, (counts.get(label) ?? 0) + 1);
  }
  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([label, count]) => ({ label, count }));
});

const topActionBars = computed(() =>
  topActions.value.map((item) => ({
    label: item.label,
    value: item.count,
  })),
);

const topAnomalyTypeBars = computed(() =>
  topAnomalyTypes.value.map((item) => ({
    label: item.label,
    value: item.count,
  })),
);

const tierMixSegments = computed(() => {
  const counts = new Map<string, number>();

  for (const event of anomalies.value) {
    const label = event.anomalyTier || t('common.unknown');
    counts.set(label, (counts.get(label) ?? 0) + 1);
  }

  return Array.from(counts.entries()).map(([label, value]) => ({
    label,
    value,
    color: ANOMALY_TIER_COLORS[label] ?? FALLBACK_ANOMALY_TIER_COLOR,
  }));
});

const sessionDurationTrend = computed(() =>
  sessions.value
    .slice(0, 10)
    .reverse()
    .map((session) => session.sessionDurationSeconds ?? 0),
);

const sessionTimelineLabels = computed(() =>
  sessions.value
    .slice(0, 10)
    .reverse()
    .map((session, index) => formatTimelineLabel(session.startTime, `S${index + 1}`)),
);

const sessionActionTrend = computed(() =>
  sessions.value
    .slice(0, 10)
    .reverse()
    .map((session) => session.totalEvents ?? 0),
);

// Presentation helpers keep chart labels and summary numbers readable.
const formatChartDuration = (value: number) =>
  value >= 3600
    ? `${Math.round(value / 3600)}h`
    : value >= 60
      ? `${Math.round(value / 60)}m`
      : `${Math.round(value)}s`;

const averageActionVolume = computed(() => {
  if (!sessions.value.length) return t('common.notAvailable');
  const total = sessions.value.reduce((sum, session) => sum + (session.totalEvents ?? 0), 0);
  return formatNumber(total / sessions.value.length, {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
});

const averageUniqueActions = computed(() => {
  if (!sessions.value.length) return t('common.notAvailable');
  const total = sessions.value.reduce((sum, session) => sum + (session.uniqueActions ?? 0), 0);
  return formatNumber(total / sessions.value.length, {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
});

const latestAnomalyScore = computed(() =>
  anomalies.value.length
    ? formatScore(anomalies.value[0]?.anomalyScore ?? null)
    : t('common.notAvailable'),
);

const formatRiskTierLabel = (value: unknown) => {
  if (typeof value !== 'string' || value.trim().length === 0) {
    return t('common.unknown');
  }

  switch (value.trim().toUpperCase()) {
    case 'CRITICAL':
      return t('common.critical');
    case 'HIGH':
      return t('common.high');
    case 'MEDIUM':
      return t('common.medium');
    case 'LOW':
      return t('common.low');
    default:
      return value;
  }
};

const formatHealthStatus = (value: unknown) => {
  if (typeof value !== 'string' || value.trim().length === 0) {
    return t('common.unknown');
  }

  switch (value.trim().toUpperCase()) {
    case 'UP':
      return t('common.up');
    case 'DOWN':
      return t('common.down');
    case 'DEGRADED':
      return t('common.degraded');
    default:
      return value;
  }
};
</script>

<style scoped>
/* Overview page layout and card styling. */
.neo-overview-grid {
  display: grid;
  gap: 18px;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
}

.neo-overview-panel {
  grid-column: span 1;
  padding: 22px;
  border-radius: 24px;
  background:
    radial-gradient(circle at top right, rgba(227, 165, 72, 0.08), transparent 40%),
    rgba(255, 250, 243, 0.84);
  border: var(--neo-border);
  box-shadow: var(--neo-shadow-soft);
  backdrop-filter: blur(8px);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.neo-overview-panel:hover {
  transform: translateY(-2px);
  box-shadow: 0 20px 40px rgba(9, 22, 30, 0.15);
}

.neo-overview-panel:hover {
  transform: translateY(-2px);
  box-shadow: 0 20px 40px rgba(9, 22, 30, 0.15);
}

.neo-overview-panel--wide {
  grid-column: span 2;
}

@media (max-width: 1200px) {
  .neo-overview-panel--wide {
    grid-column: span 1;
  }
}

.neo-overview-panel--map {
  grid-column: span 4;
}

.neo-overview-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 18px;
}

.neo-overview-head h3 {
  margin: 0;
  font-size: 20px;
  font-weight: 700;
}

.neo-overview-head p {
  margin: 6px 0 0;
  font-size: 13px;
  color: var(--neo-ink-muted);
  line-height: 1.5;
}

.neo-overview-pill {
  padding: 8px 12px;
  border-radius: 999px;
  background: rgba(47, 143, 131, 0.1);
  color: var(--neo-accent);
  font-size: 12px;
  font-weight: 700;
}

.neo-overview-signal-grid {
  display: grid;
  gap: 14px;
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.neo-overview-signal-card {
  padding: 16px;
  border-radius: 20px;
  background: rgba(16, 32, 43, 0.04);
}

.neo-overview-signal-label {
  font-size: 12px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--neo-ink-muted);
}

.neo-overview-mini-grid {
  margin-top: 16px;
  display: grid;
  gap: 12px;
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.neo-overview-mini-card {
  padding: 14px;
  border-radius: 18px;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.82), rgba(255, 248, 238, 0.72));
  border: 1px solid rgba(16, 32, 43, 0.06);
}

.neo-overview-mini-card span {
  display: block;
  font-size: 12px;
  color: var(--neo-ink-muted);
}

.neo-overview-mini-card strong {
  display: block;
  margin-top: 8px;
  font-size: 22px;
}

.neo-overview-feed {
  margin-top: 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.neo-overview-feed-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 14px;
  border-radius: 18px;
  background: rgba(16, 32, 43, 0.04);
}

.neo-overview-feed-title {
  font-size: 14px;
  font-weight: 700;
}

.neo-overview-feed-meta,
.neo-overview-feed-side span {
  font-size: 12px;
  color: var(--neo-ink-muted);
}

.neo-overview-feed-side {
  display: flex;
  flex-direction: column;
  gap: 4px;
  text-align: right;
}

.neo-overview-feed-row--alert {
  border-left: 4px solid rgba(190, 65, 36, 0.5);
}

.neo-overview-empty {
  color: var(--neo-ink-muted);
  font-size: 13px;
}

/* Responsive stacking keeps the overview grid readable on narrower screens. */
@media (max-width: 1200px) {
  .neo-overview-panel,
  .neo-overview-panel--wide,
  .neo-overview-panel--map {
    grid-column: span 12;
  }
}

@media (max-width: 820px) {
  .neo-overview-signal-grid,
  .neo-overview-mini-grid {
    grid-template-columns: 1fr;
  }
}

.neo-summary-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 12px;
}

.neo-summary-card {
  padding: 14px;
  border-radius: 18px;
  background: linear-gradient(180deg, rgba(255,255,255,0.82), rgba(255,248,238,0.72));
  border: 1px solid rgba(16,32,43,0.06);
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.neo-summary-card strong {
  font-size: 22px;
  font-weight: 700;
}

.neo-summary-card span {
  font-size: 12px;
  color: var(--neo-ink-muted);
  display: flex;
  align-items: center;
  gap: 4px;
}

.neo-health-ok { color: var(--neo-accent); }
.neo-health-warn { color: #be4124; }

.neo-hint-icon {
  font-size: 14px;
  color: var(--neo-ink-muted);
  cursor: help;
  opacity: 0.6;
}
.neo-hint-icon:hover { opacity: 1; }
</style>
