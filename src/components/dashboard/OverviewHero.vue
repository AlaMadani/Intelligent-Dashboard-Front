<template>
  <section id="overview" class="neo-section neo-hero">
    <div class="neo-hero-content">
      <div class="neo-hero-copy">
        <div class="neo-kicker">Security Operations Center</div>
        <h1 class="neo-hero-title">Signal, context, and response in one cockpit.</h1>
        <p class="neo-hero-subtitle">
          Unified anomaly monitoring, live audit trails, and explainable AI for rapid decisions.
          Built to evolve into full behavioral analytics across your monitored systems.
        </p>
        <div class="neo-hero-actions">
          <q-btn
            color="primary"
            unelevated
            label="Review live alerts"
            icon="bolt"
            @click="emit('navigate', 'alerts')"
          />
          <q-btn
            outline
            color="primary"
            label="Open investigations"
            icon="manage_search"
            @click="emit('navigate', 'investigation')"
          />
        </div>
      </div>
      <div class="neo-hero-panel">
        <div class="neo-panel-header">
          <div class="neo-panel-title">Live posture</div>
          <q-chip dense color="positive" text-color="white" icon="sensors">Streaming</q-chip>
        </div>
        <div class="neo-panel-body">
          <div class="neo-panel-metric">
            <div class="neo-panel-value">{{ totalAlerts }}</div>
            <div class="neo-panel-label">Total alerts</div>
          </div>
          <div class="neo-panel-metric">
            <div class="neo-panel-value">{{ highRiskCount }}</div>
            <div class="neo-panel-label">High risk</div>
          </div>
          <div class="neo-panel-metric">
            <div class="neo-panel-value">{{ uniqueUsers }}</div>
            <div class="neo-panel-label">Impacted users</div>
          </div>
          <div class="neo-panel-metric">
            <div class="neo-panel-value">{{ avgScore }}</div>
            <div class="neo-panel-label">Avg anomaly</div>
          </div>
        </div>
        <div class="neo-panel-footer">
          <div class="neo-panel-note">Redis investigation window stays live for fast triage.</div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
defineProps<{
  totalAlerts: number;
  highRiskCount: number;
  uniqueUsers: number;
  avgScore: string;
}>();

const emit = defineEmits<{
  (event: 'navigate', target: string): void;
}>();
</script>
