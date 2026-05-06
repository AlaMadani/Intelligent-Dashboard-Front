<template>
  <section id="sessions" class="neo-section neo-alerts">
    <div class="neo-section-header">
      <div>
        <div class="neo-section-title">{{ t('sessionsSection.title') }}</div>
        <div class="neo-section-subtitle">{{ t('sessionsSection.subtitle') }}</div>
      </div>
      <div class="neo-section-actions">
        <q-input
          dense
          outlined
          v-model="searchModel"
          :placeholder="t('sessionsSection.searchPlaceholder')"
          class="neo-search"
        >
          <template #append>
            <q-icon name="search" />
          </template>
        </q-input>
      </div>
    </div>

    <div class="neo-table-wrapper">
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
        <template #body-cell-status="props">
          <q-td :props="props">
            <q-badge
              :color="props.row.isAnomaly === true ? 'negative' : props.row.isAnomaly === false ? 'positive' : 'grey'"
              text-color="white"
              class="neo-badge"
            >
              {{ props.row.isAnomaly === true ? 'A' : props.row.isAnomaly === false ? 'N' : '?' }}
            </q-badge>
          </q-td>
        </template>
        <template #body-cell-startTime="props">
          <q-td :props="props">
            <span class="neo-cell-nowrap">{{ formatDate(props.row.startTime) }}</span>
          </q-td>
        </template>
        <template #body-cell-sessionDurationSeconds="props">
          <q-td :props="props">
            {{ formatDurationSeconds(props.row.sessionDurationSeconds) }}
          </q-td>
        </template>
        <template #body-cell-koRate="props">
          <q-td :props="props">
            {{ formatPercent(props.row.koRate, 0) }}
          </q-td>
        </template>
        <template #body-cell-isoScore="props">
          <q-td :props="props">
            <span class="neo-score">{{ formatScore(props.row.isoScore) }}</span>
          </q-td>
        </template>
        <template #body-cell-risk="props">
          <q-td :props="props">
            <div class="neo-risk-compact">
              <div
                class="neo-risk-bar"
                :style="{ width: `${safeRiskScore(sessionRiskScore(props.row))}%`, background: riskTone(sessionRiskScore(props.row)) }"
              />
            </div>
          </q-td>
        </template>
        <template #body-cell-typeConfidence="props">
          <q-td :props="props">
            {{ formatPercent(props.row.typeConfidence, 0) }}
          </q-td>
        </template>
        <template #body-cell-tags="props">
          <q-td :props="props">
            <div class="neo-tags-row">
              <q-chip
                v-for="tag in liveContextTags(props.row).slice(0, 2)"
                :key="tag"
                dense
                size="11px"
                color="orange-8"
                text-color="white"
              >
                {{ tag }}
              </q-chip>
              <span v-if="liveContextTags(props.row).length > 2" class="neo-tags-more">
                +{{ liveContextTags(props.row).length - 2 }}
              </span>
            </div>
          </q-td>
        </template>
      </q-table>
    </div>

    <q-banner v-if="error" class="neo-banner" dense>
      {{ error }}
    </q-banner>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
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

const { t } = useI18n();

const searchModel = computed({
  get: () => props.search,
  set: (value: string) => emit('update:search', value),
});

const columns: QTableColumn<SessionAnalysisDto>[] = [
  { name: 'status', label: '', field: 'isAnomaly', align: 'center' },
  { name: 'insuredId', label: t('sessionsSection.columns.insured'), field: 'insuredId', align: 'left', sortable: true },
  { name: 'sessionId', label: t('sessionsSection.columns.session'), field: 'sessionId', align: 'left' },
  { name: 'startTime', label: t('sessionsSection.columns.start'), field: 'startTime', align: 'left', sortable: true },
  { name: 'sessionDurationSeconds', label: t('sessionsSection.columns.duration'), field: 'sessionDurationSeconds', align: 'right' },
  { name: 'totalEvents', label: t('sessionsSection.columns.events'), field: 'totalEvents', align: 'right', sortable: true },
  { name: 'uniqueActions', label: t('sessionsSection.columns.unique'), field: 'uniqueActions', align: 'right' },
  { name: 'koRate', label: t('sessionsSection.columns.ko'), field: 'koRate', align: 'right' },
  { name: 'isoScore', label: t('sessionsSection.columns.score'), field: 'isoScore', align: 'right', sortable: true },
  { name: 'risk', label: t('sessionsSection.columns.risk'), field: 'ensembleRiskScore', align: 'left' },
  { name: 'typeConfidence', label: t('sessionsSection.columns.confidence'), field: 'typeConfidence', align: 'right' },
  { name: 'anomalyType', label: t('sessionsSection.columns.type'), field: 'anomalyType', align: 'left' },
  { name: 'tags', label: t('sessionsSection.columns.tags'), field: 'sessionId', align: 'left' },
];

const safeRiskScore = (value: number | null | undefined) => {
  if (value == null || Number.isNaN(value)) return 0;
  return Math.max(0, Math.min(100, Math.round(value)));
};

const riskTone = (value: number | null | undefined) => {
  const score = safeRiskScore(value);
  if (score >= 80) return '#dc2626';
  if (score >= 41) return '#f59e0b';
  return '#22c55e';
};

const sessionRiskScore = (session: SessionAnalysisDto) =>
  session.ensembleRiskScore ?? session.riskScoreAvg ?? session.riskScoreMax ?? null;

const liveContextTags = (session: SessionAnalysisDto) => {
  if (session.contextTags?.length) return session.contextTags.slice(0, 4);
  const tags: string[] = [];
  if (session.ipChanged) tags.push(t('sessionsSection.tags.ipChanged'));
  if ((session.koRate ?? 0) >= 0.3) tags.push(t('sessionsSection.tags.highKo'));
  if (session.anomalyType?.toLowerCase().includes('geo') || session.ruleType?.toLowerCase().includes('geo')) {
    tags.push(t('sessionsSection.tags.geoJump'));
  }
  return tags;
};
</script>

<style scoped>
.neo-table-wrapper {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  border-radius: 14px;
}
.neo-table {
  width: 100%;
}
:deep(.q-table) {
  min-width: 900px;
}
:deep(.q-table th),
:deep(.q-table td) {
  white-space: nowrap;
  padding: 6px 8px;
  font-size: 12px;
}
:deep(.q-table thead th) {
  font-weight: 700;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--neo-ink-muted);
}
.neo-risk-compact {
  width: 64px;
  height: 6px;
  background: rgba(16, 32, 43, 0.08);
  border-radius: 3px;
  overflow: hidden;
}
.neo-risk-bar {
  height: 100%;
  border-radius: 3px;
  transition: width 0.3s ease;
}
.neo-tags-row {
  display: flex;
  gap: 3px;
  align-items: center;
}
.neo-tags-more {
  font-size: 10px;
  color: var(--neo-ink-muted);
}
.neo-cell-nowrap {
  white-space: nowrap;
}
.neo-badge {
  font-size: 10px;
  min-width: 22px;
  padding: 1px 5px;
}
</style>
