<template>
  <section id="investigation" class="neo-section neo-investigation">
    <div class="neo-section-header">
      <div>
        <div class="neo-section-title">Investigation studio</div>
        <div class="neo-section-subtitle">
          Trace audit trails, pivot on users, and capture the AI narrative for response.
        </div>
      </div>
    </div>

    <div class="neo-investigation-grid">
      <div class="neo-panel">
        <div class="neo-panel-header">
          <div>
            <div class="neo-panel-title">Live audit trail</div>
            <div class="neo-panel-subtitle">Redis window for selected user</div>
          </div>
          <div class="neo-panel-actions">
            <q-input
              dense
              outlined
              v-model.number="userKeyModel"
              type="number"
              placeholder="User key"
              class="neo-input-compact"
            />
            <q-btn
              color="primary"
              unelevated
              icon="manage_search"
              label="Load"
              :loading="historyLoading"
              @click="emit('load-history')"
            />
          </div>
        </div>

        <div v-if="historyLoading" class="neo-placeholder">Loading audit history...</div>
        <div v-else-if="historyError" class="neo-error">{{ historyError }}</div>
        <q-timeline v-else color="primary" class="neo-timeline">
          <q-timeline-entry
            v-for="event in history"
            :key="event.id"
            :title="event.action"
            :subtitle="formatDate(event.createdAt)"
            :icon="event.success ? 'check_circle' : 'error'"
            :color="event.success ? 'positive' : 'negative'"
          >
            <div class="neo-event">
              <div class="neo-event-line">
                <span>Object</span>
                <strong>{{ event.object || 'n/a' }}</strong>
              </div>
              <div class="neo-event-line">
                <span>Details</span>
                <strong>{{ event.details || 'No details provided' }}</strong>
              </div>
              <div class="neo-event-meta">
                <q-badge v-if="event.content" color="secondary" text-color="white">Has content</q-badge>
                <span>{{ event.ipAddress || 'Unknown IP' }}</span>
              </div>
            </div>
          </q-timeline-entry>
        </q-timeline>
      </div>

      <div class="neo-panel neo-panel-contrast">
        <div class="neo-panel-header">
          <div>
            <div class="neo-panel-title">AI explanation</div>
            <div class="neo-panel-subtitle">Human-readable narrative for selected alert</div>
          </div>
          <q-btn
            color="secondary"
            unelevated
            icon="psychology"
            label="Generate"
            :disable="!selectedAlert"
            :loading="explanationLoading"
            @click="emit('generate-explanation')"
          />
        </div>

        <div v-if="!selectedAlert" class="neo-placeholder">
          Select an alert from the table to generate an explanation.
        </div>
        <div v-else class="neo-explanation">
          <div class="neo-explanation-meta">
            <div>
              <div class="neo-explanation-label">Alert ID</div>
              <div class="neo-explanation-value">#{{ selectedAlert.id }}</div>
            </div>
            <div>
              <div class="neo-explanation-label">User key</div>
              <div class="neo-explanation-value">{{ selectedAlert.userKey ?? 'n/a' }}</div>
            </div>
            <div>
              <div class="neo-explanation-label">Severity</div>
              <div class="neo-explanation-value">{{ severityLabel(selectedAlert) }}</div>
            </div>
          </div>

          <div v-if="explanationError" class="neo-error">{{ explanationError }}</div>
          <div v-else class="neo-explanation-body" v-html="formattedExplanationHtml"></div>
        </div>
      </div>

      <div class="neo-panel neo-panel-sequence">
        <div class="neo-panel-header">
          <div>
            <div class="neo-panel-title">Alert sequence</div>
            <div class="neo-panel-subtitle">Event chain + prediction context</div>
          </div>
          <q-btn
            color="primary"
            outline
            icon="sync"
            label="Refresh"
            :disable="!selectedAlert"
            :loading="sequenceLoading"
            @click="emit('load-sequence')"
          />
        </div>

        <div v-if="!selectedAlert" class="neo-placeholder">
          Select an alert to load its sequence intelligence.
        </div>
        <div v-else-if="sequenceLoading" class="neo-placeholder">
          Loading sequence intelligence...
        </div>
        <div v-else-if="sequenceError" class="neo-error">{{ sequenceError }}</div>
        <div v-else class="neo-sequence">
          <div class="neo-sequence-meta">
            <div>
              <div class="neo-sequence-label">Alert ID</div>
              <div class="neo-sequence-value">#{{ selectedAlert.id }}</div>
            </div>
            <div>
              <div class="neo-sequence-label">Sequence created</div>
              <div class="neo-sequence-value">
                {{ formatDate(sequenceDetails?.createdAt ?? null) }}
              </div>
            </div>
            <div>
              <div class="neo-sequence-label">Events</div>
              <div class="neo-sequence-value">{{ sequenceEvents.length }}</div>
            </div>
          </div>

          <div v-if="sequenceDetails?.predictionSummary" class="neo-sequence-summary">
            <div class="neo-sequence-summary-label">Prediction summary</div>
            <div class="neo-sequence-summary-body">
              {{ sequenceDetails.predictionSummary }}
            </div>
          </div>
          <div v-else class="neo-sequence-summary-empty">No prediction summary available.</div>

          <q-timeline v-if="sequenceEvents.length" color="secondary" class="neo-timeline">
            <q-timeline-entry
              v-for="event in sequenceEvents"
              :key="event.id"
              :title="event.action"
              :subtitle="formatDate(event.createdAt)"
              :icon="event.success ? 'check_circle' : 'error'"
              :color="event.success ? 'positive' : 'negative'"
            >
              <div class="neo-event">
                <div class="neo-event-line">
                  <span>Object</span>
                  <strong>{{ event.object || 'n/a' }}</strong>
                </div>
                <div class="neo-event-line">
                  <span>Details</span>
                  <strong>{{ event.details || 'No details provided' }}</strong>
                </div>
                <div class="neo-event-meta">
                  <q-badge v-if="event.content" color="secondary" text-color="white"
                    >Has content</q-badge
                  >
                  <span>{{ event.ipAddress || 'Unknown IP' }}</span>
                </div>
              </div>
            </q-timeline-entry>
          </q-timeline>
          <div v-else class="neo-placeholder">No sequence events returned for this alert.</div>

          <q-expansion-item
            v-if="sequenceDetails?.sequenceJson"
            expand-separator
            icon="schema"
            label="Sequence JSON"
            class="neo-sequence-expander"
          >
            <pre class="neo-json-block">{{ formatJson(sequenceDetails.sequenceJson) }}</pre>
          </q-expansion-item>
          <q-expansion-item
            v-if="sequenceDetails?.predictionJson"
            expand-separator
            icon="insights"
            label="Prediction JSON"
            class="neo-sequence-expander"
          >
            <pre class="neo-json-block">{{ formatJson(sequenceDetails.predictionJson) }}</pre>
          </q-expansion-item>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { AuditTrailEvent, SecurityAlert, SequenceDetailsDto } from 'src/types/soc';
import { formatDate, severityLabel } from 'src/utils/alerts';

const props = defineProps<{
  selectedAlert: SecurityAlert | null;
  explanationText: string;
  explanationLoading: boolean;
  explanationError: string;
  userKeyInput: number | null;
  history: AuditTrailEvent[];
  historyLoading: boolean;
  historyError: string;
  sequenceEvents: AuditTrailEvent[];
  sequenceDetails: SequenceDetailsDto | null;
  sequenceLoading: boolean;
  sequenceError: string;
}>();

const emit = defineEmits<{
  (event: 'update:userKeyInput', value: number | null): void;
  (event: 'load-history'): void;
  (event: 'generate-explanation'): void;
  (event: 'load-sequence'): void;
}>();

// Two-way binding for the user key input.
const userKeyModel = computed({
  get: () => props.userKeyInput,
  set: (value: number | null) => emit('update:userKeyInput', value),
});

// Minimal HTML escaping for rendering markdown-derived content.
const escapeHtml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

// Render inline markdown emphasis without block parsing.
const inlineMarkdownToHtml = (value: string) => {
  const escaped = escapeHtml(value);
  return escaped
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>');
};

// Convert plain text explanation into safe, styled HTML.
const formatExplanationHtml = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) return '<p class="neo-explanation-empty">No explanation available yet.</p>';
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

    if (/^[-*_]{3,}$/.test(line)) {
      flushParagraph();
      closeList();
      html.push('<hr />');
      continue;
    }

    const bulletMatch = line.match(/^[-*\\u2022]\s+(.*)$/);
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

    if (listType) closeList();
    paragraph.push(line);
  }

  flushParagraph();
  closeList();
  return html.join('\n');
};

// Cache formatted HTML for the explanation card.
const formattedExplanationHtml = computed(() => formatExplanationHtml(props.explanationText));

// Pretty-print JSON payloads without throwing for invalid input.
const formatJson = (value: string) => {
  try {
    return JSON.stringify(JSON.parse(value), null, 2);
  } catch {
    return value;
  }
};
</script>

<style scoped>
.neo-explanation-body {
  background: #f7f8fb;
  border: 1px solid rgba(31, 49, 86, 0.12);
  border-radius: 16px;
  color: #1c2333;
  font-size: 0.95rem;
  line-height: 1.7;
  padding: 18px 20px;
  box-shadow: 0 12px 24px rgba(24, 36, 64, 0.12);
  white-space: normal;
}

.neo-explanation-body p {
  margin: 0 0 12px 0;
}

.neo-explanation-body ul,
.neo-explanation-body ol {
  margin: 8px 0 14px 22px;
  padding: 0;
}

.neo-explanation-body li {
  margin: 6px 0;
}

.neo-explanation-body strong {
  color: #0e1a33;
}

.neo-explanation-body code {
  font-family: 'JetBrains Mono', 'Segoe UI', monospace;
  background: rgba(15, 61, 62, 0.08);
  border-radius: 6px;
  padding: 2px 6px;
}

.neo-explanation-body hr {
  border: 0;
  border-top: 1px solid rgba(31, 49, 86, 0.2);
  margin: 12px 0;
}

.neo-explanation-empty {
  color: rgba(28, 35, 51, 0.6);
}

.neo-sequence-meta {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 14px;
  margin-bottom: 16px;
}

.neo-sequence-label {
  font-size: 12px;
  color: rgba(28, 35, 51, 0.6);
}

.neo-sequence-value {
  font-size: 16px;
  font-weight: 600;
}

.neo-sequence-summary {
  background: rgba(24, 64, 111, 0.08);
  border-radius: 14px;
  padding: 14px 16px;
  margin-bottom: 16px;
}

.neo-sequence-summary-label {
  font-size: 12px;
  color: rgba(28, 35, 51, 0.6);
  margin-bottom: 6px;
}

.neo-sequence-summary-body {
  font-size: 14px;
  color: #1c2333;
  line-height: 1.5;
}

.neo-sequence-summary-empty {
  font-size: 13px;
  color: rgba(28, 35, 51, 0.55);
  margin-bottom: 16px;
}

.neo-sequence-expander {
  margin-top: 10px;
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
</style>

