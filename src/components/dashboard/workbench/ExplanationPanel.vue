<template>
  <div class="neo-workbench-explanation">
    <div class="neo-panel neo-explanation-panel">
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
      <div v-else class="neo-explanation-content">
        <div v-if="explanation" class="neo-explanation-body" v-html="formattedExplanationHtml"></div>

        <div v-if="explanation" class="neo-explanation-footer">
          <div class="neo-explanation-meta">
            <span class="neo-explanation-meta-item">
              {{ t('anomalyWorkbenchSection.labels.source') }}: <strong>{{ explanation.source }}</strong>
            </span>
            <span class="neo-explanation-meta-item">
              {{ t('anomalyWorkbenchSection.labels.model') }}: <strong>{{ explanation.model }}</strong>
            </span>
            <span class="neo-explanation-meta-item">
              {{ t('anomalyWorkbenchSection.labels.generated') }}: <strong>{{ formatDate(explanation.generatedAt) }}</strong>
            </span>
            <span class="neo-explanation-meta-item">
              {{ explanation.cached ? t('common.cacheHit') : t('common.cacheFresh') }}
            </span>
          </div>
        </div>
        <div v-else class="neo-placeholder" style="margin-top: 16px">
          {{ t('anomalyWorkbenchSection.noExplanationRequested') }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import type {
  AnomalyEventDto,
  AnomalyExplanationDto,
} from 'src/types/analytics';
import { formatDate } from 'src/utils/format';

const props = defineProps<{
  selectedEvent: AnomalyEventDto | null;
  explanation: AnomalyExplanationDto | null;
  explanationLoading: boolean;
  explanationError: string;
}>();

const emit = defineEmits<{
  (event: 'generate-explanation'): void;
}>();

const { t } = useI18n();

const formattedExplanationHtml = computed(() => {
  if (!props.explanation?.explanation) return '';
  return props.explanation.explanation
    .replace(/\n/g, '<br/>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/__(.*?)__/g, '<em>$1</em>')
    .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
});
</script>

<style scoped>
.neo-workbench-explanation {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.neo-explanation-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

.neo-placeholder {
  padding: 24px 16px;
  text-align: center;
  color: var(--neo-ink-muted);
  font-size: 13px;
}

.neo-error {
  padding: 12px 16px;
  border-radius: var(--neo-radius-card);
  background: var(--neo-critical-bg);
  color: var(--neo-critical-contrast);
  font-size: 13px;
  font-weight: 600;
}

.neo-explanation-content {
  display: flex;
  flex-direction: column;
  flex: 1;
  overflow-y: auto;
}

.neo-explanation-body {
  flex: 1;
  padding: 16px;
  color: var(--neo-ink);
  font-size: 13px;
  line-height: 1.6;
  overflow-y: auto;
}

.neo-explanation-body :deep(strong) {
  color: var(--neo-ink);
  font-weight: 700;
}

.neo-explanation-body :deep(em) {
  font-style: italic;
  color: var(--neo-ink-soft);
}

.neo-explanation-body :deep(a) {
  color: var(--neo-accent);
  text-decoration: none;
  transition: all var(--neo-transition-fast);
}

.neo-explanation-body :deep(a:hover) {
  text-decoration: underline;
}

.neo-explanation-body :deep(br) {
  display: block;
  content: '';
  margin: 4px 0;
}

.neo-explanation-footer {
  padding: 12px 16px;
  border-top: 1px solid var(--neo-border-color);
  background: rgba(23, 33, 43, 0.03);
}

.neo-explanation-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.neo-explanation-meta-item {
  color: var(--neo-ink-muted);
  font-size: 11px;
  font-weight: 500;
}

.neo-explanation-meta-item strong {
  color: var(--neo-ink-soft);
  font-weight: 700;
  font-family: 'JetBrains Mono', monospace;
}
</style>
