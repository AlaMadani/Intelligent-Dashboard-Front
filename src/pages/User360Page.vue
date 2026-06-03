<template>
  <q-page class="neo-page">
    <section class="neo-section">
      <div class="neo-section-header">
        <div>
          <div class="neo-kicker">{{ t('v36.common.schema') }}</div>
          <h1 class="neo-section-title">{{ t('v36.user360.title') }}</h1>
          <p class="neo-section-subtitle">{{ t('v36.user360.subtitle') }}</p>
        </div>
        <div class="neo-section-actions">
          <div v-if="source" class="neo-analytics-chip">{{ t('v36.common.source') }}: {{ source }}</div>
          <q-btn unelevated color="primary" icon="refresh" :loading="loading" :label="t('v36.common.refresh')" @click="refresh" />
        </div>
      </div>

      <div class="neo-panel neo-v36-lookup">
        <q-input
          v-model="lookupId"
          dense
          outlined
          clearable
          :label="t('v36.common.insuredId')"
          @keyup.enter="openUser"
        />
        <q-btn unelevated color="secondary" icon="manage_search" :label="t('v36.user360.loadUser')" @click="openUser" />
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

    <section v-if="!data" class="neo-section neo-analytics-empty">
      {{ loading ? t('v36.common.loading') : t('v36.user360.enterPrompt') }}
    </section>

    <template v-else>
      <section class="neo-section neo-v36-kpis">
        <article v-for="metric in metrics" :key="metric.label" class="neo-kpi-card">
          <div class="neo-kpi-label">{{ metric.label }}</div>
          <div class="neo-kpi-value">{{ metric.value }}</div>
          <div class="neo-kpi-meta">{{ metric.meta }}</div>
          <div class="neo-kpi-accent" aria-hidden="true"></div>
        </article>
      </section>

      <section class="neo-section neo-v36-grid">
        <article class="neo-analytics-panel">
          <div class="neo-analytics-head">
            <div>
              <h3>{{ t('v36.common.personaDisabled') }}</h3>
              <p>{{ data.persona?.source ?? 'disabled_v3_6_refactor' }}</p>
            </div>
            <q-badge color="grey" rounded>{{ data.persona?.label ?? 'persona_disabled' }}</q-badge>
          </div>
          <div class="neo-analytics-empty">{{ t('v36.user360.personaNotice') }}</div>
        </article>

        <article class="neo-analytics-panel">
          <div class="neo-analytics-head">
            <div>
              <h3>{{ t('v36.user360.baseline') }}</h3>
              <p>{{ t('v36.user360.baselineSubtitle') }}</p>
            </div>
          </div>
          <div class="neo-v36-fact-grid">
            <div class="neo-v36-fact">
              <span>{{ t('v36.user360.usualCountry') }}</span>
              <strong>{{ data.baseline?.usualCountry ?? t('common.notAvailable') }}</strong>
            </div>
            <div class="neo-v36-fact">
              <span>{{ t('v36.user360.usualActiveHours') }}</span>
              <strong>{{ safeArray(data.baseline?.usualActiveHours).join(', ') || t('common.notAvailable') }}</strong>
            </div>
            <div class="neo-v36-fact">
              <span>{{ t('v36.user360.topApiFamilies') }}</span>
              <strong>{{ topApiFamilies }}</strong>
            </div>
          </div>
        </article>

        <article class="neo-analytics-panel">
          <div class="neo-analytics-head">
            <div>
              <h3>{{ t('v36.user360.recentSessions') }}</h3>
              <p>{{ t('v36.user360.recentSessionsSubtitle') }}</p>
            </div>
          </div>
          <div class="neo-v36-list">
            <div v-if="!recentSessions.length" class="neo-analytics-empty">{{ t('v36.common.noData') }}</div>
            <div v-for="session in recentSessions" :key="session.key" class="neo-v36-list-row">
              <span>{{ session.title }}</span>
              <strong>{{ session.meta }}</strong>
            </div>
          </div>
        </article>

        <article class="neo-analytics-panel">
          <div class="neo-analytics-head">
            <div>
              <h3>{{ t('v36.user360.riskTimeline') }}</h3>
              <p>{{ t('v36.user360.riskTimelineSubtitle') }}</p>
            </div>
          </div>
          <div class="neo-v36-list">
            <div v-if="!riskTimeline.length" class="neo-analytics-empty">{{ t('v36.common.noData') }}</div>
            <div v-for="point in riskTimeline" :key="point.key" class="neo-v36-list-row">
              <span>{{ point.title }}</span>
              <strong>{{ point.meta }}</strong>
            </div>
          </div>
        </article>

        <article class="neo-analytics-panel neo-v36-wide">
          <div class="neo-analytics-head">
            <div>
              <h3>{{ t('v36.user360.userAlerts') }}</h3>
              <p>{{ t('v36.user360.userAlertsSubtitle') }}</p>
            </div>
          </div>
          <div class="neo-table-wrapper">
            <table class="neo-table">
              <thead>
                <tr>
                  <th>{{ t('v36.common.riskLevel') }}</th>
                  <th>{{ t('v36.common.finalRiskScore') }}</th>
                  <th>{{ t('v36.common.timestamp') }}</th>
                  <th>{{ t('v36.common.anomalyType') }}</th>
                  <th>{{ t('v36.common.eventAction') }}</th>
                  <th>{{ t('v36.common.action') }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="!alertItems.length">
                  <td colspan="6">{{ t('v36.common.noData') }}</td>
                </tr>
                <tr v-for="alert in alertItems" :key="alert.eventId ?? alert.recordId">
                  <td><q-badge :color="riskTone(alert.riskLevel)" rounded>{{ alert.riskLevel }}</q-badge></td>
                  <td>{{ formatNullableScore(alert.finalRiskScore) }}</td>
                  <td>{{ formatDate(alert.timestamp) }}</td>
                  <td>{{ alert.anomalyType ?? t('common.unknown') }}</td>
                  <td>{{ alert.eventAction ?? t('common.notAvailable') }}</td>
                  <td>
                    <q-btn
                      dense
                      unelevated
                      color="primary"
                      icon="manage_search"
                      :disable="!alert.eventId"
                      :label="t('v36.common.investigate')"
                      @click="openAlert(alert.eventId)"
                    />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </article>
      </section>
    </template>
  </q-page>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useUser360 } from 'src/composables/v36/useUser360';
import { ROUTE_NAMES } from 'src/router/route-names';
import {
  formatDate,
  formatNullableScore,
  formatNumber,
  formatPercent,
  riskTone,
  safeArray,
  safeRecord,
} from 'src/utils/format';

const route = useRoute();
const router = useRouter();
const { t } = useI18n();

const textValue = (value: unknown, fallback = '') => {
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  return fallback;
};

const lookupId = ref(String(route.params.insuredId ?? ''));
const insuredId = computed(() => lookupId.value.trim());
const { data, alertItems, loading, error, refresh, source, warnings } = useUser360(insuredId);

watch(
  () => route.params.insuredId,
  (value) => {
    lookupId.value = String(value ?? '');
  },
);

const metrics = computed(() => [
  {
    label: t('v36.churn.churnProbability'),
    value: formatPercent(data.value?.churn?.probability, 1),
    meta: data.value?.churn?.riskLevel ?? t('common.unknown'),
  },
  {
    label: t('v36.user360.averageRiskLast30d'),
    value: formatNullableScore(data.value?.risk?.averageRiskScoreLast30d),
    meta: t('v36.common.last30d'),
  },
  {
    label: t('v36.user360.alertCountLast30d'),
    value: formatNumber(data.value?.risk?.alertCountLast30d),
    meta: t('v36.common.last30d'),
  },
  {
    label: t('v36.user360.criticalAlertCountLast30d'),
    value: formatNumber(data.value?.risk?.criticalAlertCountLast30d),
    meta: t('v36.common.last30d'),
  },
]);

const topApiFamilies = computed(() => {
  const families = data.value?.baseline?.topApiFamilies ?? [];
  if (!families.length) return t('common.notAvailable');
  return families
    .map((item) => {
      if (typeof item === 'string') return item;
      const record = safeRecord(item);
      return textValue(record.apiFamily ?? record.name);
    })
    .filter(Boolean)
    .join(', ');
});

const recentSessions = computed(() =>
  (data.value?.recentSessions ?? []).slice(0, 8).map((session, index) => {
    const record = safeRecord(session);
    const sessionId = textValue(record.sessionId ?? record.id, `session-${index + 1}`);
    const timestamp = textValue(record.startTime ?? record.sessionStart ?? record.timestamp);
    return {
      key: sessionId,
      title: sessionId,
      meta: timestamp ? formatDate(timestamp) : t('common.notAvailable'),
    };
  }),
);

const riskTimeline = computed(() =>
  (data.value?.riskTimeline ?? []).slice(0, 8).map((point, index) => {
    const record = safeRecord(point);
    const label = textValue(record.date ?? record.timestamp, `T${index + 1}`);
    const score =
      typeof record.riskScore === 'number'
        ? record.riskScore
        : typeof record.averageRiskScore === 'number'
          ? record.averageRiskScore
          : undefined;
    return {
      key: `${label}-${index}`,
      title: label,
      meta: formatNullableScore(score),
    };
  }),
);

const openUser = async () => {
  if (!lookupId.value.trim()) return;
  await router.push({
    name: ROUTE_NAMES.USER_360_DETAIL,
    params: { insuredId: lookupId.value.trim() },
  });
  void refresh();
};

const openAlert = async (eventId: string | undefined) => {
  if (!eventId) return;
  await router.push({ name: ROUTE_NAMES.ALERT_INVESTIGATION, params: { eventId } });
};
</script>

<style scoped>
.neo-v36-lookup {
  display: grid;
  gap: var(--neo-space-3);
  grid-template-columns: minmax(240px, 1fr) auto;
  align-items: end;
  margin-top: var(--neo-space-5);
}

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

.neo-v36-fact-grid,
.neo-v36-list {
  display: grid;
  gap: var(--neo-space-3);
}

.neo-v36-fact-grid {
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
}

.neo-v36-fact,
.neo-v36-list-row {
  padding: var(--neo-space-3);
  border: var(--neo-border);
  border-radius: var(--neo-radius-card);
  background: rgba(255, 255, 255, 0.66);
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
  margin-top: 7px;
}

.neo-v36-warning {
  margin-top: var(--neo-space-4);
  border: 1px solid rgba(167, 101, 24, 0.2);
  border-radius: var(--neo-radius-card);
  background: var(--neo-warning-bg);
  color: var(--neo-warning-contrast);
}

@media (max-width: 900px) {
  .neo-v36-grid > .neo-analytics-panel {
    grid-column: 1 / -1;
  }

  .neo-v36-lookup {
    grid-template-columns: 1fr;
  }
}
</style>
