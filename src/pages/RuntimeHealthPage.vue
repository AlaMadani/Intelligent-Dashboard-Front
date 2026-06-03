<template>
  <q-page class="neo-page">
    <section class="neo-section">
      <div class="neo-section-header">
        <div>
          <div class="neo-kicker">{{ t('v36.common.schema') }}</div>
          <h1 class="neo-section-title">{{ t('v36.runtime.title') }}</h1>
          <p class="neo-section-subtitle">{{ t('v36.runtime.subtitle') }}</p>
        </div>
        <div class="neo-section-actions">
          <div v-if="source" class="neo-analytics-chip">{{ t('v36.common.source') }}: {{ source }}</div>
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

    <section class="neo-section neo-v36-kpis">
      <article class="neo-kpi-card">
        <div class="neo-kpi-label">{{ t('v36.runtime.overallStatus') }}</div>
        <div class="neo-kpi-value">{{ runtimeHealth?.status ?? t('common.unknown') }}</div>
        <div class="neo-kpi-meta">{{ runtimeHealth?.runtimeVersion ?? 'v3.6.1' }}</div>
        <div class="neo-kpi-accent" aria-hidden="true"></div>
      </article>
      <article class="neo-kpi-card">
        <div class="neo-kpi-label">{{ t('v36.common.personaDisabled') }}</div>
        <div class="neo-kpi-value">{{ runtimeHealth?.personaEnabled ? t('common.yes') : t('common.no') }}</div>
        <div class="neo-kpi-meta">{{ t('v36.runtime.personaDisabledMeta') }}</div>
        <div class="neo-kpi-accent" aria-hidden="true"></div>
      </article>
      <article class="neo-kpi-card">
        <div class="neo-kpi-label">{{ t('v36.llm.evidencePayload') }}</div>
        <div class="neo-kpi-value">{{ runtimeHealth?.llmEvidencePayloadEnabled ? t('common.yes') : t('common.no') }}</div>
        <div class="neo-kpi-meta">{{ t('v36.runtime.evidenceMeta') }}</div>
        <div class="neo-kpi-accent" aria-hidden="true"></div>
      </article>
      <article class="neo-kpi-card">
        <div class="neo-kpi-label">{{ t('v36.runtime.artifactBasePath') }}</div>
        <div class="neo-kpi-value neo-mono">{{ runtimeHealth?.artifactBasePath ?? t('common.notAvailable') }}</div>
        <div class="neo-kpi-meta">{{ t('v36.runtime.artifactMeta') }}</div>
        <div class="neo-kpi-accent" aria-hidden="true"></div>
      </article>
      <article class="neo-kpi-card">
        <div class="neo-kpi-label">{{ t('v36.runtime.llmInDataprocessor') }}</div>
        <div class="neo-kpi-value">{{ runtimeHealth?.llmExplanationInDataprocessor ? t('common.yes') : t('common.no') }}</div>
        <div class="neo-kpi-meta">{{ t('v36.runtime.llmInDataprocessorMeta') }}</div>
        <div class="neo-kpi-accent" aria-hidden="true"></div>
      </article>
      <article class="neo-kpi-card">
        <div class="neo-kpi-label">{{ t('v36.runtime.fallbackMode') }}</div>
        <div class="neo-kpi-value">{{ runtimeHealth?.fallbackMode ?? t('common.notAvailable') }}</div>
        <div class="neo-kpi-meta">{{ t('v36.runtime.fallbackModeMeta') }}</div>
        <div class="neo-kpi-accent" aria-hidden="true"></div>
      </article>
    </section>

    <section class="neo-section neo-v36-grid">
      <article class="neo-analytics-panel neo-v36-wide">
        <div class="neo-analytics-head">
          <div>
            <h3>{{ t('v36.runtime.modelHealth') }}</h3>
            <p>{{ t('v36.runtime.modelHealthSubtitle') }}</p>
          </div>
        </div>
        <div class="neo-v36-model-grid">
          <div v-for="model in modelRows" :key="model.name" class="neo-v36-model-card">
            <div class="neo-v36-model-head">
              <strong>{{ model.label }}</strong>
              <q-badge :color="model.tone" rounded>{{ model.status }}</q-badge>
            </div>
            <div class="neo-v36-fact-grid">
              <div v-for="field in model.fields" :key="field.label" class="neo-v36-fact">
                <span>{{ field.label }}</span>
                <strong>{{ field.value }}</strong>
              </div>
            </div>
          </div>
        </div>
      </article>

      <article class="neo-analytics-panel">
        <div class="neo-analytics-head">
          <div>
            <h3>{{ t('v36.runtime.diagnostics') }}</h3>
            <p>{{ diagnostics?.fallbackMode ?? t('common.unknown') }}</p>
          </div>
        </div>
        <div class="neo-v36-list">
          <div class="neo-v36-list-row">
            <span>{{ t('v36.runtime.fieldCoverage') }}</span>
            <strong>{{ objectCount(diagnostics?.fieldCoverage) }}</strong>
          </div>
          <div class="neo-v36-list-row">
            <span>{{ t('v36.runtime.modelLatency') }}</span>
            <strong>{{ objectCount(diagnostics?.modelLatency) }}</strong>
          </div>
          <div class="neo-v36-list-row">
            <span>{{ t('v36.runtime.fallbackMode') }}</span>
            <strong>{{ diagnostics?.fallbackMode ?? t('common.notAvailable') }}</strong>
          </div>
        </div>
      </article>

      <article class="neo-analytics-panel">
        <div class="neo-analytics-head">
          <div>
            <h3>{{ t('v36.runtime.finalWinners') }}</h3>
            <p>{{ t('v36.runtime.finalWinnersSubtitle') }}</p>
          </div>
        </div>
        <div class="neo-v36-list">
          <div v-for="winner in winnerRows" :key="winner.key" class="neo-v36-list-row">
            <span>{{ winner.key }}</span>
            <strong>{{ winner.value }}</strong>
          </div>
        </div>
      </article>

      <article class="neo-analytics-panel neo-v36-wide">
        <div class="neo-analytics-head">
          <div>
            <h3>{{ t('v36.runtime.reports') }}</h3>
            <p>{{ t('v36.runtime.reportsSubtitle') }}</p>
          </div>
        </div>
        <div class="neo-table-wrapper">
          <table class="neo-table">
            <thead>
              <tr>
                <th>{{ t('v36.runtime.reportName') }}</th>
                <th>{{ t('v36.runtime.available') }}</th>
                <th>{{ t('v36.common.timestamp') }}</th>
                <th>{{ t('v36.runtime.path') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="!reportRows.length">
                <td colspan="4">{{ t('v36.common.noData') }}</td>
              </tr>
              <tr v-for="report in reportRows" :key="report.name">
                <td>{{ report.name }}</td>
                <td>{{ report.available ? t('common.yes') : t('common.no') }}</td>
                <td>{{ report.generatedAt ?? t('common.notAvailable') }}</td>
                <td class="neo-mono">{{ report.resource ?? report.path ?? t('common.notAvailable') }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </article>
    </section>
  </q-page>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRuntimeHealth } from 'src/composables/v36/useRuntimeHealth';
import type { V36FinalWinnerItem, V36ModelRuntimeState } from 'src/types/analytics';
import { formatDate, safeRecord } from 'src/utils/format';

const { t } = useI18n();
const {
  runtimeHealth,
  diagnostics,
  finalWinners,
  reports,
  loading,
  error,
  refresh,
  source,
  warnings,
} = useRuntimeHealth();

const knownModels = [
  'transformerOnnx',
  'tcn',
  'xgboost',
  'lightgbm',
  'oneClassSvm',
  'extraTreesChurn',
  'ridgeForecast',
  'xgboostForecast',
];

const yesNo = (value: boolean | undefined) => (value ? t('common.yes') : t('common.no'));

const modelStatus = (state: V36ModelRuntimeState | undefined) => {
  if (!state) return { label: t('common.unknown'), tone: 'grey' };
  if (state.lastInferenceSucceeded) return { label: t('v36.runtime.ok'), tone: 'positive' };
  if (state.unavailableReason || state.lastInferenceError) {
    return { label: t('v36.runtime.degraded'), tone: 'warning' };
  }
  return { label: t('common.unknown'), tone: 'grey' };
};

const modelRows = computed(() =>
  knownModels.map((name) => {
    const state = runtimeHealth.value?.modelHealth?.[name];
    const status = modelStatus(state);
    return {
      name,
      label: name,
      status: status.label,
      tone: status.tone,
      fields: [
        { label: t('v36.runtime.artifactExists'), value: yesNo(state?.artifactExists) },
        { label: t('v36.runtime.artifactParsed'), value: yesNo(state?.artifactParsed) },
        { label: t('v36.runtime.runtimeInitialized'), value: yesNo(state?.runtimeInitialized) },
        {
          label: t('v36.runtime.inferenceEnabled'),
          value: yesNo(state?.inferenceEnabledByConfig),
        },
        {
          label: t('v36.runtime.lastInferenceSucceeded'),
          value: yesNo(state?.lastInferenceSucceeded),
        },
        {
          label: t('v36.runtime.lastInferenceTimestamp'),
          value: state?.lastInferenceTimestamp ? formatDate(state.lastInferenceTimestamp) : t('common.notAvailable'),
        },
        {
          label: t('v36.runtime.unavailableReason'),
          value: state?.unavailableReason ?? state?.lastInferenceError ?? t('common.none'),
        },
      ],
    };
  }),
);

const objectCount = (value: unknown) => Object.keys(safeRecord(value)).length;

const winnerRows = computed(() => {
  const winners = finalWinners.value?.payload;
  if (Array.isArray(winners)) {
    return winners.map((winner: V36FinalWinnerItem, index) => ({
      key: winner.useCase ?? `winner-${index + 1}`,
      value: winner.winner ?? winner.model ?? t('common.notAvailable'),
    }));
  }
  return Object.entries(safeRecord(winners)).map(([key, value]) => ({
    key,
    value: typeof value === 'string' ? value : JSON.stringify(value),
  }));
});

const reportRows = computed(() => reports.value?.items ?? reports.value?.reports ?? []);
</script>

<style scoped>
.neo-v36-kpis,
.neo-v36-grid {
  display: grid;
  gap: var(--neo-space-4);
}

.neo-v36-kpis {
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
}

.neo-v36-grid {
  grid-template-columns: repeat(12, minmax(0, 1fr));
}

.neo-v36-grid > .neo-analytics-panel {
  grid-column: span 6;
}

.neo-v36-grid > .neo-v36-wide {
  grid-column: 1 / -1;
}

.neo-v36-model-grid {
  display: grid;
  gap: var(--neo-space-4);
  grid-template-columns: repeat(auto-fit, minmax(290px, 1fr));
}

.neo-v36-model-card,
.neo-v36-fact,
.neo-v36-list-row {
  padding: var(--neo-space-3);
  border: var(--neo-border);
  border-radius: var(--neo-radius-card);
  background: rgba(255, 255, 255, 0.66);
}

.neo-v36-model-head {
  display: flex;
  justify-content: space-between;
  gap: var(--neo-space-3);
  margin-bottom: var(--neo-space-3);
}

.neo-v36-fact-grid {
  display: grid;
  gap: 8px;
  grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
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
  margin-top: 6px;
  overflow-wrap: anywhere;
}

.neo-v36-list {
  display: grid;
  gap: var(--neo-space-3);
}

.neo-v36-warning {
  margin-top: var(--neo-space-4);
  border: 1px solid rgba(167, 101, 24, 0.2);
  border-radius: var(--neo-radius-card);
  background: var(--neo-warning-bg);
  color: var(--neo-warning-contrast);
}

@media (max-width: 1000px) {
  .neo-v36-grid > .neo-analytics-panel {
    grid-column: 1 / -1;
  }
}
</style>
