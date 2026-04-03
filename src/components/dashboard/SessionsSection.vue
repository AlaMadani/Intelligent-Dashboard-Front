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
      <template #body-cell-meanDeltaSeconds="props">
        <q-td :props="props">
          {{ formatDurationSeconds(props.row.meanDeltaSeconds) }}
        </q-td>
      </template>
      <template #body-cell-aeScore="props">
        <q-td :props="props">
          <span class="neo-score">{{ formatScore(props.row.aeScore) }}</span>
        </q-td>
      </template>
      <template #body-cell-typeConfidence="props">
        <q-td :props="props">
          {{ formatPercent(props.row.typeConfidence, 1) }}
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
  { name: 'uniqueActionCount', label: 'Unique', field: 'uniqueActionCount', align: 'left' },
  { name: 'meanDeltaSeconds', label: 'Mean Δ', field: 'meanDeltaSeconds', align: 'left' },
  {
    name: 'sessionLength',
    label: 'Actions',
    field: 'sessionLength',
    align: 'left',
    sortable: true,
  },
  { name: 'aeScore', label: 'AE Score', field: 'aeScore', align: 'left', sortable: true },
  { name: 'typeConfidence', label: 'Type confidence', field: 'typeConfidence', align: 'left' },
  { name: 'anomalyType', label: 'Type', field: 'anomalyType', align: 'left' },
];
</script>
