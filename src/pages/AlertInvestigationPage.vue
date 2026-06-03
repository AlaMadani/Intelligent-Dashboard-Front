<template>
  <q-page class="neo-page">
    <section class="neo-section">
      <div class="neo-section-header">
        <div>
          <div class="neo-kicker">{{ t('v36.common.schema') }}</div>
          <h1 class="neo-section-title">{{ t('v36.investigation.title') }}</h1>
          <p class="neo-section-subtitle">{{ eventId }}</p>
        </div>
        <div class="neo-section-actions">
          <div v-if="source" class="neo-analytics-chip">{{ t('v36.common.source') }}: {{ source }}</div>
          <q-btn
            flat
            icon="arrow_back"
            :label="t('v36.common.backToAlerts')"
            @click="router.push({ name: ROUTE_NAMES.ALERTS })"
          />
          <q-btn unelevated color="primary" icon="refresh" :loading="loading" :label="t('v36.common.refresh')" @click="refresh" />
        </div>
      </div>

      <q-banner v-if="error" class="neo-banner">
        <template #avatar><q-icon name="error_outline" /></template>
        {{ error }}
      </q-banner>

      <q-banner v-if="warnings.length" class="neo-v36-warning">
        <template #avatar><q-icon name="warning" /></template>
        {{ warnings.join(' | ') }}
      </q-banner>
    </section>

    <section v-if="loading && !alert" class="neo-section neo-v36-grid">
      <skeleton-card v-for="i in 4" :key="i" />
    </section>

    <template v-else-if="alert">
      <section class="neo-section neo-panel neo-v36-alert-header">
        <div>
          <div class="neo-v36-header-row">
            <q-badge :color="riskTone(alert.riskLevel)" rounded>
              {{ alert.riskLevel ?? t('common.unknown') }}
            </q-badge>
            <span class="neo-mono">{{ alert.eventId }}</span>
          </div>
          <h2>{{ alert.anomalyType ?? t('common.unknown') }}</h2>
          <p>{{ formatDate(alert.timestamp) }}</p>
        </div>
        <div class="neo-v36-score">
          <span>{{ t('v36.common.finalRiskScore') }}</span>
          <strong>{{ formatNullableScore(alert.finalRiskScore) }}</strong>
          <q-linear-progress
            rounded
            size="10px"
            :value="scoreProgress(alert.finalRiskScore)"
            :color="riskTone(alert.riskLevel)"
          />
        </div>
      </section>

      <section class="neo-section neo-v36-grid">
        <article class="neo-analytics-panel">
          <div class="neo-analytics-head">
            <div>
              <h3>{{ t('v36.investigation.eventMetadata') }}</h3>
              <p>{{ alert.insuredId }} / {{ alert.sessionId }}</p>
            </div>
          </div>
          <div class="neo-v36-fact-grid">
            <div v-for="field in metadataFields" :key="field.label" class="neo-v36-fact">
              <span>{{ field.label }}</span>
              <strong>{{ field.value }}</strong>
            </div>
          </div>
        </article>

        <article class="neo-analytics-panel">
          <div class="neo-analytics-head">
            <div>
              <h3>{{ t('v36.common.modelScores') }}</h3>
              <p>{{ t('v36.investigation.modelScoresSubtitle') }}</p>
            </div>
          </div>
          <div class="neo-v36-fact-grid">
            <div v-for="score in modelScoreFields" :key="score.label" class="neo-v36-fact">
              <span>{{ score.label }}</span>
              <strong>{{ score.value }}</strong>
            </div>
          </div>
        </article>

        <article class="neo-analytics-panel">
          <div class="neo-analytics-head">
            <div>
              <h3>{{ t('v36.common.modelContributions') }}</h3>
              <p>{{ t('v36.investigation.modelContributionsSubtitle') }}</p>
            </div>
          </div>
          <bar-list-chart :items="contributionRows" :empty-message="t('v36.common.noData')" />
        </article>

        <article class="neo-analytics-panel">
          <div class="neo-analytics-head">
            <div>
              <h3>{{ t('v36.common.sequenceEvidence') }}</h3>
              <p>{{ alert.sequenceEvidence?.selectedSequenceModel ?? t('common.notAvailable') }}</p>
            </div>
          </div>
          <div class="neo-v36-fact-grid">
            <div v-for="field in sequenceFields" :key="field.label" class="neo-v36-fact">
              <span>{{ field.label }}</span>
              <strong>{{ field.value }}</strong>
            </div>
          </div>
          <div class="neo-v36-list q-mt-md">
            <div
              v-for="item in alert.sequenceEvidence?.topSequenceSurpriseFields ?? []"
              :key="`${item.field}-${String(item.value)}`"
              class="neo-v36-list-row"
            >
              <span>{{ item.field }}</span>
              <strong>{{ String(item.value ?? '') }} / {{ formatNullableScore(item.score) }}</strong>
            </div>
          </div>
        </article>

        <article class="neo-analytics-panel">
          <div class="neo-analytics-head">
            <div>
              <h3>{{ t('v36.common.tabularEvidence') }}</h3>
              <p>{{ alert.tabularEvidence?.featureContract ?? t('common.notAvailable') }}</p>
            </div>
          </div>
          <div class="neo-v36-list">
            <div class="neo-v36-list-row">
              <span>{{ t('v36.investigation.availableModels') }}</span>
              <strong>{{ listLabel(alert.tabularEvidence?.availableModels) }}</strong>
            </div>
            <div class="neo-v36-list-row">
              <span>{{ t('v36.investigation.unavailableModels') }}</span>
              <strong>{{ listLabel(alert.tabularEvidence?.unavailableModels) }}</strong>
            </div>
            <div class="neo-v36-list-row">
              <span>{{ t('v36.investigation.featureWarnings') }}</span>
              <strong>{{ objectCount(alert.tabularEvidence?.featureWarnings) }}</strong>
            </div>
          </div>
        </article>

        <article class="neo-analytics-panel">
          <div class="neo-analytics-head">
            <div>
              <h3>{{ t('v36.common.ruleEvidence') }}</h3>
              <p>{{ listLabel(alert.triggeredRules) }}</p>
            </div>
          </div>
          <bar-list-chart :items="ruleRows" :empty-message="t('v36.common.noData')" />
        </article>

        <article class="neo-analytics-panel">
          <div class="neo-analytics-head">
            <div>
              <h3>{{ t('v36.investigation.anomalyAttribution') }}</h3>
              <p>{{ alert.anomalyTypeAttribution?.source ?? t('common.notAvailable') }}</p>
            </div>
          </div>
          <div class="neo-v36-fact-grid">
            <div class="neo-v36-fact">
              <span>{{ t('v36.common.anomalyType') }}</span>
              <strong>{{ alert.anomalyTypeAttribution?.anomalyType ?? alert.anomalyType ?? t('common.unknown') }}</strong>
            </div>
            <div class="neo-v36-fact">
              <span>{{ t('common.confidence') }}</span>
              <strong>{{ formatPercent(alert.anomalyTypeAttribution?.confidence, 1) }}</strong>
            </div>
          </div>
        </article>

        <article class="neo-analytics-panel">
          <div class="neo-analytics-head">
            <div>
              <h3>{{ t('v36.common.churnRisk') }}</h3>
              <p>{{ alert.churnContext?.modelName ?? 'ExtraTrees' }}</p>
            </div>
          </div>
          <div class="neo-v36-fact-grid">
            <div class="neo-v36-fact">
              <span>{{ t('v36.churn.churnProbability') }}</span>
              <strong>{{ formatPercent(alert.churnContext?.probability, 1) }}</strong>
            </div>
            <div class="neo-v36-fact">
              <span>{{ t('v36.common.riskLevel') }}</span>
              <strong>{{ alert.churnContext?.riskLevel ?? t('common.unknown') }}</strong>
            </div>
            <div class="neo-v36-fact">
              <span>{{ t('v36.runtime.artifact') }}</span>
              <strong>{{ alert.churnContext?.modelArtifact ?? t('common.notAvailable') }}</strong>
            </div>
          </div>
        </article>

        <article class="neo-analytics-panel">
          <div class="neo-analytics-head">
            <div>
              <h3>{{ t('v36.common.forecastContext') }}</h3>
              <p>{{ forecastModelNames }}</p>
            </div>
          </div>
          <div class="neo-v36-fact-grid">
            <div class="neo-v36-fact">
              <span>{{ t('v36.forecast.predictedTotalEvents') }}</span>
              <strong>{{ formatNumber(alert.forecastContext?.predictedTotalEvents) }}</strong>
            </div>
            <div class="neo-v36-fact">
              <span>{{ t('v36.forecast.predictedAnomalyRate') }}</span>
              <strong>{{ formatPercent(alert.forecastContext?.predictedAnomalyRate, 1) }}</strong>
            </div>
            <div class="neo-v36-fact">
              <span>{{ t('v36.forecast.expectedAlertVolume') }}</span>
              <strong>{{ formatNumber(alert.forecastContext?.expectedAlertVolume) }}</strong>
            </div>
          </div>
        </article>

        <article class="neo-analytics-panel">
          <div class="neo-analytics-head">
            <div>
              <h3>{{ t('v36.common.personaDisabled') }}</h3>
              <p>{{ alert.persona?.source ?? 'disabled_v3_6_refactor' }}</p>
            </div>
            <q-badge color="grey" rounded>{{ alert.persona?.label ?? 'persona_disabled' }}</q-badge>
          </div>
          <div class="neo-v36-persona">
            {{ t('v36.investigation.personaDisabledNotice') }}
          </div>
        </article>

        <article class="neo-analytics-panel neo-v36-wide">
          <div class="neo-analytics-head">
            <div>
              <h3>{{ t('v36.llm.title') }}</h3>
              <p>{{ t('v36.llm.disclaimer') }}</p>
            </div>
            <div class="neo-section-actions">
              <q-btn flat icon="data_object" :label="t('v36.llm.evidencePayload')" :loading="evidenceLoading" @click="openEvidence" />
              <q-btn unelevated color="primary" icon="auto_awesome" :label="t('v36.llm.generateExplanation')" :loading="generating" @click="() => generate()" />
            </div>
          </div>

          <q-banner v-if="llmError" class="neo-banner">{{ llmError }}</q-banner>
          <q-banner v-if="fallback" class="neo-v36-warning">{{ t('v36.llm.fallbackNotice') }}</q-banner>

          <div v-if="llmLoading" class="neo-analytics-empty">{{ t('v36.llm.loadingCached') }}</div>
          <div v-else-if="!explanation" class="neo-analytics-empty">{{ t('v36.llm.noCachedExplanation') }}</div>
          <div v-else class="neo-v36-explanation">
            <h4>{{ explanation.summary }}</h4>
            <p v-if="explanation.possibleInterpretation">{{ explanation.possibleInterpretation }}</p>
            <ul v-if="explanation.evidenceBullets?.length">
              <li v-for="bullet in explanation.evidenceBullets" :key="bullet">{{ bullet }}</li>
            </ul>
            <div v-if="explanation.recommendedActions?.length">
              <strong>{{ t('v36.llm.recommendedActions') }}</strong>
              <ul>
                <li v-for="action in explanation.recommendedActions" :key="action">{{ action }}</li>
              </ul>
            </div>
            <small>{{ explanation.disclaimer ?? t('v36.llm.disclaimer') }}</small>
          </div>
        </article>
      </section>
    </template>

    <section v-else class="neo-section neo-analytics-empty">
      {{ t('v36.investigation.notFound') }}
    </section>

    <q-dialog v-model="evidenceDialog" maximized>
      <q-card class="neo-v36-evidence-card">
        <q-card-section class="row items-center justify-between">
          <div>
            <div class="text-h6">{{ t('v36.llm.evidencePayload') }}</div>
            <div class="text-caption">{{ eventId }}</div>
          </div>
          <q-btn flat round icon="close" v-close-popup />
        </q-card-section>
        <q-separator />
        <q-card-section>
          <q-banner v-if="evidenceError" class="neo-banner">{{ evidenceError }}</q-banner>
          <pre class="neo-v36-json">{{ evidenceJson }}</pre>
        </q-card-section>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import BarListChart from 'src/components/dashboard/BarListChart.vue';
import SkeletonCard from 'src/components/dashboard/SkeletonCard.vue';
import { useAlertInvestigation } from 'src/composables/v36/useAlertInvestigation';
import { useLlmExplanation } from 'src/composables/v36/useLlmExplanation';
import { ROUTE_NAMES } from 'src/router/route-names';
import {
  formatDate,
  formatNullableScore,
  formatNumber,
  formatPercent,
  riskTone,
  safeRecord,
} from 'src/utils/format';

const route = useRoute();
const router = useRouter();
const { t } = useI18n();
const evidenceDialog = ref(false);

const eventId = computed(() => String(route.params.eventId ?? ''));
const { data: alert, loading, error, refresh, source, warnings } = useAlertInvestigation(eventId);
const {
  explanation,
  evidence,
  loading: llmLoading,
  evidenceLoading,
  generating,
  error: llmError,
  evidenceError,
  fallback,
  loadEvidence,
  generate,
} = useLlmExplanation(eventId);

const stringValue = (value: unknown) => {
  if (value == null || value === '') return t('common.notAvailable');
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  return t('common.notAvailable');
};

const metadataFields = computed(() => {
  const metadata = alert.value?.eventMetadata ?? {};
  return [
    ['Event action', metadata.eventAction],
    ['API template', metadata.apiTemplate],
    ['API family', metadata.apiFamily],
    ['Country', metadata.country],
    ['Device', metadata.device],
    ['Browser', metadata.browser],
    ['OS', metadata.os],
    ['HTTP method', metadata.httpMethod],
    ['Status', metadata.status],
  ].map(([label, value]) => ({ label: String(label), value: stringValue(value) }));
});

const modelScoreFields = computed(() =>
  Object.entries(alert.value?.modelScores ?? {})
    .filter(([, value]) => typeof value === 'number')
    .map(([label, value]) => ({ label, value: formatNullableScore(value as number) })),
);

const contributionRows = computed(() =>
  Object.entries(alert.value?.modelContributions ?? {})
    .filter(([key, value]) => key !== 'raw' && typeof value === 'number')
    .map(([label, value]) => ({ label, value: Number(value) })),
);

const sequenceFields = computed(() => {
  const sequence = alert.value?.sequenceEvidence;
  return [
    ['Artifact', sequence?.sequenceModelArtifact],
    ['Context available', sequence?.contextAvailable ? t('common.yes') : t('common.no')],
    ['Window size', sequence?.windowSize],
    ['Sequence cat score', formatNullableScore(sequence?.sequenceCatScore)],
    ['Sequence cont score', formatNullableScore(sequence?.sequenceContScore)],
    ['Sequence ctx score', formatNullableScore(sequence?.sequenceCtxScore)],
  ].map(([label, value]) => ({ label: String(label), value: stringValue(value) }));
});

const ruleRows = computed(() =>
  Object.entries(alert.value?.ruleEvidence?.ruleContributions ?? {}).map(([label, value]) => ({
    label,
    value,
  })),
);

const forecastModelNames = computed(() => {
  const names = alert.value?.forecastContext?.forecastModelNames;
  if (!names) return 'Ridge / XGBoost';
  return Object.entries(names)
    .map(([key, value]) => `${key}: ${value}`)
    .join(', ');
});

const listLabel = (items: string[] | undefined) => (items?.length ? items.join(', ') : t('common.none'));
const objectCount = (value: unknown) => formatNumber(Object.keys(safeRecord(value)).length);
const scoreProgress = (score: number | undefined) => Math.max(0, Math.min(1, (score ?? 0) / 100));

const openEvidence = async () => {
  evidenceDialog.value = true;
  if (!evidence.value) {
    await loadEvidence();
  }
};

const evidenceJson = computed(() => JSON.stringify(evidence.value ?? {}, null, 2));
</script>

<style scoped>
.neo-v36-grid {
  display: grid;
  gap: var(--neo-space-4);
  grid-template-columns: repeat(12, minmax(0, 1fr));
}

.neo-v36-grid > .neo-analytics-panel,
.neo-v36-grid > .neo-card,
.neo-v36-grid > .neo-skeleton-card {
  grid-column: span 6;
}

.neo-v36-grid > .neo-v36-wide {
  grid-column: 1 / -1;
}

.neo-v36-alert-header {
  display: flex;
  justify-content: space-between;
  gap: var(--neo-space-5);
  align-items: center;
}

.neo-v36-alert-header h2 {
  margin: 10px 0 4px;
  font-size: 28px;
}

.neo-v36-alert-header p {
  margin: 0;
  color: var(--neo-ink-muted);
}

.neo-v36-header-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--neo-space-3);
}

.neo-v36-score {
  min-width: 220px;
}

.neo-v36-score span,
.neo-v36-score strong {
  display: block;
}

.neo-v36-score span {
  color: var(--neo-ink-muted);
  font-size: 12px;
}

.neo-v36-score strong {
  margin: 8px 0 12px;
  font-size: 34px;
  font-weight: 800;
}

.neo-v36-fact-grid {
  display: grid;
  gap: var(--neo-space-3);
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
}

.neo-v36-fact,
.neo-v36-list-row {
  padding: var(--neo-space-3);
  border: var(--neo-border);
  border-radius: var(--neo-radius-card);
  background: rgba(255, 255, 255, 0.66);
}

.neo-v36-fact span,
.neo-v36-fact strong,
.neo-v36-list-row span,
.neo-v36-list-row strong {
  display: block;
}

.neo-v36-fact span,
.neo-v36-list-row span {
  color: var(--neo-ink-muted);
  font-size: 11px;
  text-transform: uppercase;
}

.neo-v36-fact strong,
.neo-v36-list-row strong {
  margin-top: 7px;
  overflow-wrap: anywhere;
}

.neo-v36-list {
  display: grid;
  gap: var(--neo-space-3);
}

.neo-v36-persona {
  min-height: 100px;
  display: grid;
  place-items: center;
  border: 1px dashed rgba(23, 33, 43, 0.14);
  border-radius: var(--neo-radius-card);
  color: var(--neo-ink-muted);
}

.neo-v36-warning {
  margin-top: var(--neo-space-4);
  border: 1px solid rgba(167, 101, 24, 0.2);
  border-radius: var(--neo-radius-card);
  background: var(--neo-warning-bg);
  color: var(--neo-warning-contrast);
}

.neo-v36-explanation {
  padding: var(--neo-space-4);
  border: var(--neo-border);
  border-radius: var(--neo-radius-card);
  background: rgba(255, 255, 255, 0.68);
  line-height: 1.6;
}

.neo-v36-explanation h4 {
  margin: 0 0 10px;
}

.neo-v36-evidence-card {
  background: var(--neo-surface);
}

.neo-v36-json {
  min-height: 70vh;
  margin: 0;
  padding: var(--neo-space-4);
  overflow: auto;
  border: var(--neo-border);
  border-radius: var(--neo-radius-card);
  background: #101820;
  color: #e8f1f5;
  font-size: 12px;
}

@media (max-width: 900px) {
  .neo-v36-grid > .neo-analytics-panel,
  .neo-v36-grid > .neo-card,
  .neo-v36-grid > .neo-skeleton-card {
    grid-column: 1 / -1;
  }

  .neo-v36-alert-header {
    align-items: stretch;
    flex-direction: column;
  }
}
</style>
