<template>
  <section class="neo-section">
    <div class="neo-section-header">
      <div>
        <div class="neo-section-title">Live session radar</div>
        <div class="neo-section-subtitle">
          Active Redis-backed sessions with live AI risk, context tags, and predicted next actions.
        </div>
      </div>
      <div class="neo-session-radar-summary">
        <div class="neo-session-radar-count">{{ filteredSessions.length }}</div>
        <div class="neo-session-radar-copy">active windows</div>
      </div>
    </div>

    <div v-if="loading" class="neo-session-radar-grid">
      <SkeletonCard v-for="index in 6" :key="index" />
    </div>
    <q-banner v-else-if="error" class="neo-banner" dense>{{ error }}</q-banner>
    <div v-else-if="!filteredSessions.length" class="neo-placeholder">
      No active sessions currently match the live stream filters.
    </div>

    <div v-else class="neo-session-radar-grid">
      <article
        v-for="session in filteredSessions"
        :key="`${session.insuredId}:${session.sessionId}`"
        class="neo-session-card"
        :class="riskClass(session.riskScore)"
      >
        <div class="neo-session-card-head">
          <div>
            <div class="neo-session-id">{{ session.sessionId }}</div>
            <div class="neo-session-meta">{{ session.insuredId }} / {{ session.persona || 'persona n/a' }}</div>
          </div>
          <q-knob
            :model-value="safeRisk(session.riskScore)"
            size="68px"
            :thickness="0.2"
            :color="riskTone(session.riskScore)"
            track-color="grey-4"
            readonly
            show-value
            font-size="16px"
            class="neo-session-knob"
          />
        </div>

        <div class="neo-session-tags">
          <q-chip
            v-for="tag in session.contextTags ?? []"
            :key="tag"
            dense
            size="12px"
            :color="tagTone(tag)"
            text-color="white"
          >
            {{ tag }}
          </q-chip>
        </div>

        <div class="neo-session-metrics">
          <div class="neo-session-metric">
            <span>Route</span>
            <strong>{{ session.firstRoute || 'n/a' }} -> {{ session.lastRoute || 'n/a' }}</strong>
          </div>
          <div class="neo-session-metric">
            <span>Events</span>
            <strong>{{ readableNumber(session.totalEvents) }}</strong>
          </div>
          <div class="neo-session-metric">
            <span>Risk level</span>
            <strong>{{ session.riskLevel || 'UNKNOWN' }}</strong>
          </div>
          <div class="neo-session-metric">
            <span>Next actions</span>
            <strong>{{ nextActionsLabel(session.nextActions) }}</strong>
          </div>
          <div class="neo-session-metric">
            <span>Started</span>
            <strong>{{ readableDate(session.sessionStart) }}</strong>
          </div>
          <div class="neo-session-metric">
            <span>Updated</span>
            <strong>{{ readableDate(session.computedAt) }}</strong>
          </div>
          <div class="neo-session-metric">
            <span>Anomaly signal</span>
            <strong>{{ anomalySignal(session) }}</strong>
          </div>
        </div>
      </article>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { ActiveSessionDto, NextActionScoreDto } from 'src/types/analytics';
import { formatDate } from 'src/utils/format';
import SkeletonCard from './SkeletonCard.vue';

const props = defineProps<{
  sessions: ActiveSessionDto[];
  loading: boolean;
  error: string;
}>();

const filteredSessions = computed(() =>
  [...props.sessions].sort((left, right) => safeRisk(right.riskScore) - safeRisk(left.riskScore)),
);

const safeRisk = (value: number | null | undefined) => {
  if (value == null || Number.isNaN(value)) return 0;
  return Math.max(0, Math.min(100, Math.round(value)));
};

const riskTone = (value: number | null | undefined) => {
  const score = safeRisk(value);
  if (score >= 80) return 'negative';
  if (score >= 41) return 'warning';
  return 'positive';
};

const riskClass = (value: number | null | undefined) => ({
  'is-critical': safeRisk(value) >= 80,
});

const tagTone = (tag: string) => {
  const normalized = tag.toLowerCase();
  if (normalized.includes('geo') || normalized.includes('ip')) return 'negative';
  if (normalized.includes('error') || normalized.includes('rule')) return 'warning';
  return 'secondary';
};

const readableNumber = (value: number | null | undefined) =>
  value == null || Number.isNaN(value) ? 'n/a' : value.toLocaleString('en-GB');

const readableDate = (value: string | null | undefined) => (value ? formatDate(value) : 'n/a');

const nextActionsLabel = (actions?: NextActionScoreDto[] | null) => {
  if (!actions?.length) return 'n/a';
  return actions
    .slice(0, 3)
    .map((item) => item.action)
    .join(', ');
};

const anomalySignal = (session: ActiveSessionDto) => {
  if (session.anomalyType) return session.anomalyType;
  if (session.pathDeviationFlag || session.pathDeviation?.deviated) return 'Path deviation';
  if (session.binaryAnomaly) return 'Binary anomaly';
  return session.anomalyFlag ? 'Rule anomaly' : 'Observed';
};
</script>

<style scoped>
.neo-session-radar-summary {
  text-align: right;
}

.neo-session-radar-count {
  font-size: 30px;
  font-weight: 800;
}

.neo-session-radar-copy {
  color: var(--neo-ink-muted);
  font-size: 12px;
}

.neo-session-radar-grid {
  display: grid;
  gap: 16px;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
}

.neo-session-card {
  padding: 18px;
  border-radius: 24px;
  background: rgba(255, 250, 243, 0.9);
  border: var(--neo-border);
  box-shadow: var(--neo-shadow-soft);
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease;
}

.neo-session-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 18px 34px rgba(15, 32, 38, 0.12);
}

.neo-session-card.is-critical {
  box-shadow: 0 0 0 1px rgba(220, 38, 38, 0.18), 0 14px 30px rgba(220, 38, 38, 0.12);
  animation: neo-session-pulse 1.8s ease-in-out infinite;
}

.neo-session-card-head {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: flex-start;
}

.neo-session-id {
  font-size: 18px;
  font-weight: 800;
}

.neo-session-meta {
  margin-top: 4px;
  color: var(--neo-ink-muted);
  font-size: 12px;
}

.neo-session-tags {
  margin-top: 16px;
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  min-height: 26px;
}

.neo-session-metrics {
  margin-top: 16px;
  display: grid;
  gap: 10px;
}

.neo-session-metric {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  font-size: 13px;
}

.neo-session-metric span {
  color: var(--neo-ink-muted);
}

.neo-session-metric strong {
  text-align: right;
}

@keyframes neo-session-pulse {
  0% {
    box-shadow: 0 0 0 0 rgba(220, 38, 38, 0.18), 0 14px 30px rgba(220, 38, 38, 0.12);
  }
  70% {
    box-shadow: 0 0 0 10px rgba(220, 38, 38, 0), 0 14px 30px rgba(220, 38, 38, 0.08);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(220, 38, 38, 0), 0 14px 30px rgba(220, 38, 38, 0.12);
  }
}
</style>
