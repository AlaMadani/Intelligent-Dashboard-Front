<template>
  <!-- Analytics surface: compare anomaly mix, live actions, forecasts, and recent activity. -->
  <section id="analytics" class="neo-section">
    <div class="neo-section-header">
      <div>
        <div class="neo-section-title">{{ t('analyticsSection.title') }}</div>
        <div class="neo-section-subtitle">{{ t('analyticsSection.subtitle') }}</div>
      </div>
    </div>

    <!-- Shared error banner covers analytics and live-stats request failures. -->
    <q-banner v-if="error" class="neo-banner" dense>
      {{ error }}
    </q-banner>

    <!-- Dashboard grid combines distribution charts, forecasts, and recent activity feeds. -->
    <div class="neo-analytics-dashboard">
      <article class="neo-analytics-panel neo-analytics-panel--wide">
        <div class="neo-analytics-head">
          <div>
            <h3>{{ t('analyticsSection.anomalyTierDistributionTitle') }}</h3>
            <p>{{ t('analyticsSection.anomalyTierDistributionSubtitle') }}</p>
          </div>
          <div class="neo-analytics-chip">
            {{ t('analyticsSection.eventsCount', { count: anomalies.length }) }}
          </div>
        </div>

        <DonutBreakdownChart
          :segments="tierMixSegments"
          :center-label="t('analyticsSection.confirmedCenterLabel')"
          :center-value="String(anomalies.length)"
        />
      </article>

      <article class="neo-analytics-panel">
        <div class="neo-analytics-head">
          <div>
            <h3>{{ t('analyticsSection.topAnomalyTypesTitle') }}</h3>
            <p>{{ t('analyticsSection.topAnomalyTypesSubtitle') }}</p>
          </div>
        </div>
        <BarListChart
          :items="topAnomalyTypeBars"
          :empty-message="t('analyticsSection.topAnomalyTypesEmpty')"
        />
      </article>

      <article class="neo-analytics-panel">
        <div class="neo-analytics-head">
          <div>
            <h3>{{ t('analyticsSection.topActionsTitle') }}</h3>
            <p>{{ t('analyticsSection.topActionsSubtitle') }}</p>
          </div>
        </div>
        <BarListChart
          :items="topActionBars"
          :empty-message="t('analyticsSection.topActionsEmpty')"
        />
      </article>

      <article class="neo-analytics-panel neo-analytics-panel--map">
        <div class="neo-analytics-head">
          <div>
            <h3>{{ t('analyticsSection.geolocationTitle') }}</h3>
            <p>{{ t('analyticsSection.geolocationSubtitle') }}</p>
          </div>
        </div>
        <CountryActivityMap :countries="topCountries" />
      </article>

      <article class="neo-analytics-panel neo-analytics-panel--wide">
        <div class="neo-analytics-head">
          <div>
            <h3>{{ t('analyticsSection.sessionDurationTrendTitle') }}</h3>
            <p>{{ t('analyticsSection.sessionDurationTrendSubtitle') }}</p>
          </div>
          <div class="neo-analytics-chip">{{ averageDuration }}</div>
        </div>

        <SparkAreaChart
          :values="sessionDurationSeries"
          :labels="sessionTimelineLabels"
          :value-formatter="formatChartDuration"
          tone="primary"
        />

        <div class="neo-analytics-strip">
          <div class="neo-analytics-strip-card">
            <span>{{ t('analyticsSection.latestDurationLabel') }}</span>
            <strong>{{ latestDuration }}</strong>
          </div>
          <div class="neo-analytics-strip-card">
            <span>{{ t('analyticsSection.averageDurationLabel') }}</span>
            <strong>{{ averageDuration }}</strong>
          </div>
          <div class="neo-analytics-strip-card">
            <span>{{ t('analyticsSection.averageActionsLabel') }}</span>
            <strong>{{ averageActionVolume }}</strong>
          </div>
        </div>
      </article>

      <article class="neo-analytics-panel">
        <div class="neo-analytics-head">
          <div>
            <h3>{{ t('analyticsSection.forecastedSpikesTitle') }}</h3>
            <p>{{ t('analyticsSection.forecastedSpikesSubtitle') }}</p>
          </div>
        </div>
        <BarListChart
          :items="trendSpikeBars"
          :empty-message="t('analyticsSection.forecastedSpikesEmpty')"
        />
      </article>

      <article class="neo-analytics-panel">
        <div class="neo-analytics-head">
          <div>
            <h3>{{ t('analyticsSection.anomalyScorePulseTitle') }}</h3>
            <p>{{ t('analyticsSection.anomalyScorePulseSubtitle') }}</p>
          </div>
          <div class="neo-analytics-chip neo-analytics-chip--danger">
            {{ latestAnomalyScore }}
          </div>
        </div>

        <SparkAreaChart
          :values="anomalyScoreSeries"
          :labels="anomalyTimelineLabels"
          :value-formatter="formatScore"
          tone="danger"
        />
      </article>

      <article class="neo-analytics-panel">
        <div class="neo-analytics-head">
          <div>
            <h3>{{ t('analyticsSection.recentSessionsTitle') }}</h3>
            <p>{{ t('analyticsSection.recentSessionsSubtitle') }}</p>
          </div>
        </div>

        <div v-if="loading" class="neo-analytics-empty">
          {{ t('analyticsSection.loadingSessions') }}
        </div>
        <div v-else-if="!sessionPreview.length" class="neo-analytics-empty">
          {{ t('analyticsSection.noSessionsReturned') }}
        </div>
        <div v-else class="neo-analytics-feed">
          <div v-for="session in sessionPreview" :key="session.id" class="neo-analytics-feed-row">
            <div>
              <div class="neo-analytics-feed-title">{{ session.sessionId }}</div>
              <div class="neo-analytics-feed-meta">{{ session.insuredId }}</div>
            </div>
            <div class="neo-analytics-feed-side">
              <strong>{{ formatDate(session.startTime) }}</strong>
              <span>{{ session.isAnomaly ? t('common.anomaly') : t('common.observed') }}</span>
            </div>
          </div>
        </div>
      </article>

      <article class="neo-analytics-panel">
        <div class="neo-analytics-head">
          <div>
            <h3>{{ t('analyticsSection.recentAnomalyEventsTitle') }}</h3>
            <p>{{ t('analyticsSection.recentAnomalyEventsSubtitle') }}</p>
          </div>
        </div>

        <div v-if="loading" class="neo-analytics-empty">
          {{ t('analyticsSection.loadingAnomalies') }}
        </div>
        <div v-else-if="!anomalyPreview.length" class="neo-analytics-empty">
          {{ t('analyticsSection.noAnomalyEventsReturned') }}
        </div>
        <div v-else class="neo-analytics-feed">
          <div
            v-for="event in anomalyPreview"
            :key="anomalyEventKey(event)"
            class="neo-analytics-feed-row"
          >
            <div>
              <div class="neo-analytics-feed-title">
                {{ event.anomalyType || t('common.unknown') }}
              </div>
              <div class="neo-analytics-feed-meta">
                {{ event.insuredId }} / {{ event.sessionId }}
              </div>
            </div>
            <div class="neo-analytics-feed-side">
              <strong>{{ formatDate(event.eventTime) }}</strong>
              <span>{{ event.anomalyTier }}</span>
            </div>
          </div>
        </div>
       </article>

       <ClusterMixPanel :data="clusterMixData" :stats-summary="props.statsSummary" />

       <PathDeviationsPanel :data="pathDeviationsData" />

       <DropOffsPanel :data="dropOffsData" :sessions="props.sessions" />
    </div>
  </section>
</template>

<script setup lang="ts">
// Props deliver dashboard datasets; computed blocks reshape them for charts and previews.
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import type { AnomalyEventDto, SessionAnalysisDto, StatsResponseDto, StatsSummaryDto } from 'src/types/analytics';
import type { JsonValue } from 'src/types/api';
import {
  ANOMALY_TIER_COLORS,
  FALLBACK_ANOMALY_TIER_COLOR,
} from 'src/constants/dashboard/anomaly';
import BarListChart from './BarListChart.vue';
import CountryActivityMap from './CountryActivityMap.vue';
import DonutBreakdownChart from './DonutBreakdownChart.vue';
import SparkAreaChart from './SparkAreaChart.vue';
import ClusterMixPanel from './ClusterMixPanel.vue';
import DropOffsPanel from './DropOffsPanel.vue';
import PathDeviationsPanel from './PathDeviationsPanel.vue';
import { anomalyEventKey, formatTimelineLabel, mergeCountriesWithSessions } from 'src/utils/dashboard';
import { formatDate, formatDurationSeconds, formatScore } from 'src/utils/format';

const props = defineProps<{
  sessions: SessionAnalysisDto[];
  anomalies: AnomalyEventDto[];
  liveStats: StatsResponseDto | null;
  trendStats: StatsResponseDto | null;
  clusterMix: JsonValue;
  dropOffs: JsonValue;
  pathDeviations: JsonValue;
  statsSummary: StatsSummaryDto | null;
  loading: boolean;
  error: string;
}>();

const { t } = useI18n();

// Lightweight previews keep the larger datasets focused in the UI.
const sessionPreview = computed(() => props.sessions.slice(0, 5));
const anomalyPreview = computed(() => props.anomalies.slice(0, 5));

// Aggregate anomalies into chart-ready distributions and rankings.
const tierMix = computed(() => {
  const buckets = new Map<string, number>();
  for (const event of props.anomalies) {
    const label = event.anomalyTier || 'UNKNOWN';
    buckets.set(label, (buckets.get(label) ?? 0) + 1);
  }
  const total = props.anomalies.length || 1;
  return Array.from(buckets.entries()).map(([label, count]) => ({
    label,
    count,
    percent: Math.round((count / total) * 100),
  }));
});

const tierMixSegments = computed(() => {
  return tierMix.value.map((item) => ({
    label: item.label,
    value: item.count,
    display: `${item.count} / ${item.percent}%`,
    color: ANOMALY_TIER_COLORS[item.label] ?? FALLBACK_ANOMALY_TIER_COLOR,
  }));
});

const topAnomalyTypes = computed(() => {
  const counts = new Map<string, number>();
  for (const event of props.anomalies) {
    const label = event.anomalyType || 'UNKNOWN';
    counts.set(label, (counts.get(label) ?? 0) + 1);
  }
  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([label, count]) => ({ label, count }));
});

const topAnomalyTypeBars = computed(() =>
  topAnomalyTypes.value.map((item) => ({
    label: item.label,
    value: item.count,
  })),
);

// Normalize live and trend payloads returned by the stats endpoints.
const liveStatsPayload = computed(() => {
  const payload = props.liveStats?.payload;
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return null;
  return payload as Record<string, unknown>;
});

const extractItems = (payload: JsonValue) => {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload;
  if (typeof payload === 'object') {
    const items = (payload as Record<string, unknown>).items;
    return Array.isArray(items) ? items : [];
  }
  return [];
};

const clusterMixData = computed(() => extractItems(props.clusterMix));
const dropOffsData = computed(() => extractItems(props.dropOffs));
const pathDeviationsData = computed(() => extractItems(props.pathDeviations));

const topActions = computed(() => {
  const raw =
    liveStatsPayload.value?.top_actions_last_15m ?? liveStatsPayload.value?.topActionsLast15m;
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return [];
  return Object.entries(raw as Record<string, number>)
    .sort((a, b) => (b[1] ?? 0) - (a[1] ?? 0))
    .slice(0, 5)
    .map(([label, count]) => ({ label, count: Number(count) || 0 }));
});

const topActionBars = computed(() =>
  topActions.value.map((item) => ({
    label: item.label,
    value: item.count,
  })),
);

const topCountries = computed(() => {
  const raw =
    liveStatsPayload.value?.top_countries_right_now ??
    liveStatsPayload.value?.topCountriesRightNow;
  return mergeCountriesWithSessions(raw, props.sessions, 6);
});

const trendStatsPayload = computed(() => props.trendStats?.payload ?? null);

const formatForecastStatus = (status: string) => {
  switch (status) {
    case 'ABOVE_FORECAST':
      return 'Above forecast';
    case 'BELOW_FORECAST':
      return 'Below forecast';
    case 'WITHIN_BOUNDS':
      return 'Within bounds';
    case 'NO_ACTIVITY':
      return 'No activity';
    case 'NO_BASELINE':
      return 'No baseline';
    default:
      return status.replaceAll('_', ' ').toLowerCase();
  }
};

const buildForecastDisplay = (actual: number, delta: number | null, status: string) => {
  if (delta != null) {
    const roundedActual = Math.round(actual);
    const roundedDelta = Math.round(delta);
    const deltaPrefix = roundedDelta > 0 ? '+' : '';
    return `${roundedActual} (${deltaPrefix}${roundedDelta})`;
  }
  return formatForecastStatus(status);
};

const trendSpikeBars = computed(() => {
  const payload = trendStatsPayload.value;
  if (!payload) return [];

  if (Array.isArray(payload)) {
    return payload
      .flatMap((item) => {
        if (!item || typeof item !== 'object' || Array.isArray(item)) return [];
        const record = item as Record<string, unknown>;
        if (record.spikeAlert !== true) return [];
        const actionId = toNumber(record.actionId);
        const label =
          typeof record.actionLabel === 'string' && record.actionLabel
            ? record.actionLabel
            : t('analyticsSection.actionFallback', {
                id: actionId != null ? actionId.toFixed(0) : t('common.notAvailable'),
              });
        const value = toNumber(record.predictedCount) ?? 0;
        return [{ label, value, display: value.toFixed(0) }];
      })
        .sort((a, b) => b.value - a.value)
        .slice(0, 5);
  }

  if (typeof payload !== 'object') return [];

  const record = payload as Record<string, unknown>;
  const forecastItemsSource =
    record.items && typeof record.items === 'object' && !Array.isArray(record.items)
      ? (record.items as Record<string, unknown>)
      : record;

  const forecastBars = Object.entries(forecastItemsSource)
    .flatMap(([seriesKey, value]) => {
      if (!value || typeof value !== 'object' || Array.isArray(value)) return [];

      const item = value as Record<string, unknown>;
      const hasForecastShape =
        Array.isArray(item.points) || 'actualCount' in item || 'status' in item || 'delta' in item;

      if (!hasForecastShape) {
        return [];
      }

      const label =
        typeof item.label === 'string' && item.label.trim().length > 0
          ? item.label
          : seriesKey.replaceAll('_', ' ');
      const actual = toNumber(item.actualCount) ?? 0;
      const delta = toNumber(item.delta);
      const status =
        typeof item.status === 'string' && item.status.trim().length > 0
          ? item.status
          : 'WITHIN_BOUNDS';
      const magnitude = Math.abs(delta ?? actual);

      return [
        {
          label: `${label} (${formatForecastStatus(status)})`,
          value: magnitude,
          display: buildForecastDisplay(actual, delta, status),
        },
      ];
    })
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);

  if (forecastBars.length) {
    return forecastBars;
  }

  return Object.entries(record as Record<string, { predicted?: number; spike?: boolean }>)
    .filter(([, value]) => value && value.spike)
    .map(([label, value]) => ({
      label: `Action ${label}`,
      value: value.predicted ?? 0,
      display: value.predicted?.toFixed(0) ?? '0',
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);
});

// Build chart series and summary cards from the recent session and anomaly windows.
const sessionDurationSeries = computed(() =>
  props.sessions
    .slice(0, 10)
    .reverse()
    .map((session) => session.sessionDurationSeconds ?? 0),
);

const sessionTimelineLabels = computed(() =>
  props.sessions
    .slice(0, 10)
    .reverse()
    .map((session, index) => formatTimelineLabel(session.startTime, `S${index + 1}`)),
);

const anomalyScoreSeries = computed(() =>
  props.anomalies
    .slice(0, 10)
    .reverse()
    .map((event) => event.anomalyScore ?? 0),
);

const anomalyTimelineLabels = computed(() =>
  props.anomalies
    .slice(0, 10)
    .reverse()
    .map((event, index) =>
      formatTimelineLabel(event.eventTime ?? event.detectedAt, `A${index + 1}`),
    ),
);

const latestDuration = computed(() =>
  props.sessions.length
    ? formatDurationSeconds(props.sessions[0]?.sessionDurationSeconds ?? null)
    : t('common.notAvailable'),
);

const averageDuration = computed(() => {
  if (!props.sessions.length) return t('common.notAvailable');
  const total = props.sessions.reduce(
    (sum, session) => sum + (session.sessionDurationSeconds ?? 0),
    0,
  );
  return formatDurationSeconds(total / props.sessions.length);
});

const averageActionVolume = computed(() => {
  if (!props.sessions.length) return t('common.notAvailable');
  const total = props.sessions.reduce((sum, session) => sum + (session.totalEvents ?? 0), 0);
  return (total / props.sessions.length).toFixed(1);
});

const latestAnomalyScore = computed(() =>
  props.anomalies.length
    ? formatScore(props.anomalies[0]?.anomalyScore ?? null)
    : t('common.notAvailable'),
);

// Format helpers keep durations and numeric payload values readable in charts.
const formatChartDuration = (value: number) =>
  value >= 3600
    ? `${Math.round(value / 3600)}h`
    : value >= 60
      ? `${Math.round(value / 60)}m`
      : `${Math.round(value)}s`;

const toNumber = (value: unknown) => {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isNaN(parsed) ? null : parsed;
  }
  return null;
};
</script>

<style scoped>
/* Analytics section layout, panel styling, and feed presentation. */
.neo-analytics-dashboard {
  display: grid;
  gap: 18px;
  grid-template-columns: repeat(12, minmax(0, 1fr));
  margin-top: 18px;
}

.neo-analytics-panel {
  grid-column: span 4;
  padding: 22px;
  border-radius: 24px;
  background: rgba(255, 250, 243, 0.84);
  border: var(--neo-border);
  box-shadow: var(--neo-shadow-soft);
}

.neo-analytics-panel--wide {
  grid-column: span 8;
}

.neo-analytics-panel--map {
  grid-column: span 4;
}

.neo-analytics-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 18px;
}

.neo-analytics-head h3 {
  margin: 0;
  font-size: 20px;
  font-weight: 700;
}

.neo-analytics-head p {
  margin: 6px 0 0;
  font-size: 13px;
  color: var(--neo-ink-muted);
  line-height: 1.5;
}

.neo-analytics-chip {
  padding: 8px 12px;
  border-radius: 999px;
  background: rgba(47, 143, 131, 0.1);
  color: var(--neo-accent);
  font-size: 12px;
  font-weight: 700;
}

.neo-analytics-chip--danger {
  background: rgba(200, 90, 76, 0.12);
  color: var(--neo-danger);
}

.neo-analytics-strip {
  margin-top: 16px;
  display: grid;
  gap: 12px;
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.neo-analytics-strip-card {
  padding: 14px;
  border-radius: 18px;
  background: rgba(16, 32, 43, 0.04);
}

.neo-analytics-strip-card span {
  display: block;
  font-size: 12px;
  color: var(--neo-ink-muted);
}

.neo-analytics-strip-card strong {
  display: block;
  margin-top: 8px;
  font-size: 20px;
}

.neo-analytics-feed {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.neo-analytics-feed-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 14px;
  border-radius: 18px;
  background: rgba(16, 32, 43, 0.04);
}

.neo-analytics-feed-title {
  font-size: 14px;
  font-weight: 700;
}

.neo-analytics-feed-meta,
.neo-analytics-feed-side span {
  font-size: 12px;
  color: var(--neo-ink-muted);
}

.neo-analytics-feed-side {
  display: flex;
  flex-direction: column;
  gap: 4px;
  text-align: right;
}

.neo-analytics-empty {
  min-height: 140px;
  display: grid;
  place-items: center;
  font-size: 13px;
  color: var(--neo-ink-muted);
  background: rgba(16, 32, 43, 0.04);
  border-radius: 18px;
}

/* Collapse the multi-column dashboard into a single-column stack on smaller screens. */
@media (max-width: 1280px) {
  .neo-analytics-panel,
  .neo-analytics-panel--wide,
  .neo-analytics-panel--map {
    grid-column: span 12;
  }
}

@media (max-width: 820px) {
  .neo-analytics-strip {
    grid-template-columns: 1fr;
  }
}
</style>
