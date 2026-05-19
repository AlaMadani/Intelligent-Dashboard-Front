<template>
  <section id="workbench" class="neo-section">
    <div class="neo-section-header">
      <div>
        <div class="neo-section-title">{{ t('anomalyWorkbenchSection.title') }}</div>
        <div class="neo-section-subtitle">{{ t('anomalyWorkbenchSection.subtitle') }}</div>
      </div>
    </div>

    <div class="neo-workbench-layout">
      <!-- LEFT PANE: Live Alerts -->
      <AlertsList
        class="neo-workbench-left"
        :stream-alerts="streamAlerts"
        :stream-connected="streamConnected"
        :stream-error="streamError"
        :selected-event-key="selectedEventKey"
        @select-alert="emit('select-alert', $event)"
      />

      <!-- RIGHT PANE: Detail View -->
      <div class="neo-workbench-right">
        <!-- TABS: Summary, KPIs, Visualization, Data, Explanation -->
        <q-tabs
          v-model="activePrimaryTab"
          dense
          class="neo-workbench-tabs"
          indicator-color="primary"
          active-color="primary"
          align="left"
        >
          <q-tab name="detail" label="Details" icon="info" />
          <q-tab name="explanation" label="AI Explanation" icon="psychology" />
        </q-tabs>

        <q-tab-panels v-model="activePrimaryTab" class="neo-workbench-panels">
          <!-- Detail Tab -->
          <q-tab-panel name="detail" class="neo-workbench-tab-panel">
            <DetailPanel
              :selected-event="selectedEvent"
              :session-analysis="sessionAnalysis"
              :session-analysis-loading="sessionAnalysisLoading"
              :risk-profile="riskProfile"
              :next-actions="nextActions"
              :active-anomaly="activeAnomaly"
              :live-session-insight="liveSessionInsight ?? undefined"
            />
          </q-tab-panel>

          <!-- Explanation Tab -->
          <q-tab-panel name="explanation" class="neo-workbench-tab-panel">
            <ExplanationPanel
              :selected-event="selectedEvent"
              :explanation="explanation"
              :explanation-loading="explanationLoading"
              :explanation-error="explanationError"
              @generate-explanation="emit('generate-explanation')"
            />
          </q-tab-panel>
        </q-tab-panels>
      </div>
    </div>
  </section>
</template>
<script setup lang="ts">
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import AlertsList from './workbench/AlertsList.vue';
import DetailPanel from './workbench/DetailPanel.vue';
import ExplanationPanel from './workbench/ExplanationPanel.vue';
import type {
  AnomalyAlertDto,
  AnomalyEventDto,
  AnomalyExplanationDto,
  NextActionPredictionDto,
  SessionAnalysisDto,
  UserRiskProfileDto,
} from 'src/types/analytics';

defineProps<{
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
const activePrimaryTab = ref('detail');
</script>

<style scoped>
.neo-workbench-layout {
  display: grid;
  grid-template-columns: 340px 1fr;
  gap: var(--neo-space-5);
  height: calc(100vh - 240px);
  max-height: 100%;
}

.neo-workbench-left {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow-y: auto;
}

.neo-workbench-right {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow-y: auto;
}

.neo-workbench-tabs {
  flex-shrink: 0;
  margin-bottom: 0 !important;
  border-bottom: 1px solid var(--neo-border-color);
}

.neo-workbench-panels {
  flex: 1;
  overflow-y: auto;
  padding: 0 !important;
}

.neo-workbench-tab-panel {
  padding: 16px 0 !important;
  height: 100%;
  overflow-y: auto;
}

@media (max-width: 1200px) {
  .neo-workbench-layout {
    grid-template-columns: 300px 1fr;
  }
}

@media (max-width: 960px) {
  .neo-workbench-layout {
    grid-template-columns: 1fr;
    gap: var(--neo-space-4);
    height: auto;
    max-height: none;
  }

  .neo-workbench-left,
  .neo-workbench-right {
    height: auto;
  }
}
</style>



