<template>
  <Teleport to="body">
    <Transition name="neo-ai-modal">
      <div
        v-if="visible"
        id="explain-ai"
        class="neo-ai-modal"
        role="dialog"
        aria-modal="true"
        :aria-label="t('aiExplainer.modalTitle')"
        data-assistant-id="explain-ai"
        data-assistant-type="panel"
        data-assistant-label="AI Explainer Modal"
        data-assistant-description="Modal panel that shows AI-generated explanations, evidence payloads, and recommended actions for alerts."
        data-assistant-actions="HIGHLIGHT_ELEMENT"
        @click.self="close"
      >
        <div class="neo-ai-modal__panel">
          <header class="neo-ai-modal__header">
            <div class="neo-ai-modal__header-copy">
              <div>
                <h2 class="neo-ai-modal__title">
                  {{ t('aiExplainer.modalTitle') }}
                </h2>
                <p class="neo-ai-modal__subtitle">{{ t('aiExplainer.modalSubtitle') }}</p>
              </div>
            </div>
            <button type="button" class="neo-ai-modal__close" :aria-label="t('common.close')" @click="close">
              <q-icon name="close" />
            </button>
          </header>

          <div class="neo-ai-modal__body">
            <div v-if="loading || generating || evidenceLoading" class="neo-ai-modal__loading">
              <loading-overlay :show="true" context="llm" placement="panel" />
            </div>

            <q-banner v-if="error" class="neo-banner q-mb-md">{{ error }}</q-banner>
            <q-banner v-if="fallback && !normalizedExplanation" class="neo-ai-modal__fallback q-mb-md">{{ t('v36.llm.fallbackNotice') }}</q-banner>

            <template v-if="currentEventId && normalizedExplanation">
              <template v-if="showEvidence && evidenceJson">
                <div id="evidence-payload" class="neo-ai-modal__evidence-header"
                  data-assistant-id="evidence-payload"
                  data-assistant-type="panel"
                  data-assistant-label="Evidence Payload Panel"
                  data-assistant-description="Panel showing the raw evidence payload JSON for the selected alert."
                  data-assistant-actions="HIGHLIGHT_ELEMENT"
                >
                  <div>
                    <div class="text-h6">{{ t('v36.llm.evidencePayload') }}</div>
                    <div class="text-caption">{{ currentEventId }}</div>
                  </div>
                  <q-btn flat round icon="close" @click="showEvidence = false" />
                </div>
                <q-separator class="q-mb-md" />
                <q-banner v-if="evidenceError" class="neo-banner q-mb-md">{{ evidenceError }}</q-banner>
                <pre class="neo-v36-json">{{ evidenceJson }}</pre>
              </template>
              <template v-else>
                <div class="neo-ai-modal__llm-actions q-mb-md">
                  <q-btn
                    id="btn-evidence-payload"
                    flat
                    dense
                    size="sm"
                    icon="data_object"
                    :label="t('v36.llm.evidencePayload')"
                    data-assistant-id="btn-evidence-payload"
                    data-assistant-type="button"
                    data-assistant-label="Evidence Payload Button"
                    data-assistant-description="Button within the AI explanation modal that shows the raw evidence payload JSON."
                    data-assistant-actions="HIGHLIGHT_ELEMENT,CLICK_ELEMENT"
                    :disable="evidenceLoading"
                    @click="openEvidence"
                  />
                  <q-btn
                    outline
                    dense
                    size="sm"
                    color="orange"
                    icon="refresh"
                    :label="t('v36.llm.forceGenerate')"
                    :disable="generating"
                    @click="() => void generate({ forceRefresh: true, style: 'security_analyst', language: 'fr', includeRecommendedActions: true })"
                  />
                </div>
                <LlmExplanationPanel :explanation="normalizedExplanation" />
              </template>
            </template>

            <template v-else-if="content">
              <div v-if="content" class="neo-ai-modal__context">
                <div>
                  <span>{{ t('aiExplainer.telemetryContext') }}</span>
                  <strong>{{ content.target }}</strong>
                </div>
                <div class="neo-ai-modal__context-host">
                  <span>{{ t('aiExplainer.diagnosticHost') }}</span>
                  <strong class="neo-mono">{{ t('aiExplainer.diagnosticHostValue') }}</strong>
                </div>
              </div>

              <section v-if="content" class="neo-ai-modal__section">
                <h3>
                  <q-icon name="biotech" />
                  {{ t('aiExplainer.diagnosticSummary') }}
                </h3>
                <div class="neo-ai-modal__summary">{{ content.summary }}</div>
              </section>

              <div v-if="content" class="neo-ai-modal__columns">
                <article class="neo-ai-modal__card neo-ai-modal__card--threat">
                  <h4>
                    <q-icon name="report" />
                    {{ t('aiExplainer.threatVector') }}
                  </h4>
                  <p>{{ content.threat }}</p>
                </article>
                <article class="neo-ai-modal__card neo-ai-modal__card--recommendation">
                  <h4>
                    <q-icon name="check_box" />
                    {{ t('aiExplainer.recommendation') }}
                  </h4>
                  <p>{{ content.recommendation }}</p>
                </article>
              </div>
            </template>
          </div>

          <footer class="neo-ai-modal__footer">
            <span class="neo-ai-modal__secured">
              <q-icon name="verified_user" />
              {{ t('aiExplainer.securedBy') }}
            </span>
            <div class="neo-ai-modal__actions">
              <button type="button" class="neo-ai-modal__btn neo-ai-modal__btn--ghost" @click="close">
                {{ t('aiExplainer.dismissAnalysis') }}
              </button>
              <button type="button" class="neo-ai-modal__btn neo-ai-modal__btn--primary" @click="handleDeploy">
                <q-icon name="shield" />
                {{ t('aiExplainer.deploySafeguards') }}
              </button>
            </div>
          </footer>
        </div>
      </div>
    </Transition>

  </Teleport>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useQuasar } from 'quasar';
import LoadingOverlay from 'src/components/loading/LoadingOverlay.vue';
import LlmExplanationPanel from 'src/components/llm/LlmExplanationPanel.vue';
import { useAiExplainer } from 'src/composables/useAiExplainer';

const { t } = useI18n();
const $q = useQuasar();
const showEvidence = ref(false);
const {
  visible,
  loading,
  generating,
  evidenceLoading,
  error,
  evidenceError,
  fallback,
  content,
  normalizedExplanation,
  evidence,
  currentEventId,
  close,
  deploySafeguards,
  generate,
  loadEvidence,
} = useAiExplainer();

const handleDeploy = () => {
  const message = deploySafeguards();
  $q.notify({
    type: 'positive',
    message,
    icon: 'shield',
    position: 'top',
  });
};

const evidenceJson = computed(() => JSON.stringify(evidence.value ?? {}, null, 2));

const openEvidence = async () => {
  showEvidence.value = true;
  if (!evidence.value) {
    await loadEvidence();
  }
};
</script>

<style scoped>
.neo-ai-modal {
  position: fixed;
  inset: 0;
  z-index: 7000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(6px);
}

.neo-ai-modal__panel {
  width: min(820px, 100%);
  max-height: min(90vh, 860px);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border-radius: 18px;
  border: var(--neo-border);
  background: var(--neo-surface);
  box-shadow: var(--neo-shadow-hover);
}

.neo-ai-modal__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  padding: 20px;
  color: var(--neo-ai-chrome-text);
  background: var(--neo-ai-chrome-bg);
  border-bottom: 1px solid var(--neo-accent-line);
}

.neo-ai-modal__header-copy {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.neo-ai-modal__title {
  margin: 0;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 700;
  background: var(--neo-diamond);
  background-size: 200% auto;
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  animation: shimmer 3s ease-in-out infinite;
}

.neo-ai-modal__subtitle {
  margin: 4px 0 0;
  color: var(--neo-ai-chrome-muted);
  font-size: 11px;
}

.neo-ai-modal__close {
  width: 32px;
  height: 32px;
  display: grid;
  place-items: center;
  border: none;
  border-radius: 8px;
  background: transparent;
  color: var(--neo-ai-chrome-control);
  cursor: pointer;
}

.neo-ai-modal__close:hover {
  background: var(--neo-ai-chrome-control-hover-bg);
  color: var(--neo-ai-chrome-text);
}

.neo-ai-modal__body {
  position: relative;
  flex: 1;
  overflow: auto;
  padding: 24px;
  display: grid;
  gap: 20px;
}

.neo-ai-modal__loading {
  position: absolute;
  inset: 0;
  z-index: 2;
}

.neo-ai-modal__fallback {
  border: 1px solid rgba(251, 191, 36, 0.28);
  border-radius: var(--neo-radius-card);
  background: var(--neo-warning-bg);
  color: var(--neo-warning-contrast);
}

.neo-ai-modal__llm-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.neo-ai-modal__context {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  padding: 16px;
  border-radius: 12px;
  border: var(--neo-border);
  background: var(--neo-card-bg-tint);
  font-size: 12px;
}

.neo-ai-modal__context span {
  display: block;
  margin-bottom: 6px;
  color: var(--neo-ink-muted);
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.neo-ai-modal__context strong {
  display: block;
  color: var(--neo-ink);
  font-size: 14px;
  line-height: 1.4;
}

.neo-ai-modal__context-host {
  text-align: right;
}

.neo-ai-modal__section h3 {
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 0 0 8px;
  color: var(--neo-accent);
  font-size: 12px;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.neo-ai-modal__summary {
  padding: 16px;
  border-radius: 12px;
  border: var(--neo-border);
  background: var(--neo-card-bg-tint);
  color: var(--neo-ink-soft);
  font-size: 12px;
  line-height: 1.65;
  white-space: pre-wrap;
}

.neo-ai-modal__columns {
  display: grid;
  gap: 16px;
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.neo-ai-modal__card {
  padding: 16px;
  border-radius: 12px;
  border: 1px solid transparent;
}

.neo-ai-modal__card h4 {
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 0 0 8px;
  font-size: 12px;
}

.neo-ai-modal__card p {
  margin: 0;
  color: var(--neo-ink-muted);
  font-size: 12px;
  line-height: 1.6;
}

.neo-ai-modal__card--threat {
  border-color: rgba(239, 68, 68, 0.18);
  background: var(--neo-critical-bg);
}

.neo-ai-modal__card--threat h4 {
  color: var(--neo-critical);
}

.neo-ai-modal__card--recommendation {
  border-color: rgba(52, 211, 153, 0.18);
  background: var(--neo-success-bg);
}

.neo-ai-modal__card--recommendation h4 {
  color: var(--neo-success);
}

.neo-ai-modal__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 16px 20px;
  border-top: var(--neo-border);
}

.neo-ai-modal__secured {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: var(--neo-ink-muted);
  font-size: 11px;
}

.neo-ai-modal__secured :deep(.q-icon) {
  color: var(--neo-success);
}

.neo-ai-modal__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.neo-ai-modal__btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  font-family: inherit;
  font-size: 12px;
  font-weight: 700;
}

.neo-ai-modal__btn--ghost {
  background: var(--neo-subtle-bg);
  color: var(--neo-ink-muted);
}

.neo-ai-modal__btn--ghost:hover {
  background: var(--neo-card-bg-tint);
}

.neo-ai-modal__btn--primary {
  background: var(--neo-accent);
  color: #fff;
  box-shadow: 0 8px 24px rgba(229, 77, 86, 0.24);
}

.neo-ai-modal__btn--primary:hover {
  background: var(--neo-accent-hover);
}

.neo-ai-modal__context-info {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.neo-ai-modal__evidence-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.neo-v36-json {
  margin: 0;
  padding: 16px;
  overflow: auto;
  border: var(--neo-border);
  border-radius: var(--neo-radius-card);
  background: #101820;
  color: #e8f1f5;
  font-size: 12px;
  line-height: 1.5;
  max-height: 50vh;
  white-space: pre-wrap;
  word-break: break-all;
}

@keyframes shimmer {
  0%, 100% { background-position: 0% center; }
  50% { background-position: 200% center; }
}

.neo-ai-modal-enter-active,
.neo-ai-modal-leave-active {
  transition: opacity 220ms ease;
}

.neo-ai-modal-enter-active .neo-ai-modal__panel,
.neo-ai-modal-leave-active .neo-ai-modal__panel {
  transition:
    transform 260ms cubic-bezier(0.2, 0, 0, 1),
    opacity 220ms ease;
}

.neo-ai-modal-enter-from,
.neo-ai-modal-leave-to {
  opacity: 0;
}

.neo-ai-modal-enter-from .neo-ai-modal__panel,
.neo-ai-modal-leave-to .neo-ai-modal__panel {
  opacity: 0;
  transform: scale(0.95);
}

@media (max-width: 720px) {
  .neo-ai-modal__context {
    flex-direction: column;
  }

  .neo-ai-modal__context-host {
    text-align: left;
  }

  .neo-ai-modal__columns {
    grid-template-columns: 1fr;
  }

  .neo-ai-modal__footer {
    flex-direction: column;
    align-items: stretch;
  }

  .neo-ai-modal__actions {
    justify-content: stretch;
  }

  .neo-ai-modal__btn {
    flex: 1;
    justify-content: center;
  }
}
</style>
