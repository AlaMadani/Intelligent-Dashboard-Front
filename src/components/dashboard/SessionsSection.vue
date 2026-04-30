<template>
  <!-- Session table: browse the analyzed behavior traces returned by the backend. -->
  <section id="sessions" class="neo-section neo-alerts">
    <div class="neo-section-header">
      <div>
        <div class="neo-section-title">Session analysis</div>
        <div class="neo-section-subtitle">
          ML-enriched session summaries with behavioral statistics.
        </div>
      </div>
      <div class="neo-section-actions">
        <q-input
          dense
          outlined
          v-model="searchModel"
          placeholder="Search sessions"
          class="neo-search"
        >
          <template #append>
            <q-icon name="search" />
          </template>
        </q-input>
      </div>
    </div>

    <!-- The table focuses on behavioral metrics that help compare normal and anomalous sessions. -->
    <q-table
      flat
      class="neo-table"
      :rows="sessions"
      :columns="columns"
      row-key="id"
      :loading="loading"
      :filter="searchModel"
      :rows-per-page-options="[8, 12, 20]"
    >
      <template #body-cell-isAnomaly="props">
        <q-td :props="props">
          <q-badge
            v-if="props.row.isAnomaly === true"
            color="negative"
            text-color="white"
            class="neo-badge"
          >
            Anomaly
          </q-badge>
          <q-badge
            v-else-if="props.row.isAnomaly === false"
            color="positive"
            text-color="white"
            class="neo-badge"
          >
            Normal
          </q-badge>
          <q-badge v-else color="grey" text-color="white" class="neo-badge"> Unknown </q-badge>
        </q-td>
      </template>
      <template #body-cell-startTime="props">
        <q-td :props="props">
          {{ formatDate(props.row.startTime) }}
        </q-td>
      </template>
      <template #body-cell-sessionDurationSeconds="props">
        <q-td :props="props">
          {{ formatDurationSeconds(props.row.sessionDurationSeconds) }}
        </q-td>
      </template>
      <template #body-cell-koRate="props">
        <q-td :props="props">
          {{ formatPercent(props.row.koRate, 1) }}
        </q-td>
      </template>
      <template #body-cell-avgInterActionSeconds="props">
        <q-td :props="props">
          {{ formatDurationSeconds(props.row.avgInterActionSeconds) }}
        </q-td>
      </template>
      <template #body-cell-isoScore="props">
        <q-td :props="props">
          <span class="neo-score">{{ formatScore(props.row.isoScore) }}</span>
        </q-td>
      </template>
      <template #body-cell-typeConfidence="props">
        <q-td :props="props">
          {{ formatPercent(props.row.typeConfidence, 1) }}
        </q-td>
      </template>
      <template #body-cell-ensembleRiskScore="props">
        <q-td :props="props">
          <div class="neo-risk-cell">
            <q-knob
              :model-value="safeRiskScore(sessionRiskScore(props.row))"
              size="42px"
              :thickness="0.24"
              :color="riskTone(sessionRiskScore(props.row))"
              track-color="grey-8"
              readonly
              show-value
              font-size="11px"
              class="neo-risk-knob"
              :class="{ 'neo-risk-knob--critical': safeRiskScore(sessionRiskScore(props.row)) >= 80 }"
            />
          </div>
        </q-td>
      </template>
      <template #body-cell-liveContextTags="props">
        <q-td :props="props">
          <div class="neo-tags-row">
            <q-chip
              v-for="tag in liveContextTags(props.row)"
              :key="tag"
              dense
              size="12px"
              color="orange-8"
              text-color="white"
            >
              {{ tag }}
            </q-chip>
          </div>
        </q-td>
      </template>
    </q-table>

    <!-- Keep backend errors visible without removing the current table contents. -->
    <q-banner v-if="error" class="neo-banner" dense>
      {{ error }}
    </q-banner>
  </section>
</template>

<script setup lang="ts">
// This component presents session analysis data and emits only search updates.
import { computed } from 'vue';
import type { QTableColumn } from 'quasar';
import type { SessionAnalysisDto } from 'src/types/analytics';
import { formatDate, formatDurationSeconds, formatScore, formatPercent } from 'src/utils/format';

const props = defineProps<{
  sessions: SessionAnalysisDto[];
  loading: boolean;
  error: string;
  search: string;
}>();

const emit = defineEmits<{
  (event: 'update:search', value: string): void;
}>();

// Bridge the local search field to the parent-managed query string.
const searchModel = computed({
  get: () => props.search,
  set: (value: string) => emit('update:search', value),
});

// Column metadata defines which session metrics are displayed and sortable.
const columns: QTableColumn<SessionAnalysisDto>[] = [
  { name: 'isAnomaly', label: 'Status', field: 'isAnomaly', align: 'left', sortable: true },
  { name: 'insuredId', label: 'Insured', field: 'insuredId', align: 'left', sortable: true },
  { name: 'sessionId', label: 'Session', field: 'sessionId', align: 'left' },
  { name: 'startTime', label: 'Start', field: 'startTime', align: 'left', sortable: true },
  {
    name: 'sessionDurationSeconds',
    label: 'Duration',
    field: 'sessionDurationSeconds',
    align: 'left',
  },
  { name: 'koRate', label: 'KO rate', field: 'koRate', align: 'left' },
  { name: 'uniqueActions', label: 'Unique', field: 'uniqueActions', align: 'left' },
  {
    name: 'avgInterActionSeconds',
    label: 'Mean delta',
    field: 'avgInterActionSeconds',
    align: 'left',
  },
  {
    name: 'totalEvents',
    label: 'Events',
    field: 'totalEvents',
    align: 'left',
    sortable: true,
  },
  { name: 'isoScore', label: 'Tabular score', field: 'isoScore', align: 'left', sortable: true },
  { name: 'ensembleRiskScore', label: 'Risk', field: 'ensembleRiskScore', align: 'left' },
  { name: 'liveContextTags', label: 'Context tags', field: 'sessionId', align: 'left' },
  { name: 'typeConfidence', label: 'Type confidence', field: 'typeConfidence', align: 'left' },
  { name: 'anomalyType', label: 'Type', field: 'anomalyType', align: 'left' },
];

const safeRiskScore = (value: number | null | undefined) => {
  if (value == null || Number.isNaN(value)) return 0;
  return Math.max(0, Math.min(100, Math.round(value)));
};

const riskTone = (value: number | null | undefined) => {
  const score = safeRiskScore(value);
  if (score >= 80) return 'negative';
  if (score >= 41) return 'warning';
  return 'positive';
};

const sessionRiskScore = (session: SessionAnalysisDto) =>
  session.ensembleRiskScore ?? session.riskScoreAvg ?? session.riskScoreMax ?? null;

const liveContextTags = (session: SessionAnalysisDto) => {
  if (session.contextTags?.length) {
    return session.contextTags.slice(0, 3);
  }

  const tags: string[] = [];
  if (session.ipChanged) tags.push('IP Changed');
  if ((session.koRate ?? 0) >= 0.3) tags.push('High Error Rate');
  if (
    session.pathDeviation ||
    session.anomalyType?.toLowerCase().includes('geo') ||
    session.ruleType?.toLowerCase().includes('geo')
  ) {
    tags.push('Geo-Jump');
  }
  return tags;
};
</script>

<style scoped>
.neo-risk-cell {
  display: flex;
  align-items: center;
}

.neo-risk-knob--critical {
  animation: neo-risk-pulse 1.6s ease-in-out infinite;
  box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.28);
  border-radius: 999px;
}

.neo-tags-row {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

@keyframes neo-risk-pulse {
  0% {
    box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.26);
  }
  70% {
    box-shadow: 0 0 0 8px rgba(239, 68, 68, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(239, 68, 68, 0);
  }
}
</style>
