<template>
  <!-- Workbench layout: live queue, selected context, and AI-generated explanation output. -->
  <section id="workbench" class="neo-section neo-investigation">
    <div class="neo-section-header">
      <div>
        <div class="neo-section-title">{{ t('anomalyWorkbenchSection.title') }}</div>
        <div class="neo-section-subtitle">{{ t('anomalyWorkbenchSection.subtitle') }}</div>
      </div>
    </div>

    <div class="neo-investigation-grid">
      <!-- Live wire shows the newest streamed alerts and keeps selection in sync. -->
      <div class="neo-panel">
        <div class="neo-panel-header">
          <div>
            <div class="neo-panel-title">{{ t('anomalyWorkbenchSection.liveWireTitle') }}</div>
            <div class="neo-panel-subtitle">{{ t('anomalyWorkbenchSection.liveWireSubtitle') }}</div>
          </div>
          <div class="neo-live-pill" :class="{ 'is-loading': !streamConnected }">
            <span class="neo-live-dot"></span>
            {{ streamConnected ? t('common.connected') : t('common.reconnecting') }}
          </div>
        </div>

        <div v-if="streamError" class="neo-error">{{ streamError }}</div>
        <div v-else-if="!streamAlerts.length" class="neo-placeholder">
          {{ t('anomalyWorkbenchSection.waitingForAlerts') }}
        </div>
        <div v-else class="neo-stream-list">
          <button
            v-for="alert in streamAlerts"
            :key="anomalyEventKey(alert)"
            type="button"
            class="neo-stream-item"
            :class="{ 'is-active': anomalyEventKey(alert) === selectedEventKey }"
            @click="emit('select-alert', alert)"
          >
            <div class="neo-stream-top">
              <q-badge :color="tierColor(alert.anomalyTier)" text-color="white">
                {{ alert.anomalyTier || t('common.unknown') }}
              </q-badge>
              <span class="neo-stream-time">{{ formatDate(alert.detectedAt) }}</span>
            </div>
            <div class="neo-stream-title">{{ alert.anomalyType || t('common.unknown') }}</div>
            <div class="neo-stream-meta">{{ alert.insuredId }} / {{ alert.sessionId }}</div>
          </button>
        </div>
      </div>

      <!-- Context panel assembles session, risk, prediction, and raw payload details. -->
      <div class="neo-panel neo-panel-contrast">
        <div class="neo-panel-header">
          <div>
            <div class="neo-panel-title">{{ t('anomalyWorkbenchSection.selectedContextTitle') }}</div>
            <div class="neo-panel-subtitle">{{ t('anomalyWorkbenchSection.selectedContextSubtitle') }}</div>
          </div>
        </div>

        <div v-if="!selectedEvent" class="neo-placeholder">
          {{ t('anomalyWorkbenchSection.selectAnomalyPrompt') }}
        </div>
        <div v-else class="neo-explanation">
          <div class="neo-explanation-meta">
            <div>
              <div class="neo-explanation-label">{{ t('anomalyWorkbenchSection.labels.insured') }}</div>
              <div class="neo-explanation-value">{{ selectedEvent.insuredId }}</div>
            </div>
            <div>
              <div class="neo-explanation-label">{{ t('anomalyWorkbenchSection.labels.tier') }}</div>
              <div class="neo-explanation-value">{{ selectedEvent.anomalyTier }}</div>
            </div>
            <div>
              <div class="neo-explanation-label">{{ t('anomalyWorkbenchSection.labels.type') }}</div>
              <div class="neo-explanation-value">{{ readableText(selectedEvent.anomalyType) }}</div>
            </div>
            <div>
              <div class="neo-explanation-label">{{ t('anomalyWorkbenchSection.labels.score') }}</div>
              <div class="neo-explanation-value">
                {{ readableScore(selectedEvent.anomalyScore) }}
              </div>
            </div>
            <div>
              <div class="neo-explanation-label">{{ t('anomalyWorkbenchSection.labels.typeConfidence') }}</div>
              <div class="neo-explanation-value">
                {{ readablePercent(selectedEvent.typeConfidence) }}
              </div>
            </div>
            <div v-if="selectedEvent.anomalyProbability != null">
              <div class="neo-explanation-label">{{ t('anomalyWorkbenchSection.labels.anomalyProbability') }}</div>
              <div class="neo-explanation-value">
                {{ readablePercent(selectedEvent.anomalyProbability) }}
              </div>
            </div>
            <div v-if="selectedEvent.churnProbability != null">
              <div class="neo-explanation-label">{{ t('anomalyWorkbenchSection.labels.churnProbability') }}</div>
              <div class="neo-explanation-value">
                {{ readablePercent(selectedEvent.churnProbability) }}
              </div>
            </div>
            <div v-if="selectedEvent.riskScore != null">
              <div class="neo-explanation-label">{{ t('anomalyWorkbenchSection.labels.ensembleRisk') }}</div>
              <div class="neo-explanation-value">
                {{ readableScore(selectedEvent.riskScore) }}
              </div>
            </div>
            <div v-if="selectedEvent.pathDeviation != null">
              <div class="neo-explanation-label">{{ t('anomalyWorkbenchSection.labels.pathDeviation') }}</div>
              <div class="neo-explanation-value">
                {{ selectedEvent.pathDeviation ? t('common.yes') : t('common.no') }}
              </div>
            </div>
            <div>
              <div class="neo-explanation-label">{{ t('anomalyWorkbenchSection.labels.event') }}</div>
              <div class="neo-explanation-value">
                {{ selectedEvent.eventId || selectedEvent.id }}
              </div>
            </div>
          </div>

          <div class="neo-context-grid">
            <div class="neo-context-card">
              <div class="neo-context-title">{{ t('anomalyWorkbenchSection.sessionTitle') }}</div>
              <div v-if="sessionAnalysisLoading" class="neo-context-note">
                {{ t('anomalyWorkbenchSection.sessionLoading') }}
              </div>
              <div v-else-if="!sessionAnalysis" class="neo-context-note">
                {{ t('anomalyWorkbenchSection.sessionEmpty') }}
              </div>

              <div class="neo-context-line">
                <span>{{ t('anomalyWorkbenchSection.labels.status') }}</span>
                <strong>{{ sessionStatus }}</strong>
              </div>
              <div class="neo-context-line">
                <span>{{ t('anomalyWorkbenchSection.labels.started') }}</span>
                <strong>{{ sessionStarted }}</strong>
              </div>
              <div class="neo-context-line">
                <span>{{ t('anomalyWorkbenchSection.labels.ended') }}</span>
                <strong>{{ sessionEnded }}</strong>
              </div>
              <div class="neo-context-line">
                <span>{{ t('anomalyWorkbenchSection.labels.duration') }}</span>
                <strong>{{ sessionDuration }}</strong>
              </div>
              <div class="neo-context-line">
                <span>{{ t('anomalyWorkbenchSection.labels.koRate') }}</span>
                <strong>{{ sessionKoRate }}</strong>
              </div>
              <div class="neo-context-line">
                <span>{{ t('anomalyWorkbenchSection.labels.ruleType') }}</span>
                <strong>{{ sessionRuleType }}</strong>
              </div>
              <div class="neo-context-line">
                <span>{{ t('anomalyWorkbenchSection.labels.contextTags') }}</span>
                <strong>{{ displayedContextTags.join(', ') || t('common.notReturned') }}</strong>
              </div>
              <div class="neo-context-line">
                <span>{{ t('anomalyWorkbenchSection.labels.warnings') }}</span>
                <strong>{{ displayedWarnings.join(', ') || t('common.notReturned') }}</strong>
              </div>
              <div class="neo-context-line">
                <span>{{ t('anomalyWorkbenchSection.labels.actions') }}</span>
                <strong>{{ sessionActionCount }}</strong>
              </div>
              <div class="neo-context-line">
                <span>{{ t('anomalyWorkbenchSection.labels.uniqueActions') }}</span>
                <strong>{{ sessionUniqueActions }}</strong>
              </div>
              <div class="neo-context-line">
                <span>{{ t('anomalyWorkbenchSection.labels.meanDelta') }}</span>
                <strong>{{ sessionMeanDelta }}</strong>
              </div>
              <div class="neo-context-line">
                <span>{{ t('anomalyWorkbenchSection.labels.tabularScore') }}</span>
                <strong>{{ sessionIsoScore }}</strong>
              </div>
              <div class="neo-context-line">
                <span>{{ t('anomalyWorkbenchSection.labels.ensembleRisk') }}</span>
                <strong>{{ sessionEnsembleRisk }}</strong>
              </div>
              <div class="neo-context-line">
                <span>{{ t('anomalyWorkbenchSection.labels.actionDiversity') }}</span>
                <strong>{{ sessionActionDiversity }}</strong>
              </div>
            </div>

            <div class="neo-context-card">
              <div class="neo-context-title">{{ t('anomalyWorkbenchSection.riskProfileTitle') }}</div>
              <div v-if="!riskProfile" class="neo-context-note">
                {{ t('anomalyWorkbenchSection.riskProfileEmpty') }}
              </div>
              <div class="neo-context-line">
                <span>{{ t('anomalyWorkbenchSection.labels.riskTier') }}</span>
                <strong>{{ riskTier }}</strong>
              </div>
              <div class="neo-context-line">
                <span>{{ t('anomalyWorkbenchSection.labels.anomalyRate30d') }}</span>
                <strong>{{ riskAnomalyRate }}</strong>
              </div>
              <div class="neo-context-line">
                <span>{{ t('anomalyWorkbenchSection.labels.cleanStreak') }}</span>
                <strong>{{ riskCleanStreak }}</strong>
              </div>
              <div class="neo-context-line">
                <span>{{ t('anomalyWorkbenchSection.labels.lastAnomaly') }}</span>
                <strong>{{ riskLastAnomaly }}</strong>
              </div>
            </div>

            <div class="neo-context-card">
              <div class="neo-context-title">{{ t('anomalyWorkbenchSection.predictedActionsTitle') }}</div>
              <div v-if="!displayedNextActions.length" class="neo-context-empty">
                {{ t('anomalyWorkbenchSection.predictionsEmpty') }}
              </div>
              <div v-else class="neo-chip-row">
                <q-chip
                  v-for="action in displayedNextActions"
                  :key="action"
                  dense
                  color="secondary"
                  text-color="white"
                >
                  {{ action }}
                </q-chip>
              </div>
            </div>

            <div class="neo-context-card">
              <div class="neo-context-title">{{ t('anomalyWorkbenchSection.activeAnomalyTitle') }}</div>
              <div v-if="!activeAnomalyContext" class="neo-context-note">
                {{ t('anomalyWorkbenchSection.activeAnomalyEmpty') }}
              </div>
              <div class="neo-context-line">
                <span>{{ t('anomalyWorkbenchSection.labels.tier') }}</span>
                <strong>{{ activeTier }}</strong>
              </div>
              <div class="neo-context-line">
                <span>{{ t('anomalyWorkbenchSection.labels.type') }}</span>
                <strong>{{ activeType }}</strong>
              </div>
              <div class="neo-context-line">
                <span>{{ t('anomalyWorkbenchSection.labels.detected') }}</span>
                <strong>{{ activeDetected }}</strong>
              </div>
              <div class="neo-context-line">
                <span>{{ t('anomalyWorkbenchSection.labels.eventTime') }}</span>
                <strong>{{ activeEventTime }}</strong>
              </div>
            </div>
          </div>

          <div class="neo-investigation-visuals">
            <FeatureRadarChart :items="displayedFeatureContributions" />
            <JourneyPathMap
              :steps="displayedActionSequence"
              :rare-transitions="displayedRareTransitions"
              :path-deviation="sessionAnalysis?.pathDeviation ?? selectedEvent.pathDeviation ?? null"
            />
          </div>

          <div v-if="displayedTriggeredRules.length || displayedContextTags.length" class="neo-chip-ribbon">
            <q-chip
              v-for="tag in displayedContextTags"
              :key="`tag-${tag}`"
              dense
              color="warning"
              text-color="black"
            >
              {{ tag }}
            </q-chip>
            <q-chip
              v-for="rule in displayedTriggeredRules"
              :key="`rule-${rule}`"
              dense
              color="secondary"
              text-color="white"
            >
              {{ rule }}
            </q-chip>
          </div>

          <q-expansion-item
            v-if="liveSessionInsight"
            dense
            expand-separator
            icon="bolt"
            :label="t('anomalyWorkbenchSection.liveSessionInsightLabel')"
            class="neo-sequence-expander"
          >
            <pre class="neo-json-block">{{ formatJsonValue(liveSessionInsight) }}</pre>
          </q-expansion-item>

          <q-expansion-item
            v-if="displayedEventContext"
            dense
            expand-separator
            icon="data_object"
            :label="t('anomalyWorkbenchSection.compactAlertContextLabel')"
            class="neo-sequence-expander"
          >
            <pre class="neo-json-block">{{ formatJsonValue(displayedEventContext) }}</pre>
          </q-expansion-item>

          <q-expansion-item
            v-if="sessionAnalysis?.actionCounts && Object.keys(sessionAnalysis.actionCounts).length"
            dense
            expand-separator
            icon="list_alt"
            :label="t('anomalyWorkbenchSection.sessionActionCountsLabel')"
            class="neo-sequence-expander"
          >
            <pre class="neo-json-block">{{
              JSON.stringify(sessionAnalysis.actionCounts, null, 2)
            }}</pre>
          </q-expansion-item>
        </div>
      </div>

      <!-- Explanation panel requests and renders the AI narrative for the selected anomaly. -->
      <div class="neo-panel neo-panel-sequence">
        <div class="neo-panel-header">
          <div>
            <div class="neo-panel-title">{{ t('anomalyWorkbenchSection.aiExplanationTitle') }}</div>
            <div class="neo-panel-subtitle">{{ t('anomalyWorkbenchSection.aiExplanationSubtitle') }}</div>
          </div>
          <q-btn
            color="secondary"
            unelevated
            icon="psychology"
            :label="t('anomalyWorkbenchSection.generateAiExplanation')"
            :disable="!selectedEvent || selectedEvent.id == null"
            :loading="explanationLoading"
            @click="emit('generate-explanation')"
          />
        </div>

        <div v-if="!selectedEvent" class="neo-placeholder">
          {{ t('anomalyWorkbenchSection.selectForExplanation') }}
        </div>
        <div v-else-if="explanationError" class="neo-error">
          {{ explanationError }}
        </div>
        <div v-else class="neo-explanation">
          <div class="neo-explanation-meta">
            <div>
              <div class="neo-explanation-label">{{ t('anomalyWorkbenchSection.labels.source') }}</div>
              <div class="neo-explanation-value">
                {{ explanation?.source || t('common.notRequested') }}
              </div>
            </div>
            <div>
              <div class="neo-explanation-label">{{ t('anomalyWorkbenchSection.labels.model') }}</div>
              <div class="neo-explanation-value">
                {{ explanation?.model || t('common.notAvailable') }}
              </div>
            </div>
            <div>
              <div class="neo-explanation-label">{{ t('anomalyWorkbenchSection.labels.generated') }}</div>
              <div class="neo-explanation-value">
                {{ formatDate(explanation?.generatedAt) }}
              </div>
            </div>
            <div>
              <div class="neo-explanation-label">{{ t('anomalyWorkbenchSection.labels.cache') }}</div>
              <div class="neo-explanation-value">
                {{ explanation?.cached ? t('common.cacheHit') : explanation ? t('common.cacheFresh') : t('common.notAvailable') }}
              </div>
            </div>
          </div>

          <div class="neo-explanation-body" v-html="formattedExplanationHtml"></div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
// Parent state provides the selected anomaly plus every supporting context payload.
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import FeatureRadarChart from './FeatureRadarChart.vue';
import JourneyPathMap from './JourneyPathMap.vue';
import type {
  AnomalyAlertDto,
  AnomalyEventDto,
  AnomalyExplanationDto,
  FeatureContributionDto,
  NextActionPredictionDto,
  PathDeviationDto,
  SessionAnalysisDto,
  UserRiskProfileDto,
} from 'src/types/analytics';
import { anomalyEventKey } from 'src/utils/dashboard';
import { formatDate, formatDurationSeconds, formatNumber, formatPercent, formatScore } from 'src/utils/format';

// Input contracts carry the live stream selection and all fetched enrichment data.
const props = defineProps<{
  selectedEvent: AnomalyEventDto | null;
  selectedEventKey: string;
  streamAlerts: AnomalyEventDto[];
  streamConnected: boolean;
  streamError: string;
  liveSessionInsight?: Record<string, unknown> | null;
  sessionAnalysis: SessionAnalysisDto | null;
  sessionAnalysisLoading: boolean;
  riskProfile: UserRiskProfileDto | null;
  nextActions: NextActionPredictionDto | null;
  activeAnomaly: AnomalyAlertDto | null;
  explanation: AnomalyExplanationDto | null;
  explanationLoading: boolean;
  explanationError: string;
}>();

const emit = defineEmits<{
  (event: 'select-alert', alert: AnomalyEventDto): void;
  (event: 'generate-explanation'): void;
}>();

const { t } = useI18n();

// Helper formatters turn optional backend fields into readable UI values.
const tierColor = (tier: string | null | undefined) => {
  if (tier === 'TIER3') return 'negative';
  if (tier === 'TIER2') return 'warning';
  if (tier === 'TIER1') return 'primary';
  if (tier === 'SESSION_RUNTIME') return 'secondary';
  return 'grey';
};

const readableText = (value: string | null | undefined, fallback = t('common.notReturned')) =>
  value && value.trim().length > 0 ? value : fallback;

const readableDate = (value: string | null | undefined, fallback = t('common.notReturned')) =>
  value ? formatDate(value) : fallback;

const readablePercent = (value: number | null | undefined, fallback = t('common.notReturned')) =>
  value == null || Number.isNaN(value) ? fallback : formatPercent(value, 1);

const readableScore = (value: number | null | undefined, fallback = t('common.notReturned')) =>
  value == null || Number.isNaN(value) ? fallback : formatScore(value);

const readableDuration = (value: number | null | undefined, fallback = t('common.notReturned')) =>
  value == null || Number.isNaN(value) ? fallback : formatDurationSeconds(value);

const readableNumber = (value: number | null | undefined, fallback = t('common.notReturned')) =>
  value == null || Number.isNaN(value) ? fallback : formatNumber(value);

// Derived fields merge session data with anomaly fallbacks so the context card stays informative.
const sessionStatus = computed(() => {
  if (props.sessionAnalysis?.isAnomaly != null) {
    return props.sessionAnalysis.isAnomaly ? t('common.anomalous') : t('common.observed');
  }
  return props.selectedEvent ? t('common.anomalous') : t('common.notReturned');
});

const sessionStarted = computed(() =>
  readableDate(
    props.sessionAnalysis?.startTime ??
      props.selectedEvent?.eventTime ??
      props.selectedEvent?.detectedAt,
  ),
);

const sessionEnded = computed(() =>
  readableDate(
    props.sessionAnalysis?.endTime ??
      props.selectedEvent?.detectedAt ??
      props.selectedEvent?.eventTime,
  ),
);

const sessionDuration = computed(() =>
  readableDuration(props.sessionAnalysis?.sessionDurationSeconds),
);

const sessionKoRate = computed(() => readablePercent(props.sessionAnalysis?.koRate));

const sessionRuleType = computed(() =>
  readableText(props.sessionAnalysis?.ruleType ?? props.selectedEvent?.ruleType),
);

const sessionActionCount = computed(() =>
  readableNumber(props.sessionAnalysis?.totalEvents ?? props.sessionAnalysis?.uniqueActions),
);

const sessionUniqueActions = computed(() =>
  readableNumber(props.sessionAnalysis?.uniqueActions),
);

const sessionMeanDelta = computed(() =>
  readableDuration(props.sessionAnalysis?.avgInterActionSeconds),
);

const sessionIsoScore = computed(() => readableScore(props.sessionAnalysis?.isoScore));

const sessionEnsembleRisk = computed(() =>
  readableScore(props.sessionAnalysis?.ensembleRiskScore),
);

const sessionActionDiversity = computed(() =>
  readableScore(props.sessionAnalysis?.actionDiversity),
);

const riskTier = computed(() =>
  readableText(
    props.riskProfile?.riskTier ??
      (props.selectedEvent?.anomalyTier
        ? t('anomalyWorkbenchSection.investigateTier', {
            tier: props.selectedEvent.anomalyTier,
          })
        : null),
  ),
);

const riskAnomalyRate = computed(() => readablePercent(props.riskProfile?.anomalyRate30d));

const riskCleanStreak = computed(() => readableNumber(props.riskProfile?.consecutiveCleanSessions));

const riskLastAnomaly = computed(() =>
  readableText(props.riskProfile?.lastAnomalyType ?? props.selectedEvent?.anomalyType),
);

const displayedNextActions = computed(() => {
  const nextActionPayload = props.nextActions?.top3Actions ?? [];
  if (nextActionPayload.length) return nextActionPayload.map((action) => action.action);
  const fromEvent = props.selectedEvent?.nextActions ?? [];
  if (fromEvent.length) return fromEvent.map((action) => action.action);
  return (props.sessionAnalysis?.top3NextActions ?? []).map((action) => action.action);
});

const activeAnomalyContext = computed(() => props.activeAnomaly ?? props.selectedEvent);

const activeTier = computed(() =>
  readableText(activeAnomalyContext.value?.anomalyTier, t('common.none')),
);
const activeType = computed(() => readableText(activeAnomalyContext.value?.anomalyType));
const activeDetected = computed(() => readableDate(activeAnomalyContext.value?.detectedAt));
const activeEventTime = computed(() => readableDate(activeAnomalyContext.value?.eventTime));
const displayedEventContext = computed(() => props.selectedEvent?.eventContext ?? null);
const displayedContextTags = computed(() =>
  props.sessionAnalysis?.contextTags?.length
    ? props.sessionAnalysis.contextTags
    : stringArrayFromUnknown(props.liveSessionInsight?.contextTags),
);
const displayedWarnings = computed(() =>
  props.sessionAnalysis?.warnings?.length
    ? props.sessionAnalysis.warnings
    : stringArrayFromUnknown(props.liveSessionInsight?.warnings),
);
const displayedTriggeredRules = computed(() =>
  props.sessionAnalysis?.triggeredRules?.length
    ? props.sessionAnalysis.triggeredRules
    : stringArrayFromUnknown(props.liveSessionInsight?.triggeredRules),
);
const displayedActionSequence = computed(() =>
  props.sessionAnalysis?.actionSequence?.length
    ? props.sessionAnalysis.actionSequence
    : stringArrayFromUnknown(props.liveSessionInsight?.actionSequence),
);
const displayedRareTransitions = computed<PathDeviationDto[]>(() =>
  props.sessionAnalysis?.rareTransitions?.length
    ? props.sessionAnalysis.rareTransitions
    : pathDeviationArrayFromUnknown(props.liveSessionInsight?.rareTransitions),
);
const displayedFeatureContributions = computed<FeatureContributionDto[]>(() =>
  props.sessionAnalysis?.topContributingFeatures?.length
    ? props.sessionAnalysis.topContributingFeatures
    : featureContributionArrayFromUnknown(props.liveSessionInsight?.topContributingFeatures),
);

// Explanation text is sanitized and converted from lightweight markdown into safe HTML.
const escapeHtml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const inlineMarkdownToHtml = (value: string) => {
  const escaped = escapeHtml(value);
  return escaped
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>');
};

const formatExplanationHtml = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) {
    return `<p class="neo-explanation-empty">${escapeHtml(t('anomalyWorkbenchSection.noExplanationRequested'))}</p>`;
  }
  const lines = trimmed.split(/\r?\n/);
  const html: string[] = [];
  let listType: 'ul' | 'ol' | null = null;
  let paragraph: string[] = [];

  const flushParagraph = () => {
    if (!paragraph.length) return;
    html.push(`<p>${inlineMarkdownToHtml(paragraph.join(' '))}</p>`);
    paragraph = [];
  };

  const closeList = () => {
    if (!listType) return;
    html.push(`</${listType}>`);
    listType = null;
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) {
      flushParagraph();
      closeList();
      continue;
    }

    const bulletMatch = line.match(/^[-*\u2022]\s+(.*)$/);
    const orderedMatch = line.match(/^\d+[.)]\s+(.*)$/);

    if (bulletMatch) {
      flushParagraph();
      if (listType !== 'ul') {
        closeList();
        listType = 'ul';
        html.push('<ul>');
      }
      html.push(`<li>${inlineMarkdownToHtml(bulletMatch[1] ?? '')}</li>`);
      continue;
    }

    if (orderedMatch) {
      flushParagraph();
      if (listType !== 'ol') {
        closeList();
        listType = 'ol';
        html.push('<ol>');
      }
      html.push(`<li>${inlineMarkdownToHtml(orderedMatch[1] ?? '')}</li>`);
      continue;
    }

    if (line.startsWith('## ')) {
      flushParagraph();
      closeList();
      html.push(`<h4>${inlineMarkdownToHtml(line.slice(3))}</h4>`);
      continue;
    }

    if (listType) closeList();
    paragraph.push(line);
  }

  flushParagraph();
  closeList();
  return html.join('\n');
};

const formattedExplanationHtml = computed(() =>
  formatExplanationHtml(props.explanation?.explanation ?? ''),
);

// Pretty-print JSON payloads for the expandable debug blocks.
const formatJsonValue = (value: unknown) => {
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return t('anomalyWorkbenchSection.jsonUnserializable');
  }
};

const stringArrayFromUnknown = (value: unknown) =>
  Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];

const pathDeviationArrayFromUnknown = (value: unknown) =>
  Array.isArray(value) ? (value.filter((item) => item && typeof item === 'object') as PathDeviationDto[]) : [];

const featureContributionArrayFromUnknown = (value: unknown) =>
  Array.isArray(value)
    ? (value.filter((item) => item && typeof item === 'object') as FeatureContributionDto[])
    : [];
</script>

<style scoped>
/* Stream list, context cards, and explanation layout for the investigation workbench. */
.neo-stream-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 16px;
}

.neo-stream-item {
  border: 1px solid rgba(19, 32, 38, 0.08);
  border-radius: var(--neo-radius-card);
  background: rgba(255, 255, 255, 0.84);
  padding: 14px 16px;
  text-align: left;
  cursor: pointer;
  transition:
    transform 0.18s ease,
    box-shadow 0.18s ease,
    border-color 0.18s ease;
}

.neo-stream-item:hover {
  transform: translateY(-1px);
  box-shadow: 0 12px 28px rgba(15, 32, 38, 0.08);
}

.neo-stream-item.is-active {
  border-color: rgba(15, 61, 62, 0.28);
  background: rgba(15, 61, 62, 0.06);
}

.neo-stream-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}

.neo-stream-title {
  margin-top: 10px;
  font-weight: 600;
}

.neo-stream-meta,
.neo-stream-time {
  font-size: 12px;
  color: var(--neo-ink-muted);
}

.neo-context-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 12px;
}

.neo-context-card {
  border: var(--neo-border);
  border-radius: var(--neo-radius-card);
  background: rgba(255, 255, 255, 0.7);
  padding: 14px 16px;
}

.neo-context-title {
  font-size: 13px;
  font-weight: 600;
  margin-bottom: 10px;
}

.neo-context-note {
  margin-bottom: 10px;
  font-size: 12px;
  line-height: 1.5;
  color: var(--neo-ink-muted);
}

.neo-context-line {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  font-size: 13px;
  margin-top: 8px;
}

.neo-context-line span {
  color: var(--neo-ink-muted);
}

.neo-context-line strong {
  text-align: right;
}

.neo-context-empty {
  color: var(--neo-ink-muted);
  font-size: 13px;
}

.neo-investigation-visuals {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.neo-chip-ribbon {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.neo-chip-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.neo-sequence-expander {
  margin-top: 4px;
}

.neo-json-block {
  background: #14232d;
  color: #e6edf0;
  border-radius: var(--neo-radius-card);
  padding: 12px;
  font-size: 12px;
  line-height: 1.5;
  overflow-x: auto;
  white-space: pre;
}

/* Rich-text rules keep generated explanation content readable inside the panel. */
.neo-explanation-body h4 {
  margin: 0 0 8px;
  font-size: 15px;
}

.neo-explanation-body p {
  margin: 0 0 12px;
}

.neo-explanation-body ul,
.neo-explanation-body ol {
  margin: 8px 0 14px 18px;
  padding: 0;
}

.neo-explanation-body li {
  margin: 6px 0;
}

.neo-explanation-body code {
  font-family: 'JetBrains Mono', 'Segoe UI', monospace;
  background: rgba(15, 61, 62, 0.08);
  border-radius: 6px;
  padding: 2px 6px;
}

.neo-explanation-empty {
  color: rgba(28, 35, 51, 0.6);
}

@media (max-width: 960px) {
  .neo-investigation-visuals {
    grid-template-columns: 1fr;
  }
}
</style>
