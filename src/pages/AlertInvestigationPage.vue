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
          <ai-explain-button
            v-if="eventId"
            context-key="investigation-overview"
            variant="prominent"
            :event-id="eventId"
            :params="{ eventId, riskLevel: alert?.riskLevel, anomalyType: alert?.anomalyType }"
          />
          <q-btn
            flat
            icon="arrow_back"
            :label="t('v36.common.backToAlerts')"
            @click="router.push({ name: ROUTE_NAMES.ALERTS })"
          />
          <q-btn unelevated color="primary" icon="refresh" :disable="loading" :label="t('v36.common.refresh')" @click="() => refresh()" />
        </div>
      </div>

      <q-banner v-if="error" class="neo-banner">
        <template #avatar><q-icon name="error_outline" /></template>
        {{ error }}
      </q-banner>

      <q-banner v-if="sourceBanner" :class="sourceBannerClass">
        <template #avatar><q-icon :name="sourceBannerIcon" /></template>
        {{ sourceBanner }}
      </q-banner>

      <q-banner v-if="warnings.length" class="neo-v36-warning">
        <template #avatar><q-icon name="warning" /></template>
        {{ warnings.join(' | ') }}
      </q-banner>
    </section>

    <div class="neo-loading-scope neo-investigation-body">
      <loading-overlay :show="loading" context="fetch" />

    <template v-if="alert">
      <section class="neo-section neo-panel neo-v36-alert-header">
        <div>
          <div class="neo-v36-header-row">
            <q-badge :color="riskTone(riskLevelDisplay(alert.riskTier, alert.riskLevel))" rounded>
              {{ riskLevelDisplay(alert.riskTier, alert.riskLevel) ?? t('common.unknown') }}
            </q-badge>
            <span class="neo-mono">{{ alert.eventId }}</span>
          </div>
          <h2>{{ alert.anomalyType ?? t('common.unknown') }}</h2>
          <p>{{ formatDate(alert.timestamp) }}</p>
        </div>
        <div class="neo-v36-score">
          <span>{{ t('v36.common.finalRiskScore') }}</span>
          <strong>{{ formatNullableScore(alert.finalRiskScore) }}</strong>
          <InfoTooltip :text="t('v36.help.investigation.finalRiskScore')" />
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
              <h3>{{ t('v36.common.modelScores') }} <InfoTooltip :text="t('v36.help.investigation.modelScores')" /></h3>
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
              <h3>{{ t('v36.common.modelContributions') }} <InfoTooltip :text="t('v36.help.investigation.modelContributions')" /></h3>
              <p>{{ t('v36.investigation.modelContributionsSubtitle') }}</p>
            </div>
          </div>
          <bar-list-chart :items="contributionRows" :empty-message="t('v36.common.noData')" />
        </article>

        <article class="neo-analytics-panel">
          <div class="neo-analytics-head">
            <div>
              <h3>{{ t('v36.common.sequenceEvidence') }} <InfoTooltip :text="t('v36.help.investigation.sequenceEvidence')" /></h3>
              <p>{{ alert.sequenceEvidence?.selectedSequenceModel ?? t('common.notAvailable') }}</p>
            </div>
            
          </div>
          <div class="neo-v36-fact-grid">
            <div v-for="field in sequenceFields" :key="field.label" class="neo-v36-fact">
              <span>{{ field.label }}</span>
              <strong>{{ field.value }}</strong>
            </div>
          </div>
          <div v-if="topSurpriseFieldsItems.length" class="neo-v36-list q-mt-md">
            <div
              v-for="item in topSurpriseFieldsItems"
              :key="item.key"
              class="neo-v36-list-row"
            >
              <span>{{ item.label }}</span>
              <strong>{{ item.value }}</strong>
            </div>
          </div>
        </article>

        <article class="neo-analytics-panel">
          <div class="neo-analytics-head">
            <div>
              <h3>{{ t('v36.common.tabularEvidence') }} <InfoTooltip :text="t('v36.help.investigation.tabularEvidence')" /></h3>
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
              <h3>{{ t('v36.common.ruleEvidence') }} <InfoTooltip :text="t('v36.help.investigation.ruleEvidence')" /></h3>
            </div>
          </div>
          <template v-if="hasTriggeredRules">
            <div class="neo-v36-section-label">{{ t('v36.investigation.triggeredRules') }}</div>
            <div class="neo-v36-chip-row">
              <q-chip v-for="rule in triggeredRuleCodes" :key="rule" dense outline color="warning" class="neo-v36-rule-chip">
                {{ rule }}
              </q-chip>
            </div>
            <bar-list-chart v-if="hasRuleContributionDetails" :items="ruleRows" />
            <q-banner v-else dense rounded class="neo-v36-missing-banner q-mt-sm">
              {{ t('v36.investigation.ruleDetailsUnavailable') }}
            </q-banner>
          </template>
          <div v-else class="neo-v36-empty-rules">
            {{ t('v36.investigation.noTriggeredRules') }}
          </div>
        </article>

        <article class="neo-analytics-panel">
          <div class="neo-analytics-head">
            <div>
              <h3>{{ t('v36.investigation.anomalyAttribution') }} <InfoTooltip :text="t('v36.help.investigation.anomalyAttribution')" /></h3>
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
              <h3>{{ t('v36.common.churnRisk') }} <InfoTooltip :text="t('v36.help.investigation.churnContext')" /></h3>
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
              <h3>{{ t('v36.common.forecastContext') }} <InfoTooltip :text="t('v36.help.investigation.forecastContext')" /></h3>
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

        <article class="neo-analytics-panel">
          <div class="neo-analytics-head">
            <div>
              <h3>{{ t('v36.sessionLifecycle.title') }}</h3>
              <p>{{ alert.sessionId }}</p>
            </div>
          </div>
          <div v-if="hasSessionLifecycle" class="neo-v36-fact-grid">
            <div class="neo-v36-fact">
              <span>{{ t('v36.sessionLifecycle.endReason') }}</span>
              <q-badge :color="sessionEndReasonTone(sessionLifecycleData.sessionEndReason)" rounded>
                {{ formatSessionEndReason(sessionLifecycleData.sessionEndReason) }}
              </q-badge>
            </div>
            <div class="neo-v36-fact">
              <span>{{ t('v36.sessionLifecycle.endedExplicitly') }}</span>
              <strong>{{ formatBooleanYesNo(sessionLifecycleData.sessionEndedExplicitly) }}</strong>
            </div>
            <div class="neo-v36-fact">
              <span>{{ t('v36.sessionLifecycle.endedAt') }}</span>
              <strong>{{ formatDate(sessionLifecycleData.sessionEndedAt) }}</strong>
            </div>
            <div class="neo-v36-fact">
              <span>{{ t('v36.sessionLifecycle.duration') }}</span>
              <strong>{{ formatDurationMs(sessionLifecycleData.sessionDurationMs) }}</strong>
            </div>
            <div class="neo-v36-fact">
              <span>{{ t('v36.sessionLifecycle.eventCount') }}</span>
              <strong>{{ formatNumber(sessionLifecycleData.sessionEventCount) }}</strong>
            </div>
          </div>
          <div v-else class="neo-analytics-empty">
            {{ t('v36.sessionLifecycle.notAvailable') }}
          </div>
        </article>
      </section>
    </template>

    <section v-else-if="!loading" class="neo-section neo-analytics-empty">
      {{ t('v36.investigation.notFound') }}
    </section>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import InfoTooltip from 'src/components/common/InfoTooltip.vue';
import BarListChart from 'src/components/dashboard/BarListChart.vue';
import AiExplainButton from 'src/components/ai/AiExplainButton.vue';
import { useAlertInvestigation } from 'src/composables/v36/useAlertInvestigation';
import { ROUTE_NAMES } from 'src/router/route-names';
import {
  formatBooleanYesNo,
  formatDate,
  formatDurationMs,
  formatNullableScore,
  formatNumber,
  formatPercent,
  formatSessionEndReason,
  riskLevelDisplay,
  riskTone,
  safeRecord,
  sessionEndReasonTone,
  sourceInfoBanner,
} from 'src/utils/format';

const route = useRoute();
const router = useRouter();
const { t } = useI18n();

const eventId = computed(() => String(route.params.eventId ?? ''));
const { data: alert, loading, error, refresh, source, warnings } = useAlertInvestigation(eventId);

const sourceBannerInfo = computed(() => sourceInfoBanner(source.value));
const sourceBanner = computed(() => sourceBannerInfo.value?.message ?? '');
const sourceBannerClass = computed(() => {
  const type = sourceBannerInfo.value?.type;
  if (type === 'warning') return 'neo-v36-warning';
  if (type === 'info') return 'neo-v36-info';
  return '';
});
const sourceBannerIcon = computed(() => {
  const type = sourceBannerInfo.value?.type;
  if (type === 'warning') return 'warning';
  if (type === 'info') return 'info';
  return '';
});

const stringValue = (value: unknown, fallback = t('common.notAvailable')): string => {
  if (value == null || value === '') return fallback;
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (typeof value === 'object') return JSON.stringify(value);
  return fallback;
};

const metadataFields = computed(() => {
  const metadata = alert.value?.eventMetadata;
  if (!metadata) return [{ label: t('v36.common.eventMetadata'), value: t('v36.investigation.metadataNotAvailable') }];
  return [
    [t('v36.common.eventAction'), metadata.eventAction],
    [t('v36.common.apiTemplate'), metadata.apiTemplate],
    [t('v36.common.apiFamily'), metadata.apiFamily],
    [t('v36.common.country'), metadata.country],
    [t('v36.common.device'), metadata.device],
    [t('v36.common.browser'), metadata.browser],
    [t('v36.common.os'), metadata.os],
    [t('v36.common.httpMethod'), metadata.httpMethod],
    [t('v36.common.status'), metadata.status],
  ].map(([label, value]) => ({ label: String(label), value: stringValue(value) }));
});

const modelScoreFields = computed(() => {
  const scores = alert.value?.modelScores;
  if (!scores) return [];
  const fields: { label: string; value: string }[] = [];
  const scoreFields = [
    { label: t('v36.investigation.xgboostAnomalyScore'), key: 'xgboostAnomalyScore100' as const },
    { label: t('v36.investigation.lightgbmAlertScore'), key: 'lightgbmAlertScore100' as const },
    { label: t('v36.investigation.transformerRiskScore'), key: 'transformerRiskScore100' as const },
    { label: t('v36.investigation.tcnRiskScore'), key: 'tcnRiskScore100' as const },
    { label: t('v36.investigation.ruleRiskScore'), key: 'ruleRiskScore' as const },
  ];
  for (const field of scoreFields) {
    const value = scores[field.key];
    if (typeof value === 'number') {
      fields.push({ label: field.label, value: formatNullableScore(value) });
    } else if (field.key === 'tcnRiskScore100') {
      fields.push({ label: field.label, value: t('common.notRun') });
    } else {
      fields.push({ label: field.label, value: t('common.notAvailable') });
    }
  }
  return fields;
});

const contributionRows = computed(() =>
  Object.entries(alert.value?.modelContributions ?? {})
    .filter(([key, value]) => key !== 'raw' && typeof value === 'number')
    .map(([label, value]) => ({ label, value: Number(value) })),
);

const sequenceFields = computed(() => {
  const s = alert.value?.sequenceEvidence;
  if (!s) return [];
  const fields: { label: string; value: string }[] = [];
  if (s.selectedSequenceModel) {
    fields.push({ label: t('v36.investigation.selectedSequenceModel'), value: s.selectedSequenceModel });
  }
  if (s.sequenceModelArtifact) {
    fields.push({ label: t('v36.investigation.sequenceModelArtifact'), value: s.sequenceModelArtifact });
  }
  fields.push({ label: t('v36.investigation.contextAvailable'), value: s.contextAvailable ? t('common.yes') : t('common.no') });
  fields.push({ label: t('v36.investigation.windowSize'), value: s.windowSize != null ? String(s.windowSize) : t('common.notAvailable') });
  if (s.sequenceCatScore != null) {
    fields.push({ label: t('v36.investigation.sequenceCatScore'), value: String(s.sequenceCatScore) });
  }
  if (s.sequenceContScore != null) {
    fields.push({ label: t('v36.investigation.sequenceContScore'), value: String(s.sequenceContScore) });
  }
  if (s.sequenceCtxScore != null) {
    fields.push({ label: t('v36.investigation.sequenceCtxScore'), value: String(s.sequenceCtxScore) });
  }
  if (s.sequenceActuallyRanModels?.length) {
    fields.push({ label: t('v36.investigation.sequenceActuallyRanModels'), value: s.sequenceActuallyRanModels.join(', ') });
  }
  if (s.sequenceRunBoth != null) {
    fields.push({ label: t('v36.investigation.sequenceRunBoth'), value: s.sequenceRunBoth ? t('common.yes') : t('common.no') });
  }
  if (s.transformerUsedInFusion != null) {
    fields.push({ label: t('v36.investigation.transformerUsedInFusion'), value: s.transformerUsedInFusion ? t('common.yes') : t('common.no') });
  }
  if (s.tcnUsedInFusion != null) {
    fields.push({ label: t('v36.investigation.tcnUsedInFusion'), value: s.tcnUsedInFusion ? t('common.yes') : t('common.no') });
  }
  if (s.transformerRiskScore100 != null) {
    fields.push({ label: t('v36.investigation.transformerRiskScore'), value: formatNullableScore(s.transformerRiskScore100) });
  }
  if (s.tcnRiskScore100 != null) {
    fields.push({ label: t('v36.investigation.tcnRiskScore'), value: formatNullableScore(s.tcnRiskScore100) });
  } else if (s.transformerRiskScore100 != null) {
    fields.push({ label: t('v36.investigation.tcnRiskScore'), value: t('common.notRun') });
  }
  return fields;
});

const topSurpriseFieldsItems = computed(() => {
  const s = alert.value?.sequenceEvidence;
  if (!s) return [];
  if (s.topSurpriseFields?.length) {
    return s.topSurpriseFields.map((item, idx) => ({
      key: `topSurpriseFields-${idx}`,
      label: t('v36.investigation.surpriseField'),
      value: item,
    }));
  }
  if (s.topSequenceSurpriseFields?.length) {
    return s.topSequenceSurpriseFields.map((item, idx) => ({
      key: `topSequenceSurpriseFields-${idx}`,
      label: stringValue(item.field, t('v36.investigation.surpriseField')),
      value: `${stringValue(item.value, '')} (${item.score != null ? formatNullableScore(item.score) : t('common.notAvailable')})`,
    }));
  }
  return [];
});

const triggeredRuleCodes = computed(() =>
  alert.value?.triggeredRules
    ?? alert.value?.ruleEvidence?.triggeredRules
    ?? [],
);

const ruleContributions = computed(() => alert.value?.ruleEvidence?.ruleContributions ?? null);

const hasTriggeredRules = computed(() => triggeredRuleCodes.value.length > 0);

const hasRuleContributionDetails = computed(() =>
  !!ruleContributions.value && Object.keys(ruleContributions.value).length > 0,
);

const ruleRows = computed(() =>
  Object.entries(ruleContributions.value ?? {}).map(([label, value]) => ({
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

const sessionLifecycleData = computed(() => {
  const detail = alert.value;
  if (detail?.sessionLifecycle) return detail.sessionLifecycle;
  return {
    sessionEndReason: detail?.sessionEndReason ?? null,
    sessionEndedExplicitly: detail?.sessionEndedExplicitly ?? null,
    sessionEndedAt: detail?.sessionEndedAt ?? null,
    sessionDurationMs: detail?.sessionDurationMs ?? null,
    sessionEventCount: detail?.sessionEventCount ?? null,
  };
});

const hasSessionLifecycle = computed(() =>
  sessionLifecycleData.value.sessionEndReason != null ||
  sessionLifecycleData.value.sessionEndedExplicitly != null ||
  sessionLifecycleData.value.sessionEndedAt != null ||
  sessionLifecycleData.value.sessionDurationMs != null ||
  sessionLifecycleData.value.sessionEventCount != null,
);

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
  overflow-wrap: anywhere;
  word-break: break-word;
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
  background: var(--neo-card-bg-tint);
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
  overflow-wrap: anywhere;
  word-break: break-word;
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
  border: 1px dashed rgba(255, 255, 255, 0.14);
  border-radius: var(--neo-radius-card);
  color: var(--neo-ink-muted);
}

.neo-v36-warning {
  margin-top: var(--neo-space-4);
  border: 1px solid rgba(251, 191, 36, 0.28);
  border-radius: var(--neo-radius-card);
  background: var(--neo-warning-bg);
  color: var(--neo-warning-contrast);
}

.neo-v36-explanation {
  padding: var(--neo-space-4);
  border: var(--neo-border);
  border-radius: var(--neo-radius-card);
  background: var(--neo-card-bg-tint);
  line-height: 1.6;
}

.neo-v36-explanation h4 {
  margin: 0 0 10px;
}

.neo-v36-evidence-card {
  color: var(--neo-ink);
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

.neo-v36-section-label {
  color: var(--neo-ink-muted);
  font-size: 11px;
  text-transform: uppercase;
  margin-bottom: 6px;
}

.neo-v36-chip-row {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 12px;
}

.neo-v36-rule-chip {
  font-size: 12px;
}

.neo-v36-missing-banner {
  background: rgba(255, 255, 255, 0.04);
  color: var(--neo-ink-muted);
  font-size: 13px;
}

.neo-v36-empty-rules {
  color: var(--neo-ink-muted);
  font-size: 13px;
  padding: 4px 0;
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
