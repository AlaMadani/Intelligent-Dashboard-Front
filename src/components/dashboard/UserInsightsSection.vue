<template>
  <!-- User intelligence page: lookup insured context, predictions, and active anomaly status. -->
  <section id="insights" class="neo-section neo-investigation">
    <div class="neo-section-header">
      <div>
        <div class="neo-section-title">User intelligence</div>
        <div class="neo-section-subtitle">
          Pull the latest risk profile, predicted actions, and active anomalies for an insured.
        </div>
      </div>
    </div>

    <!-- Three panels split the insured lookup, predicted actions, and active anomaly snapshot. -->
    <div class="neo-investigation-grid">
      <div class="neo-panel">
        <div class="neo-panel-header">
          <div>
            <div class="neo-panel-title">Lookup insured</div>
            <div class="neo-panel-subtitle">Risk profile + next actions</div>
          </div>
          <div class="neo-panel-actions">
            <q-input
              dense
              outlined
              v-model="insuredModel"
              placeholder="Insured ID"
              class="neo-input-compact"
            />
            <q-btn
              color="primary"
              unelevated
              icon="search"
              label="Load"
              :loading="loading"
              @click="emit('load')"
            />
          </div>
        </div>

        <div v-if="error" class="neo-error">{{ error }}</div>
        <div v-else-if="!riskProfile" class="neo-placeholder">
          Enter an insured ID to view live risk context.
        </div>
        <div v-else class="neo-explanation">
          <div class="neo-explanation-meta">
            <div>
              <div class="neo-explanation-label">Risk tier</div>
              <div class="neo-explanation-value">{{ riskProfile.riskTier ?? 'n/a' }}</div>
            </div>
            <div>
              <div class="neo-explanation-label">Anomaly rate (30d)</div>
              <div class="neo-explanation-value">
                {{ formatPercent(riskProfile.anomalyRate30d, 1) }}
              </div>
            </div>
            <div>
              <div class="neo-explanation-label">Sessions (30d)</div>
              <div class="neo-explanation-value">{{ riskProfile.sessions30d ?? 0 }}</div>
            </div>
            <div>
              <div class="neo-explanation-label">Last anomaly</div>
              <div class="neo-explanation-value">
                {{ riskProfile.lastAnomalyType || 'n/a' }}
              </div>
            </div>
            <div>
              <div class="neo-explanation-label">Last updated</div>
              <div class="neo-explanation-value">{{ formatDate(riskProfile.lastUpdated) }}</div>
            </div>
            <div>
              <div class="neo-explanation-label">Anomalies (7d)</div>
              <div class="neo-explanation-value">{{ riskProfile.anomalyCount7d ?? 0 }}</div>
            </div>
            <div>
              <div class="neo-explanation-label">Anomalies (30d)</div>
              <div class="neo-explanation-value">{{ riskProfile.anomalyCount30d ?? 0 }}</div>
            </div>
            <div>
              <div class="neo-explanation-label">Sessions (7d)</div>
              <div class="neo-explanation-value">{{ riskProfile.sessions7d ?? 0 }}</div>
            </div>
            <div>
              <div class="neo-explanation-label">Most frequent action (30d)</div>
              <div class="neo-explanation-value">
                {{ riskProfile.mostFrequentAction30d || 'n/a' }}
              </div>
            </div>
            <div>
              <div class="neo-explanation-label">Avg session (30d)</div>
              <div class="neo-explanation-value">
                {{ formatDurationSeconds(riskProfile.avgSessionDuration30d) }}
              </div>
            </div>
          </div>

          <div class="neo-analytics-meta">
            Consecutive clean sessions: {{ riskProfile.consecutiveCleanSessions ?? 0 }}
          </div>
        </div>
      </div>

      <div class="neo-panel neo-panel-contrast">
        <div class="neo-panel-header">
          <div>
            <div class="neo-panel-title">Predicted next actions</div>
            <div class="neo-panel-subtitle">Top-3 model output</div>
          </div>
        </div>

        <div v-if="!nextActions?.top3Actions?.length" class="neo-placeholder">
          No next-action predictions available.
        </div>
        <div v-else class="neo-analytics-list">
          <div v-for="action in nextActions.top3Actions" :key="action" class="neo-analytics-row">
            <span>{{ action }}</span>
          </div>
        </div>
      </div>

      <div class="neo-panel neo-panel-sequence">
        <div class="neo-panel-header">
          <div>
            <div class="neo-panel-title">Active anomaly</div>
            <div class="neo-panel-subtitle">Latest alert if present</div>
          </div>
        </div>

        <div v-if="!activeAnomaly" class="neo-placeholder">No active anomaly for this insured.</div>
        <div v-else class="neo-explanation">
          <div class="neo-explanation-meta">
            <div>
              <div class="neo-explanation-label">Tier</div>
              <div class="neo-explanation-value">{{ activeAnomaly.anomalyTier }}</div>
            </div>
            <div>
              <div class="neo-explanation-label">Type</div>
              <div class="neo-explanation-value">{{ activeAnomaly.anomalyType }}</div>
            </div>
            <div>
              <div class="neo-explanation-label">Score</div>
              <div class="neo-explanation-value">
                {{ formatScore(activeAnomaly.anomalyScore) }}
              </div>
            </div>
            <div>
              <div class="neo-explanation-label">Detected</div>
              <div class="neo-explanation-value">
                {{ formatDate(activeAnomaly.detectedAt) }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
// Parent-managed state feeds the insured lookup while this component remains presentation-focused.
import { computed } from 'vue';
import type {
  AnomalyAlertDto,
  NextActionPredictionDto,
  UserRiskProfileDto,
} from 'src/types/analytics';
import { formatDate, formatPercent, formatScore, formatDurationSeconds } from 'src/utils/format';

const props = defineProps<{
  insuredId: string;
  riskProfile: UserRiskProfileDto | null;
  nextActions: NextActionPredictionDto | null;
  activeAnomaly: AnomalyAlertDto | null;
  loading: boolean;
  error: string;
}>();

const emit = defineEmits<{
  (event: 'update:insuredId', value: string): void;
  (event: 'load'): void;
}>();

// Computed setter keeps the insured ID input synchronized with the shared store.
const insuredModel = computed({
  get: () => props.insuredId,
  set: (value: string) => emit('update:insuredId', value),
});
</script>
