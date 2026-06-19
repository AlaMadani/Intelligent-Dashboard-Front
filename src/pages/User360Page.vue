<template>
  <q-page class="neo-page neo-loading-scope">
    <loading-overlay :show="loading" context="fetch" />
    <section class="neo-section">
      <div class="neo-section-header">
        <div>
          <div class="neo-kicker">{{ t('v36.common.schema') }}</div>
          <h1 class="neo-section-title">{{ t('v36.user360.title') }}</h1>
          <p class="neo-section-subtitle">{{ t('v36.user360.subtitle') }}</p>
        </div>
        <div class="neo-section-actions">
          <div v-if="source" class="neo-analytics-chip">{{ t('v36.common.source') }}: {{ source }}</div>
          <ai-explain-button
            v-if="data?.insuredId"
            context-key="user360-profile"
            variant="prominent"
            :params="{ insuredId: data.insuredId }"
          />
          <LiveConnectionBadge
            :connected="sseConnected"
            :connecting="sseConnecting"
            :last-event-at="sseLastEventAt"
          />
          <q-btn unelevated color="primary" icon="refresh" :disable="loading" :label="t('v36.common.refresh')" @click="() => refresh()">
            <q-tooltip>{{ t('live.manualRefreshTooltip') }}</q-tooltip>
          </q-btn>
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

      <q-banner v-if="sourceBanner" :class="sourceBannerClass">
        <template #avatar><q-icon :name="sourceBannerIcon" /></template>
        {{ sourceBanner }}
      </q-banner>

      <q-banner v-if="warnings.length" class="neo-v36-warning">
        <template #avatar><q-icon name="warning" /></template>
        {{ warnings.join(' | ') }}
      </q-banner>
    </section>

    <section v-if="!data && !loading" class="neo-section neo-analytics-empty">
      {{ t('v36.user360.enterPrompt') }}
    </section>

    <template v-else-if="data">
      <section class="neo-section neo-v36-kpis">
        <article v-for="metric in metrics" :key="metric.label" class="neo-kpi-card">
          <div class="neo-kpi-label">{{ metric.label }} <InfoTooltip v-if="metric.help" :text="metric.help" /></div>
          <div class="neo-kpi-value">{{ metric.value }}</div>
          <div class="neo-kpi-meta">{{ metric.meta }}</div>
          <div class="neo-kpi-accent" aria-hidden="true"></div>
        </article>
      </section>

      <section class="neo-section neo-v36-grid">
        <article class="neo-analytics-panel">
          <div class="neo-analytics-head">
            <div>
              <h3>{{ t('v36.common.personaDisabled') }} <InfoTooltip :text="t('v36.help.user360.persona')" /></h3>
              <p>{{ data.persona?.source ?? 'disabled_v3_6_refactor' }}</p>
            </div>
            <q-badge color="grey" rounded>{{ data.persona?.label ?? 'persona_disabled' }}</q-badge>
          </div>
          <div class="neo-analytics-empty">{{ t('v36.user360.personaNotice') }}</div>
        </article>

        <article class="neo-analytics-panel">
          <div class="neo-analytics-head">
            <div>
              <h3>{{ t('v36.user360.baseline') }} <InfoTooltip :text="t('v36.help.user360.baseline')" /></h3>
              <p>{{ t('v36.user360.baselineSubtitle') }}</p>
            </div>
            
          </div>
          <div class="neo-v36-fact-grid">
            <div class="neo-v36-fact">
              <span>{{ t('v36.user360.usualCountry') }} <InfoTooltip :text="t('v36.help.user360.usualCountry')" /></span>
              <strong>{{ data.baseline?.usualCountry ?? t('common.notAvailable') }}</strong>
            </div>
            <div class="neo-v36-fact">
              <span>{{ t('v36.user360.usualActiveHours') }} <InfoTooltip :text="t('v36.help.user360.usualActiveHours')" /></span>
              <strong>{{ safeArray(data.baseline?.usualActiveHours).join(', ') || t('common.notAvailable') }}</strong>
            </div>
            <div class="neo-v36-fact">
              <span>{{ t('v36.user360.topApiFamilies') }} <InfoTooltip :text="t('v36.help.user360.topApiFamilies')" /></span>
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
              <h3>{{ t('v36.user360.riskTimeline') }} <InfoTooltip :text="t('v36.help.user360.riskTimeline')" /></h3>
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
                    <div class="neo-v36-row-actions">
                      <ai-explain-button
                        v-if="alert.eventId"
                        context-key="alert-row"
                        variant="compact"
                        :event-id="alert.eventId"
                        :params="{
                          eventId: alert.eventId,
                          riskLevel: alert.riskLevel,
                          anomalyType: alert.anomalyType,
                          finalRiskScore: formatNullableScore(alert.finalRiskScore),
                        }"
                      />
                      <q-btn
                        dense
                        unelevated
                        color="primary"
                        icon="manage_search"
                        :disable="!alert.eventId"
                        :label="t('v36.common.investigate')"
                        @click="openAlert(alert.eventId)"
                      />
                    </div>
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
import InfoTooltip from 'src/components/common/InfoTooltip.vue';
import LoadingOverlay from 'src/components/loading/LoadingOverlay.vue';
import AiExplainButton from 'src/components/ai/AiExplainButton.vue';
import LiveConnectionBadge from 'src/components/common/LiveConnectionBadge.vue';
import { useUser360 } from 'src/composables/v36/useUser360';
import { useV36SseState } from 'src/composables/v36/useV36SseRefresh';
import { ROUTE_NAMES } from 'src/router/route-names';
import {
  formatDate,
  formatNullableScore,
  formatNullableNumber,
  formatNumber,
  formatPercent,
  riskLevelFromScore,
  riskTone,
  safeArray,
  safeRecord,
  sourceInfoBanner,
} from 'src/utils/format';

const route = useRoute();
const router = useRouter();
const { t } = useI18n();

const textValue = (value: unknown, fallback = '') => {
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  return fallback;
};

const { connected: sseConnected, connecting: sseConnecting, lastEventAt: sseLastEventAt } = useV36SseState();
const lookupId = ref(String(route.params.insuredId ?? ''));
const insuredId = computed(() => lookupId.value.trim());
const { data, alertItems, loading, error, refresh, source, warnings } = useUser360(insuredId);

const sourceBannerInfo = computed(() => sourceInfoBanner(source.value));
const sourceBanner = computed(() => sourceBannerInfo.value?.message ?? '');
const sourceBannerClass = computed(() => {
  const type = sourceBannerInfo.value?.type;
  if (type === 'warning') return 'neo-v36-warning';
  if (type === 'info') return 'neo-v36-info';
  return '';
});
const sourceBannerIcon = computed(() => {
  const type = sourceBannerInfo.value?.type;
  if (type === 'warning') return 'warning';
  if (type === 'info') return 'info';
  return '';
});

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
    help: t('v36.help.user360.churnProbability'),
  },
  {
    label: t('v36.user360.averageRiskLast30d'),
    value: formatNullableScore(data.value?.risk?.averageRiskScoreLast30d),
    meta: t('v36.common.last30d'),
    help: t('v36.help.user360.averageRiskLast30d'),
  },
  {
    label: t('v36.user360.alertCountLast30d'),
    value: formatNumber(data.value?.risk?.alertCountLast30d),
    meta: t('v36.common.last30d'),
    help: t('v36.help.user360.alertCountLast30d'),
  },
  {
    label: t('v36.user360.criticalAlertCountLast30d'),
    value: formatNumber(data.value?.risk?.criticalAlertCountLast30d),
    meta: t('v36.common.last30d'),
    help: t('v36.help.user360.criticalAlertCountLast30d'),
  },
]);

const topApiFamilies = computed(() => {
  const families = data.value?.baseline?.topApiFamilies ?? [];
  if (!families.length) return t('v36.user360.noApiFamilies');
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
  (data.value?.recentSessions ?? []).slice(0, 8).map((session) => {
    const score = session.finalRiskScore;
    const level = session.riskLevel ?? (score != null ? riskLevelFromScore(score) : null);
    const meta = [level ? `${t('v36.common.riskLevel')}: ${level}` : null, score != null ? `${t('v36.common.finalRiskScore')}: ${formatNullableNumber(score)}` : null]
      .filter(Boolean)
      .join(' | ');
    return {
      key: session.sessionId ?? 'session',
      title: session.sessionId ?? t('common.notAvailable'),
      meta: meta || t('common.notAvailable'),
    };
  }),
);

const riskTimeline = computed(() =>
  (data.value?.riskTimeline ?? []).slice(0, 8).map((point, index) => {
    const ts = point.timestamp;
    const score = point.finalRiskScore;
    const level = point.riskLevel ?? (score != null ? riskLevelFromScore(score) : null);
    const meta = [score != null ? formatNullableNumber(score) : null, level ? `(${level})` : null]
      .filter(Boolean)
      .join(' ');
    return {
      key: `${ts ?? `T${index + 1}`}-${index}`,
      title: ts ? formatDate(ts) : `T${index + 1}`,
      meta: meta || t('common.notAvailable'),
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
  background: var(--neo-card-bg-tint);
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
  border: 1px solid rgba(251, 191, 36, 0.28);
  border-radius: var(--neo-radius-card);
  background: var(--neo-warning-bg);
  color: var(--neo-warning-contrast);
}

.neo-v36-row-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
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
