<template>
  <section id="analytics" class="neo-section neo-analytics">
    <div class="neo-section-header">
      <div>
        <div class="neo-section-title">Behavior analytics preview</div>
        <div class="neo-section-subtitle">
          Focused insights for triage, prioritization, and detection tuning.
        </div>
      </div>
    </div>

    <div class="neo-analytics-grid">
      <div class="neo-analytics-card">
        <div class="neo-analytics-title">Severity mix</div>
        <div class="neo-analytics-list">
          <div v-for="item in severityMix" :key="item.label" class="neo-analytics-row">
            <span>{{ item.label }}</span>
            <span class="neo-analytics-value">{{ item.count }} ({{ item.percent }}%)</span>
          </div>
          <div v-if="!alerts.length" class="neo-analytics-empty">No alerts loaded yet.</div>
        </div>
        <div class="neo-analytics-meta">Use this to rebalance triage and response playbooks.</div>
      </div>

      <div class="neo-analytics-card">
        <div class="neo-analytics-title">Top alert types</div>
        <div class="neo-analytics-list">
          <div v-for="item in topAlertTypes" :key="item.label" class="neo-analytics-row">
            <span>{{ item.label }}</span>
            <span class="neo-analytics-value">{{ item.count }}</span>
          </div>
          <div v-if="!topAlertTypes.length" class="neo-analytics-empty">No alert types yet.</div>
        </div>
        <div class="neo-analytics-meta">Prioritize tuning and playbooks for these patterns.</div>
      </div>

      <div class="neo-analytics-card">
        <div class="neo-analytics-title">Risky users</div>
        <div class="neo-analytics-list">
          <div v-for="item in riskyUsers" :key="item.label" class="neo-analytics-row">
            <span>{{ item.label }}</span>
            <span class="neo-analytics-value">Avg {{ item.score }}</span>
          </div>
          <div v-if="!riskyUsers.length" class="neo-analytics-empty">No user keys detected.</div>
        </div>
        <div class="neo-analytics-meta">Focus investigations on repeated high anomaly behavior.</div>
      </div>

      <div class="neo-analytics-card">
        <div class="neo-analytics-title">IP hotspots</div>
        <div class="neo-analytics-list">
          <div v-for="item in ipHotspots" :key="item.label" class="neo-analytics-row">
            <span>{{ item.label }}</span>
            <span class="neo-analytics-value">{{ item.count }}</span>
          </div>
          <div v-if="!ipHotspots.length" class="neo-analytics-empty">No IP activity yet.</div>
        </div>
        <div class="neo-analytics-meta">Escalate repeat IPs with multiple alerts.</div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { SecurityAlert } from 'src/types/soc';
import { formatScore, severityLabel, type Severity } from 'src/utils/alerts';

const props = defineProps<{
  alerts: SecurityAlert[];
}>();

// Aggregate counts for analytics cards.
const totalAlerts = computed(() => props.alerts.length);

// Severity distribution for quick triage health checks.
const severityMix = computed(() => {
  const buckets: Record<Severity, number> = { High: 0, Medium: 0, Low: 0 };
  for (const alert of props.alerts) {
    buckets[severityLabel(alert)] += 1;
  }
  return (['High', 'Medium', 'Low'] as const).map((label) => {
    const count = buckets[label];
    const percent = totalAlerts.value ? Math.round((count / totalAlerts.value) * 100) : 0;
    return { label, count, percent };
  });
});

// Highest-frequency alert types.
const topAlertTypes = computed(() => {
  const counts = new Map<string, number>();
  for (const alert of props.alerts) {
    const label = alert.alertType || 'Unknown';
    counts.set(label, (counts.get(label) ?? 0) + 1);
  }
  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([label, count]) => ({ label, count }));
});

// Users with the highest average anomaly score.
const riskyUsers = computed(() => {
  const scores = new Map<number, { total: number; count: number }>();
  for (const alert of props.alerts) {
    if (alert.userKey == null || alert.anomalyScore == null) continue;
    const entry = scores.get(alert.userKey) ?? { total: 0, count: 0 };
    entry.total += alert.anomalyScore;
    entry.count += 1;
    scores.set(alert.userKey, entry);
  }
  return Array.from(scores.entries())
    .map(([userKey, entry]) => ({
      label: `User ${userKey}`,
      score: formatScore(entry.total / entry.count),
      count: entry.count,
    }))
    .sort((a, b) => Number(b.score) - Number(a.score))
    .slice(0, 4);
});

// IPs appearing most frequently in alerts.
const ipHotspots = computed(() => {
  const counts = new Map<string, number>();
  for (const alert of props.alerts) {
    if (!alert.ipAddress) continue;
    counts.set(alert.ipAddress, (counts.get(alert.ipAddress) ?? 0) + 1);
  }
  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([label, count]) => ({ label, count }));
});
</script>

<style scoped>
.neo-analytics-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.neo-analytics-row {
  display: flex;
  justify-content: space-between;
  font-size: 14px;
}

.neo-analytics-value {
  font-weight: 600;
}

.neo-analytics-empty {
  font-size: 13px;
  color: var(--neo-ink-muted);
}
</style>
