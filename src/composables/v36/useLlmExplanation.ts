import { computed, type Ref, ref, shallowRef, watch } from 'vue';
import { i18n } from 'src/boot/i18n';
import {
  generateV36Explanation,
  getV36CachedExplanation,
  getV36LlmEvidence,
  isNotFoundError,
  normalizeApiError,
} from 'src/services/analytics';
import type {
  V36LlmEvidencePayload,
  V36LlmExplanationRequest,
  V36LlmExplanationResponse,
} from 'src/types/analytics';

export const useLlmExplanation = (eventId: Ref<string>) => {
  // ---- State ----
  const explanation = shallowRef<V36LlmExplanationResponse | null>(null);
  const evidence = shallowRef<V36LlmEvidencePayload | null>(null);
  const loading = ref(false);
  const evidenceLoading = ref(false);
  const generating = ref(false);
  const error = ref('');
  const evidenceError = ref('');
  const lastUpdated = ref<Date | null>(null);

  // ---- Computed ----
  const fallback = computed(
    () => Boolean(explanation.value?.fallback) || explanation.value?.source === 'provider_error_fallback',
  );

  // ---- Methods ----
  const loadCached = async () => {
    const currentEventId = eventId.value.trim();
    if (!currentEventId) return;

    loading.value = true;
    error.value = '';

    try {
      const response = await getV36CachedExplanation(currentEventId);
      explanation.value = response.data ?? null;
      lastUpdated.value = new Date();
    } catch (err) {
      if (isNotFoundError(err)) {
        explanation.value = null;
        return;
      }
      error.value = normalizeApiError(err).message;
    } finally {
      loading.value = false;
    }
  };

  const loadEvidence = async () => {
    const currentEventId = eventId.value.trim();
    if (!currentEventId) return;

    evidenceLoading.value = true;
    evidenceError.value = '';

    try {
      const response = await getV36LlmEvidence(currentEventId);
      evidence.value = response.data ?? null;
    } catch (err) {
      evidenceError.value = normalizeApiError(err).message;
      evidence.value = null;
    } finally {
      evidenceLoading.value = false;
    }
  };

  const generate = async (request: V36LlmExplanationRequest = {}) => {
    const currentEventId = eventId.value.trim();
    if (!currentEventId) return;

    generating.value = true;
    error.value = '';

    try {
      const response = await generateV36Explanation(currentEventId, {
        forceRefresh: false,
        style: 'security_analyst',
        language: 'fr',
        includeRecommendedActions: true,
        ...request,
      });
      explanation.value = response.data ?? null;
      lastUpdated.value = new Date();
    } catch (err) {
      const normalized = normalizeApiError(err);
      if (normalized.status === 409) {
        error.value = i18n.global.t('v36.llm.generationInProgress');
      } else if (normalized.status === 404) {
        error.value = i18n.global.t('v36.llm.evidenceUnavailable');
      } else {
        error.value = normalized.message;
      }
    } finally {
      generating.value = false;
    }
  };

  // ---- Watchers ----
  watch(
    eventId,
    () => {
      explanation.value = null;
      evidence.value = null;
      void loadCached();
    },
    { immediate: true },
  );

  // ---- Return ----
  return {
    explanation,
    evidence,
    loading,
    evidenceLoading,
    generating,
    error,
    evidenceError,
    fallback,
    loadCached,
    loadEvidence,
    generate,
    lastUpdated,
  };
};
