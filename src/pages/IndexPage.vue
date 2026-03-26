<template>
  <q-page class="neo-page">
    <div v-if="liveNotice" class="neo-live-toast" role="status">
      <div class="neo-live-toast-title">Live alert detected</div>
      <div class="neo-live-toast-body">{{ liveNotice }}</div>
    </div>

    <OverviewHero
      :total-alerts="totalAlerts"
      :high-risk-count="highRiskCount"
      :unique-users="uniqueUsers"
      :avg-score="avgScore"
      @navigate="scrollToSection"
    />

    <KpiStrip
      :total-alerts="totalAlerts"
      :explained-count="explainedCount"
      :threshold-coverage="thresholdCoverage"
      :history-count="historyCount"
    />

    <AlertsSection
      :alerts="alerts"
      :loading="alertsLoading"
      :error="alertsError"
      :search="search"
      :selected-alert-id="selectedAlert?.id ?? null"
      @update:search="(value) => (search = value)"
      @select="onAlertSelect"
    />

    <InvestigationSection
      :selected-alert="selectedAlert"
      :explanation-text="explanationText"
      :explanation-loading="explanationLoading"
      :explanation-error="explanationError"
      :user-key-input="userKeyInput"
      :history="history"
      :history-loading="historyLoading"
      :history-error="historyError"
      :sequence-events="sequenceEvents"
      :sequence-details="sequenceDetails"
      :sequence-loading="sequenceLoading"
      :sequence-error="sequenceError"
      @update:user-key-input="(value) => (userKeyInput = value)"
      @load-history="fetchHistory"
      @generate-explanation="fetchExplanation"
      @load-sequence="fetchSequence"
    />

    <AnalyticsSection :alerts="alerts" />
  </q-page>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { api } from 'boot/axios';
import AlertsSection from 'src/components/dashboard/AlertsSection.vue';
import AnalyticsSection from 'src/components/dashboard/AnalyticsSection.vue';
import InvestigationSection from 'src/components/dashboard/InvestigationSection.vue';
import KpiStrip from 'src/components/dashboard/KpiStrip.vue';
import OverviewHero from 'src/components/dashboard/OverviewHero.vue';
import type { AuditTrailEvent, SecurityAlert, SequenceDetailsDto } from 'src/types/soc';
import { isAboveThreshold, severityLabel } from 'src/utils/alerts';

// Alert stream and table UI state.
const alerts = ref<SecurityAlert[]>([]);
const alertsLoading = ref(false);
const alertsError = ref('');
const search = ref('');

// Selected alert context and AI explanation state.
const selectedAlert = ref<SecurityAlert | null>(null);
const explanationText = ref('');
const explanationLoading = ref(false);
const explanationError = ref('');

// Investigation timeline state.
const userKeyInput = ref<number | null>(null);
const history = ref<AuditTrailEvent[]>([]);
const historyLoading = ref(false);
const historyError = ref('');

// Sequence intelligence state.
const sequenceEvents = ref<AuditTrailEvent[]>([]);
const sequenceDetails = ref<SequenceDetailsDto | null>(null);
const sequenceLoading = ref(false);
const sequenceError = ref('');

// Live notice and polling lifecycle handles.
const liveNotice = ref('');
const seenAlertIds = ref<Set<number>>(new Set());
let liveNoticeTimer: ReturnType<typeof setTimeout> | undefined;
let pollingTimer: ReturnType<typeof setInterval> | undefined;

// KPI rollups for the header and summary cards.
const totalAlerts = computed(() => alerts.value.length);
const highRiskCount = computed(
  () => alerts.value.filter((alert) => severityLabel(alert) === 'High').length
);
const uniqueUsers = computed(() => {
  const keys = new Set(alerts.value.map((alert) => alert.userKey).filter((key) => key != null));
  return keys.size;
});
const avgScore = computed(() => {
  if (!alerts.value.length) return '0.00';
  const sum = alerts.value.reduce((acc, alert) => acc + (alert.anomalyScore ?? 0), 0);
  return (sum / alerts.value.length).toFixed(2);
});
const explainedCount = computed(
  () => alerts.value.filter((alert) => !!alert.aiExplanation).length
);
const thresholdCoverage = computed(() => {
  if (!alerts.value.length) return 0;
  const above = alerts.value.filter((alert) => isAboveThreshold(alert)).length;
  return Math.round((above / alerts.value.length) * 100);
});
const historyCount = computed(() => history.value.length);

// Local smooth-scroll for in-page navigation.
const scrollToSection = (id: string) => {
  const target = document.getElementById(id);
  if (!target) return;
  const header = document.querySelector<HTMLElement>('.neo-header');
  const headerOffset = header?.offsetHeight ?? 0;
  const offsetTop = target.getBoundingClientRect().top + window.scrollY - headerOffset - 12;
  window.scrollTo({ top: Math.max(0, offsetTop), behavior: 'smooth' });
};

// Update selection and kick off dependent data loads.
const onAlertSelect = (row: SecurityAlert) => {
  selectedAlert.value = row;
  explanationText.value = row.aiExplanation || 'AI explanation not cached yet.';
  explanationError.value = '';
  sequenceEvents.value = [];
  sequenceDetails.value = null;
  sequenceError.value = '';
  if (row.userKey != null) {
    userKeyInput.value = row.userKey;
  }
  void fetchSequence();
};

// Toast-like notice for newly arrived alerts.
const showLiveNotice = (count: number) => {
  const suffix = count === 1 ? 'New alert received.' : `${count} new alerts received.`;
  liveNotice.value = `${suffix} Showing the latest first.`;
  if (liveNoticeTimer) {
    clearTimeout(liveNoticeTimer);
  }
  liveNoticeTimer = setTimeout(() => {
    liveNotice.value = '';
  }, 6000);
};

// Sort newest alerts first with stable tie-breaks.
const sortAlerts = (items: SecurityAlert[]) => {
  return [...items].sort((a, b) => {
    const aTime = a.detectedAt ? Date.parse(a.detectedAt) : 0;
    const bTime = b.detectedAt ? Date.parse(b.detectedAt) : 0;
    if (aTime !== bTime) return bTime - aTime;
    return b.id - a.id;
  });
};

// Fetch the main alert stream and detect new arrivals.
const fetchAlerts = async () => {
  alertsLoading.value = true;
  alertsError.value = '';
  try {
    const response = await api.get<SecurityAlert[]>('/alerts');
    const incoming = sortAlerts(response.data ?? []);
    const currentIds = new Set(incoming.map((alert) => alert.id));
    if (seenAlertIds.value.size) {
      const newCount = incoming.filter((alert) => !seenAlertIds.value.has(alert.id)).length;
      if (newCount > 0) {
        showLiveNotice(newCount);
      }
    }
    seenAlertIds.value = currentIds;
    alerts.value = incoming;
  } catch {
    alertsError.value = 'Unable to load alerts. Check the API service and try again.';
  } finally {
    alertsLoading.value = false;
  }
};

// Load the audit trail for the selected user.
const fetchHistory = async () => {
  if (userKeyInput.value == null) {
    historyError.value = 'Provide a user key to load the audit trail.';
    return;
  }
  historyLoading.value = true;
  historyError.value = '';
  try {
    const response = await api.get<AuditTrailEvent[]>(
      `/redis/user/${userKeyInput.value}/history`
    );
    history.value = response.data ?? [];
  } catch {
    historyError.value = 'Unable to load audit history. Check Redis and API connectivity.';
  } finally {
    historyLoading.value = false;
  }
};

// Request the AI explanation for the selected alert.
const fetchExplanation = async () => {
  if (!selectedAlert.value) return;
  explanationLoading.value = true;
  explanationError.value = '';
  try {
    const response = await api.get<string>(`/alerts/${selectedAlert.value.id}/explain`);
    explanationText.value = response.data;
  } catch {
    explanationError.value = 'AI explanation failed. Verify the XAI service connection.';
  } finally {
    explanationLoading.value = false;
  }
};

// Pull sequence events and prediction metadata in parallel.
const fetchSequence = async () => {
  if (!selectedAlert.value) return;
  sequenceLoading.value = true;
  sequenceError.value = '';
  try {
    const [eventsResponse, detailsResponse] = await Promise.all([
      api.get<AuditTrailEvent[]>(`/alerts/${selectedAlert.value.id}/sequence`),
      api.get<SequenceDetailsDto>(`/alerts/${selectedAlert.value.id}/sequence-details`),
    ]);
    sequenceEvents.value = eventsResponse.data ?? [];
    sequenceDetails.value = detailsResponse.data ?? null;
  } catch {
    sequenceError.value = 'Unable to load sequence intelligence for this alert.';
    sequenceEvents.value = [];
    sequenceDetails.value = null;
  } finally {
    sequenceLoading.value = false;
  }
};

// Start polling on mount and clean up timers on unmount.
onMounted(() => {
  void fetchAlerts();
  pollingTimer = setInterval(() => {
    void fetchAlerts();
  }, 5000);
});

onBeforeUnmount(() => {
  if (pollingTimer) clearInterval(pollingTimer);
  if (liveNoticeTimer) clearTimeout(liveNoticeTimer);
});
</script>
