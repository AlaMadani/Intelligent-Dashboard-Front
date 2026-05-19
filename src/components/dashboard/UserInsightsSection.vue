<template>
  <section id="insights" class="neo-section">
    <div class="neo-section-header">
      <div>
        <div class="neo-section-title">{{ t('userInsightsSection.title') }}</div>
        <div class="neo-section-subtitle">{{ t('userInsightsSection.subtitle') }}</div>
      </div>
    </div>

    <!-- STEP 1: Search & Lookup -->
    <div class="neo-insights-flow">
      <div class="neo-panel neo-insights-search-panel">
        <div class="neo-panel-header">
          <div>
            <div class="neo-panel-title">{{ t('userInsightsSection.lookupTitle') }}</div>
            <div class="neo-panel-subtitle">{{ t('userInsightsSection.lookupSubtitle') }}</div>
          </div>
        </div>

        <div class="neo-insights-search">
          <q-input
            dense
            outlined
            v-model="insuredModel"
            :placeholder="t('userInsightsSection.insuredPlaceholder')"
            class="neo-input-compact"
            @keyup.enter="emit('load')"
          />
          <q-btn
            color="primary"
            unelevated
            icon="search"
            :label="t('userInsightsSection.load')"
            :loading="loading"
            @click="emit('load')"
          />
        </div>

        <div v-if="error" class="neo-error">{{ error }}</div>
        <div v-else-if="!riskProfile && !loading" class="neo-placeholder">
          {{ t('userInsightsSection.enterPrompt') }}
        </div>
      </div>

      <!-- STEP 2: Risk Profile Card (Hero View) -->
      <div v-if="loading && !riskProfile" class="neo-insights-skeleton-grid">
        <div class="skeleton" style="height:120px"></div>
        <div class="skeleton" style="height:120px"></div>
        <div class="skeleton" style="height:120px"></div>
      </div>

      <template v-else-if="riskProfile">
        <!-- Risk Badge & Updated Info -->
        <div class="neo-insights-hero">
          <div class="neo-risk-badge-hero" :class="'neo-risk-badge-hero--' + (riskProfile.riskTier || 'low').toLowerCase()">
            <span class="neo-risk-dot-hero"></span>
            <div class="neo-risk-badge-hero-text">
              <span class="neo-risk-tier-label">{{ t('userInsightsSection.labels.riskLevel') }}</span>
              <span class="neo-risk-tier-value">{{ riskProfile.riskTier ?? t('common.notAvailable') }}</span>
            </div>
          </div>
          <div class="neo-risk-updated">
            {{ t('userInsightsSection.labels.lastUpdated') }}
            <strong>{{ formatDate(riskProfile.lastUpdated) }}</strong>
          </div>
        </div>

        <!-- STEP 3: Key Metrics Grid (3 Columns, Prioritized) -->
        <div class="neo-insights-metrics-grid">
          <!-- TOP ROW: Most Critical Metrics -->
          <div class="neo-metric-card neo-metric-card--primary">
            <div class="neo-metric-header">
              <span class="neo-metric-label">
                {{ t('userInsightsSection.labels.anomalyRate30d') }}
                <q-icon name="info" class="neo-hint-icon">
                  <q-tooltip>{{ t('userInsightsSection.tooltips.anomalyRate30d') }}</q-tooltip>
                </q-icon>
              </span>
            </div>
            <span class="neo-metric-value">{{ formatPercent(riskProfile.anomalyRate30d, 1) }}</span>
            <q-linear-progress
              :value="Math.min((riskProfile.anomalyRate30d ?? 0), 1)"
              class="neo-metric-bar"
              :color="rateColor(riskProfile.anomalyRate30d)"
              size="6px"
              rounded
            />
            <div class="neo-metric-trend">
              <span class="neo-trend-label">7d:</span>
              <span class="neo-trend-value">{{ formatPercent((riskProfile.anomalyCount7d || 0) / Math.max(riskProfile.sessions7d || 1, 1), 1) }}</span>
            </div>
          </div>

          <div class="neo-metric-card neo-metric-card--primary">
            <div class="neo-metric-header">
              <span class="neo-metric-label">{{ t('userInsightsSection.labels.sessions30d') }}</span>
            </div>
            <span class="neo-metric-value">{{ riskProfile.sessions30d ?? 0 }}</span>
            <q-linear-progress
              :value="Math.min(((riskProfile.sessions30d ?? 0) / 100), 1)"
              class="neo-metric-bar"
              color="info"
              size="6px"
              rounded
            />
            <div class="neo-metric-trend">
              <span class="neo-trend-label">7d:</span>
              <span class="neo-trend-value">{{ riskProfile.sessions7d ?? 0 }}</span>
            </div>
          </div>

          <div class="neo-metric-card neo-metric-card--primary">
            <div class="neo-metric-header">
              <span class="neo-metric-label">{{ t('userInsightsSection.labels.consecutiveClean') }}</span>
            </div>
            <span class="neo-metric-value">{{ riskProfile.consecutiveCleanSessions ?? 0 }}</span>
            <div class="neo-metric-badge" :class="(riskProfile.consecutiveCleanSessions ?? 0) > 0 ? 'is-positive' : 'is-neutral'">
              {{ (riskProfile.consecutiveCleanSessions ?? 0) > 0 ? '✓ Clean' : 'At Risk' }}
            </div>
          </div>

          <!-- SECONDARY ROW: Anomaly Details -->
          <div class="neo-metric-card">
            <div class="neo-metric-header">
              <span class="neo-metric-label">{{ t('userInsightsSection.labels.anomalies7d') }}</span>
            </div>
            <span class="neo-metric-value">{{ riskProfile.anomalyCount7d ?? 0 }}</span>
            <span class="neo-metric-subtext">in last 7 days</span>
          </div>

          <div class="neo-metric-card">
            <div class="neo-metric-header">
              <span class="neo-metric-label">{{ t('userInsightsSection.labels.anomalies30d') }}</span>
            </div>
            <span class="neo-metric-value">{{ riskProfile.anomalyCount30d ?? 0 }}</span>
            <span class="neo-metric-subtext">in last 30 days</span>
          </div>

          <div class="neo-metric-card">
            <div class="neo-metric-header">
              <span class="neo-metric-label">{{ t('userInsightsSection.labels.avgSession30d') }}</span>
            </div>
            <span class="neo-metric-value">{{ formatDurationSeconds(riskProfile.avgSessionDuration30d) }}</span>
            <span class="neo-metric-subtext">avg duration</span>
          </div>
        </div>

        <!-- STEP 4: Additional Context Panels -->
        <div class="neo-insights-context-row">
          <!-- Last Anomaly Info -->
          <div class="neo-panel neo-insights-context-panel">
            <div class="neo-panel-title-compact">{{ t('userInsightsSection.labels.lastAnomaly') }}</div>
            <div v-if="riskProfile.lastAnomalyType" class="neo-context-value">
              <q-badge color="warning" text-color="white" class="q-mr-md">
                {{ riskProfile.lastAnomalyType }}
              </q-badge>
            </div>
            <div v-else class="neo-placeholder-sm">
              {{ t('common.notAvailable') }}
            </div>
          </div>

          <!-- Most Frequent Action -->
          <div class="neo-panel neo-insights-context-panel">
            <div class="neo-panel-title-compact">{{ t('userInsightsSection.labels.mostFrequentAction30d') }}</div>
            <div v-if="riskProfile.mostFrequentAction30d" class="neo-context-value">
              <q-chip size="md" color="primary" text-color="white">
                {{ riskProfile.mostFrequentAction30d }}
              </q-chip>
            </div>
            <div v-else class="neo-placeholder-sm">
              {{ t('common.notAvailable') }}
            </div>
          </div>
        </div>
      </template>

      <!-- Predicted Actions Section -->
      <template v-if="nextActions && nextActions.top3Actions?.length">
        <div class="neo-panel">
          <div class="neo-panel-header">
            <div>
              <div class="neo-panel-title">{{ t('userInsightsSection.predictedActionsTitle') }}</div>
              <div class="neo-panel-subtitle">{{ t('userInsightsSection.predictedActionsSubtitle') }}</div>
            </div>
            <q-badge
              v-if="nextActions?.sessionId"
              color="secondary"
              outline
              class="neo-insights-session-badge"
            >
              {{ nextActions.sessionId.slice(0, 12) }}&hellip;
            </q-badge>
          </div>

          <div v-if="!nextActions.sessionId" class="neo-analytics-meta" style="margin-bottom:12px">
            {{ t('userInsightsSection.crossSessionPrediction') }}
            <span v-if="nextActions.predictedAt"> / {{ formatDate(nextActions.predictedAt) }}</span>
          </div>

          <div class="neo-actions-list">
            <div
              v-for="action in nextActions.top3Actions"
              :key="action.action"
              class="neo-action-item"
            >
              <div class="neo-action-head">
                <span class="neo-action-name">{{ action.action }}</span>
                <strong class="neo-action-prob">{{ formatPercent(action.probability, 1) }}</strong>
              </div>
              <q-linear-progress
                :value="Math.min(action.probability ?? 0, 1)"
                color="primary"
                size="6px"
                rounded
              />
            </div>
          </div>
        </div>
      </template>

      <!-- Active Anomaly Section -->
      <template v-if="activeAnomaly">
        <div class="neo-panel">
          <div class="neo-panel-header">
            <div>
              <div class="neo-panel-title">{{ t('userInsightsSection.activeAnomalyTitle') }}</div>
              <div class="neo-panel-subtitle">{{ t('userInsightsSection.activeAnomalySubtitle') }}</div>
            </div>
          </div>

          <div class="neo-anomaly-card">
            <div class="neo-anomaly-head">
              <q-badge
                :color="tierBadgeColor(activeAnomaly.anomalyTier)"
                text-color="white"
                class="neo-anomaly-tier"
              >
                {{ activeAnomaly.anomalyTier }}
              </q-badge>
              <span class="neo-anomaly-type">{{ activeAnomaly.anomalyType }}</span>
            </div>

            <div class="neo-anomaly-metrics">
              <div class="neo-anomaly-metric">
                <span class="neo-anomaly-metric-label">{{ t('userInsightsSection.labels.score') }}</span>
                <span class="neo-anomaly-metric-value">{{ formatScore(activeAnomaly.anomalyScore) }}</span>
                <q-linear-progress
                  :value="Math.min((activeAnomaly.anomalyScore ?? 0) / 100, 1)"
                  :color="scoreColor(activeAnomaly.anomalyScore)"
                  size="5px"
                  rounded
                />
              </div>

              <div v-if="activeAnomaly.riskScore != null" class="neo-anomaly-metric">
                <span class="neo-anomaly-metric-label">{{ t('userInsightsSection.labels.ensembleRisk') }}</span>
                <span class="neo-anomaly-metric-value">{{ formatScore(activeAnomaly.riskScore) }}</span>
                <q-linear-progress
                  :value="Math.min((activeAnomaly.riskScore ?? 0) / 100, 1)"
                  :color="scoreColor(activeAnomaly.riskScore)"
                  size="5px"
                  rounded
                />
              </div>

              <div v-if="activeAnomaly.churnProbability != null" class="neo-anomaly-metric">
                <span class="neo-anomaly-metric-label">{{ t('userInsightsSection.labels.churn') }}</span>
                <span class="neo-anomaly-metric-value">{{ formatPercent(activeAnomaly.churnProbability, 1) }}</span>
                <q-linear-progress
                  :value="Math.min(activeAnomaly.churnProbability, 1)"
                  color="warning"
                  size="5px"
                  rounded
                />
              </div>
            </div>

            <div class="neo-anomaly-details">
              <div class="neo-anomaly-detail">
                <span class="neo-anomaly-detail-label">{{ t('userInsightsSection.labels.detected') }}</span>
                <span class="neo-anomaly-detail-value">{{ formatDate(activeAnomaly.detectedAt) }}</span>
              </div>
              <div v-if="activeAnomaly.ruleType" class="neo-anomaly-detail">
                <span class="neo-anomaly-detail-label">{{ t('userInsightsSection.labels.ruleType') }}</span>
                <span class="neo-anomaly-detail-value">{{ activeAnomaly.ruleType }}</span>
              </div>
            </div>
          </div>
        </div>
      </template>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import type {
  AnomalyAlertDto,
  NextActionPredictionDto,
  UserRiskProfileDto,
} from 'src/types/analytics';
import { formatDate, formatPercent, formatScore, formatDurationSeconds } from 'src/utils/format';

const props = defineProps<{
  insuredId: string;
  riskProfile: UserRiskProfileDto | null;
  nextActions: NextActionPredictionDto | null;
  activeAnomaly: AnomalyAlertDto | null;
  loading: boolean;
  error: string;
}>();

const emit = defineEmits<{
  (event: 'update:insuredId', value: string): void;
  (event: 'load'): void;
}>();

const { t } = useI18n();

const insuredModel = computed({
  get: () => props.insuredId,
  set: (value: string) => emit('update:insuredId', value),
});

const rateColor = (rate: number | null | undefined) => {
  if (rate == null) return 'grey';
  if (rate >= 0.2) return 'negative';
  if (rate >= 0.05) return 'warning';
  return 'positive';
};

const scoreColor = (score: number | null | undefined) => {
  if (score == null) return 'grey';
  if (score >= 80) return 'negative';
  if (score >= 50) return 'warning';
  return 'positive';
};

const tierBadgeColor = (tier: string | null | undefined) => {
  switch (tier) {
    case 'TIER3': return 'negative';
    case 'TIER2': return 'warning';
    case 'TIER1': return 'info';
    default: return 'grey';
  }
};
</script>

<style scoped>
.neo-insights-flow {
  display: flex;
  flex-direction: column;
  gap: var(--neo-space-5);
}

.neo-insights-search-panel {
  max-width: 100%;
}

.neo-insights-search {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 14px;
}

.neo-insights-search .neo-input-compact {
  flex: 1;
  min-width: 0;
}

.neo-insights-skeleton-grid {
  display: grid;
  gap: var(--neo-space-5);
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
}

.neo-insights-hero {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--neo-space-4);
  padding: 24px;
  border: var(--neo-border);
  border-radius: var(--neo-radius-card);
  background: linear-gradient(180deg, rgba(255,255,255,0.95), rgba(246,249,248,0.92));
  box-shadow: var(--neo-shadow-card);
  flex-wrap: wrap;
}

.neo-risk-badge-hero {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 12px 20px;
  border-radius: 12px;
  min-width: 240px;
}

.neo-risk-badge-hero--high,
.neo-risk-badge-hero--critical {
  background: var(--neo-critical-bg);
  color: var(--neo-critical-contrast);
}

.neo-risk-badge-hero--medium {
  background: var(--neo-warning-bg);
  color: var(--neo-warning-contrast);
}

.neo-risk-badge-hero--low {
  background: var(--neo-success-bg);
  color: var(--neo-success-contrast);
}

.neo-risk-dot-hero {
  width: 16px;
  height: 16px;
  border-radius: 999px;
  flex-shrink: 0;
}

.neo-risk-badge-hero--high .neo-risk-dot-hero,
.neo-risk-badge-hero--critical .neo-risk-dot-hero {
  background: var(--neo-critical);
  box-shadow: 0 0 0 6px rgba(179,75,60,0.15);
}

.neo-risk-badge-hero--medium .neo-risk-dot-hero {
  background: var(--neo-warning);
  box-shadow: 0 0 0 6px rgba(167,101,24,0.15);
}

.neo-risk-badge-hero--low .neo-risk-dot-hero {
  background: var(--neo-success);
  box-shadow: 0 0 0 6px rgba(46,125,99,0.15);
}

.neo-risk-badge-hero-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.neo-risk-tier-label {
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  opacity: 0.8;
}

.neo-risk-tier-value {
  font-size: 24px;
  font-weight: 800;
}

.neo-risk-updated {
  color: var(--neo-ink-muted);
  font-size: 13px;
  white-space: nowrap;
}

.neo-risk-updated strong {
  color: var(--neo-ink-soft);
  font-weight: 600;
}

.neo-insights-metrics-grid {
  display: grid;
  gap: var(--neo-space-4);
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
}

.neo-metric-card {
  padding: 18px;
  border: var(--neo-border);
  border-radius: var(--neo-radius-card);
  background: var(--neo-card-bg);
  box-shadow: var(--neo-shadow-card);
  display: flex;
  flex-direction: column;
  gap: 10px;
  transition: all var(--neo-transition-med);
}

.neo-metric-card:hover {
  border-color: var(--neo-border-strong);
  box-shadow: var(--neo-shadow-hover);
  transform: translateY(-2px);
}

.neo-metric-card--primary {
  border-color: var(--neo-accent-soft);
  background: linear-gradient(135deg, rgba(255,255,255,0.95), rgba(246,249,248,0.92));
}

.neo-metric-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.neo-metric-label {
  color: var(--neo-ink-muted);
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  display: flex;
  align-items: center;
  gap: 6px;
}

.neo-hint-icon {
  font-size: 14px;
  color: var(--neo-ink-faint);
  cursor: help;
}

.neo-metric-value {
  color: var(--neo-ink);
  font-size: 32px;
  font-weight: 800;
  line-height: 1;
}

.neo-metric-bar {
  margin-top: 4px;
}

.neo-metric-trend {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--neo-ink-muted);
  margin-top: 2px;
}

.neo-trend-label {
  font-weight: 600;
}

.neo-trend-value {
  color: var(--neo-ink-soft);
  font-weight: 700;
}

.neo-metric-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border-radius: 6px;
  background: rgba(23,33,43,0.06);
  color: var(--neo-ink-soft);
  font-size: 12px;
  font-weight: 600;
  width: fit-content;
  margin-top: 4px;
}

.neo-metric-badge.is-positive {
  background: var(--neo-success-bg);
  color: var(--neo-success-contrast);
}

.neo-metric-subtext {
  color: var(--neo-ink-muted);
  font-size: 11px;
  margin-top: 2px;
}

.neo-insights-context-row {
  display: grid;
  gap: var(--neo-space-4);
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
}

.neo-insights-context-panel {
  padding: 16px;
}

.neo-panel-title-compact {
  color: var(--neo-ink-muted);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  margin-bottom: 10px;
}

.neo-context-value {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}

.neo-placeholder-sm {
  color: var(--neo-ink-muted);
  font-size: 13px;
}

.neo-actions-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 12px;
}

.neo-action-item {
  padding: 12px;
  border: 1px solid var(--neo-border-color);
  border-radius: var(--neo-radius-control);
  background: rgba(23,33,43,0.03);
}

.neo-action-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 6px;
}

.neo-action-name {
  color: var(--neo-ink);
  font-size: 13px;
  font-weight: 600;
  flex: 1;
}

.neo-action-prob {
  color: var(--neo-accent);
  font-family: 'JetBrains Mono', monospace;
  font-size: 13px;
  white-space: nowrap;
}

.neo-anomaly-card {
  padding: 16px;
  border: 1px solid var(--neo-border-color);
  border-radius: var(--neo-radius-card);
  background: rgba(23,33,43,0.03);
}

.neo-anomaly-head {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 16px;
}

.neo-anomaly-tier {
  font-size: 11px;
  letter-spacing: 0.06em;
  font-weight: 700;
}

.neo-anomaly-type {
  color: var(--neo-ink);
  font-size: 16px;
  font-weight: 700;
}

.neo-anomaly-metrics {
  display: grid;
  gap: 12px;
  margin-bottom: 16px;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
}

.neo-anomaly-metric {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.neo-anomaly-metric-label {
  color: var(--neo-ink-muted);
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.neo-anomaly-metric-value {
  color: var(--neo-ink);
  font-size: 20px;
  font-weight: 800;
}

.neo-anomaly-details {
  display: grid;
  gap: 8px;
  padding-top: 12px;
  border-top: 1px solid var(--neo-border-color);
}

.neo-anomaly-detail {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.neo-anomaly-detail-label {
  color: var(--neo-ink-muted);
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.neo-anomaly-detail-value {
  color: var(--neo-ink-soft);
  font-size: 13px;
  font-weight: 600;
  text-align: right;
}

.neo-insights-session-badge {
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px;
}

.neo-error {
  padding: 12px 16px;
  border-radius: var(--neo-radius-card);
  background: var(--neo-critical-bg);
  color: var(--neo-critical-contrast);
  font-size: 13px;
  font-weight: 600;
}

.neo-placeholder {
  padding: 24px 16px;
  text-align: center;
  color: var(--neo-ink-muted);
  font-size: 13px;
}

.neo-analytics-meta {
  color: var(--neo-ink-muted);
  font-size: 12px;
  font-weight: 500;
}

.neo-analytics-meta strong {
  color: var(--neo-ink-soft);
  font-weight: 600;
}

@media (max-width: 768px) {
  .neo-insights-hero {
    flex-direction: column;
    align-items: flex-start;
  }

  .neo-risk-badge-hero {
    min-width: unset;
    width: 100%;
  }

  .neo-insights-metrics-grid {
    grid-template-columns: 1fr;
  }

  .neo-metric-value {
    font-size: 28px;
  }
}
</style>