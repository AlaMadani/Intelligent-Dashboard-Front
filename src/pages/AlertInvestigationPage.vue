// ---- Template ----
<template>
  <q-page class="neo-page">
    <section class="neo-section">
      <div class="neo-section-header">
        <div>
          <div class="neo-kicker">{{ t('v36.common.schema') }}</div>
          <h1 class="neo-section-title">{{ t('v36.investigation.title') }}</h1>
          <p class="neo-section-subtitle">{{ eventId }}</p>
        </div>
        <div class="neo-section-actions">
          <div v-if="source" id="investigation-source-chip" class="neo-analytics-chip" data-assistant-id="investigation-source-chip" data-assistant-type="badge" data-assistant-label="Data Source Chip" data-assistant-description="Chip showing the data source for the investigation data." data-assistant-actions="HIGHLIGHT_ELEMENT">{{ t('v36.common.source') }}: {{ source }}</div>
          <span id="btn-explain-ai"
            data-assistant-id="btn-explain-ai"
            data-assistant-type="button"
            data-assistant-label="Explain AI Button"
            data-assistant-description="Button that opens the AI explanation modal for the current alert."
            data-assistant-actions="HIGHLIGHT_ELEMENT,CLICK_ELEMENT"
          >
            <ai-explain-button
              v-if="eventId"
              context-key="investigation-overview"
              variant="prominent"
              :event-id="eventId"
              :params="{ eventId, riskLevel: alert?.riskLevel, anomalyType: alert?.anomalyType }"
            />
          </span>
          <q-btn
            id="investigation-back-button"
            flat
            icon="arrow_back"
            :label="t('v36.common.backToAlerts')"
            data-assistant-id="investigation-back-button"
            data-assistant-type="button"
            data-assistant-label="Back to Alerts Button"
            data-assistant-description="Button that navigates back to the Alerts list page."
            data-assistant-actions="HIGHLIGHT_ELEMENT,CLICK_ELEMENT"
            @click="router.push({ name: ROUTE_NAMES.ALERTS })"
          />
          <q-btn id="investigation-refresh-button" unelevated color="primary" icon="refresh" :disable="loading" :label="t('v36.common.refresh')" data-assistant-id="investigation-refresh-button" data-assistant-type="button" data-assistant-label="Refresh Investigation" data-assistant-description="Button that refreshes the investigation data for the current alert." data-assistant-actions="HIGHLIGHT_ELEMENT,CLICK_ELEMENT" @click="() => refresh()" />
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

      <q-banner v-if="warnings.length" class="neo-v36-warning">
        <template #avatar><q-icon name="warning" /></template>
        {{ warnings.join(' | ') }}
      </q-banner>
    </section>

    <div class="neo-loading-scope neo-investigation-body">
      <loading-overlay :show="loading" context="fetch" />

    <template v-if="alert">
      <section id="investigation-alert-header" class="neo-section neo-panel neo-v36-alert-header"
        data-assistant-id="investigation-alert-header"
        data-assistant-type="card"
        data-assistant-label="Alert Header Section"
        data-assistant-description="Header showing the risk level badge, event ID, anomaly type, timestamp, and final risk score with progress bar."
        data-assistant-actions="HIGHLIGHT_ELEMENT"
      >
        <div>
          <div class="neo-v36-header-row">
            <q-badge :color="riskTone(riskLevelDisplay(alert.riskTier, alert.riskLevel))" rounded>
              {{ riskLevelDisplay(alert.riskTier, alert.riskLevel) ?? t('common.unknown') }}
            </q-badge>
            <span class="neo-mono">{{ alert.eventId }}</span>
          </div>
          <h2>{{ alert.anomalyType ?? t('common.unknown') }}</h2>
          <p>{{ formatDate(alert.timestamp) }}</p>
        </div>
        <div class="neo-v36-score">
          <span>{{ t('v36.common.finalRiskScore') }}</span>
          <strong>{{ formatNullableScore(alert.finalRiskScore) }}</strong>
          <InfoTooltip :text="t('v36.help.investigation.finalRiskScore')" />
          <q-linear-progress
            rounded
            size="10px"
            :value="scoreProgress(alert.finalRiskScore)"
            :color="riskTone(alert.riskLevel)"
          />
        </div>
      </section>

      <section class="neo-section neo-v36-grid">
        <article id="card-event-metadata" class="neo-analytics-panel"
          data-assistant-id="card-event-metadata"
          data-assistant-type="card"
          data-assistant-label="Event Metadata Card"
          data-assistant-description="Card showing the event metadata including insured ID, session ID, event ID, event type, version, IP address, user agent, and other contextual information."
          data-assistant-actions="HIGHLIGHT_ELEMENT"
        >
          <div class="neo-analytics-head">
            <div>
              <h3>{{ t('v36.investigation.eventMetadata') }}</h3>
              <p>{{ alert.insuredId }} / {{ alert.sessionId }}</p>
            </div>
          </div>
          <div class="neo-v36-fact-grid">
            <div v-for="field in metadataFields" :key="field.label" class="neo-v36-fact">
              <span>{{ field.label }}</span>
              <strong>{{ field.value }}</strong>
            </div>
          </div>
        </article>

        <article id="card-model-scores" class="neo-analytics-panel"
          data-assistant-id="card-model-scores"
          data-assistant-type="card"
          data-assistant-label="Model Scores Card"
          data-assistant-description="Card showing the scores from each model including raw score, risk level, and weight contribution to the final risk."
          data-assistant-actions="HIGHLIGHT_ELEMENT"
        >
          <div class="neo-analytics-head">
            <div>
              <h3>{{ t('v36.common.modelScores') }} <InfoTooltip :text="t('v36.help.investigation.modelScores')" /></h3>
              <p>{{ t('v36.investigation.modelScoresSubtitle') }}</p>
            </div>
            
          </div>
          <div class="neo-v36-fact-grid">
            <div v-for="score in modelScoreFields" :key="score.label" class="neo-v36-fact">
              <span>{{ score.label }}</span>
              <strong>{{ score.value }}</strong>
            </div>
          </div>
        </article>

        <article id="investigation-model-contributions" class="neo-analytics-panel"
          data-assistant-id="investigation-model-contributions"
          data-assistant-type="card"
          data-assistant-label="Model Contributions"
          data-assistant-description="Card showing the contribution breakdown of each model to the final risk score."
          data-assistant-actions="HIGHLIGHT_ELEMENT"
        >
          <div class="neo-analytics-head">
            <div>
              <h3>{{ t('v36.common.modelContributions') }} <InfoTooltip :text="t('v36.help.investigation.modelContributions')" /></h3>
              <p>{{ t('v36.investigation.modelContributionsSubtitle') }}</p>
            </div>
          </div>
          <bar-list-chart :items="contributionRows" :empty-message="t('v36.common.noData')" />
        </article>

        <article id="card-sequence-evidence" class="neo-analytics-panel"
          data-assistant-id="card-sequence-evidence"
          data-assistant-type="card"
          data-assistant-label="Sequence Evidence Card"
          data-assistant-description="Card showing the sequence of events leading up to the alert, including prior events and their timestamps."
          data-assistant-actions="HIGHLIGHT_ELEMENT"
        >
          <div class="neo-analytics-head">
            <div>
              <h3>{{ t('v36.common.sequenceEvidence') }} <InfoTooltip :text="t('v36.help.investigation.sequenceEvidence')" /></h3>
              <p>{{ alert.sequenceEvidence?.selectedSequenceModel ?? t('common.notAvailable') }}</p>
            </div>
            
          </div>
          <div class="neo-v36-fact-grid">
            <div v-for="field in sequenceFields" :key="field.label" class="neo-v36-fact">
              <span>{{ field.label }}</span>
              <strong>{{ field.value }}</strong>
            </div>
          </div>
          <div v-if="topSurpriseFieldsItems.length" class="neo-v36-list q-mt-md">
            <div
              v-for="item in topSurpriseFieldsItems"
              :key="item.key"
              class="neo-v36-list-row"
            >
              <span>{{ item.label }}</span>
              <strong>{{ item.value }}</strong>
            </div>
          </div>
        </article>

        <article id="investigation-tabular-evidence" class="neo-analytics-panel"
          data-assistant-id="investigation-tabular-evidence"
          data-assistant-type="card"
          data-assistant-label="Tabular Evidence"
          data-assistant-description="Card showing tabular evidence including available models, unavailable models, and feature warnings."
          data-assistant-actions="HIGHLIGHT_ELEMENT"
        >
          <div class="neo-analytics-head">
            <div>
              <h3>{{ t('v36.common.tabularEvidence') }} <InfoTooltip :text="t('v36.help.investigation.tabularEvidence')" /></h3>
              <p>{{ alert.tabularEvidence?.featureContract ?? t('common.notAvailable') }}</p>
            </div>
          </div>
          <div class="neo-v36-list">
            <div class="neo-v36-list-row">
              <span>{{ t('v36.investigation.availableModels') }}</span>
              <strong>{{ listLabel(alert.tabularEvidence?.availableModels) }}</strong>
            </div>
            <div class="neo-v36-list-row">
              <span>{{ t('v36.investigation.unavailableModels') }}</span>
              <strong>{{ listLabel(alert.tabularEvidence?.unavailableModels) }}</strong>
            </div>
            <div class="neo-v36-list-row">
              <span>{{ t('v36.investigation.featureWarnings') }}</span>
              <strong>{{ objectCount(alert.tabularEvidence?.featureWarnings) }}</strong>
            </div>
          </div>
        </article>

        <article id="investigation-rule-evidence" class="neo-analytics-panel"
          data-assistant-id="investigation-rule-evidence"
          data-assistant-type="card"
          data-assistant-label="Rule Evidence"
          data-assistant-description="Card showing triggered rules, rule contributions, and rule evidence details."
          data-assistant-actions="HIGHLIGHT_ELEMENT"
        >
          <div class="neo-analytics-head">
            <div>
              <h3>{{ t('v36.common.ruleEvidence') }} <InfoTooltip :text="t('v36.help.investigation.ruleEvidence')" /></h3>
            </div>
          </div>
          <template v-if="hasTriggeredRules">
            <div class="neo-v36-section-label">{{ t('v36.investigation.triggeredRules') }}</div>
            <div class="neo-v36-chip-row">
              <q-chip v-for="rule in triggeredRuleCodes" :key="rule" dense outline color="warning" class="neo-v36-rule-chip">
                {{ rule }}
              </q-chip>
            </div>
            <bar-list-chart v-if="hasRuleContributionDetails" :items="ruleRows" />
            <q-banner v-else dense rounded class="neo-v36-missing-banner q-mt-sm">
              {{ t('v36.investigation.ruleDetailsUnavailable') }}
            </q-banner>
          </template>
          <div v-else class="neo-v36-empty-rules">
            {{ t('v36.investigation.noTriggeredRules') }}
          </div>
        </article>

        <article id="card-anomaly-attribution" class="neo-analytics-panel"
          data-assistant-id="card-anomaly-attribution"
          data-assistant-type="card"
          data-assistant-label="Anomaly Attribution Card"
          data-assistant-description="Card showing the anomaly attribution breakdown including feature importance and contributions."
          data-assistant-actions="HIGHLIGHT_ELEMENT"
        >
          <div class="neo-analytics-head">
            <div>
              <h3>{{ t('v36.investigation.anomalyAttribution') }} <InfoTooltip :text="t('v36.help.investigation.anomalyAttribution')" /></h3>
              <p>{{ alert.anomalyTypeAttribution?.source ?? t('common.notAvailable') }}</p>
            </div>
          </div>
          <div class="neo-v36-fact-grid">
            <div class="neo-v36-fact">
              <span>{{ t('v36.common.anomalyType') }}</span>
              <strong>{{ alert.anomalyTypeAttribution?.anomalyType ?? alert.anomalyType ?? t('common.unknown') }}</strong>
            </div>
            <div class="neo-v36-fact">
              <span>{{ t('common.confidence') }}</span>
              <strong>{{ formatPercent(alert.anomalyTypeAttribution?.confidence, 1) }}</strong>
            </div>
          </div>
        </article>

        <article id="card-session-lifecycle" class="neo-analytics-panel"
          data-assistant-id="card-session-lifecycle"
          data-assistant-type="card"
          data-assistant-label="Session Lifecycle Card"
          data-assistant-description="Card showing the session lifecycle including start time, end time, duration, status, and key events within the session."
          data-assistant-actions="HIGHLIGHT_ELEMENT"
        >
          <div class="neo-analytics-head">
            <div>
              <h3>{{ t('v36.sessionLifecycle.title') }} <InfoTooltip :text="t('v36.sessionLifecycle.subtitle')" /></h3>
              <p>{{ alert.sessionId }}</p>
            </div>
          </div>
          <div v-if="hasSessionLifecycle" class="neo-v36-fact-grid">
            <div class="neo-v36-fact">
              <span>{{ t('v36.sessionLifecycle.endReason') }}</span>
              <q-badge :color="sessionEndReasonTone(sessionLifecycleData.sessionEndReason)" rounded>
                {{ formatSessionEndReason(sessionLifecycleData.sessionEndReason) }}
              </q-badge>
            </div>
            <div class="neo-v36-fact">
              <span>{{ t('v36.sessionLifecycle.endedExplicitly') }}</span>
              <strong>{{ formatBooleanYesNo(sessionLifecycleData.sessionEndedExplicitly) }}</strong>
            </div>
            <div class="neo-v36-fact">
              <span>{{ t('v36.sessionLifecycle.endedAt') }}</span>
              <strong>{{ formatDate(sessionLifecycleData.sessionEndedAt) }}</strong>
            </div>
            <div class="neo-v36-fact">
              <span>{{ t('v36.sessionLifecycle.duration') }} <InfoTooltip :text="t('v36.sessionLifecycle.durationTooltip')" /></span>
              <strong>{{ formatDurationMs(sessionLifecycleData.sessionDurationMs) }}</strong>
            </div>
            <div class="neo-v36-fact">
              <span>{{ t('v36.sessionLifecycle.eventCount') }}</span>
              <strong>{{ formatNumber(sessionLifecycleData.sessionEventCount) }}</strong>
            </div>
          </div>
          <div v-else class="neo-analytics-empty">
            {{ t('v36.sessionLifecycle.notAvailable') }}
          </div>
        </article>

        <article id="card-next-event-prediction" v-if="hasNextEventPredictionEvidence" class="neo-analytics-panel"
          data-assistant-id="card-next-event-prediction"
          data-assistant-type="card"
          data-assistant-label="Next Event Prediction Card"
          data-assistant-description="Card showing the predicted next event including predicted event type, confidence score, and timing estimation."
          data-assistant-actions="HIGHLIGHT_ELEMENT"
        >
          <div class="neo-analytics-head">
            <div>
              <h3><span class="neo-ai-text">{{ t('v36.investigation.nextEventPredictionEvidence') }}</span> <InfoTooltip :text="t('v36.investigation.nextEventPredictionEvidenceSubtitle')" /></h3>
              <p>{{ prediction?.sessionId ?? t('common.notAvailable') }}</p>
            </div>
          </div>

          <!-- Case 2: deviation with previousPrediction -->
          <template v-if="hasDeviationWithPreviousPrediction">
            <!-- Prediction before this event -->
            <div class="neo-v36-section-label q-mt-md q-mb-sm">
              {{ t('v36.investigation.predictionBeforeEvent') }}
              <InfoTooltip :text="t('v36.investigation.predictionBeforeEventTooltip')" />
            </div>
            <div class="neo-v36-fact-grid">
              <div v-if="predictionTopHead(previousPrediction, 'frontend_action_name')" class="neo-v36-fact">
                <span>{{ t('v36.investigation.expectedAction') }} <InfoTooltip :text="t('v36.nextEventPrediction.help.predictedAction')" /></span>
                <strong>{{ predictionTopHead(previousPrediction, 'frontend_action_name') }}</strong>
              </div>
              <div v-if="predictionTopHead(previousPrediction, 'api_template')" class="neo-v36-fact">
                <span>{{ t('v36.investigation.expectedApi') }} <InfoTooltip :text="t('v36.nextEventPrediction.help.predictedApi')" /></span>
                <strong>{{ predictionTopHead(previousPrediction, 'api_template') }}</strong>
              </div>
              <div v-if="predictionTopHead(previousPrediction, 'api_family')" class="neo-v36-fact">
                <span>{{ t('v36.investigation.expectedApiFamily') }} <InfoTooltip :text="t('v36.nextEventPrediction.help.predictedApiFamily')" /></span>
                <strong>{{ predictionTopHead(previousPrediction, 'api_family') }}</strong>
              </div>
            </div>
            <div class="neo-v36-fact-grid q-mt-md">
              <div v-if="previousPrediction?.contextEventId" class="neo-v36-fact">
                <span>{{ t('v36.investigation.contextEventId') }}</span>
                <strong>{{ previousPrediction.contextEventId }}</strong>
              </div>
              <div v-if="previousPrediction?.contextSize != null" class="neo-v36-fact">
                <span>{{ t('v36.investigation.contextSize') }} <InfoTooltip :text="t('v36.nextEventPrediction.help.contextSize')" /></span>
                <strong>{{ formatNumber(previousPrediction.contextSize) }}</strong>
              </div>
              <div v-if="previousPrediction?.model" class="neo-v36-fact">
                <span>{{ t('v36.investigation.model') }} <InfoTooltip :text="t('v36.nextEventPrediction.help.model')" /></span>
                <strong>{{ previousPrediction.model }}</strong>
              </div>
              <div v-if="previousPrediction?.createdAt" class="neo-v36-fact">
                <span>{{ t('v36.investigation.createdAt') }}</span>
                <strong>{{ formatDate(previousPrediction.createdAt) }}</strong>
              </div>
            </div>

            <!-- Actual investigated event -->
            <template v-if="deviation?.actual">
              <div class="neo-v36-section-label q-mt-md q-mb-sm">
                {{ t('v36.investigation.actualInvestigatedEvent') }}
              </div>
              <div class="neo-v36-fact-grid">
                <div v-for="fieldKey in deviationActualKeys" :key="fieldKey" class="neo-v36-fact">
                  <span>{{ deviationFieldLabel(fieldKey) }} <InfoTooltip :text="deviationFieldHelp(fieldKey)" /></span>
                  <strong>{{ deviation?.actual?.[fieldKey] ?? t('common.notAvailable') }}</strong>
                </div>
              </div>
            </template>

            <!-- Deviation from previous prediction -->
            <div class="neo-v36-section-label q-mt-md q-mb-sm">
              {{ t('v36.investigation.deviationFromPreviousPrediction') }}
            </div>
            <div v-if="deviation?.deviationScore != null" class="neo-v36-fact-grid q-mb-md">
              <div class="neo-v36-fact">
                <span>{{ t('v36.investigation.deviationScore') }} <InfoTooltip :text="t('v36.nextEventPrediction.help.deviationScore')" /></span>
                <strong>{{ formatNullableScore(deviation?.deviationScore) }}</strong>
              </div>
            </div>
            <template v-if="deviation?.actualProbabilities">
              <div class="neo-v36-section-label q-mt-sm q-mb-sm">{{ t('v36.investigation.deviationProbabilities') }} <InfoTooltip :text="t('v36.nextEventPrediction.help.actualProbabilities')" /></div>
              <div class="neo-v36-list">
                <div v-for="(prob, key) in deviation?.actualProbabilities" :key="key" class="neo-v36-list-row">
                  <span>{{ key }}</span>
                  <strong>{{ formatPredictionProb(prob) }}</strong>
                </div>
              </div>
            </template>
            <template v-if="deviation?.predictionMatch">
              <div class="neo-v36-section-label q-mt-sm q-mb-sm">{{ t('v36.investigation.deviationMatch') }} <InfoTooltip :text="t('v36.nextEventPrediction.help.topKMatches')" /></div>
              <div class="neo-v36-list">
                <div v-for="(match, rawKey) in deviation?.predictionMatch" :key="rawKey" class="neo-v36-list-row">
                  <span>{{ deviationMatchLabel(rawKey) }}</span>
                  <q-badge :color="match ? 'positive' : 'grey'" rounded>{{ match ? t('common.yes') : t('common.no') }}</q-badge>
                </div>
              </div>
              <div class="neo-v36-info-box q-mt-sm">
                {{ t('v36.investigation.deviationMatchSummary', { matched: deviationMatchCount, total: deviationMatchTotal }) }}
                <InfoTooltip :text="t('v36.nextEventPrediction.help.matchSummary')" />
              </div>
              <div v-if="deviationInterpretation" class="neo-v36-info-box q-mt-xs">
                {{ deviationInterpretation }}
              </div>
            </template>

            <!-- Prediction after this event (from evidence.prediction) -->
            <template v-if="prediction?.heads && prediction !== previousPrediction">
              <div class="neo-v36-section-label q-mt-md q-mb-sm">
                {{ t('v36.investigation.predictionAfterEvent') }}
              </div>
              <div class="neo-v36-fact-grid">
                <div v-if="predictionTopHead(prediction, 'frontend_action_name')" class="neo-v36-fact">
                  <span>{{ t('v36.investigation.predictedNextAction') }} <InfoTooltip :text="t('v36.nextEventPrediction.help.predictedAction')" /></span>
                  <strong>{{ predictionTopHead(prediction, 'frontend_action_name') }}</strong>
                </div>
                <div v-if="predictionTopHead(prediction, 'api_template')" class="neo-v36-fact">
                  <span>{{ t('v36.investigation.predictedApi') }} <InfoTooltip :text="t('v36.nextEventPrediction.help.predictedApi')" /></span>
                  <strong>{{ predictionTopHead(prediction, 'api_template') }}</strong>
                </div>
                <div v-if="predictionTopHead(prediction, 'api_family')" class="neo-v36-fact">
                  <span>{{ t('v36.investigation.predictedApiFamily') }} <InfoTooltip :text="t('v36.nextEventPrediction.help.predictedApiFamily')" /></span>
                  <strong>{{ predictionTopHead(prediction, 'api_family') }}</strong>
                </div>
              </div>
            </template>
            <!-- Explicit predictionAfterEvent field if it exists and differs -->
            <template v-if="predictionAfterEvent?.heads && predictionAfterEvent !== prediction">
              <div class="neo-v36-section-label q-mt-md q-mb-sm">
                {{ t('v36.investigation.predictionAfterEvent') }}
              </div>
              <div class="neo-v36-fact-grid">
                <div v-if="predictionTopHead(predictionAfterEvent, 'frontend_action_name')" class="neo-v36-fact">
                  <span>{{ t('v36.investigation.predictedNextAction') }} <InfoTooltip :text="t('v36.nextEventPrediction.help.predictedAction')" /></span>
                  <strong>{{ predictionTopHead(predictionAfterEvent, 'frontend_action_name') }}</strong>
                </div>
                <div v-if="predictionTopHead(predictionAfterEvent, 'api_template')" class="neo-v36-fact">
                  <span>{{ t('v36.investigation.predictedApi') }} <InfoTooltip :text="t('v36.nextEventPrediction.help.predictedApi')" /></span>
                  <strong>{{ predictionTopHead(predictionAfterEvent, 'api_template') }}</strong>
                </div>
                <div v-if="predictionTopHead(predictionAfterEvent, 'api_family')" class="neo-v36-fact">
                  <span>{{ t('v36.investigation.predictedApiFamily') }} <InfoTooltip :text="t('v36.nextEventPrediction.help.predictedApiFamily')" /></span>
                  <strong>{{ predictionTopHead(predictionAfterEvent, 'api_family') }}</strong>
                </div>
              </div>
            </template>
          </template>

          <!-- Case 3: deviation without previousPrediction -->
          <template v-else-if="hasDeviationWithoutPreviousPrediction">
            <div class="neo-v36-section-label q-mt-md q-mb-sm">
              {{ t('v36.investigation.deviationFromPreviousPrediction') }}
            </div>
            <div v-if="deviation?.deviationScore != null" class="neo-v36-fact-grid q-mb-md">
              <div class="neo-v36-fact">
                <span>{{ t('v36.investigation.deviationScore') }} <InfoTooltip :text="t('v36.nextEventPrediction.help.deviationScore')" /></span>
                <strong>{{ formatNullableScore(deviation?.deviationScore) }}</strong>
              </div>
            </div>
            <template v-if="deviation?.actualProbabilities">
              <div class="neo-v36-section-label q-mt-sm q-mb-sm">{{ t('v36.investigation.deviationProbabilities') }} <InfoTooltip :text="t('v36.nextEventPrediction.help.actualProbabilities')" /></div>
              <div class="neo-v36-list">
                <div v-for="(prob, key) in deviation?.actualProbabilities" :key="key" class="neo-v36-list-row">
                  <span>{{ key }}</span>
                  <strong>{{ formatPredictionProb(prob) }}</strong>
                </div>
              </div>
            </template>
            <template v-if="deviation?.predictionMatch">
              <div class="neo-v36-section-label q-mt-sm q-mb-sm">{{ t('v36.investigation.deviationMatch') }} <InfoTooltip :text="t('v36.nextEventPrediction.help.topKMatches')" /></div>
              <div class="neo-v36-list">
                <div v-for="(match, rawKey) in deviation?.predictionMatch" :key="rawKey" class="neo-v36-list-row">
                  <span>{{ deviationMatchLabel(rawKey) }}</span>
                  <q-badge :color="match ? 'positive' : 'grey'" rounded>{{ match ? t('common.yes') : t('common.no') }}</q-badge>
                </div>
              </div>
              <div class="neo-v36-info-box q-mt-sm">
                {{ t('v36.investigation.deviationMatchSummary', { matched: deviationMatchCount, total: deviationMatchTotal }) }}
                <InfoTooltip :text="t('v36.nextEventPrediction.help.matchSummary')" />
              </div>
              <div v-if="deviationInterpretation" class="neo-v36-info-box q-mt-xs">
                {{ deviationInterpretation }}
              </div>
            </template>
            <div class="neo-v36-info-box q-mt-sm">
              {{ t('v36.investigation.previousPredictionNotAvailable') }}
            </div>
          </template>

          <!-- Case 1: prediction only, no deviation -->
          <template v-else-if="hasPredictionOnly">
            <div class="neo-v36-section-label q-mt-md q-mb-sm">
              {{ t('v36.investigation.predictionGeneratedFromThisEvent') }}
            </div>
            <div class="neo-v36-fact-grid">
              <div v-if="predictionTopHead(prediction, 'frontend_action_name')" class="neo-v36-fact">
                <span>{{ t('v36.investigation.predictedNextAction') }} <InfoTooltip :text="t('v36.nextEventPrediction.help.predictedAction')" /></span>
                <strong>{{ predictionTopHead(prediction, 'frontend_action_name') }}</strong>
              </div>
              <div v-if="predictionTopHead(prediction, 'api_template')" class="neo-v36-fact">
                <span>{{ t('v36.investigation.predictedApi') }} <InfoTooltip :text="t('v36.nextEventPrediction.help.predictedApi')" /></span>
                <strong>{{ predictionTopHead(prediction, 'api_template') }}</strong>
              </div>
              <div v-if="predictionTopHead(prediction, 'api_family')" class="neo-v36-fact">
                <span>{{ t('v36.investigation.predictedApiFamily') }} <InfoTooltip :text="t('v36.nextEventPrediction.help.predictedApiFamily')" /></span>
                <strong>{{ predictionTopHead(prediction, 'api_family') }}</strong>
              </div>
            </div>
            <div class="neo-v36-info-box q-mt-sm">
              {{ t('v36.investigation.noDeviationAvailable') }}
            </div>
            <div class="neo-v36-info-box q-mt-xs">
              {{ t('v36.investigation.noDeviationExtraNote') }}
            </div>
          </template>
        </article>

        <article id="card-user-business-context" class="neo-analytics-panel neo-v36-wide"
          data-assistant-id="card-user-business-context"
          data-assistant-type="card"
          data-assistant-label="User Business Context Card"
          data-assistant-description="Card showing user business context information including profile details, subscription status, and business attributes."
          data-assistant-actions="HIGHLIGHT_ELEMENT"
        >
          <div class="neo-analytics-head">
            <div>
              <h3>{{ t('v36.common.userBusinessContext') }}</h3>
              <p>{{ t('v36.investigation.showAdvancedContext') }}</p>
            </div>
            <q-btn id="btn-advanced-context" flat dense :icon="advancedExpanded ? 'expand_less' : 'expand_more'" :label="advancedExpanded ? t('v36.investigation.hideAdvancedContext') : t('v36.investigation.showAdvancedContext')" data-assistant-id="btn-advanced-context" data-assistant-type="button" data-assistant-label="Advanced Context Button" data-assistant-description="Button that expands the advanced context section within the alert investigation view." data-assistant-actions="HIGHLIGHT_ELEMENT,CLICK_ELEMENT" @click="advancedExpanded = !advancedExpanded" />
          </div>
          <template v-if="advancedExpanded">
            <div id="advanced-context" class="neo-v36-advanced-section"
              data-assistant-id="advanced-context"
              data-assistant-type="panel"
              data-assistant-label="Advanced Context Panel"
              data-assistant-description="Panel showing the advanced context for the AI explanation including churn risk, forecast context, and persona information."
              data-assistant-actions="HIGHLIGHT_ELEMENT"
            >
              <div class="neo-v36-section-label q-mb-sm">{{ t('v36.common.churnRisk') }} <InfoTooltip :text="t('v36.investigation.churnContextTooltip')" /></div>
              <div class="neo-v36-fact-grid q-mb-md">
                <div class="neo-v36-fact">
                  <span>{{ t('v36.churn.churnProbability') }}</span>
                  <strong>{{ formatPercent(alert.churnContext?.probability, 1) }}</strong>
                </div>
                <div class="neo-v36-fact">
                  <span>{{ t('v36.common.riskLevel') }}</span>
                  <strong>{{ alert.churnContext?.riskLevel ?? t('common.unknown') }}</strong>
                </div>
                <div v-if="alert.churnContext?.modelArtifact" class="neo-v36-fact">
                  <span>{{ t('v36.runtime.artifact') }}</span>
                  <strong>{{ alert.churnContext.modelArtifact }}</strong>
                </div>
              </div>

              <template v-if="hasForecastValues">
                <div class="neo-v36-section-label q-mb-sm">{{ t('v36.common.forecastContext') }} <InfoTooltip :text="t('v36.investigation.forecastContextTooltip')" /></div>
                <div class="neo-v36-fact-grid q-mb-md">
                  <div v-if="alert.forecastContext?.predictedTotalEvents != null" class="neo-v36-fact">
                    <span>{{ t('v36.forecast.predictedTotalEvents') }}</span>
                    <strong>{{ formatNumber(alert.forecastContext.predictedTotalEvents) }}</strong>
                  </div>
                  <div v-if="alert.forecastContext?.predictedAnomalyRate != null" class="neo-v36-fact">
                    <span>{{ t('v36.forecast.predictedAnomalyRate') }}</span>
                    <strong>{{ formatPercent(alert.forecastContext.predictedAnomalyRate, 1) }}</strong>
                  </div>
                  <div v-if="alert.forecastContext?.expectedAlertVolume != null" class="neo-v36-fact">
                    <span>{{ t('v36.forecast.expectedAlertVolume') }}</span>
                    <strong>{{ formatNumber(alert.forecastContext.expectedAlertVolume) }}</strong>
                  </div>
                </div>
              </template>

              <div class="neo-v36-section-label q-mb-sm">{{ t('v36.common.personaDisabled') }}</div>
              <div class="neo-v36-persona-compact">
                {{ t('v36.investigation.personaDisabledCompact') }}
              </div>
            </div>
          </template>
        </article>
      </section>
    </template>

    <section v-else-if="!loading" class="neo-section neo-analytics-empty">
      {{ t('v36.investigation.notFound') }}
    </section>
    </div>
  </q-page>
</template>

// ---- Script Setup ----
<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import InfoTooltip from 'src/components/common/InfoTooltip.vue';
import BarListChart from 'src/components/dashboard/BarListChart.vue';
import AiExplainButton from 'src/components/ai/AiExplainButton.vue';
import { useAlertInvestigation } from 'src/composables/v36/useAlertInvestigation';
import { ROUTE_NAMES } from 'src/router/route-names';
import { resetLoaderScrollLock } from 'src/composables/useLoaderScrollLock';
import { ASSISTANT_EXPLAIN_AI_EVENT, ASSISTANT_EVIDENCE_PAYLOAD_EVENT, ASSISTANT_ADVANCED_CONTEXT_EVENT } from 'src/constants/events';
import type { V36NextEventPrediction } from 'src/types/analytics';
import {
  formatBooleanYesNo,
  formatDate,
  formatDurationMs,
  formatNullableScore,
  formatNumber,
  formatPercent,
  formatSessionEndReason,
  riskLevelDisplay,
  riskTone,
  safeRecord,
  sessionEndReasonTone,
  sourceInfoBanner,
} from 'src/utils/format';

const route = useRoute();
const router = useRouter();
const { t } = useI18n();

const eventId = computed(() => String(route.params.eventId ?? ''));
const { data: alert, loading, error, refresh, source, warnings } = useAlertInvestigation(eventId);

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

const stringValue = (value: unknown, fallback = t('common.notAvailable')): string => {
  if (value == null || value === '') return fallback;
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (typeof value === 'object') return JSON.stringify(value);
  return fallback;
};

const metadataFields = computed(() => {
  const metadata = alert.value?.eventMetadata;
  if (!metadata) return [{ label: t('v36.common.eventMetadata'), value: t('v36.investigation.metadataNotAvailable') }];
  return [
    [t('v36.common.eventAction'), metadata.eventAction],
    [t('v36.common.apiTemplate'), metadata.apiTemplate],
    [t('v36.common.apiFamily'), metadata.apiFamily],
    [t('v36.common.country'), metadata.country],
    [t('v36.common.device'), metadata.device],
    [t('v36.common.browser'), metadata.browser],
    [t('v36.common.os'), metadata.os],
    [t('v36.common.httpMethod'), metadata.httpMethod],
    [t('v36.common.status'), metadata.status],
  ].map(([label, value]) => ({ label: String(label), value: stringValue(value) }));
});

const modelScoreFields = computed(() => {
  const scores = alert.value?.modelScores;
  if (!scores) return [];
  const fields: { label: string; value: string }[] = [];
  const scoreFields = [
    { label: t('v36.investigation.xgboostAnomalyScore'), key: 'xgboostAnomalyScore100' as const },
    { label: t('v36.investigation.lightgbmAlertScore'), key: 'lightgbmAlertScore100' as const },
    { label: t('v36.investigation.transformerRiskScore'), key: 'transformerRiskScore100' as const },
    { label: t('v36.investigation.tcnRiskScore'), key: 'tcnRiskScore100' as const },
    { label: t('v36.investigation.ruleRiskScore'), key: 'ruleRiskScore' as const },
  ];
  for (const field of scoreFields) {
    const value = scores[field.key];
    if (typeof value === 'number') {
      fields.push({ label: field.label, value: formatNullableScore(value) });
    } else if (field.key === 'tcnRiskScore100') {
      fields.push({ label: field.label, value: t('common.notRun') });
    } else {
      fields.push({ label: field.label, value: t('common.notAvailable') });
    }
  }
  return fields;
});

const contributionRows = computed(() =>
  Object.entries(alert.value?.modelContributions ?? {})
    .filter(([key, value]) => key !== 'raw' && typeof value === 'number')
    .map(([label, value]) => ({ label, value: Number(value) })),
);

const sequenceFields = computed(() => {
  const s = alert.value?.sequenceEvidence;
  if (!s) return [];
  const fields: { label: string; value: string }[] = [];
  if (s.selectedSequenceModel) {
    fields.push({ label: t('v36.investigation.selectedSequenceModel'), value: s.selectedSequenceModel });
  }
  if (s.sequenceModelArtifact) {
    fields.push({ label: t('v36.investigation.sequenceModelArtifact'), value: s.sequenceModelArtifact });
  }
  fields.push({ label: t('v36.investigation.contextAvailable'), value: s.contextAvailable ? t('common.yes') : t('common.no') });
  fields.push({ label: t('v36.investigation.windowSize'), value: s.windowSize != null ? String(s.windowSize) : t('common.notAvailable') });
  if (s.sequenceCatScore != null) {
    fields.push({ label: t('v36.investigation.sequenceCatScore'), value: String(s.sequenceCatScore) });
  }
  if (s.sequenceContScore != null) {
    fields.push({ label: t('v36.investigation.sequenceContScore'), value: String(s.sequenceContScore) });
  }
  if (s.sequenceCtxScore != null) {
    fields.push({ label: t('v36.investigation.sequenceCtxScore'), value: String(s.sequenceCtxScore) });
  }
  if (s.sequenceActuallyRanModels?.length) {
    fields.push({ label: t('v36.investigation.sequenceActuallyRanModels'), value: s.sequenceActuallyRanModels.join(', ') });
  }
  if (s.sequenceRunBoth != null) {
    fields.push({ label: t('v36.investigation.sequenceRunBoth'), value: s.sequenceRunBoth ? t('common.yes') : t('common.no') });
  }
  if (s.transformerUsedInFusion != null) {
    fields.push({ label: t('v36.investigation.transformerUsedInFusion'), value: s.transformerUsedInFusion ? t('common.yes') : t('common.no') });
  }
  if (s.tcnUsedInFusion != null) {
    fields.push({ label: t('v36.investigation.tcnUsedInFusion'), value: s.tcnUsedInFusion ? t('common.yes') : t('common.no') });
  }
  if (s.transformerRiskScore100 != null) {
    fields.push({ label: t('v36.investigation.transformerRiskScore'), value: formatNullableScore(s.transformerRiskScore100) });
  }
  if (s.tcnRiskScore100 != null) {
    fields.push({ label: t('v36.investigation.tcnRiskScore'), value: formatNullableScore(s.tcnRiskScore100) });
  } else if (s.transformerRiskScore100 != null) {
    fields.push({ label: t('v36.investigation.tcnRiskScore'), value: t('common.notRun') });
  }
  return fields;
});

const topSurpriseFieldsItems = computed(() => {
  const s = alert.value?.sequenceEvidence;
  if (!s) return [];
  if (s.topSurpriseFields?.length) {
    return s.topSurpriseFields.map((item, idx) => ({
      key: `topSurpriseFields-${idx}`,
      label: t('v36.investigation.surpriseField'),
      value: item,
    }));
  }
  if (s.topSequenceSurpriseFields?.length) {
    return s.topSequenceSurpriseFields.map((item, idx) => ({
      key: `topSequenceSurpriseFields-${idx}`,
      label: stringValue(item.field, t('v36.investigation.surpriseField')),
      value: `${stringValue(item.value, '')} (${item.score != null ? formatNullableScore(item.score) : t('common.notAvailable')})`,
    }));
  }
  return [];
});

const triggeredRuleCodes = computed(() =>
  alert.value?.triggeredRules
    ?? alert.value?.ruleEvidence?.triggeredRules
    ?? [],
);

const ruleContributions = computed(() => alert.value?.ruleEvidence?.ruleContributions ?? null);

const hasTriggeredRules = computed(() => triggeredRuleCodes.value.length > 0);

const hasRuleContributionDetails = computed(() =>
  !!ruleContributions.value && Object.keys(ruleContributions.value).length > 0,
);

const ruleRows = computed(() =>
  Object.entries(ruleContributions.value ?? {}).map(([label, value]) => ({
    label,
    value,
  })),
);

const listLabel = (items: string[] | undefined) => (items?.length ? items.join(', ') : t('common.none'));
const objectCount = (value: unknown) => formatNumber(Object.keys(safeRecord(value)).length);
const scoreProgress = (score: number | undefined) => Math.max(0, Math.min(1, (score ?? 0) / 100));

const sessionLifecycleData = computed(() => {
  const detail = alert.value;
  if (detail?.sessionLifecycle) return detail.sessionLifecycle;
  return {
    sessionEndReason: detail?.sessionEndReason ?? null,
    sessionEndedExplicitly: detail?.sessionEndedExplicitly ?? null,
    sessionEndedAt: detail?.sessionEndedAt ?? null,
    sessionDurationMs: detail?.sessionDurationMs ?? null,
    sessionEventCount: detail?.sessionEventCount ?? null,
  };
});

const hasSessionLifecycle = computed(() =>
  sessionLifecycleData.value.sessionEndReason != null ||
  sessionLifecycleData.value.sessionEndedExplicitly != null ||
  sessionLifecycleData.value.sessionEndedAt != null ||
  sessionLifecycleData.value.sessionDurationMs != null ||
  sessionLifecycleData.value.sessionEventCount != null,
);

const evidence = computed(() => alert.value?.nextEventPredictionEvidence ?? null);
const deviation = computed(() => evidence.value?.deviation ?? null);
const previousPrediction = computed(() => deviation.value?.previousPrediction ?? null);
const prediction = computed(() => evidence.value?.prediction ?? null);
const predictionAfterEvent = computed(() => evidence.value?.predictionAfterEvent ?? null);


const hasDeviationWithPreviousPrediction = computed(() =>
  !!deviation.value && !!previousPrediction.value?.heads
);

const hasDeviationWithoutPreviousPrediction = computed(() =>
  !!deviation.value && !previousPrediction.value?.heads
);

const hasPredictionOnly = computed(() =>
  !!evidence.value?.prediction?.heads
  && !evidence.value?.deviation
  && !evidence.value?.prediction?.deviation
);



const hasNextEventPredictionEvidence = computed(() =>
  hasDeviationWithPreviousPrediction.value || hasDeviationWithoutPreviousPrediction.value || hasPredictionOnly.value
);

const formatPredictionProb = (prob: number): string => {
  if (prob == null) return t('common.notAvailable');
  return `${(prob * 100).toFixed(1)}%`;
};

const UNK_TOKENS = new Set(['UNK_0', 'UNK', '<unk>', 'PAD', 'MASK']);

const cleanPredictedValue = (value: string): string =>
  UNK_TOKENS.has(value) ? t('common.unknownToken') : value;

const predictionTopHead = (predObj: V36NextEventPrediction | null, head: string): string => {
  const items = predObj?.heads?.[head];
  if (!items?.length) return '';
  const meaningful = items.filter(item => !UNK_TOKENS.has(item.value));
  const first = meaningful.length > 0 ? meaningful[0] : items[0];
  if (!first) return '';
  return `${cleanPredictedValue(first.value)} (${formatPredictionProb(first.probability)})`;
};

const deviationActualKeys = computed(() => {
  if (!deviation.value?.actual) return [];
  const order = ['frontend_action_name', 'action_value', 'page', 'api_template', 'api_family', 'http_method', 'status'];
  return order.filter(k => k in deviation.value!.actual!);
});

const deviationFieldLabel = (key: string): string => {
  const labels: Record<string, string> = {
    frontend_action_name: t('v36.nextEventPrediction.fields.frontendActionName'),
    action_value: t('v36.nextEventPrediction.fields.actionValue'),
    page: t('v36.nextEventPrediction.fields.page'),
    api_template: t('v36.nextEventPrediction.fields.apiTemplate'),
    api_family: t('v36.nextEventPrediction.fields.apiFamily'),
    http_method: t('v36.nextEventPrediction.fields.httpMethod'),
    status: t('v36.nextEventPrediction.fields.status'),
  };
  return labels[key] ?? key.replaceAll('_', ' ');
};

const deviationFieldHelp = (key: string): string => {
  const help: Record<string, string> = {
    frontend_action_name: t('v36.nextEventPrediction.help.fieldAction'),
    action_value: t('v36.nextEventPrediction.help.fieldActionValue'),
    page: t('v36.nextEventPrediction.help.fieldPage'),
    api_template: t('v36.nextEventPrediction.help.fieldApi'),
    api_family: t('v36.nextEventPrediction.help.fieldApiFamily'),
    http_method: t('v36.nextEventPrediction.help.fieldHttpMethod'),
    status: t('v36.nextEventPrediction.help.fieldStatus'),
  };
  return help[key] ?? '';
};

const deviationMatchLabel = (rawKey: string): string => {
  const cleanKey = rawKey.endsWith('TopK') ? rawKey.slice(0, -4) : rawKey;
  return deviationFieldLabel(cleanKey);
};

const deviationInterpretation = computed(() => {
  const total = deviationMatchTotal.value;
  const matched = deviationMatchCount.value;
  if (total === 0) return '';
  const ratio = matched / total;
  if (ratio <= 0.3) return t('v36.nextEventPrediction.interpretation.mostlyUnexpected', { matched, total });
  if (ratio <= 0.7) return t('v36.nextEventPrediction.interpretation.partiallyExpected', { matched, total });
  return t('v36.nextEventPrediction.interpretation.mostlyExpected', { matched, total });
});

const deviationMatchCount = computed(() => {
  if (!deviation.value?.predictionMatch) return 0;
  return Object.values(deviation.value.predictionMatch).filter(Boolean).length;
});

const deviationMatchTotal = computed(() => {
  if (!deviation.value?.predictionMatch) return 0;
  return Object.values(deviation.value.predictionMatch).length;
});

const advancedExpanded = ref(false);

const hasForecastValues = computed(() => {
  const fc = alert.value?.forecastContext;
  return (fc?.predictedTotalEvents != null)
    || (fc?.predictedAnomalyRate != null)
    || (fc?.expectedAlertVolume != null);
});

onMounted(() => {
  document.addEventListener(ASSISTANT_EVIDENCE_PAYLOAD_EVENT, handleAssistantEvidencePayload);
  document.addEventListener(ASSISTANT_ADVANCED_CONTEXT_EVENT, handleAssistantAdvancedContext);
});

onBeforeUnmount(() => {
  resetLoaderScrollLock();
  document.removeEventListener(ASSISTANT_EVIDENCE_PAYLOAD_EVENT, handleAssistantEvidencePayload);
  document.removeEventListener(ASSISTANT_ADVANCED_CONTEXT_EVENT, handleAssistantAdvancedContext);
});

const handleAssistantEvidencePayload = () => {
  document.dispatchEvent(new CustomEvent(ASSISTANT_EXPLAIN_AI_EVENT, { bubbles: true }));
};

const handleAssistantAdvancedContext = () => {
  advancedExpanded.value = true;
};

</script>

// ---- Styles ----
<style scoped>
.neo-v36-grid {
  display: grid;
  gap: var(--neo-space-4);
  grid-template-columns: repeat(12, minmax(0, 1fr));
}

.neo-v36-grid > .neo-analytics-panel,
.neo-v36-grid > .neo-card,
.neo-v36-grid > .neo-skeleton-card {
  grid-column: span 6;
}

.neo-v36-grid > .neo-v36-wide {
  grid-column: 1 / -1;
}

.neo-v36-alert-header {
  display: flex;
  justify-content: space-between;
  gap: var(--neo-space-5);
  align-items: center;
}

.neo-v36-alert-header h2 {
  margin: 10px 0 4px;
  font-size: 28px;
  overflow-wrap: anywhere;
  word-break: break-word;
}

.neo-v36-alert-header p {
  margin: 0;
  color: var(--neo-ink-muted);
}

.neo-v36-header-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--neo-space-3);
}

.neo-v36-score {
  min-width: 220px;
}

.neo-v36-score span,
.neo-v36-score strong {
  display: block;
}

.neo-v36-score span {
  color: var(--neo-ink-muted);
  font-size: 12px;
}

.neo-v36-score strong {
  margin: 8px 0 12px;
  font-size: 34px;
  font-weight: 800;
}

.neo-v36-fact-grid {
  display: grid;
  gap: var(--neo-space-3);
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
  overflow-wrap: anywhere;
  word-break: break-word;
}

.neo-v36-fact strong,
.neo-v36-list-row strong {
  margin-top: 7px;
  overflow-wrap: anywhere;
}

.neo-v36-list {
  display: grid;
  gap: var(--neo-space-3);
}

.neo-v36-persona-compact {
  padding: var(--neo-space-3);
  border: 1px dashed var(--neo-border-color);
  border-radius: var(--neo-radius-card);
  color: var(--neo-ink-muted);
  font-size: 12px;
}

.neo-v36-advanced-section {
  margin-top: var(--neo-space-4);
}

.neo-v36-warning {
  margin-top: var(--neo-space-4);
  border: 1px solid rgba(251, 191, 36, 0.28);
  border-radius: var(--neo-radius-card);
  background: var(--neo-warning-bg);
  color: var(--neo-warning-contrast);
}

.neo-v36-explanation {
  padding: var(--neo-space-4);
  border: var(--neo-border);
  border-radius: var(--neo-radius-card);
  background: var(--neo-card-bg-tint);
  line-height: 1.6;
}

.neo-v36-explanation h4 {
  margin: 0 0 10px;
}

.neo-v36-evidence-card {
  color: var(--neo-ink);
  background: var(--neo-surface);
}

.neo-v36-json {
  min-height: 70vh;
  margin: 0;
  padding: var(--neo-space-4);
  overflow: auto;
  border: var(--neo-border);
  border-radius: var(--neo-radius-card);
  background: #101820;
  color: #e8f1f5;
  font-size: 12px;
}

.neo-v36-section-label {
  color: var(--neo-ink-muted);
  font-size: 11px;
  text-transform: uppercase;
  margin-bottom: 6px;
}

.neo-v36-chip-row {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 12px;
}

.neo-v36-rule-chip {
  font-size: 12px;
}

.neo-v36-missing-banner {
  background: rgba(255, 255, 255, 0.04);
  color: var(--neo-ink-muted);
  font-size: 13px;
}

.neo-v36-empty-rules {
  color: var(--neo-ink-muted);
  font-size: 13px;
  padding: 4px 0;
}

@media (max-width: 900px) {
  .neo-v36-grid > .neo-analytics-panel,
  .neo-v36-grid > .neo-card,
  .neo-v36-grid > .neo-skeleton-card {
    grid-column: 1 / -1;
  }

  .neo-v36-alert-header {
    align-items: stretch;
    flex-direction: column;
  }
}
</style>
