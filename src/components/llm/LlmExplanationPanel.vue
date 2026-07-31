<template>
  <div class="llm-explanation-panel">
    <div class="llm-explanation-header">
      <div class="llm-explanation-badges">
        <q-badge
          v-if="norm.cached"
          color="info"
          rounded
        >
          {{ t('v36.explanation.badges.cached') }}
        </q-badge>
        <q-badge
          v-else
          color="positive"
          rounded
        >
          {{ t('v36.explanation.badges.generated') }}
        </q-badge>
        <q-badge
          v-if="norm.forceRefresh"
          color="orange"
          rounded
        >
          {{ t('v36.explanation.badges.forceGenerated') }}
        </q-badge>
        <q-badge
          v-if="norm.provider"
          color="purple"
          rounded
        >
          {{ norm.provider }}
        </q-badge>
        <q-badge
          v-if="norm.source"
          :color="sourceTone(norm.source)"
          rounded
        >
          {{ formatSource(norm.source) }}
        </q-badge>
        <q-badge
          v-if="norm.fallback"
          color="warning"
          rounded
        >
          {{ t('v36.explanation.badges.providerFallback') }}
        </q-badge>
      </div>
      <div
        v-if="norm.generatedAt"
        class="text-caption text-grey q-mt-xs"
      >
        {{ formatDate(norm.generatedAt) }}
      </div>
    </div>

    <q-banner
      v-if="norm.fallback || norm.source === 'provider_error_fallback'"
      class="llm-warning-banner q-mt-md"
    >
      <template #avatar>
        <q-icon name="warning" />
      </template>
      {{ t('v36.explanation.warnings.providerFallback') }}
    </q-banner>

    <q-banner
      v-if="norm.source === 'sql_fallback'"
      class="llm-info-banner q-mt-md"
    >
      <template #avatar>
        <q-icon name="info" />
      </template>
      {{ t('v36.source.sqlFallbackMessage') }}
    </q-banner>

    <div
      v-if="norm.summary"
      class="llm-section q-mt-lg"
    >
      <h4 class="llm-section-title">
        <q-icon
          name="article"
          size="sm"
          class="q-mr-sm"
        />
        {{ t('v36.explanation.sections.summary') }}
      </h4>
      <p class="llm-paragraph">{{ norm.summary }}</p>
    </div>

    <q-separator class="q-my-md" />

    <div
      v-if="norm.riskNarrative"
      class="llm-section"
    >
      <h4 class="llm-section-title">
        <q-icon
          name="gpp_maybe"
          size="sm"
          class="q-mr-sm"
          color="warning"
        />
        {{ t('v36.explanation.sections.riskAssessment') }}
      </h4>
      <p class="llm-paragraph">{{ norm.riskNarrative }}</p>
    </div>

    <q-separator v-if="norm.riskNarrative" class="q-my-md" />

    <div
      v-if="norm.behaviorNarrative"
      class="llm-section"
    >
      <h4 class="llm-section-title">
        <q-icon
          name="person_search"
          size="sm"
          class="q-mr-sm"
        />
        {{ t('v36.explanation.sections.observedBehavior') }}
      </h4>
      <p class="llm-paragraph">{{ norm.behaviorNarrative }}</p>
    </div>

    <q-separator v-if="norm.behaviorNarrative" class="q-my-md" />

    <div
      v-if="norm.modelNarrative || modelScoreItems.length"
      class="llm-section"
    >
      <h4 class="llm-section-title">
        <q-icon
          name="model_training"
          size="sm"
          class="q-mr-sm"
        />
        {{ t('v36.explanation.sections.modelAnalysis') }}
      </h4>
      <p
        v-if="norm.modelNarrative"
        class="llm-paragraph"
      >
        {{ norm.modelNarrative }}
      </p>
      <div
        v-if="modelScoreItems.length"
        class="llm-model-scores q-mt-sm"
      >
        <div
          v-for="item in modelScoreItems"
          :key="item.key"
          class="llm-score-row"
        >
          <span class="llm-score-name text-weight-medium">{{ item.label }}</span>
          <span class="llm-score-value text-body2">{{ item.description }}</span>
        </div>
      </div>
    </div>

    <q-separator v-if="norm.rulesNarrative || norm.triggeredRulesExplanation?.length" class="q-my-md" />

    <div
      v-if="norm.rulesNarrative || norm.triggeredRulesExplanation?.length"
      class="llm-section"
    >
      <h4 class="llm-section-title">
        <q-icon
          name="gavel"
          size="sm"
          class="q-mr-sm"
        />
        {{ t('v36.explanation.sections.triggeredRules') }}
      </h4>
      <p
        v-if="norm.rulesNarrative"
        class="llm-paragraph"
      >
        {{ norm.rulesNarrative }}
      </p>
      <div
        v-if="norm.triggeredRulesExplanation?.length"
        class="llm-rule-chips q-mt-sm"
      >
        <q-chip
          v-for="(rule, idx) in norm.triggeredRulesExplanation"
          :key="idx"
          :label="formatTriggeredRule(rule)"
          outline
          color="orange"
          size="12px"
          class="q-mr-xs q-mb-xs"
        />
      </div>
    </div>

    <q-separator v-if="norm.sequenceNarrative" class="q-my-md" />

    <div
      v-if="norm.sequenceNarrative"
      class="llm-section"
    >
      <h4 class="llm-section-title">
        <q-icon
          name="timeline"
          size="sm"
          class="q-mr-sm"
        />
        {{ t('v36.explanation.sections.sequenceAnalysis') }}
      </h4>
      <p class="llm-paragraph">{{ norm.sequenceNarrative }}</p>
    </div>

    <q-separator v-if="evidenceBullets.length" class="q-my-md" />

    <div
      v-if="evidenceBullets.length"
      class="llm-section"
    >
      <h4 class="llm-section-title">
        <q-icon
          name="checklist"
          size="sm"
          class="q-mr-sm"
        />
        {{ t('v36.explanation.sections.keyEvidence') }}
      </h4>
      <q-list
        dense
        class="llm-bullet-list"
      >
        <q-item
          v-for="(bullet, idx) in evidenceBullets"
          :key="idx"
        >
          <q-item-section avatar>
            <q-icon
              name="circle"
              size="6px"
              color="grey"
            />
          </q-item-section>
          <q-item-section>
            <q-item-label class="llm-bullet-text">{{ bullet }}</q-item-label>
          </q-item-section>
        </q-item>
      </q-list>
    </div>

    <q-separator v-if="norm.possibleInterpretation" class="q-my-md" />

    <div
      v-if="norm.possibleInterpretation"
      class="llm-section llm-section-caution"
    >
      <h4 class="llm-section-title">
        <q-icon
          name="psychology"
          size="sm"
          class="q-mr-sm"
        />
        {{ t('v36.explanation.sections.possibleInterpretation') }}
      </h4>
      <p class="llm-paragraph">{{ norm.possibleInterpretation }}</p>
    </div>

    <q-separator v-if="norm.recommendedActions?.length" class="q-my-md" />

    <div
      v-if="norm.recommendedActions?.length"
      class="llm-section"
    >
      <h4 class="llm-section-title">
        <q-icon
          name="assignment"
          size="sm"
          class="q-mr-sm"
        />
        {{ t('v36.explanation.sections.recommendedActions') }}
      </h4>
      <q-list
        dense
        class="llm-action-list"
      >
        <q-item
          v-for="(action, idx) in norm.recommendedActions"
          :key="idx"
        >
          <q-item-section avatar>
            <q-icon
              :name="'chevron_right'"
              color="primary"
              size="18px"
            />
          </q-item-section>
          <q-item-section>
            <q-item-label>{{ action }}</q-item-label>
          </q-item-section>
        </q-item>
      </q-list>
    </div>

    <q-separator v-if="norm.limitations" class="q-my-md" />

    <div
      v-if="norm.limitations"
      class="llm-section llm-section-muted"
    >
      <h4 class="llm-section-title">
        <q-icon
          name="error_outline"
          size="sm"
          class="q-mr-sm"
        />
        {{ t('v36.explanation.sections.limitations') }}
      </h4>
      <p class="llm-paragraph">{{ norm.limitations }}</p>
    </div>

    <q-separator class="q-my-md" />

    <div
      v-if="norm.disclaimer"
      class="llm-disclaimer"
    >
      <small>{{ norm.disclaimer }}</small>
    </div>

    <q-expansion-item
      v-if="norm.raw"
      icon="data_object"
      :label="t('v36.explanation.sections.rawResponse')"
      header-class="llm-raw-toggle"
      class="q-mt-lg"
    >
      <pre class="llm-raw-json">{{ rawJson }}</pre>
    </q-expansion-item>
  </div>
</template>

<script setup lang="ts">
// ---- Imports ----
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { formatDate, formatSource, sourceTone } from 'src/utils/format';
import type { NormalizedLlmExplanation } from 'src/types/analytics';

// ---- Props ----
const props = defineProps<{
  explanation: NormalizedLlmExplanation;
}>();

const { t } = useI18n();

// ---- Computed ----
const norm = computed(() => props.explanation);

const rawJson = computed(() => JSON.stringify(norm.value.raw, null, 2));

const formatTriggeredRule = (rule: Record<string, unknown>): string => {
  const name = typeof rule.name === 'string' ? rule.name : typeof rule.rule === 'string' ? rule.rule : typeof rule.code === 'string' ? rule.code : '';
  const severity = typeof rule.severity === 'string' ? ` — ${rule.severity}` : typeof rule.level === 'string' ? ` — ${rule.level}` : '';
  return `${name}${severity}`;
};

const modelScoreItems = computed(() => {
  const mse = norm.value.modelScoreExplanation;
  if (!mse) return [];
  return Object.entries(mse)
    .filter((entry): entry is [string, string | Record<string, unknown>] => entry[1] != null && (typeof entry[1] === 'string' || typeof entry[1] === 'object'))
    .map(([key, value]) => ({
      key,
      label: key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1'),
      description: typeof value === 'string' ? value : JSON.stringify(value, null, 1),
    }));
});

const evidenceBullets = computed(() => norm.value.keyEvidenceBullets ?? norm.value.evidenceBullets ?? []);
</script>

// ---- Styles ----
<style scoped>
.llm-explanation-panel {
  padding: 8px 0;
}

.llm-explanation-header {
  margin-bottom: 4px;
}

.llm-explanation-badges {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.llm-warning-banner {
  background: rgba(251, 191, 36, 0.12);
  color: var(--neo-warning-contrast, #f5c542);
  border: 1px solid rgba(251, 191, 36, 0.28);
  border-radius: 8px;
}

.llm-info-banner {
  background: rgba(33, 150, 243, 0.10);
  color: var(--neo-info-contrast, #64b5f6);
  border: 1px solid rgba(33, 150, 243, 0.25);
  border-radius: 8px;
}

.llm-section-title {
  display: flex;
  align-items: center;
  font-size: 15px;
  font-weight: 600;
  margin: 0 0 8px;
  line-height: 1.4;
}

.llm-paragraph {
  margin: 0;
  line-height: 1.7;
  font-size: 14px;
  color: var(--neo-ink, #e0e0e0);
}

.llm-section-caution {
  background: rgba(255, 152, 0, 0.06);
  border-left: 3px solid rgba(255, 152, 0, 0.4);
  padding: 12px 16px;
  border-radius: 8px;
}

.llm-section-muted {
  color: var(--neo-ink-muted, #999);
}

.llm-model-scores {
  display: grid;
  gap: 8px;
}

.llm-score-row {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 8px 12px;
  background: var(--neo-card-bg-tint, rgba(255,255,255,0.03));
  border-radius: 6px;
  border: 1px solid var(--neo-border-color, rgba(255,255,255,0.08));
}

.llm-score-name {
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--neo-ink-muted, #999);
}

.llm-score-value {
  color: var(--neo-ink, #e0e0e0);
}

.llm-rule-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.llm-bullet-list .q-item,
.llm-action-list .q-item {
  min-height: 28px;
  padding: 4px 0;
}

.llm-bullet-text {
  font-size: 13px;
  line-height: 1.6;
}

.llm-disclaimer {
  color: var(--neo-ink-muted, #777);
  font-style: italic;
  line-height: 1.5;
}

.llm-raw-toggle {
  font-size: 12px;
  color: var(--neo-ink-muted, #777);
}

.llm-raw-json {
  margin: 0;
  padding: 12px;
  background: #101820;
  color: #e8f1f5;
  font-size: 11px;
  line-height: 1.5;
  border-radius: 6px;
  overflow-x: auto;
  max-height: 400px;
  white-space: pre-wrap;
  word-break: break-all;
}
</style>
