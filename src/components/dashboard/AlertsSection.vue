<template>
  <section id="alerts" class="neo-section neo-alerts">
    <div class="neo-section-header">
      <div>
        <div class="neo-section-title">Security alerts</div>
        <div class="neo-section-subtitle">
          Real-time anomalies scored by ML with AI explanations on demand.
        </div>
      </div>
      <div class="neo-section-actions">
        <q-input dense outlined v-model="searchModel" placeholder="Search alerts" class="neo-search">
          <template #append>
            <q-icon name="search" />
          </template>
        </q-input>
        <div class="neo-live-pill" :class="{ 'is-loading': loading }">
          <span class="neo-live-dot"></span>
          Live
        </div>
      </div>
    </div>

    <q-table
      flat
      class="neo-table"
      :rows="alerts"
      :columns="alertColumns"
      row-key="id"
      :loading="loading"
      :filter="searchModel"
      :rows-per-page-options="[8, 12, 20]"
      :row-class="alertRowClass"
      @row-click="onRowClick"
    >
      <template #body-cell-severity="props">
        <q-td :props="props">
          <q-badge :color="severityColor(props.row)" text-color="white" class="neo-badge">
            {{ severityLabel(props.row) }}
          </q-badge>
        </q-td>
      </template>
      <template #body-cell-anomalyScore="props">
        <q-td :props="props">
          <div class="neo-score">
            <span>{{ formatScore(props.row.anomalyScore) }}</span>
            <span class="neo-score-threshold">/ {{ formatScore(props.row.thresholdUsed) }}</span>
          </div>
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
import type { SecurityAlert } from 'src/types/soc';
import { formatDate, formatScore, severityColor, severityLabel } from 'src/utils/alerts';

const props = defineProps<{
  alerts: SecurityAlert[];
  loading: boolean;
  error: string;
  search: string;
  selectedAlertId: number | null;
}>();

const emit = defineEmits<{
  (event: 'update:search', value: string): void;
  (event: 'select', row: SecurityAlert): void;
}>();

const searchModel = computed({
  get: () => props.search,
  set: (value: string) => emit('update:search', value),
});

const alertRowClass = (row: SecurityAlert) =>
  props.selectedAlertId === row.id ? 'neo-row-active' : '';

const onRowClick = (_evt: Event, row: SecurityAlert) => {
  emit('select', row);
};

const alertColumns: QTableColumn<SecurityAlert>[] = [
  {
    name: 'severity',
    label: 'Severity',
    field: (row: SecurityAlert) => severityLabel(row),
    align: 'left',
    sortable: true,
  },
  {
    name: 'id',
    label: 'Alert ID',
    field: 'id',
    align: 'left',
    sortable: true,
  },
  {
    name: 'alertType',
    label: 'Type',
    field: 'alertType',
    align: 'left',
    sortable: true,
  },
  {
    name: 'userKey',
    label: 'User',
    field: 'userKey',
    align: 'left',
    sortable: true,
  },
  {
    name: 'ipAddress',
    label: 'IP address',
    field: 'ipAddress',
    align: 'left',
  },
  {
    name: 'anomalyScore',
    label: 'Score / Threshold',
    field: 'anomalyScore',
    align: 'left',
    sortable: true,
  },
  {
    name: 'detectedAt',
    label: 'Detected at',
    field: 'detectedAt',
    align: 'left',
    sortable: true,
  },
];
</script>
