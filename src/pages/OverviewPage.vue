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
      :events-per-minute="eventsPerMinute"
      :anomaly-rate="anomalyRate"
      :ko-rate="koRate"
      :stream-connected="streamConnected"
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
import { useDashboard } from 'src/composables/useDashboard';
import {
  ANOMALY_TIER_COLORS,
  FALLBACK_ANOMALY_TIER_COLOR,
} from 'src/constants/dashboard/anomaly';
import { formatTimelineLabel, normalizeCountryTelemetry } from 'src/utils/dashboard';
import { formatDate, formatScore } from 'src/utils/format';

// Router navigation lets the hero shortcuts jump between dashboard sections.
const router = useRouter();
const { t } = useI18n();
const {
  totalSessions,
  anomalousSessions,
  totalAnomalies,
  avgSessionDuration,
  latestStreamAlert,
  activeSessions,
  eventsPerMinute,
  anomalyRate,
  koRate,
  sessions,
  liveStats,
  trendStats,
  anomalies,
  streamConnected,
  lastUpdated,
  eventsSinceLoad,
} = useDashboard();

// Normalize raw stats payloads into chart- and card-friendly structures.
const liveStatsPayload = computed(() => {
  const payload = liveStats.value?.payload;
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return null;
  return payload as Record<string, unknown>;
});

const eventsPerMinuteValue = computed(() => {
  const value = liveStatsPayload.value?.events_per_minute;
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isNaN(parsed) ? null : parsed;
  }
  return null;
});

const recentSessions = computed(() => sessions.value.slice(0, 5));

const topActions = computed(() => {
  const raw = liveStatsPayload.value?.top_actions_last_15m;
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return [];
  return Object.entries(raw as Record<string, number>)
    .sort((a, b) => (b[1] ?? 0) - (a[1] ?? 0))
    .slice(0, 5)
    .map(([label, count]) => ({ label, count: Number(count) || 0 }));
});

const topCountries = computed(() => {
  const raw = liveStatsPayload.value?.top_countries_right_now;
  return normalizeCountryTelemetry(raw, 6);
});

const topAnomalyTypes = computed(() => {
  const counts = new Map<string, number>();
  for (const event of anomalies.value) {
    const label = event.anomalyType || 'UNKNOWN';
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
    const label = event.anomalyTier || 'UNKNOWN';
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
  return (total / sessions.value.length).toFixed(1);
});

const averageUniqueActions = computed(() => {
  if (!sessions.value.length) return t('common.notAvailable');
  const total = sessions.value.reduce((sum, session) => sum + (session.uniqueActions ?? 0), 0);
  return (total / sessions.value.length).toFixed(1);
});

const latestAnomalyScore = computed(() =>
  anomalies.value.length
    ? formatScore(anomalies.value[0]?.anomalyScore ?? null)
    : t('common.notAvailable'),
);
</script>

<style scoped>
/* Overview page layout and card styling. */
.neo-overview-grid {
  display: grid;
  gap: 18px;
  grid-template-columns: repeat(12, minmax(0, 1fr));
}

.neo-overview-panel {
  grid-column: span 4;
  padding: 22px;
  border-radius: 24px;
  background: rgba(255, 250, 243, 0.84);
  border: var(--neo-border);
  box-shadow: var(--neo-shadow-soft);
  backdrop-filter: blur(8px);
}

.neo-overview-panel--wide {
  grid-column: span 8;
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
</style>
