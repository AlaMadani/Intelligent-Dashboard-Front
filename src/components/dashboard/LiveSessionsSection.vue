<template>
  <section class="neo-section">
    <div class="neo-section-header">
      <div>
        <div class="neo-section-title">{{ t('liveSessionsSection.title') }}</div>
        <div class="neo-section-subtitle">{{ t('liveSessionsSection.subtitle') }}</div>
      </div>
      <div class="neo-session-radar-summary">
        <div class="neo-session-radar-count">{{ filteredSessions.length }}</div>
        <div class="neo-session-radar-copy">{{ t('liveSessionsSection.activeWindows') }}</div>
      </div>
    </div>

    <div v-if="loading" class="neo-session-radar-grid">
      <SkeletonCard v-for="index in 6" :key="index" />
    </div>
    <q-banner v-else-if="error" class="neo-banner" dense>{{ error }}</q-banner>
    <div v-else-if="!filteredSessions.length" class="neo-placeholder">
      {{ t('liveSessionsSection.empty') }}
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
            <div class="neo-session-meta">
              {{ session.insuredId }} / {{ session.persona || t('liveSessionsSection.personaUnavailable') }}
            </div>
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
            <span>{{ t('liveSessionsSection.labels.route') }}</span>
            <strong>
              {{ session.firstRoute || t('common.notAvailable') }} ->
              {{ session.lastRoute || t('common.notAvailable') }}
            </strong>
          </div>
          <div class="neo-session-metric">
            <span>{{ t('liveSessionsSection.labels.events') }}</span>
            <strong>{{ readableNumber(session.totalEvents) }}</strong>
          </div>
          <div class="neo-session-metric">
            <span>{{ t('liveSessionsSection.labels.riskLevel') }}</span>
            <strong>{{ session.riskLevel || t('common.unknown') }}</strong>
          </div>
          <div class="neo-session-metric">
            <span>{{ t('liveSessionsSection.labels.nextActions') }}</span>
            <strong>{{ nextActionsLabel(session.nextActions) }}</strong>
          </div>
          <div class="neo-session-metric">
            <span>{{ t('liveSessionsSection.labels.started') }}</span>
            <strong>{{ readableDate(session.sessionStart) }}</strong>
          </div>
          <div class="neo-session-metric">
            <span>{{ t('liveSessionsSection.labels.updated') }}</span>
            <strong>{{ readableDate(session.computedAt) }}</strong>
          </div>
          <div class="neo-session-metric">
            <span>{{ t('liveSessionsSection.labels.anomalySignal') }}</span>
            <strong>{{ anomalySignal(session) }}</strong>
          </div>
        </div>
      </article>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import type { ActiveSessionDto, NextActionScoreDto } from 'src/types/analytics';
import { formatDate, formatNumber } from 'src/utils/format';
import SkeletonCard from './SkeletonCard.vue';

const props = defineProps<{
  sessions: ActiveSessionDto[];
  loading: boolean;
  error: string;
}>();

const { t } = useI18n();

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
  formatNumber(value);

const readableDate = (value: string | null | undefined) =>
  value ? formatDate(value) : t('common.notAvailable');

const nextActionsLabel = (actions?: NextActionScoreDto[] | null) => {
  if (!actions?.length) return t('common.notAvailable');
  return actions
    .slice(0, 3)
    .map((item) => item.action)
    .join(', ');
};

const anomalySignal = (session: ActiveSessionDto) => {
  if (session.anomalyType) return session.anomalyType;
  if (session.pathDeviationFlag || session.pathDeviation?.deviated) {
    return t('liveSessionsSection.anomalySignals.pathDeviation');
  }
  if (session.binaryAnomaly) return t('liveSessionsSection.anomalySignals.binaryAnomaly');
  return session.anomalyFlag
    ? t('liveSessionsSection.anomalySignals.ruleAnomaly')
    : t('common.observed');
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
  background: 
    radial-gradient(circle at top right, rgba(227, 165, 72, 0.08), transparent 40%),
    rgba(255, 250, 243, 0.9);
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
  background: 
    radial-gradient(circle at top right, rgba(220, 38, 38, 0.1), transparent 40%),
    rgba(255, 250, 243, 0.9);
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
