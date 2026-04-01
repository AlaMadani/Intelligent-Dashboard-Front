<template>
  <section id="anomalies" class="neo-section neo-alerts">
    <div class="neo-section-header">
      <div>
        <div class="neo-section-title">Anomaly events</div>
        <div class="neo-section-subtitle">
          Session-close alerts confirmed by the classifier and rule engine.
        </div>
      </div>
      <div class="neo-section-actions">
        <q-input dense outlined v-model="searchModel" placeholder="Search anomalies" class="neo-search">
          <template #append>
            <q-icon name="search" />
          </template>
        </q-input>
        <div class="neo-live-pill" :class="{ 'is-loading': loading }">
          <span class="neo-live-dot"></span>
          Streaming
        </div>
      </div>
    </div>

    <q-table
      flat
      class="neo-table"
      :rows="events"
      :columns="columns"
      row-key="id"
      :loading="loading"
      :filter="searchModel"
      :rows-per-page-options="[8, 12, 20]"
      :row-class="eventRowClass"
      @row-click="onRowClick"
    >
      <template #body-cell-anomalyTier="props">
        <q-td :props="props">
          <q-badge :color="tierColor(props.row.anomalyTier)" text-color="white" class="neo-badge">
            {{ props.row.anomalyTier || 'UNKNOWN' }}
          </q-badge>
        </q-td>
      </template>
      <template #body-cell-anomalyScore="props">
        <q-td :props="props">
          <span class="neo-score">{{ formatScore(props.row.anomalyScore) }}</span>
        </q-td>
      </template>
      <template #body-cell-typeConfidence="props">
        <q-td :props="props">
          {{ formatPercent(props.row.typeConfidence, 1) }}
        </q-td>
      </template>
      <template #body-cell-eventId="props">
        <q-td :props="props">
          {{ props.row.eventId || '—' }}
        </q-td>
      </template>
      <template #body-cell-detectedAt="props">
        <q-td :props="props">
          {{ formatDate(props.row.detectedAt) }}
        </q-td>
      </template>
    </q-table>

    <q-banner v-if="error" class="neo-banner" dense>
      {{ error }}
    </q-banner>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { QTableColumn } from 'quasar';
import type { AnomalyEventDto } from 'src/types/analytics';
import { formatDate, formatScore, formatPercent } from 'src/utils/format';

const props = defineProps<{
  events: AnomalyEventDto[];
  loading: boolean;
  error: string;
  search: string;
  selectedEventKey: string;
}>();

const emit = defineEmits<{
  (event: 'update:search', value: string): void;
  (event: 'select', row: AnomalyEventDto): void;
}>();

const searchModel = computed({
  get: () => props.search,
  set: (value: string) => emit('update:search', value),
});

const tierColor = (tier: string) => {
  if (tier === 'TIER3') return 'negative';
  if (tier === 'TIER2') return 'warning';
  if (tier === 'TIER1') return 'primary';
  return 'grey';
};

const eventKey = (event: AnomalyEventDto) =>
  event.id != null
    ? `id:${event.id}`
    : `${event.insuredId}:${event.sessionId}:${event.eventId}:${event.detectedAt ?? ''}`;

const eventRowClass = (row: AnomalyEventDto) =>
  props.selectedEventKey && eventKey(row) === props.selectedEventKey ? 'neo-row-active' : '';

const onRowClick = (_event: Event, row: AnomalyEventDto) => {
  emit('select', row);
};

const columns: QTableColumn<AnomalyEventDto>[] = [
  { name: 'anomalyTier', label: 'Tier', field: 'anomalyTier', align: 'left', sortable: true },
  { name: 'anomalyType', label: 'Type', field: 'anomalyType', align: 'left', sortable: true },
  { name: 'typeConfidence', label: 'Type confidence', field: 'typeConfidence', align: 'left', sortable: true },
  { name: 'insuredId', label: 'Insured', field: 'insuredId', align: 'left', sortable: true },
  { name: 'sessionId', label: 'Session', field: 'sessionId', align: 'left' },
  { name: 'eventId', label: 'Event', field: 'eventId', align: 'left' },
  { name: 'anomalyScore', label: 'Score', field: 'anomalyScore', align: 'left', sortable: true },
  { name: 'ruleType', label: 'Rule', field: 'ruleType', align: 'left' },
  { name: 'detectedAt', label: 'Detected', field: 'detectedAt', align: 'left', sortable: true },
];
</script>
