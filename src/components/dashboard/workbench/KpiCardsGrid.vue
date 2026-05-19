<template>
  <div class="neo-kpi-cards-grid">
    <!-- Session KPIs -->
    <div class="neo-kpi-group">
      <div class="neo-kpi-group-title">{{ t('anomalyWorkbenchSection.sessionTitle') }}</div>
      <div v-if="loading" class="neo-kpi-group-loading">
        <div class="skeleton" style="height: 40px"></div>
        <div class="skeleton" style="height: 40px"></div>
        <div class="skeleton" style="height: 40px"></div>
      </div>
      <div v-else class="neo-kpi-cards">
        <div class="neo-kpi-card">
          <span class="neo-kpi-label">{{ t('anomalyWorkbenchSection.labels.status') }}</span>
          <span class="neo-kpi-value">{{ sessionStatus }}</span>
        </div>
        <div class="neo-kpi-card">
          <span class="neo-kpi-label">{{ t('anomalyWorkbenchSection.labels.duration') }}</span>
          <span class="neo-kpi-value">{{ sessionDuration }}</span>
        </div>
        <div class="neo-kpi-card">
          <span class="neo-kpi-label">{{ t('anomalyWorkbenchSection.labels.actions') }}</span>
          <span class="neo-kpi-value">{{ sessionActionCount }}</span>
        </div>
        <div class="neo-kpi-card">
          <span class="neo-kpi-label">{{ t('anomalyWorkbenchSection.labels.uniqueActions') }}</span>
          <span class="neo-kpi-value">{{ sessionUniqueActions }}</span>
        </div>
        <div class="neo-kpi-card">
          <span class="neo-kpi-label">{{ t('anomalyWorkbenchSection.labels.koRate') }}</span>
          <span class="neo-kpi-value">{{ sessionKoRate }}</span>
        </div>
        <div class="neo-kpi-card">
          <span class="neo-kpi-label">{{ t('anomalyWorkbenchSection.labels.ensembleRisk') }}</span>
          <span class="neo-kpi-value">{{ sessionEnsembleRisk }}</span>
        </div>
      </div>
    </div>

    <!-- Risk Profile KPIs -->
    <div class="neo-kpi-group">
      <div class="neo-kpi-group-title">{{ t('anomalyWorkbenchSection.riskProfileTitle') }}</div>
      <div v-if="!riskProfile" class="neo-kpi-group-empty">
        {{ t('anomalyWorkbenchSection.riskProfileEmpty') }}
      </div>
      <div v-else class="neo-kpi-cards">
        <div class="neo-kpi-card neo-kpi-card--risk">
          <span class="neo-kpi-label">{{ t('anomalyWorkbenchSection.labels.riskTier') }}</span>
          <span class="neo-kpi-value" :class="riskTierClass">{{ riskTier }}</span>
        </div>
        <div class="neo-kpi-card">
          <span class="neo-kpi-label">{{ t('anomalyWorkbenchSection.labels.anomalyRate30d') }}</span>
          <span class="neo-kpi-value">{{ riskAnomalyRate }}</span>
        </div>
        <div class="neo-kpi-card">
          <span class="neo-kpi-label">{{ t('anomalyWorkbenchSection.labels.cleanStreak') }}</span>
          <span class="neo-kpi-value">{{ riskCleanStreak }}</span>
        </div>
        <div class="neo-kpi-card">
          <span class="neo-kpi-label">{{ t('anomalyWorkbenchSection.labels.lastAnomaly') }}</span>
          <span class="neo-kpi-value neo-kpi-value--small">{{ riskLastAnomaly }}</span>
        </div>
      </div>
    </div>

    <!-- Predicted Actions KPIs -->
    <div class="neo-kpi-group">
      <div class="neo-kpi-group-title">{{ t('anomalyWorkbenchSection.predictedActionsTitle') }}</div>
      <div v-if="!nextActions || !nextActions.top3Actions?.length" class="neo-kpi-group-empty">
        {{ t('anomalyWorkbenchSection.predictionsEmpty') }}
      </div>
      <div v-else class="neo-kpi-actions-list">
        <div
          v-for="action in nextActionsWithProb"
          :key="action.action"
          class="neo-kpi-action-row"
        >
          <div class="neo-kpi-action-head">
            <span class="neo-kpi-action-name">{{ action.action }}</span>
            <strong class="neo-kpi-action-prob">{{ action.prob }}</strong>
          </div>
          <q-linear-progress
            :value="action.rawProb"
            color="secondary"
            size="5px"
            rounded
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import type {
  AnomalyAlertDto,
  NextActionPredictionDto,
  SessionAnalysisDto,
  UserRiskProfileDto,
} from 'src/types/analytics';
import { formatDurationSeconds, formatNumber, formatPercent, formatScore } from 'src/utils/format';

const props = defineProps<{
  sessionAnalysis: SessionAnalysisDto | null;
  loading: boolean;
  riskProfile: UserRiskProfileDto | null;
  nextActions: NextActionPredictionDto | null;
  activeAnomaly: AnomalyAlertDto | null;
}>();

const { t } = useI18n();

const readableText = (value: string | null | undefined, fallback = '—') =>
  value && value.trim().length > 0 ? value : fallback;

const readablePercent = (value: number | null | undefined, fallback = '—') =>
  value == null || Number.isNaN(value) ? fallback : formatPercent(value, 1);

const readableScore = (value: number | null | undefined, fallback = '—') =>
  value == null || Number.isNaN(value) ? fallback : formatScore(value);

const readableDuration = (value: number | null | undefined, fallback = '—') =>
  value == null || Number.isNaN(value) ? fallback : formatDurationSeconds(value);

const readableNumber = (value: number | null | undefined, fallback = '—') =>
  value == null || Number.isNaN(value) ? fallback : formatNumber(value);

const sessionStatus = computed(() => {
  if (props.sessionAnalysis?.isAnomaly != null) {
    return props.sessionAnalysis.isAnomaly ? t('common.anomalous') : t('common.observed');
  }
  return '—';
});

const sessionDuration = computed(() =>
  readableDuration(props.sessionAnalysis?.sessionDurationSeconds),
);

const sessionActionCount = computed(() => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const value = (props.sessionAnalysis as any)?.actionCount ?? (props.sessionAnalysis as any)?.actionCounts;
  return readableNumber(value);
});

const sessionUniqueActions = computed(() => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const value = (props.sessionAnalysis as any)?.uniqueActionCount ?? (props.sessionAnalysis as any)?.uniqueActions;
  return readableNumber(value);
});

const sessionKoRate = computed(() =>
  readablePercent(props.sessionAnalysis?.koRate),
);

const sessionEnsembleRisk = computed(() =>
  readableScore(props.sessionAnalysis?.ensembleRiskScore),
);

const riskTier = computed(() =>
  readableText(props.riskProfile?.riskTier),
);

const riskTierClass = computed(() => {
  const tier = props.riskProfile?.riskTier?.toLowerCase();
  if (tier === 'critical' || tier === 'high') return 'is-critical';
  if (tier === 'medium') return 'is-warning';
  return 'is-safe';
});

const riskAnomalyRate = computed(() =>
  readablePercent(props.riskProfile?.anomalyRate30d),
);

const riskCleanStreak = computed(() =>
  readableNumber(props.riskProfile?.consecutiveCleanSessions),
);

const riskLastAnomaly = computed(() =>
  readableText(props.riskProfile?.lastAnomalyType),
);

const nextActionsWithProb = computed(() => {
  if (!props.nextActions?.top3Actions) return [];
  return props.nextActions.top3Actions.map((action) => ({
    ...action,
    prob: formatPercent(action.probability, 1),
    rawProb: Math.min(action.probability ?? 0, 1),
  }));
});
</script>

<style scoped>
.neo-kpi-cards-grid {
  display: grid;
  gap: var(--neo-space-5);
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
}

.neo-kpi-group {
  border: var(--neo-border);
  border-radius: var(--neo-radius-card);
  background: var(--neo-card-bg);
  box-shadow: var(--neo-shadow-card);
  padding: 12px;
  margin-bottom: 10px;
}

.neo-kpi-group-title {
  color: var(--neo-ink);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  margin-bottom: 8px;
  padding-bottom: 6px;
  border-bottom: 1px solid var(--neo-border-color);
}

.neo-kpi-group-empty {
  padding: 16px 12px;
  text-align: center;
  color: var(--neo-ink-muted);
  font-size: 12px;
}

.neo-kpi-group-loading {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.neo-kpi-cards {
  display: grid;
  gap: 6px;
  grid-template-columns: repeat(3, 1fr);
}

.neo-kpi-card {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 8px;
  border: 1px solid var(--neo-border-color);
  border-radius: var(--neo-radius-control);
  background: rgba(23, 33, 43, 0.03);
}

.neo-kpi-card--risk {
  grid-column: 1 / -1;
}

.neo-kpi-label {
  color: var(--neo-ink-muted);
  font-size: 8px;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.neo-kpi-value {
  color: var(--neo-ink);
  font-size: 14px;
  font-weight: 800;
  line-height: 1.2;
}

.neo-kpi-value--small {
  font-size: 13px;
}

.neo-kpi-value.is-critical {
  color: var(--neo-critical);
}

.neo-kpi-value.is-warning {
  color: var(--neo-warning);
}

.neo-kpi-value.is-safe {
  color: var(--neo-success);
}

.neo-kpi-actions-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.neo-kpi-action-row {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 8px;
  border: 1px solid var(--neo-border-color);
  border-radius: var(--neo-radius-control);
  background: rgba(23, 33, 43, 0.03);
}

.neo-kpi-action-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.neo-kpi-action-name {
  color: var(--neo-ink);
  font-size: 12px;
  font-weight: 600;
  flex: 1;
}

.neo-kpi-action-prob {
  color: var(--neo-accent);
  font-family: 'JetBrains Mono', monospace;
  font-size: 12px;
  white-space: nowrap;
}
</style>
