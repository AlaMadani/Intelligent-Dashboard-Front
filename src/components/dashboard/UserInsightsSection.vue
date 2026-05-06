<template>
  <!-- User intelligence page: lookup insured context, predictions, and active anomaly status. -->
  <section id="insights" class="neo-section neo-investigation">
    <div class="neo-section-header">
      <div>
        <div class="neo-section-title">{{ t('userInsightsSection.title') }}</div>
        <div class="neo-section-subtitle">{{ t('userInsightsSection.subtitle') }}</div>
      </div>
    </div>

    <!-- Three panels split the insured lookup, predicted actions, and active anomaly snapshot. -->
    <div class="neo-investigation-grid">
      <div class="neo-panel">
        <div class="neo-panel-header">
          <div>
            <div class="neo-panel-title">{{ t('userInsightsSection.lookupTitle') }}</div>
            <div class="neo-panel-subtitle">{{ t('userInsightsSection.lookupSubtitle') }}</div>
          </div>
          <div class="neo-panel-actions">
            <q-input
              dense
              outlined
              v-model="insuredModel"
              :placeholder="t('userInsightsSection.insuredPlaceholder')"
              class="neo-input-compact"
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
        </div>

        <div v-if="error" class="neo-error">{{ error }}</div>
        <div v-else-if="!riskProfile" class="neo-placeholder">
          {{ t('userInsightsSection.enterPrompt') }}
        </div>
        <div v-else class="neo-explanation">
          <div class="neo-explanation-meta">
            <div>
              <div class="neo-explanation-label">{{ t('userInsightsSection.labels.riskTier') }} <q-icon name="help_outline" class="neo-hint-icon-sm"><q-tooltip>{{ t('userInsightsSection.tooltips.riskTier') }}</q-tooltip></q-icon></div>
              <div class="neo-explanation-value">{{ riskProfile.riskTier ?? t('common.notAvailable') }}</div>
            </div>
            <div>
              <div class="neo-explanation-label">{{ t('userInsightsSection.labels.anomalyRate30d') }} <q-icon name="help_outline" class="neo-hint-icon-sm"><q-tooltip>{{ t('userInsightsSection.tooltips.anomalyRate30d') }}</q-tooltip></q-icon></div>
              <div class="neo-explanation-value">
                {{ formatPercent(riskProfile.anomalyRate30d, 1) }}
              </div>
            </div>
            <div>
              <div class="neo-explanation-label">{{ t('userInsightsSection.labels.sessions30d') }} <q-icon name="help_outline" class="neo-hint-icon-sm"><q-tooltip>{{ t('userInsightsSection.tooltips.sessions30d') }}</q-tooltip></q-icon></div>
              <div class="neo-explanation-value">{{ riskProfile.sessions30d ?? 0 }}</div>
            </div>
            <div>
              <div class="neo-explanation-label">{{ t('userInsightsSection.labels.lastAnomaly') }} <q-icon name="help_outline" class="neo-hint-icon-sm"><q-tooltip>{{ t('userInsightsSection.tooltips.lastAnomaly') }}</q-tooltip></q-icon></div>
              <div class="neo-explanation-value">
                {{ riskProfile.lastAnomalyType || t('common.notAvailable') }}
              </div>
            </div>
            <div>
              <div class="neo-explanation-label">{{ t('userInsightsSection.labels.lastUpdated') }} <q-icon name="help_outline" class="neo-hint-icon-sm"><q-tooltip>{{ t('userInsightsSection.tooltips.lastUpdated') }}</q-tooltip></q-icon></div>
              <div class="neo-explanation-value">{{ formatDate(riskProfile.lastUpdated) }}</div>
            </div>
            <div>
              <div class="neo-explanation-label">{{ t('userInsightsSection.labels.anomalies7d') }}</div>
              <div class="neo-explanation-value">{{ riskProfile.anomalyCount7d ?? 0 }}</div>
            </div>
            <div>
              <div class="neo-explanation-label">{{ t('userInsightsSection.labels.anomalies30d') }}</div>
              <div class="neo-explanation-value">{{ riskProfile.anomalyCount30d ?? 0 }}</div>
            </div>
            <div>
              <div class="neo-explanation-label">{{ t('userInsightsSection.labels.sessions7d') }}</div>
              <div class="neo-explanation-value">{{ riskProfile.sessions7d ?? 0 }}</div>
            </div>
            <div>
              <div class="neo-explanation-label">{{ t('userInsightsSection.labels.mostFrequentAction30d') }}</div>
              <div class="neo-explanation-value">
                {{ riskProfile.mostFrequentAction30d || t('common.notAvailable') }}
              </div>
            </div>
            <div>
              <div class="neo-explanation-label">{{ t('userInsightsSection.labels.avgSession30d') }}</div>
              <div class="neo-explanation-value">
                {{ formatDurationSeconds(riskProfile.avgSessionDuration30d) }}
              </div>
            </div>
          </div>

          <div class="neo-analytics-meta">
            {{ t('userInsightsSection.consecutiveCleanSessions', { count: riskProfile.consecutiveCleanSessions ?? 0 }) }}
          </div>
        </div>
      </div>

      <div class="neo-panel neo-panel-contrast">
        <div class="neo-panel-header">
          <div>
            <div class="neo-panel-title">{{ t('userInsightsSection.predictedActionsTitle') }}</div>
            <div class="neo-panel-subtitle">{{ t('userInsightsSection.predictedActionsSubtitle') }}</div>
          </div>
        </div>

        <div v-if="!nextActions?.top3Actions?.length" class="neo-placeholder">
          {{ t('userInsightsSection.noPredictions') }}
        </div>
        <div v-else class="neo-analytics-list">
          <div class="neo-analytics-meta">
            {{ nextActions.sessionId ? `${t('common.session')} ${nextActions.sessionId}` : t('userInsightsSection.crossSessionPrediction') }}
            <span v-if="nextActions.predictedAt"> / {{ formatDate(nextActions.predictedAt) }}</span>
          </div>
          <div v-for="action in nextActions.top3Actions" :key="action.action" class="neo-analytics-row">
            <span>{{ action.action }}</span>
            <strong>{{ formatPercent(action.probability, 1) }}</strong>
          </div>
        </div>
      </div>

      <div class="neo-panel neo-panel-sequence">
        <div class="neo-panel-header">
          <div>
            <div class="neo-panel-title">{{ t('userInsightsSection.activeAnomalyTitle') }}</div>
            <div class="neo-panel-subtitle">{{ t('userInsightsSection.activeAnomalySubtitle') }}</div>
          </div>
        </div>

        <div v-if="!activeAnomaly" class="neo-placeholder">{{ t('userInsightsSection.noActiveAnomaly') }}</div>
        <div v-else class="neo-explanation">
          <div class="neo-explanation-meta">
            <div>
              <div class="neo-explanation-label">{{ t('userInsightsSection.labels.tier') }}</div>
              <div class="neo-explanation-value">{{ activeAnomaly.anomalyTier }}</div>
            </div>
            <div>
              <div class="neo-explanation-label">{{ t('userInsightsSection.labels.type') }}</div>
              <div class="neo-explanation-value">{{ activeAnomaly.anomalyType }}</div>
            </div>
            <div>
              <div class="neo-explanation-label">{{ t('userInsightsSection.labels.score') }}</div>
              <div class="neo-explanation-value">
                {{ formatScore(activeAnomaly.anomalyScore) }}
              </div>
            </div>
            <div v-if="activeAnomaly.riskScore != null">
              <div class="neo-explanation-label">{{ t('userInsightsSection.labels.ensembleRisk') }}</div>
              <div class="neo-explanation-value">
                {{ formatScore(activeAnomaly.riskScore) }}
              </div>
            </div>
            <div v-if="activeAnomaly.churnProbability != null">
              <div class="neo-explanation-label">{{ t('userInsightsSection.labels.churn') }}</div>
              <div class="neo-explanation-value">
                {{ formatPercent(activeAnomaly.churnProbability, 1) }}
              </div>
            </div>
            <div>
              <div class="neo-explanation-label">{{ t('userInsightsSection.labels.detected') }}</div>
              <div class="neo-explanation-value">
                {{ formatDate(activeAnomaly.detectedAt) }}
              </div>
            </div>
            <div v-if="activeAnomaly.ruleType">
              <div class="neo-explanation-label">{{ t('userInsightsSection.labels.ruleType') }}</div>
              <div class="neo-explanation-value">{{ activeAnomaly.ruleType }}</div>
            </div>
            <div
              v-if="
                activeAnomaly.transitionFromAction ||
                activeAnomaly.transitionToAction
              "
            >
              <div class="neo-explanation-label">{{ t('userInsightsSection.labels.transition') }}</div>
              <div class="neo-explanation-value">
                {{ activeAnomaly.transitionFromAction || t('common.notAvailable') }} ->
                {{ activeAnomaly.transitionToAction || t('common.notAvailable') }}
              </div>
            </div>
            <div v-if="activeAnomaly.modelArtifact">
              <div class="neo-explanation-label">{{ t('userInsightsSection.labels.modelArtifact') }}</div>
              <div class="neo-explanation-value">{{ activeAnomaly.modelArtifact }}</div>
            </div>
          </div>

          <div v-if="activeAnomaly.nextActions?.length" class="neo-analytics-meta">
            {{ t('userInsightsSection.suggestedNextActions') }}
            {{ activeAnomaly.nextActions.map((action) => action.action).join(', ') }}
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
// Parent-managed state feeds the insured lookup while this component remains presentation-focused.
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

// Computed setter keeps the insured ID input synchronized with the shared store.
const insuredModel = computed({
  get: () => props.insuredId,
  set: (value: string) => emit('update:insuredId', value),
});
</script>
