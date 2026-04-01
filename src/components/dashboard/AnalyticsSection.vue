<template>
  <section id="analytics" class="neo-section neo-analytics">
    <div class="neo-section-header">
      <div>
        <div class="neo-section-title">Behavior analytics</div>
        <div class="neo-section-subtitle">
          Live platform signals combined with recent anomalies and sessions.
        </div>
      </div>
    </div>

    <div class="neo-analytics-grid">
      <div class="neo-analytics-card">
        <div class="neo-analytics-title">Anomaly tier mix</div>
        <div class="neo-analytics-list">
          <div v-for="item in tierMix" :key="item.label" class="neo-analytics-row">
            <span>{{ item.label }}</span>
            <span class="neo-analytics-value">{{ item.count }} ({{ item.percent }}%)</span>
          </div>
          <div v-if="!anomalies.length" class="neo-analytics-empty">No anomaly events yet.</div>
        </div>
        <div class="neo-analytics-meta">Live classification output from session-close alerts.</div>
      </div>

      <div class="neo-analytics-card">
        <div class="neo-analytics-title">Top anomaly types</div>
        <div class="neo-analytics-list">
          <div v-for="item in topAnomalyTypes" :key="item.label" class="neo-analytics-row">
            <span>{{ item.label }}</span>
            <span class="neo-analytics-value">{{ item.count }}</span>
          </div>
          <div v-if="!topAnomalyTypes.length" class="neo-analytics-empty">No anomaly types yet.</div>
        </div>
        <div class="neo-analytics-meta">Use this to prioritize tuning and response playbooks.</div>
      </div>

      <div class="neo-analytics-card">
        <div class="neo-analytics-title">Top actions (15m)</div>
        <div class="neo-analytics-list">
          <div v-for="item in topActions" :key="item.label" class="neo-analytics-row">
            <span>{{ item.label }}</span>
            <span class="neo-analytics-value">{{ item.count }}</span>
          </div>
          <div v-if="!topActions.length" class="neo-analytics-empty">No live action data.</div>
        </div>
        <div class="neo-analytics-meta">From Redis live stats snapshot.</div>
      </div>

      <div class="neo-analytics-card">
        <div class="neo-analytics-title">Active countries</div>
        <div class="neo-analytics-list">
          <div v-for="item in topCountries" :key="item.label" class="neo-analytics-row">
            <span>{{ item.label }}</span>
            <span class="neo-analytics-value">{{ item.count }}</span>
          </div>
          <div v-if="!topCountries.length" class="neo-analytics-empty">No live country data.</div>
        </div>
        <div class="neo-analytics-meta">Top geographies in the current window.</div>
      </div>

      <div class="neo-analytics-card">
        <div class="neo-analytics-title">Trend spikes (tomorrow)</div>
        <div class="neo-analytics-list">
          <div v-for="item in trendSpikes" :key="item.label" class="neo-analytics-row">
            <span>{{ item.label }}</span>
            <span class="neo-analytics-value">{{ item.predicted }}</span>
          </div>
          <div v-if="!trendSpikes.length" class="neo-analytics-empty">No spike alerts.</div>
        </div>
        <div class="neo-analytics-meta">Based on XGBoost daily forecasts.</div>
      </div>

      <div class="neo-analytics-card">
        <div class="neo-analytics-title">Recent sessions</div>
        <div class="neo-analytics-list">
          <div
            v-for="session in sessionPreview"
            :key="session.id"
            class="neo-analytics-row"
          >
            <span>
              {{ session.sessionId }}
              <span v-if="session.isAnomaly" class="neo-analytics-flag">Anomaly</span>
            </span>
            <span class="neo-analytics-value">{{ formatDate(session.startTime) }}</span>
          </div>
          <div v-if="loading" class="neo-analytics-empty">Loading sessions...</div>
          <div v-else-if="error" class="neo-analytics-empty">{{ error }}</div>
          <div v-else-if="!sessionPreview.length" class="neo-analytics-empty">
            No sessions returned.
          </div>
        </div>
        <div class="neo-analytics-meta">
          Monitoring recent behavioral sessions.
        </div>
      </div>

      <div class="neo-analytics-card">
        <div class="neo-analytics-title">Recent anomaly events</div>
        <div class="neo-analytics-list">
          <div v-for="event in anomalyPreview" :key="anomalyKey(event)" class="neo-analytics-row">
            <span>{{ event.anomalyTier }} · {{ event.anomalyType }}</span>
            <span class="neo-analytics-value">{{ formatDate(event.eventTime) }}</span>
          </div>
          <div v-if="loading" class="neo-analytics-empty">Loading anomalies...</div>
          <div v-else-if="error" class="neo-analytics-empty">{{ error }}</div>
          <div v-else-if="!anomalyPreview.length" class="neo-analytics-empty">
            No anomaly events returned.
          </div>
        </div>
        <div class="neo-analytics-meta">
          Focus response on the latest confirmed anomalies.
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { AnomalyEventDto, SessionAnalysisDto, StatsResponseDto } from 'src/types/analytics';
import { formatDate } from 'src/utils/format';

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
  const total = props.anomalies.length;
  return Array.from(buckets.entries()).map(([label, count]) => ({
    label,
    count,
    percent: total ? Math.round((count / total) * 100) : 0,
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
    .slice(0, 4)
    .map(([label, count]) => ({ label, count }));
});

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
    .slice(0, 4)
    .map(([label, count]) => ({ label, count }));
});

const topCountries = computed(() => {
  const raw = liveStatsPayload.value?.top_countries_right_now;
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return [];
  return Object.entries(raw as Record<string, number>)
    .sort((a, b) => (b[1] ?? 0) - (a[1] ?? 0))
    .slice(0, 4)
    .map(([label, count]) => ({ label, count }));
});

const trendStatsPayload = computed(() => {
  const payload = props.trendStats?.payload;
  if (!payload) return null;
  return payload;
});

const parsedTrendStats = computed(() => {
  const payload = trendStatsPayload.value;
  if (!Array.isArray(payload)) return [];

  return payload.flatMap((item) => {
    if (!item || typeof item !== 'object' || Array.isArray(item)) return [];
    const record = item as Record<string, unknown>;
    const actionId = toNumber(record.actionId);
    if (actionId == null) return [];

    return [
      {
        actionId,
        actionLabel:
          typeof record.actionLabel === 'string' && record.actionLabel
            ? record.actionLabel
            : `Action ${actionId}`,
        predictedCount: toNumber(record.predictedCount),
        spikeAlert: record.spikeAlert === true,
      },
    ];
  });
});

const trendSpikes = computed(() => {
  const payload = trendStatsPayload.value;
  if (!payload) return [];

  if (Array.isArray(payload)) {
    return parsedTrendStats.value
      .filter((item) => item.spikeAlert)
      .sort((a, b) => (b.predictedCount ?? 0) - (a.predictedCount ?? 0))
      .slice(0, 4)
      .map((item) => ({
        label: item.actionLabel,
        predicted: item.predictedCount?.toFixed(0) ?? 'n/a',
      }));
  }

  if (typeof payload !== 'object') return [];
  return Object.entries(payload as Record<string, { predicted?: number; spike?: boolean }>)
    .filter(([, value]) => value && value.spike)
    .map(([label, value]) => ({
      label: `Action ${label}`,
      predicted: value.predicted?.toFixed(0) ?? 'n/a',
    }))
    .slice(0, 4);
});

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
.neo-analytics-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.neo-analytics-row {
  display: flex;
  justify-content: space-between;
  font-size: 14px;
}

.neo-analytics-value {
  font-weight: 600;
}

.neo-analytics-empty {
  font-size: 13px;
  color: var(--neo-ink-muted);
}

.neo-analytics-flag {
  margin-left: 6px;
  padding: 2px 6px;
  border-radius: 999px;
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  background: rgba(206, 43, 23, 0.14);
  color: #b01d12;
}
</style>
