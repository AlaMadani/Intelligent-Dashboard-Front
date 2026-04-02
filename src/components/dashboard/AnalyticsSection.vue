<template>
  <section id="analytics" class="neo-section">
    <div class="neo-section-header">
      <div>
        <div class="neo-section-title">Behavior analytics</div>
        <div class="neo-section-subtitle">
          Live platform signals fused with anomaly events, recent sessions, and forecast output.
        </div>
      </div>
    </div>

    <q-banner v-if="error" class="neo-banner" dense>
      {{ error }}
    </q-banner>

    <div class="neo-analytics-dashboard">
      <article class="neo-analytics-panel neo-analytics-panel--wide">
        <div class="neo-analytics-head">
          <div>
            <h3>Anomaly tier distribution</h3>
            <p>Live classification output from confirmed anomaly events.</p>
          </div>
          <div class="neo-analytics-chip">{{ anomalies.length }} events</div>
        </div>

        <DonutBreakdownChart
          :segments="tierMixSegments"
          center-label="Confirmed"
          :center-value="String(anomalies.length)"
        />
      </article>

      <article class="neo-analytics-panel">
        <div class="neo-analytics-head">
          <div>
            <h3>Top anomaly types</h3>
            <p>Prioritize tuning and response playbooks.</p>
          </div>
        </div>
        <BarListChart :items="topAnomalyTypeBars" empty-message="No anomaly types yet." />
      </article>

      <article class="neo-analytics-panel">
        <div class="neo-analytics-head">
          <div>
            <h3>Top actions in 15 minutes</h3>
            <p>Behavior concentration from the live stats window.</p>
          </div>
        </div>
        <BarListChart :items="topActionBars" empty-message="No live action data." />
      </article>

      <article class="neo-analytics-panel neo-analytics-panel--map">
        <div class="neo-analytics-head">
          <div>
            <h3>Geolocation of active countries</h3>
            <p>Country hotspots in the current live traffic window.</p>
          </div>
        </div>
        <CountryActivityMap :countries="topCountries" />
      </article>

      <article class="neo-analytics-panel neo-analytics-panel--wide">
        <div class="neo-analytics-head">
          <div>
            <h3>Session duration trend</h3>
            <p>Recent session length movement from the latest analyzed traces.</p>
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
            <span>Latest duration</span>
            <strong>{{ latestDuration }}</strong>
          </div>
          <div class="neo-analytics-strip-card">
            <span>Average duration</span>
            <strong>{{ averageDuration }}</strong>
          </div>
          <div class="neo-analytics-strip-card">
            <span>Average actions</span>
            <strong>{{ averageActionVolume }}</strong>
          </div>
        </div>
      </article>

      <article class="neo-analytics-panel">
        <div class="neo-analytics-head">
          <div>
            <h3>Forecasted spikes</h3>
            <p>Predicted action spikes from the trend service.</p>
          </div>
        </div>
        <BarListChart :items="trendSpikeBars" empty-message="No spike alerts." />
      </article>

      <article class="neo-analytics-panel">
        <div class="neo-analytics-head">
          <div>
            <h3>Anomaly score pulse</h3>
            <p>How aggressive the latest anomaly scores look.</p>
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
            <h3>Recent sessions</h3>
            <p>Latest session activity in the current result set.</p>
          </div>
        </div>

        <div v-if="loading" class="neo-analytics-empty">Loading sessions...</div>
        <div v-else-if="!sessionPreview.length" class="neo-analytics-empty">No sessions returned.</div>
        <div v-else class="neo-analytics-feed">
          <div v-for="session in sessionPreview" :key="session.id" class="neo-analytics-feed-row">
            <div>
              <div class="neo-analytics-feed-title">{{ session.sessionId }}</div>
              <div class="neo-analytics-feed-meta">{{ session.insuredId }}</div>
            </div>
            <div class="neo-analytics-feed-side">
              <strong>{{ formatDate(session.startTime) }}</strong>
              <span>{{ session.isAnomaly ? 'Anomaly' : 'Observed' }}</span>
            </div>
          </div>
        </div>
      </article>

      <article class="neo-analytics-panel">
        <div class="neo-analytics-head">
          <div>
            <h3>Recent anomaly events</h3>
            <p>Latest confirmed anomalies for analyst response.</p>
          </div>
        </div>

        <div v-if="loading" class="neo-analytics-empty">Loading anomalies...</div>
        <div v-else-if="!anomalyPreview.length" class="neo-analytics-empty">
          No anomaly events returned.
        </div>
        <div v-else class="neo-analytics-feed">
          <div
            v-for="event in anomalyPreview"
            :key="anomalyKey(event)"
            class="neo-analytics-feed-row"
          >
            <div>
              <div class="neo-analytics-feed-title">
                {{ event.anomalyType || 'UNKNOWN' }}
              </div>
              <div class="neo-analytics-feed-meta">{{ event.insuredId }} / {{ event.sessionId }}</div>
            </div>
            <div class="neo-analytics-feed-side">
              <strong>{{ formatDate(event.eventTime) }}</strong>
              <span>{{ event.anomalyTier }}</span>
            </div>
          </div>
        </div>
      </article>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { AnomalyEventDto, SessionAnalysisDto, StatsResponseDto } from 'src/types/analytics';
import BarListChart from './BarListChart.vue';
import CountryActivityMap from './CountryActivityMap.vue';
import DonutBreakdownChart from './DonutBreakdownChart.vue';
import SparkAreaChart from './SparkAreaChart.vue';
import { formatTimelineLabel, normalizeCountryTelemetry } from 'src/utils/dashboard';
import { formatDate, formatDurationSeconds, formatScore } from 'src/utils/format';

const props = defineProps<{
  sessions: SessionAnalysisDto[];
  anomalies: AnomalyEventDto[];
  liveStats: StatsResponseDto | null;
  trendStats: StatsResponseDto | null;
  loading: boolean;
  error: string;
}>();

const sessionPreview = computed(() => props.sessions.slice(0, 5));
const anomalyPreview = computed(() => props.anomalies.slice(0, 5));

const anomalyKey = (event: AnomalyEventDto) =>
  event.id != null
    ? `id:${event.id}`
    : `${event.insuredId}:${event.sessionId}:${event.eventId}:${event.detectedAt ?? ''}`;

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
  const colors: Record<string, string> = {
    TIER1: '#2f8f83',
    TIER2: '#e3a548',
    TIER3: '#cf5d4a',
    ML_ERROR: '#617ca8',
    UNKNOWN: '#8899a8',
  };
  const fallbackColor = '#8899a8';

  return tierMix.value.map((item) => ({
    label: item.label,
    value: item.count,
    display: `${item.count} / ${item.percent}%`,
    color: colors[item.label] ?? fallbackColor,
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
  }))
);

const liveStatsPayload = computed(() => {
  const payload = props.liveStats?.payload;
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return null;
  return payload as Record<string, unknown>;
});

const topActions = computed(() => {
  const raw = liveStatsPayload.value?.top_actions_last_15m;
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
  }))
);

const topCountries = computed(() => {
  const raw = liveStatsPayload.value?.top_countries_right_now;
  return normalizeCountryTelemetry(raw, 6);
});

const trendStatsPayload = computed(() => props.trendStats?.payload ?? null);

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
            : `Action ${actionId != null ? actionId.toFixed(0) : 'n/a'}`;
        const value = toNumber(record.predictedCount) ?? 0;
        return [{ label, value, display: value.toFixed(0) }];
      })
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  }

  if (typeof payload !== 'object') return [];
  return Object.entries(payload as Record<string, { predicted?: number; spike?: boolean }>)
    .filter(([, value]) => value && value.spike)
    .map(([label, value]) => ({
      label: `Action ${label}`,
      value: value.predicted ?? 0,
      display: value.predicted?.toFixed(0) ?? '0',
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);
});

const sessionDurationSeries = computed(() =>
  props.sessions
    .slice(0, 10)
    .reverse()
    .map((session) => session.sessionDurationSeconds ?? 0)
);

const sessionTimelineLabels = computed(() =>
  props.sessions
    .slice(0, 10)
    .reverse()
    .map((session, index) => formatTimelineLabel(session.startTime, `S${index + 1}`))
);

const anomalyScoreSeries = computed(() =>
  props.anomalies
    .slice(0, 10)
    .reverse()
    .map((event) => event.anomalyScore ?? 0)
);

const anomalyTimelineLabels = computed(() =>
  props.anomalies
    .slice(0, 10)
    .reverse()
    .map((event, index) => formatTimelineLabel(event.eventTime ?? event.detectedAt, `A${index + 1}`))
);

const latestDuration = computed(() =>
  props.sessions.length
    ? formatDurationSeconds(props.sessions[0]?.sessionDurationSeconds ?? null)
    : 'n/a'
);

const averageDuration = computed(() => {
  if (!props.sessions.length) return 'n/a';
  const total = props.sessions.reduce(
    (sum, session) => sum + (session.sessionDurationSeconds ?? 0),
    0
  );
  return formatDurationSeconds(total / props.sessions.length);
});

const averageActionVolume = computed(() => {
  if (!props.sessions.length) return 'n/a';
  const total = props.sessions.reduce((sum, session) => sum + (session.sessionLength ?? 0), 0);
  return (total / props.sessions.length).toFixed(1);
});

const latestAnomalyScore = computed(() =>
  props.anomalies.length ? formatScore(props.anomalies[0]?.anomalyScore ?? null) : 'n/a'
);

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
