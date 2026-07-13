<template>
  <q-page class="neo-page neo-loading-scope">
    <loading-overlay :show="loading" context="fetch" />
    <section class="neo-section">
      <div class="neo-section-header">
        <div>
          <div class="neo-kicker">{{ t('v36.common.schema') }}</div>
          <h1 class="neo-section-title">{{ t('v36.runtime.title') }}</h1>
          <p class="neo-section-subtitle">{{ t('v36.runtime.subtitle') }}</p>
        </div>
        <div class="neo-section-actions">
          <span id="runtime-live-connection-badge" data-assistant-id="runtime-live-connection-badge" data-assistant-type="status-indicator" data-assistant-label="Live Connection Badge" data-assistant-description="Badge showing the SSE live connection status for runtime health." data-assistant-actions="HIGHLIGHT_ELEMENT">
            <LiveConnectionBadge
              :connected="sseConnected"
              :connecting="sseConnecting"
              :last-event-at="sseLastEventAt"
            />
          </span>
          <div v-if="source" id="runtime-source-chip" class="neo-analytics-chip" data-assistant-id="runtime-source-chip" data-assistant-type="badge" data-assistant-label="Data Source Chip" data-assistant-description="Chip showing the data source for the runtime health data." data-assistant-actions="HIGHLIGHT_ELEMENT">{{ t('v36.common.source') }}: {{ source }}</div>
          <ai-explain-button context-key="runtime-health" variant="prominent" />
          <q-btn
            id="runtime-refresh-button"
            data-assistant-id="runtime-refresh-button"
            data-assistant-type="button"
            data-assistant-label="Refresh Runtime Health"
            data-assistant-description="Refreshes the runtime health data."
            data-assistant-actions="HIGHLIGHT_ELEMENT,CLICK_ELEMENT"
            unelevated color="primary" icon="refresh" :disable="loading" :label="t('v36.common.refresh')" @click="() => refresh()"
          >
            <q-tooltip>{{ t('live.manualRefreshTooltip') }}</q-tooltip>
          </q-btn>
        </div>
      </div>

      <q-banner v-if="error" class="neo-banner">
        <template #avatar><q-icon name="error_outline" /></template>
        {{ error }}
      </q-banner>

      <q-banner v-if="sourceBanner" :class="sourceBannerClass">
        <template #avatar><q-icon :name="sourceBannerIcon" /></template>
        {{ sourceBanner }}
      </q-banner>

      <q-banner v-if="dedupedWarnings.length" class="neo-v36-warning">
        <template #avatar><q-icon name="warning" /></template>
        {{ dedupedWarnings.join(' | ') }}
      </q-banner>
    </section>

    <section class="neo-section neo-v36-kpis">
      <article id="card-runtime-summary" data-assistant-id="card-runtime-summary" data-assistant-type="card" data-assistant-label="Overall Status" data-assistant-description="Overall runtime health status and version." data-assistant-actions="HIGHLIGHT_ELEMENT" class="neo-kpi-card">
        <div class="neo-kpi-label">{{ t('v36.runtime.overallStatus') }} <InfoTooltip :text="t('v36.help.runtime.overallStatus')" /></div>
        <div class="neo-kpi-value">{{ runtimeHealth?.status ?? t('common.unknown') }}</div>
        <div class="neo-kpi-meta">{{ runtimeHealth?.runtimeVersion ?? 'v3.6.1' }}</div>
        <div class="neo-kpi-accent" aria-hidden="true"></div>
      </article>
      <article id="runtime-kpi-persona" data-assistant-id="runtime-kpi-persona" data-assistant-type="card" data-assistant-label="Persona Enabled" data-assistant-description="Indicates whether persona is enabled." data-assistant-actions="HIGHLIGHT_ELEMENT" class="neo-kpi-card">
        <div class="neo-kpi-label">{{ t('v36.common.persona') }} <InfoTooltip :text="t('v36.help.runtime.persona')" /></div>
        <div class="neo-kpi-value">{{ runtimeHealth?.personaEnabled ? t('common.yes') : t('common.no') }}</div>
        <div class="neo-kpi-meta">{{ t('v36.runtime.personaDisabledMeta') }}</div>
        <div class="neo-kpi-accent" aria-hidden="true"></div>
      </article>
      <article id="runtime-kpi-evidence-payload" data-assistant-id="runtime-kpi-evidence-payload" data-assistant-type="card" data-assistant-label="Evidence Payload" data-assistant-description="Indicates whether LLM evidence payload is enabled." data-assistant-actions="HIGHLIGHT_ELEMENT" class="neo-kpi-card">
        <div class="neo-kpi-label">{{ t('v36.llm.evidencePayload') }} <InfoTooltip :text="t('v36.help.runtime.evidencePayload')" /></div>
        <div class="neo-kpi-value">{{ runtimeHealth?.llmEvidencePayloadEnabled ? t('common.yes') : t('common.no') }}</div>
        <div class="neo-kpi-meta">{{ t('v36.runtime.evidenceMeta') }}</div>
        <div class="neo-kpi-accent" aria-hidden="true"></div>
      </article>
      <article id="runtime-kpi-artifact-base-path" data-assistant-id="runtime-kpi-artifact-base-path" data-assistant-type="card" data-assistant-label="Artifact Base Path" data-assistant-description="The artifact base path for the runtime." data-assistant-actions="HIGHLIGHT_ELEMENT" class="neo-kpi-card">
        <div class="neo-kpi-label">{{ t('v36.runtime.artifactBasePath') }} <InfoTooltip :text="t('v36.help.runtime.artifactBasePath')" /></div>
        <div class="neo-kpi-value neo-mono">{{ runtimeHealth?.artifactBasePath ?? t('common.notAvailable') }}</div>
        <div class="neo-kpi-meta">{{ t('v36.runtime.artifactMeta') }}</div>
        <div class="neo-kpi-accent" aria-hidden="true"></div>
      </article>
      <article id="runtime-kpi-llm-dataprocessor" data-assistant-id="runtime-kpi-llm-dataprocessor" data-assistant-type="card" data-assistant-label="LLM in Dataprocessor" data-assistant-description="Indicates whether LLM explanation in dataprocessor is enabled." data-assistant-actions="HIGHLIGHT_ELEMENT" class="neo-kpi-card">
        <div class="neo-kpi-label">{{ t('v36.runtime.llmInDataprocessor') }} <InfoTooltip :text="t('v36.help.runtime.llmInDataprocessor')" /></div>
        <div class="neo-kpi-value">{{ runtimeHealth?.llmExplanationInDataprocessor ? t('common.yes') : t('common.no') }}</div>
        <div class="neo-kpi-meta">{{ t('v36.runtime.llmInDataprocessorMeta') }}</div>
        <div class="neo-kpi-accent" aria-hidden="true"></div>
      </article>
      <article id="runtime-kpi-sequence-model" data-assistant-id="runtime-kpi-sequence-model" data-assistant-type="card" data-assistant-label="Sequence Model" data-assistant-description="The selected sequence model mode." data-assistant-actions="HIGHLIGHT_ELEMENT" class="neo-kpi-card">
        <div class="neo-kpi-label">{{ t('v36.runtime.sequenceModel') }} <InfoTooltip :text="t('v36.help.runtime.sequenceModel')" /></div>
        <div class="neo-kpi-value">{{ formatSequenceMode(runtimeHealth?.fallbackMode) }}</div>
        <div class="neo-kpi-meta">{{ t('v36.runtime.selectedSequenceModel') }}</div>
        <div class="neo-kpi-accent" aria-hidden="true"></div>
      </article>
    </section>

    <section class="neo-section neo-v36-grid">
      <article id="card-model-health" data-assistant-id="card-model-health" data-assistant-type="section" data-assistant-label="Model Health" data-assistant-description="Health status for all known models." data-assistant-actions="HIGHLIGHT_ELEMENT" class="neo-analytics-panel neo-v36-wide">
        <div class="neo-analytics-head">
          <div>
            <h3>{{ t('v36.runtime.modelHealth') }}</h3>
            <p>{{ t('v36.runtime.modelHealthSubtitle') }}</p>
          </div>
          <ai-explain-button context-key="runtime-model-health" variant="prominent" />
        </div>
        <div class="neo-v36-model-grid">
          <div v-for="model in modelRows" :key="model.name" class="neo-v36-model-card">
            <div class="neo-v36-model-head">
              <strong>{{ model.label }}</strong>
              <q-badge :color="model.tone" rounded>{{ model.status }}</q-badge>
              <InfoTooltip v-if="model.statusHelp" :text="model.statusHelp" />
            </div>
            <div class="neo-v36-fact-grid">
              <div v-for="field in model.fields" :key="field.label" class="neo-v36-fact">
                <span>{{ field.label }} <InfoTooltip v-if="field.help" :text="field.help" /></span>
                <strong>{{ field.value }}</strong>
              </div>
            </div>
          </div>
        </div>
      </article>

      <article id="runtime-diagnostics-section" class="neo-analytics-panel"
        data-assistant-id="runtime-diagnostics-section"
        data-assistant-type="card"
        data-assistant-label="Diagnostics Section"
        data-assistant-description="Section showing diagnostics including field coverage, sequence coverage, tabular coverage, model latency, and benchmark data."
        data-assistant-actions="HIGHLIGHT_ELEMENT"
      >
        <div class="neo-analytics-head">
          <div>
            <h3>{{ t('v36.runtime.diagnostics') }}</h3>
            <p>{{ t('v36.runtime.diagnosticsSubtitle') }}</p>
          </div>
          
        </div>
        <div v-if="diagnosticsSection" class="neo-v36-list">
          <div v-for="row in diagnosticsSection" :key="row.label" class="neo-v36-list-row">
            <span>{{ row.label }} <InfoTooltip v-if="row.help" :text="row.help" /></span>
            <strong>{{ row.value }}</strong>
          </div>
        </div>
        <div v-else class="neo-analytics-empty">
          {{ t('v36.runtime.notAvailable') }}
        </div>
      </article>

      <article id="card-kafka-health" data-assistant-id="card-kafka-health" data-assistant-type="section" data-assistant-label="Kafka Health" data-assistant-description="Kafka consumer group health and configuration." data-assistant-actions="HIGHLIGHT_ELEMENT" class="neo-analytics-panel">
        <div class="neo-analytics-head">
          <div>
            <h3>{{ t('v36.runtime.kafka.title') }}</h3>
            <p>{{ t('v36.runtime.kafka.subtitle') }}</p>
          </div>
          
        </div>
        <div v-if="kafkaSection" class="neo-v36-list">
          <q-banner v-if="kafkaSection.lastProcessingError" class="neo-v36-warning q-mb-md">
            <template #avatar><q-icon name="warning" /></template>
            {{ t('v36.runtime.kafka.processingErrorBanner') }}
          </q-banner>
          <q-banner v-if="kafkaConcurrencyInfo" :class="kafkaConcurrencyInfo.type === 'warning' ? 'neo-v36-warning q-mb-md' : 'neo-v36-info q-mb-md'">
            <template #avatar><q-icon :name="kafkaConcurrencyInfo.type === 'warning' ? 'warning' : 'info'" /></template>
            {{ kafkaConcurrencyInfo.message }}
          </q-banner>
          <q-banner v-if="kafkaMaxPollWarning" class="neo-v36-warning q-mb-md">
            <template #avatar><q-icon name="warning" /></template>
            {{ kafkaMaxPollWarning }}
          </q-banner>
          <div class="neo-v36-fact-grid">
            <div class="neo-v36-fact">
              <span>{{ t('v36.runtime.kafka.consumerGroup') }} <InfoTooltip :text="t('v36.help.runtime.consumerGroup')" /></span>
              <strong>{{ kafkaSection.consumerGroupId ?? t('common.notAvailable') }}</strong>
            </div>
            <div class="neo-v36-fact">
              <span>{{ t('v36.runtime.kafka.topic') }} <InfoTooltip :text="t('v36.help.runtime.topic')" /></span>
              <strong class="neo-mono">{{ kafkaSection.topic ?? t('common.notAvailable') }}</strong>
            </div>
            <div class="neo-v36-fact">
              <span>{{ t('v36.runtime.kafka.configuredConcurrency') }} <InfoTooltip :text="t('v36.help.runtime.configuredConcurrency')" /></span>
              <strong>{{ formatNumber(kafkaSection.configuredConcurrency) }}</strong>
            </div>
            <div class="neo-v36-fact">
              <span>{{ t('v36.runtime.kafka.assignedPartitions') }} <InfoTooltip :text="t('v36.help.runtime.assignedPartitions')" /></span>
              <strong>{{ formatAssignedPartitions(kafkaSection.assignedPartitions) }}</strong>
            </div>
            <div v-if="kafkaPartitionStatus" class="neo-v36-fact">
              <span>{{ t('v36.runtime.partitionStatus') }} <InfoTooltip :text="t('v36.help.runtime.partitionStatus')" /></span>
              <strong>{{ kafkaPartitionStatus }}</strong>
            </div>
            <div v-if="kafkaEffectiveParallelism != null" class="neo-v36-fact">
              <span>{{ t('v36.runtime.effectiveParallelism') }} <InfoTooltip :text="t('v36.help.runtime.effectiveParallelism')" /></span>
              <strong>{{ formatNumber(kafkaEffectiveParallelism) }}</strong>
            </div>
            <div class="neo-v36-fact">
              <span>{{ t('v36.runtime.kafka.topicPartitionCount') }} <InfoTooltip :text="t('v36.help.runtime.topicPartitionCount')" /></span>
              <strong>{{ formatNumber(kafkaSection.topicPartitionCount) }}</strong>
            </div>
            <div class="neo-v36-fact">
              <span>{{ t('v36.runtime.kafka.autoOffsetReset') }} <InfoTooltip :text="t('v36.help.runtime.autoOffsetReset')" /></span>
              <strong><q-badge :color="autoOffsetResetTone(kafkaSection.autoOffsetReset)" rounded>{{ formatAutoOffsetReset(kafkaSection.autoOffsetReset) }}</q-badge></strong>
            </div>
            <div class="neo-v36-fact">
              <span>{{ t('v36.runtime.kafka.maxPollRecords') }} <InfoTooltip :text="t('v36.help.runtime.maxPollRecords')" /></span>
              <strong>{{ formatNumber(kafkaSection.maxPollRecords) }}</strong>
            </div>
            <div class="neo-v36-fact">
              <span>{{ t('v36.runtime.kafka.maxPollInterval') }} <InfoTooltip :text="t('v36.help.runtime.maxPollInterval')" /></span>
              <strong>{{ formatDurationMs(kafkaSection.maxPollIntervalMs) }}</strong>
            </div>
            <div class="neo-v36-fact">
              <span>{{ t('v36.runtime.kafka.lastConsumedAt') }} <InfoTooltip :text="t('v36.help.runtime.lastConsumedAt')" /></span>
              <strong>{{ formatDate(kafkaSection.lastConsumedAt) }}</strong>
            </div>
            <div class="neo-v36-fact">
              <span>{{ t('v36.runtime.kafka.lastAckAt') }} <InfoTooltip :text="t('v36.help.runtime.lastAckAt')" /></span>
              <strong>{{ formatDate(kafkaSection.lastAckAt) }}</strong>
            </div>
            <div class="neo-v36-fact">
              <span>{{ t('v36.runtime.kafka.recordsProcessedTotal') }} <InfoTooltip :text="t('v36.help.runtime.recordsProcessedTotal')" /></span>
              <strong>{{ formatNumber(kafkaSection.recordsProcessedTotal) }}</strong>
            </div>
            <div class="neo-v36-fact">
              <span>{{ t('v36.runtime.kafka.processingFailures') }} <InfoTooltip :text="t('v36.help.runtime.processingFailures')" /></span>
              <strong>{{ formatNumber(kafkaSection.processingFailuresTotal) }}</strong>
            </div>
            <div v-if="kafkaSection.lastProcessingError" class="neo-v36-fact neo-v36-wide-fact">
              <span>{{ t('v36.runtime.kafka.lastProcessingError') }}</span>
              <strong class="neo-error-text">{{ kafkaSection.lastProcessingError }}</strong>
            </div>
          </div>
        </div>
        <div v-else class="neo-analytics-empty">
          {{ t('v36.runtime.notAvailable') }}
        </div>
      </article>

      <article id="runtime-idempotency-section" class="neo-analytics-panel"
        data-assistant-id="runtime-idempotency-section"
        data-assistant-type="card"
        data-assistant-label="Idempotency Section"
        data-assistant-description="Section showing idempotency metrics including duplicate events, sequence appends, alerts, and SQL writes skipped."
        data-assistant-actions="HIGHLIGHT_ELEMENT"
      >
        <div class="neo-analytics-head">
          <div>
            <h3>{{ t('v36.runtime.idempotency.title') }}</h3>
            <p>{{ t('v36.runtime.idempotency.subtitle') }}</p>
          </div>
        </div>
        <div v-if="idempotencySection" class="neo-v36-list">
          <div class="neo-v36-fact-grid">
            <div class="neo-v36-fact">
              <span>{{ t('v36.runtime.idempotency.duplicateEventsSkipped') }} <InfoTooltip :text="t('v36.help.runtime.duplicateEventsSkipped')" /></span>
              <strong>{{ formatNumber(idempotencySection.duplicateEventsSkipped) }}</strong>
            </div>
            <div class="neo-v36-fact">
              <span>{{ t('v36.runtime.idempotency.duplicateSequenceAppendsSkipped') }} <InfoTooltip :text="t('v36.help.runtime.duplicateSequenceAppendsSkipped')" /></span>
              <strong>{{ formatNumber(idempotencySection.duplicateSequenceAppendsSkipped) }}</strong>
            </div>
            <div class="neo-v36-fact">
              <span>{{ t('v36.runtime.idempotency.duplicateAlertsSkipped') }} <InfoTooltip :text="t('v36.help.runtime.duplicateAlertsSkipped')" /></span>
              <strong>{{ formatNumber(idempotencySection.duplicateAlertsSkipped) }}</strong>
            </div>
            <div class="neo-v36-fact">
              <span>{{ t('v36.runtime.idempotency.duplicateSqlWritesSkipped') }} <InfoTooltip :text="t('v36.help.runtime.duplicateSqlWritesSkipped')" /></span>
              <strong>{{ formatNumber(idempotencySection.duplicateSqlWritesSkipped) }}</strong>
            </div>
          </div>
        </div>
        <div v-else class="neo-analytics-empty">
          {{ t('v36.runtime.notAvailable') }}
        </div>
      </article>

      <article id="runtime-performance-section" class="neo-analytics-panel neo-v36-wide"
        data-assistant-id="runtime-performance-section"
        data-assistant-type="card"
        data-assistant-label="Performance Section"
        data-assistant-description="Section showing performance metrics including event processing, model inference, sequence inference, Redis write, and other latency measurements (Avg/P95)."
        data-assistant-actions="HIGHLIGHT_ELEMENT"
      >
        <div class="neo-analytics-head">
          <div>
            <h3>{{ t('v36.runtime.performance.title') }}</h3>
            <p>{{ t('v36.runtime.performance.subtitle') }}</p>
          </div>
        </div>
        <div v-if="performanceSection" class="neo-v36-list">
          <q-banner v-if="performanceHighLagWarning" class="neo-v36-warning q-mb-md">
            <template #avatar><q-icon name="warning" /></template>
            {{ performanceHighLagWarning }}
          </q-banner>
          <div class="neo-v36-large-fact-grid">
            <div class="neo-v36-fact">
              <span>{{ t('v36.runtime.performance.eventProcessing') }} ({{ t('v36.runtime.performance.avgP95') }}) <InfoTooltip :text="t('v36.help.runtime.eventProcessing')" /></span>
              <strong>{{ formatLatencyMs(performanceSection.eventProcessingMsAvg) }} / {{ formatLatencyMs(performanceSection.eventProcessingMsP95) }}</strong>
            </div>
            <div v-if="performanceSection.redisWriteMsAvg != null || performanceSection.redisWriteMsP95 != null" class="neo-v36-fact">
              <span>{{ t('v36.runtime.performance.redisWrite') }} ({{ t('v36.runtime.performance.avgP95') }}) <InfoTooltip :text="t('v36.help.runtime.performanceRedisWrite')" /></span>
              <strong>{{ formatLatencyMs(performanceSection.redisWriteMsAvg) }} / {{ formatLatencyMs(performanceSection.redisWriteMsP95) }}</strong>
            </div>
            <div v-if="performanceSection.modelInferenceMsAvg != null || performanceSection.modelInferenceMsP95 != null" class="neo-v36-fact">
              <span>{{ t('v36.runtime.performance.modelInference') }} ({{ t('v36.runtime.performance.avgP95') }}) <InfoTooltip :text="t('v36.help.runtime.performanceModelInference')" /></span>
              <strong>{{ formatLatencyMs(performanceSection.modelInferenceMsAvg) }} / {{ formatLatencyMs(performanceSection.modelInferenceMsP95) }}</strong>
            </div>
            <div v-if="performanceSection.sequenceMsAvg != null || performanceSection.sequenceMsP95 != null" class="neo-v36-fact">
              <span>{{ t('v36.runtime.performance.sequenceInference') }} ({{ t('v36.runtime.performance.avgP95') }}) <InfoTooltip :text="t('v36.help.runtime.performanceSequenceInference')" /></span>
              <strong>{{ formatLatencyMs(performanceSection.sequenceMsAvg) }} / {{ formatLatencyMs(performanceSection.sequenceMsP95) }}</strong>
            </div>
            <div v-if="performanceSection.tabularMsAvg != null || performanceSection.tabularMsP95 != null" class="neo-v36-fact">
              <span>{{ t('v36.runtime.performance.tabularInference') }} ({{ t('v36.runtime.performance.avgP95') }}) <InfoTooltip :text="t('v36.help.runtime.performanceTabularInference')" /></span>
              <strong>{{ formatLatencyMs(performanceSection.tabularMsAvg) }} / {{ formatLatencyMs(performanceSection.tabularMsP95) }}</strong>
            </div>
            <div v-if="performanceSection.historyFetchMsAvg != null || performanceSection.historyFetchMsP95 != null" class="neo-v36-fact">
              <span>{{ t('v36.runtime.performance.historyFetch') }} ({{ t('v36.runtime.performance.avgP95') }}) <InfoTooltip :text="t('v36.help.runtime.performanceHistoryFetch')" /></span>
              <strong>{{ formatLatencyMs(performanceSection.historyFetchMsAvg) }} / {{ formatLatencyMs(performanceSection.historyFetchMsP95) }}</strong>
            </div>
            <div v-if="performanceSection.rulesMsAvg != null || performanceSection.rulesMsP95 != null" class="neo-v36-fact">
              <span>{{ t('v36.runtime.performance.rulesEvaluation') }} ({{ t('v36.runtime.performance.avgP95') }}) <InfoTooltip :text="t('v36.help.runtime.performanceRulesEvaluation')" /></span>
              <strong>{{ formatLatencyMs(performanceSection.rulesMsAvg) }} / {{ formatLatencyMs(performanceSection.rulesMsP95) }}</strong>
            </div>
            <div v-if="performanceSection.finalizationMsAvg != null || performanceSection.finalizationMsP95 != null" class="neo-v36-fact">
              <span>{{ t('v36.runtime.performance.finalization') }} ({{ t('v36.runtime.performance.avgP95') }}) <InfoTooltip :text="t('v36.help.runtime.performanceFinalization')" /></span>
              <strong>{{ formatLatencyMs(performanceSection.finalizationMsAvg) }} / {{ formatLatencyMs(performanceSection.finalizationMsP95) }}</strong>
            </div>
            <div v-if="performanceSection.alertPublishMsAvg != null || performanceSection.alertPublishMsP95 != null" class="neo-v36-fact">
              <span>{{ t('v36.runtime.performance.alertPublish') }} ({{ t('v36.runtime.performance.avgP95') }}) <InfoTooltip :text="t('v36.help.runtime.performanceAlertPublish')" /></span>
              <strong>{{ formatLatencyMs(performanceSection.alertPublishMsAvg) }} / {{ formatLatencyMs(performanceSection.alertPublishMsP95) }}</strong>
            </div>
            <div v-if="performanceSection.kafkaEventAgeReceiveMsAvg != null || performanceSection.kafkaEventAgeReceiveMsP95 != null" class="neo-v36-fact">
              <span>{{ t('v36.runtime.performance.kafkaEventAgeAtReceive') }} ({{ t('v36.runtime.performance.avgP95') }}) <InfoTooltip :text="t('v36.help.runtime.performanceKafkaEventAgeAtReceive')" /></span>
              <strong>{{ formatLatencyMs(performanceSection.kafkaEventAgeReceiveMsAvg) }} / {{ formatLatencyMs(performanceSection.kafkaEventAgeReceiveMsP95) }}</strong>
            </div>
            <div v-if="performanceSection.sequenceMode != null" class="neo-v36-fact">
              <span>{{ t('v36.runtime.performance.sequenceMode') }} <InfoTooltip :text="t('v36.help.runtime.sequenceMode')" /></span>
              <strong>{{ formatSequenceMode(performanceSection.sequenceMode) }}</strong>
            </div>
            <div v-if="performanceSection.sqlWriteMsAvg != null || performanceSection.sqlWriteMsP95 != null" class="neo-v36-fact">
              <span>{{ t('v36.runtime.performance.sqlWrite') }} ({{ t('v36.runtime.performance.avgP95') }}) <InfoTooltip :text="t('v36.help.runtime.performanceSqlWrite')" /></span>
              <strong>{{ formatLatencyMs(performanceSection.sqlWriteMsAvg) }} / {{ formatLatencyMs(performanceSection.sqlWriteMsP95) }}</strong>
            </div>
            <div v-if="performanceSection.dashboardRefreshMsAvg != null || performanceSection.dashboardRefreshMsP95 != null" class="neo-v36-fact">
              <span>{{ t('v36.runtime.performance.dashboardRefresh') }} ({{ t('v36.runtime.performance.avgP95') }}) <InfoTooltip :text="t('v36.help.runtime.performanceDashboardRefresh')" /></span>
              <strong>{{ formatLatencyMs(performanceSection.dashboardRefreshMsAvg) }} / {{ formatLatencyMs(performanceSection.dashboardRefreshMsP95) }}</strong>
            </div>
            <div v-if="performanceSection.recordsProcessedPerSecond != null" class="neo-v36-fact">
              <span>{{ t('v36.runtime.performance.recordsProcessedPerSecond') }} <InfoTooltip :text="t('v36.help.runtime.recordsProcessedPerSecond')" /></span>
              <strong>{{ formatThroughput(performanceSection.recordsProcessedPerSecond) }}</strong>
            </div>
            <div v-if="performanceSection.dashboardLastRefreshAt" class="neo-v36-fact">
              <span>{{ t('v36.runtime.performance.dashboardLastRefreshAt') }} <InfoTooltip :text="t('v36.help.runtime.dashboardLastRefreshAt')" /></span>
              <strong>{{ formatDate(performanceSection.dashboardLastRefreshAt) }}</strong>
            </div>
            <div v-if="performanceSection.dashboardRefreshSkippedDueToRateLimit != null" class="neo-v36-fact">
              <span>{{ t('v36.runtime.performance.dashboardRefreshSkipped') }} <InfoTooltip :text="t('v36.help.runtime.dashboardRefreshSkipped')" /></span>
              <strong>{{ formatNumber(performanceSection.dashboardRefreshSkippedDueToRateLimit) }}</strong>
            </div>
            <div v-if="performanceSection.kafkaLagCached != null" class="neo-v36-fact">
              <span>{{ t('v36.runtime.performance.kafkaLagCached') }} <InfoTooltip :text="t('v36.help.runtime.kafkaLagCached')" /></span>
              <strong>{{ formatNumber(performanceSection.kafkaLagCached) }}</strong>
            </div>
            <div v-if="performanceSection.loadSheddingMode != null" class="neo-v36-fact">
              <span>{{ t('v36.runtime.performance.loadSheddingMode') }} <InfoTooltip :text="t('v36.help.runtime.loadSheddingMode')" /></span>
              <strong>{{ formatLoadSheddingMode(performanceSection.loadSheddingMode) }}</strong>
            </div>
            <div v-if="performanceSection.performanceSummaryRunCount != null" class="neo-v36-fact">
              <span>{{ t('v36.runtime.performance.summaryRunCount') }} <InfoTooltip :text="t('v36.help.runtime.performanceSummaryRunCount')" /></span>
              <strong>{{ formatNumber(performanceSection.performanceSummaryRunCount) }}</strong>
            </div>
            <div v-if="performanceSection.performanceSummaryLastRunAt" class="neo-v36-fact">
              <span>{{ t('v36.runtime.performance.summaryLastRunAt') }} <InfoTooltip :text="t('v36.help.runtime.performanceSummaryLastRunAt')" /></span>
              <strong>{{ formatDate(performanceSection.performanceSummaryLastRunAt) }}</strong>
            </div>
            <div v-if="performanceSection.kafka_listener_hot_path_blocked != null" class="neo-v36-fact">
              <span>{{ t('v36.runtime.performance.hotPathBlocked') }} <InfoTooltip :text="t('v36.help.runtime.hotPathBlocked')" /></span>
              <strong>{{ formatBooleanYesNo(performanceSection.kafka_listener_hot_path_blocked) }}</strong>
            </div>
          </div>
          <div v-if="performanceSection.redisWriteMsAvg == null && performanceSection.modelInferenceMsAvg == null && performanceSection.sequenceMsAvg == null && performanceSection.tabularMsAvg == null && performanceSection.historyFetchMsAvg == null && performanceSection.rulesMsAvg == null && performanceSection.finalizationMsAvg == null && performanceSection.alertPublishMsAvg == null && performanceSection.kafkaEventAgeReceiveMsAvg == null && performanceSection.sqlWriteMsAvg == null && performanceSection.dashboardRefreshMsAvg == null" class="neo-v36-info-box">
            {{ t('v36.runtime.detailedStageLatencyUnavailable') }} <InfoTooltip :text="t('v36.help.runtime.detailedStageLatency')" />
          </div>
        </div>
        <div v-else class="neo-analytics-empty">
          {{ t('v36.runtime.notAvailable') }}
        </div>
      </article>

      <article id="runtime-stats-section" class="neo-analytics-panel"
        data-assistant-id="runtime-stats-section"
        data-assistant-type="card"
        data-assistant-label="Stats Section"
        data-assistant-description="Section showing live time basis statistics for the runtime."
        data-assistant-actions="HIGHLIGHT_ELEMENT"
      >
        <div class="neo-analytics-head">
          <div>
            <h3>{{ t('v36.runtime.stats.title') }}</h3>
            <p>{{ t('v36.runtime.stats.subtitle') }}</p>
          </div>
          
        </div>
        <div v-if="statsSection" class="neo-v36-list">
          <div class="neo-v36-fact-grid">
            <div class="neo-v36-fact">
              <span>{{ t('v36.runtime.stats.liveTimeBasis') }} <InfoTooltip :text="t('v36.help.runtime.statsLiveTimeBasis')" /></span>
              <strong>{{ statsSection.liveTimeBasis ?? t('common.notAvailable') }}</strong>
            </div>
          </div>
          <div v-if="statsSection.liveTimeBasis === 'ingestion'" class="neo-v36-info-box">
            {{ t('v36.runtime.stats.ingestionBasis') }}
          </div>
          <div v-else-if="statsSection.liveTimeBasis === 'event'" class="neo-v36-info-box">
            {{ t('v36.runtime.stats.eventBasis') }}
          </div>
        </div>
        <div v-else class="neo-analytics-empty">
          {{ t('v36.runtime.stats.notAvailable') }}
        </div>
      </article>

      <article id="runtime-next-event-prediction-section" class="neo-analytics-panel"
        data-assistant-id="runtime-next-event-prediction-section"
        data-assistant-type="card"
        data-assistant-label="Next Event Prediction Section"
        data-assistant-description="Section showing next event prediction configuration including enabled status, model, top-K, minimum context events, heads, and feature flags."
        data-assistant-actions="HIGHLIGHT_ELEMENT"
      >
        <div class="neo-analytics-head">
          <div>
            <h3>{{ t('v36.runtime.nextEventPrediction.title') }}</h3>
            <p>{{ t('v36.runtime.nextEventPrediction.subtitle') }}</p>
          </div>
        </div>
        <template v-if="nextEventPredictionSection">
          <div v-if="nextEventPredictionSection.enabled === false" class="neo-v36-info-box">
            {{ t('v36.runtime.nextEventPrediction.disabledMessage') }}
          </div>
          <div class="neo-v36-fact-grid">
            <div class="neo-v36-fact">
              <span>{{ t('v36.runtime.nextEventPrediction.enabled') }}</span>
              <q-badge :color="nextEventPredictionSection.enabled ? 'positive' : 'grey'" rounded>
                {{ formatBooleanYesNo(nextEventPredictionSection.enabled) }}
              </q-badge>
            </div>
            <div class="neo-v36-fact">
              <span>{{ t('v36.runtime.nextEventPrediction.model') }}</span>
              <strong>{{ nextEventPredictionSection.model ?? t('common.notAvailable') }}</strong>
            </div>
            <div class="neo-v36-fact">
              <span>{{ t('v36.runtime.nextEventPrediction.topK') }}</span>
              <strong>{{ formatNumber(nextEventPredictionSection.topK) }}</strong>
            </div>
            <div class="neo-v36-fact">
              <span>{{ t('v36.runtime.nextEventPrediction.minimumContextEvents') }}</span>
              <strong>{{ formatNumber(nextEventPredictionSection.minimumContextEvents) }}</strong>
            </div>
            <div class="neo-v36-fact neo-v36-wide-fact">
              <span>{{ t('v36.runtime.nextEventPrediction.heads') }}</span>
              <strong>{{ nextEventPredictionSection.heads?.join(', ') ?? t('common.none') }}</strong>
            </div>
            <div class="neo-v36-fact">
              <span>{{ t('v36.runtime.nextEventPrediction.affectsRiskScore') }}</span>
              <strong>{{ t('common.no') }}</strong>
            </div>
            <div class="neo-v36-fact">
              <span>{{ t('v36.runtime.nextEventPrediction.redisWrite') }}</span>
              <strong>{{ formatBooleanYesNo(nextEventPredictionSection.redisWrite) }}</strong>
            </div>
            <div class="neo-v36-fact">
              <span>{{ t('v36.runtime.nextEventPrediction.sqlWrite') }}</span>
              <strong>{{ formatBooleanYesNo(nextEventPredictionSection.sqlWrite) }}</strong>
            </div>
            <div class="neo-v36-fact">
              <span>{{ t('v36.runtime.nextEventPrediction.deviationEvaluation') }}</span>
              <strong>{{ formatBooleanYesNo(nextEventPredictionSection.deviationEvaluation) }}</strong>
            </div>
          </div>
        </template>
        <template v-else-if="nextActionPredictionSection">
          <div class="neo-v36-info-box q-mb-sm">Deprecated: {{ t('v36.runtime.nextActionPrediction.title') }}</div>
          <div v-if="nextActionPredictionSection.enabled === false" class="neo-v36-info-box">
            {{ t('v36.runtime.nextActionPrediction.disabledMessage') }}
          </div>
          <div class="neo-v36-fact-grid">
            <div class="neo-v36-fact">
              <span>{{ t('v36.runtime.nextActionPrediction.enabled') }}</span>
              <q-badge :color="nextActionPredictionSection.enabled ? 'positive' : 'grey'" rounded>
                {{ formatBooleanYesNo(nextActionPredictionSection.enabled) }}
              </q-badge>
            </div>
            <div class="neo-v36-fact">
              <span>{{ t('v36.runtime.nextActionPrediction.mode') }}</span>
              <strong>{{ nextActionPredictionSection.mode ?? t('common.notAvailable') }}</strong>
            </div>
            <div class="neo-v36-fact">
              <span>{{ t('v36.runtime.nextActionPrediction.lastSkipReason') }}</span>
              <strong>{{ nextActionPredictionSection.lastSkipReason ?? t('common.none') }}</strong>
            </div>
            <div class="neo-v36-fact">
              <span>{{ t('v36.runtime.nextActionPrediction.generatedTotal') }}</span>
              <strong>{{ formatNumber(nextActionPredictionSection.predictionsGeneratedTotal) }}</strong>
            </div>
            <div class="neo-v36-fact">
              <span>{{ t('v36.runtime.nextActionPrediction.skippedTotal') }}</span>
              <strong>{{ formatNumber(nextActionPredictionSection.predictionsSkippedTotal) }}</strong>
            </div>
          </div>
        </template>
        <div v-else class="neo-analytics-empty">
          {{ t('v36.runtime.notAvailable') }}
        </div>
      </article>

      <article id="runtime-session-finalization-section" class="neo-analytics-panel"
        data-assistant-id="runtime-session-finalization-section"
        data-assistant-type="card"
        data-assistant-label="Session Finalization Section"
        data-assistant-description="Section showing session finalization metrics including open sessions, explicit end, timeout, max duration, flush counts, and late events."
        data-assistant-actions="HIGHLIGHT_ELEMENT"
      >
        <div class="neo-analytics-head">
          <div>
            <h3>{{ t('v36.sessionFinalization.title') }}</h3>
            <p>{{ formatDate(sessionFinalization?.expiredSessionFlushLastRunAt) }}</p>
          </div>
          
        </div>
        <div v-if="sessionFinalization" class="neo-v36-list">
          <div class="neo-v36-list-row">
            <span>{{ t('v36.sessionFinalization.openSessions') }} <InfoTooltip :text="t('v36.help.runtime.openSessions')" /></span>
            <strong>{{ formatNumber(sessionFinalization.openSessionCount) }}</strong>
          </div>
          <div class="neo-v36-list-row">
            <span>{{ t('v36.sessionFinalization.finalizedByExplicitEnd') }} <InfoTooltip :text="t('v36.help.runtime.finalizedByExplicitEnd')" /></span>
            <strong>{{ formatNumber(sessionFinalization.sessionsFinalizedByExplicitEnd) }}</strong>
          </div>
          <div class="neo-v36-list-row">
            <span>{{ t('v36.sessionFinalization.finalizedByInactivityTimeout') }} <InfoTooltip :text="t('v36.help.runtime.finalizedByInactivityTimeout')" /></span>
            <strong>{{ formatNumber(sessionFinalization.sessionsFinalizedByInactivityTimeout) }}</strong>
          </div>
          <div class="neo-v36-list-row">
            <span>{{ t('v36.sessionFinalization.finalizedByMaxDuration') }} <InfoTooltip :text="t('v36.help.runtime.finalizedByMaxDuration')" /></span>
            <strong>{{ formatNumber(sessionFinalization.sessionsFinalizedByMaxDuration) }}</strong>
          </div>
          <div class="neo-v36-list-row">
            <span>{{ t('v36.sessionFinalization.lastFlushRun') }} <InfoTooltip :text="t('v36.help.runtime.sessionFinalizationLastFlushRun')" /></span>
            <strong>{{ formatDate(sessionFinalization.expiredSessionFlushLastRunAt) }}</strong>
          </div>
          <div class="neo-v36-list-row">
            <span>{{ t('v36.sessionFinalization.lastFlushFinalizedCount') }} <InfoTooltip :text="t('v36.help.runtime.sessionFinalizationLastFlushFinalizedCount')" /></span>
            <strong>{{ formatNumber(sessionFinalization.expiredSessionFlushLastFinalizedCount) }}</strong>
          </div>
          <div class="neo-v36-list-row">
            <span>{{ t('v36.sessionFinalization.lateEventsForFinalizedSessions') }} <InfoTooltip :text="t('v36.help.runtime.lateEventsForFinalizedSessions')" /></span>
            <strong>{{ formatNumber(sessionFinalization.lateEventsForFinalizedSessions) }}</strong>
          </div>
          <div class="neo-v36-list-row">
            <span>{{ t('v36.sessionFinalization.duplicateFinalizationSkipped') }} <InfoTooltip :text="t('v36.help.runtime.duplicateFinalizationSkipped')" /></span>
            <strong>{{ formatNumber(sessionFinalization.duplicateFinalizationSkipped) }}</strong>
          </div>
        </div>
        <div v-else class="neo-analytics-empty">
          {{ t('v36.sessionFinalization.notAvailable') }}
        </div>
      </article>

      <article id="runtime-final-winners-section" class="neo-analytics-panel"
        data-assistant-id="runtime-final-winners-section"
        data-assistant-type="card"
        data-assistant-label="Final Winners Section"
        data-assistant-description="Section showing the final model winners and recommended approaches for each use case."
        data-assistant-actions="HIGHLIGHT_ELEMENT"
      >
        <div class="neo-analytics-head">
          <div>
            <h3>{{ t('v36.runtime.finalWinners') }} <InfoTooltip :text="t('v36.help.runtime.finalWinners')" /></h3>
            <p>{{ t('v36.runtime.finalWinnersSubtitle') }}</p>
          </div>
        </div>
        <div v-if="finalWinners?.available === false" class="neo-analytics-empty">
          {{ t('v36.runtime.notAvailable') }}
        </div>
        <div v-else-if="!winnerRows.length" class="neo-analytics-empty">
          {{ t('v36.common.noData') }}
        </div>
        <div v-else class="neo-v36-list">
          <div v-for="winner in winnerRows" :key="winner.key" class="neo-v36-list-row">
            <span>{{ winner.title }}</span>
            <strong>{{ winner.detail }}</strong>
          </div>
        </div>
      </article>

      <article id="runtime-reports-section" data-assistant-id="runtime-reports-section" data-assistant-type="table" data-assistant-label="Reports Table" data-assistant-description="Table showing available runtime reports with name, availability status, generation timestamp, and path." data-assistant-actions="HIGHLIGHT_ELEMENT" class="neo-analytics-panel neo-v36-wide">
        <div class="neo-analytics-head">
          <div>
            <h3>{{ t('v36.runtime.reports') }}</h3>
            <p>{{ t('v36.runtime.reportsSubtitle') }}</p>
          </div>
          
        </div>
        <div class="neo-table-wrapper">
          <table id="runtime-reports-table-element" data-assistant-id="runtime-reports-table-element" data-assistant-type="table" data-assistant-label="Runtime Reports Table Data" data-assistant-description="HTML table with runtime report rows." data-assistant-actions="HIGHLIGHT_ELEMENT" class="neo-table">
            <thead>
              <tr>
                <th>{{ t('v36.runtime.reportName') }}</th>
                <th>{{ t('v36.runtime.available') }}</th>
                <th>{{ t('v36.common.timestamp') }}</th>
                <th>{{ t('v36.runtime.path') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="!reportRows.length">
                <td colspan="4">{{ t('v36.common.noData') }}</td>
              </tr>
              <tr v-for="report in reportRows" :key="report.name">
                <td>{{ report.name }}</td>
                <td>{{ report.available ? t('common.yes') : t('common.no') }}</td>
                <td>{{ report.generatedAt ?? t('common.notAvailable') }}</td>
                <td class="neo-mono">{{ report.resource ?? report.path ?? t('common.notAvailable') }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </article>
    </section>
  </q-page>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import InfoTooltip from 'src/components/common/InfoTooltip.vue';
import LoadingOverlay from 'src/components/loading/LoadingOverlay.vue';
import AiExplainButton from 'src/components/ai/AiExplainButton.vue';
import LiveConnectionBadge from 'src/components/common/LiveConnectionBadge.vue';
import { ASSISTANT_REFRESH_RUNTIME_EVENT } from 'src/constants/events';
import { useRuntimeHealth } from 'src/composables/v36/useRuntimeHealth';
import { useV36SseState } from 'src/composables/v36/useV36SseRefresh';
import type {
  V36FinalWinnerItem,
  V36ModelRuntimeState,
} from 'src/types/analytics';
import {
  formatAssignedPartitions,
  formatDate,
  formatDurationMs,
  formatLatencyMs,
  formatBooleanYesNo,
  formatLoadSheddingMode,
  formatAutoOffsetReset,
  formatNumber,
  formatNullableNumber,
  formatSequenceMode,
  formatThroughput,
  formatModelLatencyName,
  formatModelLatencyValue,
  formatUnknownRatio,
  safeRecord,
  autoOffsetResetTone,
  sourceInfoBanner,
} from 'src/utils/format';

const { connected: sseConnected, connecting: sseConnecting, lastEventAt: sseLastEventAt } = useV36SseState();
const { t } = useI18n();
const {
  runtimeHealth,
  diagnostics,
  finalWinners,
  reports,
  loading,
  error,
  refresh,
  source,
  warnings,
} = useRuntimeHealth();

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

const dedupedWarnings = computed(() => [...new Set(warnings.value)]);

const knownModels = [
  'transformerOnnx',
  'tcnOnnx',
  'xgboostAnomalyRanking',
  'lightgbmAlerting',
  'catboostOptionalAnomaly',
  'oneClassSvmNovelty',
  'extraTreesChurn',
  'ridgeAnomalyRateForecast',
  'xgboostTotalEventsForecast',
  'persona',
  'llmCall',
  'llmEvidencePayload',
];

const yesNo = (value: boolean | undefined) => (value ? t('common.yes') : t('common.no'));

const modelStatus = (name: string, state: V36ModelRuntimeState | undefined) => {
  if (!state) return { label: t('common.unknown'), tone: 'grey' };

  if (name === 'persona' && state.unavailableReason?.toLowerCase().includes('intentionally skipped')) {
    return { label: t('v36.runtime.disabledByDesign'), tone: 'info' };
  }

  if (name === 'llmCall' && state.unavailableReason?.toLowerCase().includes('api-service')) {
    return { label: t('v36.runtime.handledByApiService'), tone: 'info' };
  }

  if (name === 'llmEvidencePayload' && state.artifactExists && state.artifactParsed && state.runtimeInitialized && state.inferenceEnabledByConfig) {
    return { label: t('v36.runtime.readyAvailable'), tone: 'positive' };
  }

  if (state.lastInferenceSucceeded === true) return { label: t('v36.runtime.ok'), tone: 'positive' };
  if (state.lastInferenceSucceeded === false) {
    if (state.unavailableReason || state.lastInferenceError) {
      return { label: t('v36.runtime.degraded'), tone: 'warning' };
    }
    return { label: t('v36.runtime.inferenceFailed'), tone: 'warning' };
  }
  if (state.unavailableReason) {
    return { label: t('v36.runtime.degraded'), tone: 'warning' };
  }
  return { label: t('v36.runtime.noInferenceRecorded'), tone: 'grey' };
};

const modelRows = computed(() =>
  knownModels.map((name) => {
    const state = runtimeHealth.value?.modelHealth?.[name];
    const status = modelStatus(name, state);
    const isEvidencePayload = name === 'llmEvidencePayload';
    const isLlmCall = name === 'llmCall';
    const isNotInferenceModel = isEvidencePayload || isLlmCall;
    const fields: { label: string; value: string; help?: string }[] = [
      { label: t('v36.runtime.artifactExists'), value: yesNo(state?.artifactExists), help: t('v36.help.runtime.artifactExists') },
      { label: t('v36.runtime.artifactParsed'), value: yesNo(state?.artifactParsed), help: t('v36.help.runtime.artifactParsed') },
      { label: t('v36.runtime.runtimeInitialized'), value: yesNo(state?.runtimeInitialized), help: t('v36.help.runtime.runtimeInitialized') },
      {
        label: t('v36.runtime.inferenceEnabled'),
        value: yesNo(state?.inferenceEnabledByConfig),
        help: t('v36.help.runtime.inferenceEnabled'),
      },
    ];
    if (isNotInferenceModel) {
      fields.push({
        label: isEvidencePayload ? t('v36.runtime.lastPayloadGenerated') : t('v36.runtime.lastInferenceNotApplicable'),
        value: state?.lastInferenceTimestamp ? formatDate(state.lastInferenceTimestamp) : t('common.notAvailable'),
      });
    } else {
      fields.push({
        label: t('v36.runtime.lastInferenceSucceeded'),
        value: state?.lastInferenceSucceeded != null ? yesNo(state.lastInferenceSucceeded) : t('common.notAvailable'),
        help: t('v36.help.runtime.lastInferenceSucceeded'),
      });
      fields.push({
        label: t('v36.runtime.lastInferenceTimestamp'),
        value: state?.lastInferenceTimestamp ? formatDate(state.lastInferenceTimestamp) : t('common.notAvailable'),
        help: t('v36.help.runtime.lastInferenceTimestamp'),
      });
    }
    fields.push({
      label: t('v36.runtime.unavailableReason'),
      value: state?.unavailableReason ?? state?.lastInferenceError ?? t('common.none'),
      help: t('v36.help.runtime.unavailableReason'),
    });
    const statusHelp = status.label === t('v36.runtime.disabledByDesign') ? t('v36.help.runtime.disabledByDesign')
      : status.label === t('v36.runtime.handledByApiService') ? t('v36.help.runtime.handledByApiService')
      : status.label === t('v36.runtime.readyAvailable') ? t('v36.help.runtime.readyAvailable')
      : undefined;
    return {
      name,
      label: name,
      status: status.label,
      tone: status.tone,
      fields,
      statusHelp,
    };
  }),
);

const diagnosticsSection = computed(() => {
  const diag = diagnostics.value;
  if (!diag) return null;
  const rows: { label: string; value: string; help?: string }[] = [];

  const fc = diag.fieldCoverage;
  if (fc) {
    const entries = Object.entries(safeRecord(fc));
    rows.push({
      label: t('v36.runtime.fieldCoverage'),
      value: t('v36.runtime.fieldCoverageSections', { count: entries.length }),
      help: t('v36.help.runtime.fieldCoverage'),
    });

    const fcRecord = fc as Record<string, unknown>;
    const seq = fcRecord.sequence as Record<string, unknown> | undefined;
    if (seq) {
      rows.push({
        label: t('v36.runtime.sequenceCoverage'),
        value: t('v36.runtime.sequenceModeNormal'),
        help: t('v36.help.runtime.sequenceCoverage'),
      });
      if (typeof seq.totalEvents === 'number') {
        rows.push({
          label: t('v36.runtime.eventsAnalyzed'),
          value: formatNumber(seq.totalEvents),
          help: t('v36.help.runtime.eventsAnalyzed'),
        });
      }
      const warnings = seq.highUnknownFieldWarnings;
      const warningCount = Array.isArray(warnings) ? warnings.length : 0;
      rows.push({
        label: t('v36.runtime.highUnknownFieldWarnings'),
        value: formatNumber(warningCount),
        help: t('v36.help.runtime.highUnknownFieldWarnings'),
      });
    }

    const tab = fcRecord.tabular as Record<string, unknown> | undefined;
    if (tab) {
      rows.push({
        label: t('v36.runtime.tabularCoverage'),
        value: t('v36.runtime.modelLatencyAvailable'),
        help: t('v36.help.runtime.tabularCoverage'),
      });
      if (typeof tab.unknownCategoricalRatio === 'number') {
        rows.push({
          label: t('v36.runtime.unknownCategoricalRatio'),
          value: formatUnknownRatio(tab.unknownCategoricalRatio),
          help: t('v36.help.runtime.unknownCategoricalRatio'),
        });
      }
      rows.push({
        label: t('v36.runtime.missingFeatures'),
        value: formatNumber(tab.missingFeatureCount as number | null | undefined),
        help: t('v36.help.runtime.missingFeatures'),
      });
      rows.push({
        label: t('v36.runtime.defaultedFeatures'),
        value: formatNumber(tab.defaultedFeatureCount as number | null | undefined),
        help: t('v36.help.runtime.defaultedFeatures'),
      });
      rows.push({
        label: t('v36.runtime.nanInfinityReplacements'),
        value: formatNumber(tab.nanInfinityReplacements as number | null | undefined),
        help: t('v36.help.runtime.nanInfinityReplacements'),
      });
    }
  } else {
    rows.push({
      label: t('v36.runtime.fieldCoverage'),
      value: t('common.notAvailable'),
    });
  }

  const ml = diag.modelLatency;
  if (ml && typeof ml === 'object') {
    const mlRecord = ml as Record<string, unknown>;
    if (mlRecord.available === true) {
      rows.push({
        label: t('v36.runtime.modelLatency'),
        value: t('v36.runtime.modelLatencyAvailable'),
      });
      if (typeof mlRecord.benchmarkLastRunAt === 'string') {
        rows.push({
          label: t('v36.runtime.benchmarkLastRun'),
          value: formatDate(mlRecord.benchmarkLastRunAt),
          help: t('v36.help.runtime.benchmarkLastRun'),
        });
      }
      Object.entries(mlRecord).forEach(([key, val]) => {
        if (['available', 'benchmarkLastRunAt', 'benchmarkWarnings'].includes(key)) return;
        const name = formatModelLatencyName(key);
        const strVal = typeof val === 'number' ? formatModelLatencyValue(val) : t('common.notAvailable');
        rows.push({ label: name, value: strVal, help: t('v36.help.runtime.modelLatencyEntry') });
      });
    } else {
      rows.push({
        label: t('v36.runtime.modelLatency'),
        value: t('v36.runtime.modelLatencyNotAvailable'),
        help: t('v36.help.runtime.modelLatency'),
      });
    }
  } else {
    rows.push({
      label: t('v36.runtime.modelLatency'),
      value: t('v36.runtime.modelLatencyNotAvailable'),
      help: t('v36.help.runtime.modelLatency'),
    });
  }

  if (diag.fallbackMode) {
    rows.push({
      label: t('v36.runtime.sequenceModel'),
      value: formatSequenceMode(diag.fallbackMode),
      help: t('v36.help.runtime.sequenceModel'),
    });
  }

  return rows.length ? rows : null;
});

const kafkaPartitionStatus = computed(() => {
  const k = kafkaSection.value;
  if (k == null) return null;
  const assigned = k.assignedPartitionCount;
  const total = k.topicPartitionCount;
  if (assigned == null && total == null) return null;
  if (total == null) return assigned != null ? formatNumber(assigned) : null;
  if (assigned == null) return t('v36.runtime.partitionStatusInfo', { assigned: '?', total: formatNumber(total) });
  if (assigned >= total) {
    return t('v36.runtime.partitionFullyAssigned', { count: formatNumber(assigned) });
  }
  return t('v36.runtime.partitionStatusInfo', {
    assigned: formatNumber(assigned),
    total: formatNumber(total),
  });
});

const kafkaEffectiveParallelism = computed(() => {
  const k = kafkaSection.value;
  if (k?.effectiveConsumerParallelism != null) return k.effectiveConsumerParallelism;
  if (k?.configuredConcurrency != null && k.assignedPartitionCount != null) {
    return Math.min(k.assignedPartitionCount, k.configuredConcurrency);
  }
  return null;
});

const winnerRows = computed(() => {
  if (finalWinners.value?.available === false) return [];
  const winners = finalWinners.value?.payload;
  if (!Array.isArray(winners)) return [];
  return winners.map((winner: V36FinalWinnerItem) => {
    const useCase = winner.use_case ?? winner.useCase ?? '';
    const approach = winner.recommended_approach ?? winner.winner ?? winner.model ?? '';
    const family = winner.family ?? '';
    const metric = winner.selection_metric ?? '';
    const metricVal = winner.metric_value;
    const parts = [useCase, approach].filter(Boolean);
    const detail = [family, metric && metricVal != null ? `${metric}=${formatNullableNumber(metricVal, 4)}` : null]
      .filter(Boolean)
      .join(' | ');
    return {
      key: useCase || approach || 'winner',
      title: parts.join(' → ') || t('common.unknown'),
      detail,
    };
  });
});

const reportRows = computed(() => reports.value?.items ?? reports.value?.reports ?? []);

const sessionFinalization = computed(() =>
  runtimeHealth.value?.sessionFinalization ?? diagnostics.value?.sessionFinalization ?? null,
);

const kafkaSection = computed(() =>
  runtimeHealth.value?.kafka ?? diagnostics.value?.kafka ?? null,
);

const idempotencySection = computed(() =>
  runtimeHealth.value?.idempotency ?? diagnostics.value?.idempotency ?? null,
);

const performanceSection = computed(() =>
  runtimeHealth.value?.performance ?? runtimeHealth.value?.kafka?.performance ?? diagnostics.value?.performance ?? null,
);

const statsSection = computed(() =>
  runtimeHealth.value?.stats ?? diagnostics.value?.stats ?? null,
);

const nextActionPredictionSection = computed(() =>
  runtimeHealth.value?.nextActionPrediction ?? null,
);

const nextEventPredictionSection = computed(() =>
  runtimeHealth.value?.nextEventPrediction ?? null,
);


const kafkaConcurrencyInfo = computed(() => {
  const k = kafkaSection.value;
  if (k == null) return null;
  const assigned = k.assignedPartitionCount ?? (k.assignedPartitions ? (Array.isArray(k.assignedPartitions) ? k.assignedPartitions.length : (typeof k.assignedPartitions === 'number' ? k.assignedPartitions : null)) : null);
  if (assigned == null || k.configuredConcurrency == null) return null;
  if (assigned < k.configuredConcurrency) {
    if (k.topicPartitionCount != null) {
      return { message: t('v36.runtime.kafka.concurrencyWarning', {
        assigned: formatNumber(assigned),
        configured: formatNumber(k.configuredConcurrency),
      }), type: 'warning' as const };
    }
    return { message: t('v36.runtime.kafka.assignedPartitionsInfo', {
      assigned: formatNumber(assigned),
    }), type: 'info' as const };
  }
  return null;
});

const kafkaMaxPollWarning = computed(() => {
  const k = kafkaSection.value;
  if (k?.maxPollRecords != null && k.maxPollRecords > 100) {
    return t('v36.runtime.kafka.maxPollWarning', { value: formatNumber(k.maxPollRecords) });
  }
  return null;
});

const performanceHighLagWarning = computed(() => {
  const p = performanceSection.value;
  if (p?.kafkaLagCached != null && p.kafkaLagCached > 10000) {
    return t('v36.runtime.performance.highLagWarning', { value: formatNumber(p.kafkaLagCached) });
  }
  return null;
});

const handleRuntimeRefresh = () => {
  void refresh();
};

onMounted(() => {
  document.addEventListener(ASSISTANT_REFRESH_RUNTIME_EVENT, handleRuntimeRefresh);
});

onBeforeUnmount(() => {
  document.removeEventListener(ASSISTANT_REFRESH_RUNTIME_EVENT, handleRuntimeRefresh);
});
</script>

<style scoped>
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

.neo-v36-model-grid {
  display: grid;
  gap: var(--neo-space-4);
  grid-template-columns: repeat(auto-fit, minmax(290px, 1fr));
}

.neo-v36-model-card,
.neo-v36-fact,
.neo-v36-list-row {
  padding: var(--neo-space-3);
  border: var(--neo-border);
  border-radius: var(--neo-radius-card);
  background: var(--neo-card-bg-tint);
}

.neo-v36-model-card {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  word-break: break-word;
  min-height: 420px;
}

.neo-v36-model-card .neo-v36-fact-grid {
  flex: 1;
  align-content: start;
}

.neo-v36-model-head {
  display: flex;
  justify-content: space-between;
  gap: var(--neo-space-3);
  margin-bottom: var(--neo-space-3);
}

.neo-v36-fact-grid {
  display: grid;
  gap: 8px;
  grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
  min-width: 0;
}

.neo-v36-large-fact-grid {
  display: grid;
  gap: 8px;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
}

.neo-v36-wide-fact {
  grid-column: 1 / -1;
}

.neo-v36-info-box {
  margin-top: var(--neo-space-3);
  padding: var(--neo-space-3);
  border: 1px solid rgba(59, 130, 246, 0.2);
  border-radius: var(--neo-radius-card);
  background: rgba(59, 130, 246, 0.06);
  color: var(--neo-ink-muted);
  font-size: 13px;
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
  margin-top: 6px;
  overflow-wrap: anywhere;
}

.neo-v36-list {
  display: grid;
  gap: var(--neo-space-3);
}

.neo-v36-warning {
  margin-top: var(--neo-space-4);
  border: 1px solid rgba(251, 191, 36, 0.28);
  border-radius: var(--neo-radius-card);
  background: var(--neo-warning-bg);
  color: var(--neo-warning-contrast);
}

@media (max-width: 1000px) {
  .neo-v36-grid > .neo-analytics-panel {
    grid-column: 1 / -1;
  }
}
</style>
