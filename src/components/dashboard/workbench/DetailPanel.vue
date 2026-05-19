<template>
  <div class="neo-workbench-detail">
    <div class="neo-panel neo-detail-panel">
      <div class="neo-panel-header">
        <div>
          <div class="neo-panel-title">{{ t('anomalyWorkbenchSection.selectedContextTitle') }}</div>
          <div class="neo-panel-subtitle">{{ t('anomalyWorkbenchSection.selectedContextSubtitle') }}</div>
        </div>
      </div>

      <div v-if="!selectedEvent" class="neo-placeholder">
        {{ t('anomalyWorkbenchSection.selectAnomalyPrompt') }}
      </div>

      <template v-else>
        <!-- Collapsible Summary Section -->
        <q-expansion-item
          v-model="summaryExpanded"
          dense
          expand-separator
          icon="expand_more"
          class="neo-detail-summary-item"
        >
          <template #header>
            <div class="neo-detail-summary-compact">
              <q-badge :color="tierColor(selectedEvent.anomalyTier)" text-color="white" class="neo-detail-tier">
                {{ selectedEvent.anomalyTier }}
              </q-badge>
              <span class="neo-detail-type">{{ selectedEvent.anomalyType || t('common.unknown') }}</span>
              <span class="neo-detail-insured">{{ selectedEvent.insuredId }}</span>
            </div>
          </template>

          <!-- Expanded Content: Score Bars -->
          <div class="neo-detail-scores-expanded">
            <div class="neo-score-bar">
              <span class="neo-score-label">{{ t('anomalyWorkbenchSection.labels.score') }}</span>
              <span class="neo-score-value">{{ readableScore(selectedEvent.anomalyScore) }}</span>
              <q-linear-progress
                :value="clamp(selectedEvent.anomalyScore, 100)"
                :color="scoreColor(selectedEvent.anomalyScore)"
                size="4px"
                rounded
              />
            </div>
            <div v-if="selectedEvent.anomalyProbability != null" class="neo-score-bar">
              <span class="neo-score-label">{{ t('anomalyWorkbenchSection.labels.anomalyProbability') }}</span>
              <span class="neo-score-value">{{ readablePercent(selectedEvent.anomalyProbability) }}</span>
              <q-linear-progress
                :value="clamp(selectedEvent.anomalyProbability, 1)"
                color="negative"
                size="4px"
                rounded
              />
            </div>
            <div v-if="selectedEvent.riskScore != null" class="neo-score-bar">
              <span class="neo-score-label">{{ t('anomalyWorkbenchSection.labels.ensembleRisk') }}</span>
              <span class="neo-score-value">{{ readableScore(selectedEvent.riskScore) }}</span>
              <q-linear-progress
                :value="clamp(selectedEvent.riskScore, 100)"
                :color="scoreColor(selectedEvent.riskScore)"
                size="4px"
                rounded
              />
            </div>
            <div v-if="selectedEvent.churnProbability != null" class="neo-score-bar">
              <span class="neo-score-label">{{ t('anomalyWorkbenchSection.labels.churnProbability') }}</span>
              <span class="neo-score-value">{{ readablePercent(selectedEvent.churnProbability) }}</span>
              <q-linear-progress
                :value="clamp(selectedEvent.churnProbability, 1)"
                color="warning"
                size="4px"
                rounded
              />
            </div>

            <!-- Meta Info Row -->
            <div class="neo-detail-meta-row">
              <div class="neo-detail-meta-item">
                <span class="neo-detail-meta-label">{{ t('anomalyWorkbenchSection.labels.event') }}</span>
                <span class="neo-detail-meta-value neo-mono">{{ selectedEvent.eventId || selectedEvent.id }}</span>
              </div>
              <div class="neo-detail-meta-item">
                <span class="neo-detail-meta-label">{{ t('anomalyWorkbenchSection.labels.pathDeviation') }}</span>
                <span class="neo-detail-meta-value">{{ selectedEvent.pathDeviation ? t('common.yes') : t('common.no') }}</span>
              </div>
              <div class="neo-detail-meta-item">
                <span class="neo-detail-meta-label">{{ t('anomalyWorkbenchSection.labels.ruleType') }}</span>
                <span class="neo-detail-meta-value">{{ readableText(selectedEvent.ruleType) }}</span>
              </div>
            </div>
          </div>
        </q-expansion-item>

        <!-- Tabbed Content -->
        <q-tabs
          v-model="activeTab"
          dense
          class="neo-detail-tabs"
          indicator-color="primary"
          active-color="primary"
          align="left"
        >
          <q-tab name="kpis" label="KPIs & Context" />
          <q-tab name="visualization" label="Visualization" />
          <q-tab name="json" label="Data" />
        </q-tabs>

        <q-tab-panels v-model="activeTab" class="neo-detail-panels">
          <!-- KPIs Tab -->
          <q-tab-panel name="kpis" class="neo-detail-tab-panel">
            <KpiCardsGrid
              :session-analysis="sessionAnalysis"
              :loading="sessionAnalysisLoading"
              :risk-profile="riskProfile"
              :next-actions="nextActions"
              :active-anomaly="activeAnomaly"
            />
          </q-tab-panel>

          <!-- Visualization Tab -->
          <q-tab-panel name="visualization" class="neo-detail-tab-panel">
            <div class="neo-visualization-container">
              <FeatureRadarChart :items="displayedFeatureContributions" />
              <JourneyPathMap
                :steps="displayedActionSequence"
                :rare-transitions="displayedRareTransitions"
                :path-deviation="sessionAnalysis?.pathDeviation ?? selectedEvent.pathDeviation ?? null"
              />
            </div>

            <!-- Tags & Rules -->
            <div v-if="displayedTriggeredRules.length || displayedContextTags.length" class="neo-detail-ribbon">
              <span
                v-for="tag in displayedContextTags"
                :key="'tag-' + tag"
                class="neo-detail-chip neo-detail-chip--tag"
              >
                {{ tag }}
              </span>
              <span
                v-for="rule in displayedTriggeredRules"
                :key="'rule-' + rule"
                class="neo-detail-chip neo-detail-chip--rule"
              >
                {{ rule }}
              </span>
            </div>
          </q-tab-panel>

          <!-- JSON Data Tab -->
          <q-tab-panel name="json" class="neo-detail-tab-panel">
            <q-expansion-item
              v-if="liveSessionInsight"
              dense
              expand-separator
              icon="bolt"
              label="Live Session Insight"
              class="neo-detail-expander"
            >
              <pre class="neo-json-block">{{ formatJsonValue(liveSessionInsight) }}</pre>
            </q-expansion-item>

            <q-expansion-item
              v-if="displayedEventContext"
              dense
              expand-separator
              icon="data_object"
              label="Alert Context"
              class="neo-detail-expander"
            >
              <pre class="neo-json-block">{{ formatJsonValue(displayedEventContext) }}</pre>
            </q-expansion-item>

            <q-expansion-item
              v-if="sessionAnalysis?.actionCounts && Object.keys(sessionAnalysis.actionCounts).length"
              dense
              expand-separator
              icon="list_alt"
              label="Action Counts"
              class="neo-detail-expander"
            >
              <pre class="neo-json-block">{{ JSON.stringify(sessionAnalysis.actionCounts, null, 2) }}</pre>
            </q-expansion-item>
          </q-tab-panel>
        </q-tab-panels>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import FeatureRadarChart from '../FeatureRadarChart.vue';
import JourneyPathMap from '../JourneyPathMap.vue';
import KpiCardsGrid from './KpiCardsGrid.vue';
import type {
  AnomalyAlertDto,
  AnomalyEventDto,
  FeatureContributionDto,
  NextActionPredictionDto,
  SessionAnalysisDto,
  UserRiskProfileDto,
} from 'src/types/analytics';
import { formatPercent, formatScore } from 'src/utils/format';

const props = defineProps<{
  selectedEvent: AnomalyEventDto | null;
  sessionAnalysis: SessionAnalysisDto | null;
  sessionAnalysisLoading: boolean;
  riskProfile: UserRiskProfileDto | null;
  nextActions: NextActionPredictionDto | null;
  activeAnomaly: AnomalyAlertDto | null;
  liveSessionInsight?: Record<string, unknown> | null | undefined;
}>();

const { t } = useI18n();
const activeTab = ref('kpis');
const summaryExpanded = ref(true);

const clamp = (value: number | null | undefined, max: number) =>
  value == null ? 0 : Math.min(value / max, 1);

const scoreColor = (score: number | null | undefined) => {
  if (score == null) return 'grey';
  if (score >= 80) return 'negative';
  if (score >= 50) return 'warning';
  return 'positive';
};

const tierColor = (tier: string | null | undefined) => {
  if (tier === 'TIER3') return 'negative';
  if (tier === 'TIER2') return 'warning';
  if (tier === 'TIER1') return 'primary';
  if (tier === 'SESSION_RUNTIME') return 'secondary';
  return 'grey';
};

const readableText = (value: string | null | undefined, fallback = '—') =>
  value && value.trim().length > 0 ? value : fallback;

const readablePercent = (value: number | null | undefined, fallback = '—') =>
  value == null || Number.isNaN(value) ? fallback : formatPercent(value, 1);

const readableScore = (value: number | null | undefined, fallback = '—') =>
  value == null || Number.isNaN(value) ? fallback : formatScore(value);

const formatJsonValue = (value: unknown): string => JSON.stringify(value, null, 2);

const displayedFeatureContributions = computed((): FeatureContributionDto[] => {
  // Note: featureContributions may not exist in all versions of SessionAnalysisDto
  return [];
});

const displayedActionSequence = computed(() => {
  if (!props.sessionAnalysis?.actionSequence) return [];
  return props.sessionAnalysis.actionSequence.slice(0, 10);
});

const displayedRareTransitions = computed(() => {
  if (!props.sessionAnalysis?.rareTransitions) return [];
  return props.sessionAnalysis.rareTransitions.slice(0, 5);
});

const displayedContextTags = computed(() => {
  if (!props.sessionAnalysis?.contextTags) return [];
  return props.sessionAnalysis.contextTags.slice(0, 8);
});

const displayedTriggeredRules = computed(() => {
  // Note: triggeredRules may not exist in all versions of AnomalyEventDto
  return [];
});

const displayedEventContext = computed(() => {
  // We return minimal context since custom properties vary
  return null;
});
</script>

<style scoped>
.neo-workbench-detail {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.neo-detail-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

.neo-placeholder {
  padding: 48px 24px;
  text-align: center;
  color: var(--neo-ink-muted);
  font-size: 14px;
}

/* Collapsible Summary Item */
.neo-detail-summary-item {
  flex-shrink: 0;
  margin-bottom: 0 !important;
}

.neo-detail-summary-compact {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  padding: 8px 0;
}

.neo-detail-tier {
  font-size: 10px;
  letter-spacing: 0.06em;
  flex-shrink: 0;
}

.neo-detail-type {
  color: var(--neo-ink);
  font-size: 14px;
  font-weight: 700;
}

.neo-detail-insured {
  color: var(--neo-ink-muted);
  font-size: 12px;
  font-family: 'JetBrains Mono', monospace;
  margin-left: auto;
}

/* Expanded Scores Section */
.neo-detail-scores-expanded {
  display: grid;
  gap: 6px;
  padding: 8px 0;
  grid-template-columns: repeat(2, 1fr);
}

.neo-score-bar {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 6px 8px;
  border: 1px solid var(--neo-border-color);
  border-radius: var(--neo-radius-control);
  background: rgba(23, 33, 43, 0.03);
}

.neo-score-label {
  color: var(--neo-ink-muted);
  font-size: 9px;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.neo-score-value {
  color: var(--neo-ink);
  font-size: 13px;
  font-weight: 800;
}

.neo-detail-meta-row {
  display: flex;
  gap: 12px;
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid var(--neo-border-color);
  flex-wrap: wrap;
}

.neo-detail-meta-item {
  display: flex;
  align-items: center;
  gap: 6px;
}

.neo-detail-meta-label {
  color: var(--neo-ink-muted);
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.neo-detail-meta-value {
  color: var(--neo-ink-soft);
  font-size: 12px;
  font-weight: 600;
}

.neo-mono {
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px;
}

.neo-detail-tabs {
  margin-bottom: 0 !important;
  flex-shrink: 0;
}

.neo-detail-panels {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 0;
  min-height: 0;
}

.neo-detail-tab-panel {
  padding: 12px 16px !important;
  height: 100%;
  overflow-y: auto;
  overflow-x: hidden;
}

.neo-visualization-container {
  display: grid;
  gap: 10px;
  grid-template-columns: 1fr;
  margin-bottom: 10px;
}

.neo-detail-ribbon {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  padding: 8px;
  border: 1px solid var(--neo-border-color);
  border-radius: var(--neo-radius-control);
  background: rgba(23, 33, 43, 0.03);
  margin-bottom: 10px;
}

.neo-detail-chip {
  display: inline-flex;
  align-items: center;
  padding: 3px 8px;
  border-radius: 4px;
  font-size: 10px;
  font-weight: 600;
}

.neo-detail-chip--tag {
  background: var(--neo-info-bg);
  color: var(--neo-info-contrast);
}

.neo-detail-chip--rule {
  background: var(--neo-warning-bg);
  color: var(--neo-warning-contrast);
}

.neo-detail-expander {
  margin-bottom: 6px;
}

.neo-json-block {
  padding: 8px;
  border-radius: var(--neo-radius-control);
  background: #f5f5f5;
  color: #333;
  font-family: 'JetBrains Mono', monospace;
  font-size: 10px;
  overflow-x: auto;
  max-height: 300px;
  white-space: pre-wrap;
  word-break: break-word;
  overflow-y: auto;
}

.neo-placeholder {
  padding: 24px 16px;
  text-align: center;
  color: var(--neo-ink-muted);
  font-size: 13px;
}

@media (max-width: 768px) {
  .neo-visualization-container {
    grid-template-columns: 1fr;
  }

  .neo-detail-meta-row {
    flex-direction: column;
  }

  .neo-detail-insured {
    margin-left: 0;
  }

  .neo-detail-scores-expanded {
    grid-template-columns: 1fr;
  }
}
</style>
