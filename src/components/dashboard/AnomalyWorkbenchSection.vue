<template>
  <section id="workbench" class="neo-section neo-investigation">
    <div class="neo-section-header">
      <div>
        <div class="neo-section-title">Response workbench</div>
        <div class="neo-section-subtitle">
          Stream live alerts from Kafka, inspect anomaly context, and request AI explanations on
          demand.
        </div>
      </div>
    </div>

    <div class="neo-investigation-grid">
      <div class="neo-panel">
        <div class="neo-panel-header">
          <div>
            <div class="neo-panel-title">Live anomaly wire</div>
            <div class="neo-panel-subtitle">Kafka alerts relayed by the API service</div>
          </div>
          <div class="neo-live-pill" :class="{ 'is-loading': !streamConnected }">
            <span class="neo-live-dot"></span>
            {{ streamConnected ? 'Connected' : 'Reconnecting' }}
          </div>
        </div>

        <div v-if="streamError" class="neo-error">{{ streamError }}</div>
        <div v-else-if="!streamAlerts.length" class="neo-placeholder">
          Waiting for anomaly alerts from the live stream.
        </div>
        <div v-else class="neo-stream-list">
          <button
            v-for="alert in streamAlerts"
            :key="anomalyKey(alert)"
            type="button"
            class="neo-stream-item"
            :class="{ 'is-active': anomalyKey(alert) === selectedEventKey }"
            @click="emit('select-alert', alert)"
          >
            <div class="neo-stream-top">
              <q-badge :color="tierColor(alert.anomalyTier)" text-color="white">
                {{ alert.anomalyTier || 'UNKNOWN' }}
              </q-badge>
              <span class="neo-stream-time">{{ formatDate(alert.detectedAt) }}</span>
            </div>
            <div class="neo-stream-title">{{ alert.anomalyType || 'UNKNOWN' }}</div>
            <div class="neo-stream-meta">{{ alert.insuredId }} / {{ alert.sessionId }}</div>
          </button>
        </div>
      </div>

      <div class="neo-panel neo-panel-contrast">
        <div class="neo-panel-header">
          <div>
            <div class="neo-panel-title">Selected anomaly context</div>
            <div class="neo-panel-subtitle">
              Session, risk, next action, and raw payload signals.
            </div>
          </div>
        </div>

        <div v-if="!selectedEvent" class="neo-placeholder">
          Select an anomaly from the live wire or the anomaly table.
        </div>
        <div v-else class="neo-explanation">
          <div class="neo-explanation-meta">
            <div>
              <div class="neo-explanation-label">Insured</div>
              <div class="neo-explanation-value">{{ selectedEvent.insuredId }}</div>
            </div>
            <div>
              <div class="neo-explanation-label">Tier</div>
              <div class="neo-explanation-value">{{ selectedEvent.anomalyTier }}</div>
            </div>
            <div>
              <div class="neo-explanation-label">Type</div>
              <div class="neo-explanation-value">{{ readableText(selectedEvent.anomalyType) }}</div>
            </div>
            <div>
              <div class="neo-explanation-label">Score</div>
              <div class="neo-explanation-value">{{ readableScore(selectedEvent.anomalyScore) }}</div>
            </div>
            <div>
              <div class="neo-explanation-label">Type confidence</div>
              <div class="neo-explanation-value">
                {{ readablePercent(selectedEvent.typeConfidence) }}
              </div>
            </div>
            <div>
              <div class="neo-explanation-label">Event</div>
              <div class="neo-explanation-value">{{ selectedEvent.eventId || selectedEvent.id }}</div>
            </div>
          </div>

          <div class="neo-context-grid">
            <div class="neo-context-card">
              <div class="neo-context-title">Session</div>
              <div v-if="sessionAnalysisLoading" class="neo-context-note">
                Loading matching session trace for this anomaly.
              </div>
              <div v-else-if="!sessionAnalysis" class="neo-context-note">
                No matching session trace was returned by the API. Event-level fallback values are
                shown where possible.
              </div>

              <div class="neo-context-line">
                <span>Status</span>
                <strong>{{ sessionStatus }}</strong>
              </div>
              <div class="neo-context-line">
                <span>Started</span>
                <strong>{{ sessionStarted }}</strong>
              </div>
              <div class="neo-context-line">
                <span>Ended</span>
                <strong>{{ sessionEnded }}</strong>
              </div>
              <div class="neo-context-line">
                <span>Duration</span>
                <strong>{{ sessionDuration }}</strong>
              </div>
              <div class="neo-context-line">
                <span>KO rate</span>
                <strong>{{ sessionKoRate }}</strong>
              </div>
              <div class="neo-context-line">
                <span>Rule type</span>
                <strong>{{ sessionRuleType }}</strong>
              </div>
              <div class="neo-context-line">
                <span>Actions</span>
                <strong>{{ sessionActionCount }}</strong>
              </div>
              <div class="neo-context-line">
                <span>Unique actions</span>
                <strong>{{ sessionUniqueActions }}</strong>
              </div>
              <div class="neo-context-line">
                <span>Mean delta</span>
                <strong>{{ sessionMeanDelta }}</strong>
              </div>
              <div class="neo-context-line">
                <span>Action diversity</span>
                <strong>{{ sessionActionDiversity }}</strong>
              </div>
            </div>

            <div class="neo-context-card">
              <div class="neo-context-title">Risk profile</div>
              <div v-if="!riskProfile" class="neo-context-note">
                The risk profile endpoint returned no profile for this insured.
              </div>
              <div class="neo-context-line">
                <span>Risk tier</span>
                <strong>{{ riskTier }}</strong>
              </div>
              <div class="neo-context-line">
                <span>30d anomaly rate</span>
                <strong>{{ riskAnomalyRate }}</strong>
              </div>
              <div class="neo-context-line">
                <span>Clean streak</span>
                <strong>{{ riskCleanStreak }}</strong>
              </div>
              <div class="neo-context-line">
                <span>Last anomaly</span>
                <strong>{{ riskLastAnomaly }}</strong>
              </div>
            </div>

            <div class="neo-context-card">
              <div class="neo-context-title">Predicted next actions</div>
              <div v-if="!displayedNextActions.length" class="neo-context-empty">
                No prediction payload was returned for this insured or session.
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
              <div class="neo-context-title">Active anomaly</div>
              <div v-if="!activeAnomalyContext" class="neo-context-note">
                No separate active anomaly payload was returned. The selected anomaly is shown as the
                fallback.
              </div>
              <div class="neo-context-line">
                <span>Tier</span>
                <strong>{{ activeTier }}</strong>
              </div>
              <div class="neo-context-line">
                <span>Type</span>
                <strong>{{ activeType }}</strong>
              </div>
              <div class="neo-context-line">
                <span>Detected</span>
                <strong>{{ activeDetected }}</strong>
              </div>
              <div class="neo-context-line">
                <span>Event time</span>
                <strong>{{ activeEventTime }}</strong>
              </div>
            </div>
          </div>

          <q-expansion-item
            v-if="selectedEvent.eventJson"
            dense
            expand-separator
            icon="data_object"
            label="Raw anomaly payload"
            class="neo-sequence-expander"
          >
            <pre class="neo-json-block">{{ formatJson(selectedEvent.eventJson) }}</pre>
          </q-expansion-item>

          <q-expansion-item
            v-if="sessionAnalysis?.actionCounts && Object.keys(sessionAnalysis.actionCounts).length"
            dense
            expand-separator
            icon="list_alt"
            label="Session action counts"
            class="neo-sequence-expander"
          >
            <pre class="neo-json-block">{{ JSON.stringify(sessionAnalysis.actionCounts, null, 2) }}</pre>
          </q-expansion-item>
        </div>
      </div>

      <div class="neo-panel neo-panel-sequence">
        <div class="neo-panel-header">
          <div>
            <div class="neo-panel-title">AI explanation</div>
            <div class="neo-panel-subtitle">
              Prompted with anomaly, session, risk, next action, and live stats context.
            </div>
          </div>
          <q-btn
            color="secondary"
            unelevated
            icon="psychology"
            label="Explain"
            :disable="!selectedEvent || selectedEvent.id == null"
            :loading="explanationLoading"
            @click="emit('generate-explanation')"
          />
        </div>

        <div v-if="!selectedEvent" class="neo-placeholder">
          Select an anomaly to request an explanation.
        </div>
        <div v-else-if="explanationError" class="neo-error">
          {{ explanationError }}
        </div>
        <div v-else class="neo-explanation">
          <div class="neo-explanation-meta">
            <div>
              <div class="neo-explanation-label">Source</div>
              <div class="neo-explanation-value">
                {{ explanation?.source || 'not requested' }}
              </div>
            </div>
            <div>
              <div class="neo-explanation-label">Model</div>
              <div class="neo-explanation-value">
                {{ explanation?.model || 'n/a' }}
              </div>
            </div>
            <div>
              <div class="neo-explanation-label">Generated</div>
              <div class="neo-explanation-value">
                {{ formatDate(explanation?.generatedAt) }}
              </div>
            </div>
            <div>
              <div class="neo-explanation-label">Cache</div>
              <div class="neo-explanation-value">
                {{ explanation?.cached ? 'hit' : explanation ? 'fresh' : 'n/a' }}
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
import { computed } from 'vue';
import type {
  AnomalyAlertDto,
  AnomalyEventDto,
  AnomalyExplanationDto,
  NextActionPredictionDto,
  SessionAnalysisDto,
  UserRiskProfileDto,
} from 'src/types/analytics';
import {
  formatDate,
  formatDurationSeconds,
  formatPercent,
  formatScore,
} from 'src/utils/format';

const props = defineProps<{
  selectedEvent: AnomalyEventDto | null;
  selectedEventKey: string;
  streamAlerts: AnomalyEventDto[];
  streamConnected: boolean;
  streamError: string;
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

const anomalyKey = (event: AnomalyEventDto) =>
  event.id != null
    ? `id:${event.id}`
    : `${event.insuredId}:${event.sessionId}:${event.eventId}:${event.detectedAt ?? ''}`;

const tierColor = (tier: string | null | undefined) => {
  if (tier === 'TIER3') return 'negative';
  if (tier === 'TIER2') return 'warning';
  if (tier === 'TIER1') return 'primary';
  return 'grey';
};

const readableText = (value: string | null | undefined, fallback = 'Not returned') =>
  value && value.trim().length > 0 ? value : fallback;

const readableDate = (value: string | null | undefined, fallback = 'Not returned') =>
  value ? formatDate(value) : fallback;

const readablePercent = (value: number | null | undefined, fallback = 'Not returned') =>
  value == null || Number.isNaN(value) ? fallback : formatPercent(value, 1);

const readableScore = (value: number | null | undefined, fallback = 'Not returned') =>
  value == null || Number.isNaN(value) ? fallback : formatScore(value);

const readableDuration = (value: number | null | undefined, fallback = 'Not returned') =>
  value == null || Number.isNaN(value) ? fallback : formatDurationSeconds(value);

const readableNumber = (value: number | null | undefined, fallback = 'Not returned') =>
  value == null || Number.isNaN(value) ? fallback : value.toLocaleString('en-GB');

const sessionStatus = computed(() => {
  if (props.sessionAnalysis?.isAnomaly != null) {
    return props.sessionAnalysis.isAnomaly ? 'Anomalous' : 'Observed';
  }
  return props.selectedEvent ? 'Anomalous' : 'Not returned';
});

const sessionStarted = computed(() =>
  readableDate(
    props.sessionAnalysis?.startTime ?? props.selectedEvent?.eventTime ?? props.selectedEvent?.detectedAt
  )
);

const sessionEnded = computed(() =>
  readableDate(
    props.sessionAnalysis?.endTime ?? props.selectedEvent?.detectedAt ?? props.selectedEvent?.eventTime
  )
);

const sessionDuration = computed(() =>
  readableDuration(props.sessionAnalysis?.sessionDurationSeconds)
);

const sessionKoRate = computed(() => readablePercent(props.sessionAnalysis?.koRate));

const sessionRuleType = computed(() =>
  readableText(props.sessionAnalysis?.ruleType ?? props.selectedEvent?.ruleType)
);

const sessionActionCount = computed(() =>
  readableNumber(props.sessionAnalysis?.sessionLength ?? props.sessionAnalysis?.uniqueActionCount)
);

const sessionUniqueActions = computed(() =>
  readableNumber(props.sessionAnalysis?.uniqueActionCount)
);

const sessionMeanDelta = computed(() =>
  readableDuration(props.sessionAnalysis?.meanDeltaSeconds)
);

const sessionActionDiversity = computed(() =>
  readableScore(props.sessionAnalysis?.actionDiversity)
);

const riskTier = computed(() =>
  readableText(
    props.riskProfile?.riskTier ??
      (props.selectedEvent?.anomalyTier ? `Investigate ${props.selectedEvent.anomalyTier}` : null)
  )
);

const riskAnomalyRate = computed(() => readablePercent(props.riskProfile?.anomalyRate30d));

const riskCleanStreak = computed(() =>
  readableNumber(props.riskProfile?.consecutiveCleanSessions)
);

const riskLastAnomaly = computed(() =>
  readableText(props.riskProfile?.lastAnomalyType ?? props.selectedEvent?.anomalyType)
);

const displayedNextActions = computed(() => {
  const nextActionPayload = props.nextActions?.top3Actions ?? [];
  if (nextActionPayload.length) return nextActionPayload;
  return props.sessionAnalysis?.top3NextActions ?? [];
});

const activeAnomalyContext = computed(() => props.activeAnomaly ?? props.selectedEvent);

const activeTier = computed(() => readableText(activeAnomalyContext.value?.anomalyTier, 'None'));
const activeType = computed(() => readableText(activeAnomalyContext.value?.anomalyType));
const activeDetected = computed(() => readableDate(activeAnomalyContext.value?.detectedAt));
const activeEventTime = computed(() => readableDate(activeAnomalyContext.value?.eventTime));

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
  if (!trimmed) return '<p class="neo-explanation-empty">No explanation requested yet.</p>';
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
  formatExplanationHtml(props.explanation?.explanation ?? '')
);

const formatJson = (value: string) => {
  try {
    return JSON.stringify(JSON.parse(value), null, 2);
  } catch {
    return value;
  }
};
</script>

<style scoped>
.neo-stream-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 16px;
}

.neo-stream-item {
  border: 1px solid rgba(19, 32, 38, 0.08);
  border-radius: 16px;
  background: #fffdfa;
  padding: 14px 16px;
  text-align: left;
  cursor: pointer;
  transition: transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease;
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
  border-radius: 16px;
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

.neo-chip-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.neo-sequence-expander {
  margin-top: 4px;
}

.neo-json-block {
  background: #0f1a2b;
  color: #d9e2f2;
  border-radius: 12px;
  padding: 12px;
  font-size: 12px;
  line-height: 1.5;
  overflow-x: auto;
  white-space: pre;
}

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
</style>
