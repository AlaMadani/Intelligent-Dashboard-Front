import { computed, readonly, ref, shallowRef } from 'vue';
import { i18n } from 'src/boot/i18n';
import {
  generateV36Explanation,
  getV36CachedExplanation,
  getV36LlmEvidence,
  isNotFoundError,
  normalizeApiError,
} from 'src/services/analytics';
import { normalizeExplanationPayload } from 'src/utils/format';
import type {
  V36LlmEvidencePayload,
  V36LlmExplanationRequest,
  V36LlmExplanationResponse,
} from 'src/types/analytics';
import type { AiExplainerContent, AiExplainerOpenOptions } from 'src/types/aiExplainer';

const visible = ref(false);
const loading = ref(false);
const generating = ref(false);
const evidenceLoading = ref(false);
const error = ref('');
const evidenceError = ref('');
const fallback = ref(false);
const content = ref<AiExplainerContent | null>(null);
const explanation = shallowRef<V36LlmExplanationResponse | null>(null);
const evidence = shallowRef<V36LlmEvidencePayload | null>(null);
const currentEventId = ref<string | null>(null);

const normalizedExplanation = computed(() => normalizeExplanationPayload(explanation.value));

const notAvailableLabel = () => i18n.global.t('common.notAvailable');

const interpolate = (template: string, params: Record<string, string | number | undefined | null>) =>
  template.replace(/\{(\w+)\}/g, (_, key: string) => {
    const value = params[key];
    return value == null || value === '' ? notAvailableLabel() : String(value);
  });

const resolveStaticContent = (
  contextKey: string,
  params: Record<string, string | number | undefined | null> = {},
): AiExplainerContent => {
  const translate = (key: string) => i18n.global.t(key);
  const hasKey = (key: string) => i18n.global.te(key);
  const base = `aiExplainer.contexts.${contextKey}`;

  if (!hasKey(`${base}.target`)) {
    return {
      target: interpolate(translate('aiExplainer.fallback.target'), { context: contextKey }),
      summary: translate('aiExplainer.fallback.summary'),
      threat: translate('aiExplainer.fallback.threat'),
      recommendation: translate('aiExplainer.fallback.recommendation'),
    };
  }

  return {
    target: interpolate(translate(`${base}.target`), params),
    summary: interpolate(translate(`${base}.summary`), params),
    threat: interpolate(translate(`${base}.threat`), params),
    recommendation: interpolate(translate(`${base}.recommendation`), params),
  };
};

const mapLlmResponse = (
  response: V36LlmExplanationResponse,
  targetLabel: string,
): AiExplainerContent => {
  const summaryParts = [
    response.summary,
    ...(response.evidenceBullets?.length ? ['', ...response.evidenceBullets.map((b) => `• ${b}`)] : []),
  ].filter(Boolean);

  return {
    target: targetLabel,
    summary: summaryParts.join('\n'),
    threat: response.possibleInterpretation ?? i18n.global.t('aiExplainer.fallback.threat'),
    recommendation:
      response.recommendedActions?.join(' ') ??
      i18n.global.t('aiExplainer.fallback.recommendation'),
  };
};

const loadEventExplanation = async (eventId: string, targetLabel: string) => {
  loading.value = true;
  error.value = '';
  fallback.value = false;
  explanation.value = null;
  evidence.value = null;

  try {
    let response: V36LlmExplanationResponse | null = null;

    try {
      const cached = await getV36CachedExplanation(eventId);
      response = cached.data ?? null;
    } catch (err) {
      if (!isNotFoundError(err)) {
        throw err;
      }
    }

    if (!response) {
      generating.value = true;
      const generated = await generateV36Explanation(eventId, {
        forceRefresh: false,
        style: 'security_analyst',
        language: 'fr',
        includeRecommendedActions: true,
      });
      response = generated.data ?? null;
    }

    explanation.value = response;

    if (!response) {
      error.value = i18n.global.t('dashboardState.errors.explanationMissing');
      content.value = resolveStaticContent('alert-event-fallback', { eventId });
      return;
    }

    fallback.value = Boolean(response.fallback);
    content.value = mapLlmResponse(response, targetLabel);
  } catch (err) {
    error.value = normalizeApiError(err).message;
    content.value = resolveStaticContent('alert-event-fallback', { eventId });
  } finally {
    loading.value = false;
    generating.value = false;
  }
};

const generate = async (request: V36LlmExplanationRequest = {}) => {
  const eventId = currentEventId.value?.trim();
  if (!eventId) return;

  generating.value = true;
  error.value = '';

  try {
    const response = await generateV36Explanation(eventId, {
      forceRefresh: false,
      style: 'security_analyst',
      language: 'fr',
      includeRecommendedActions: true,
      ...request,
    });
    explanation.value = response.data ?? null;
    if (response.data) {
      fallback.value = Boolean(response.data.fallback);
      const targetLabel = content.value?.target ?? i18n.global.t('aiExplainer.eventTarget');
      content.value = mapLlmResponse(response.data, targetLabel);
    }
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

const loadEvidence = async () => {
  const eventId = currentEventId.value?.trim();
  if (!eventId) return;

  evidenceLoading.value = true;
  evidenceError.value = '';

  try {
    const response = await getV36LlmEvidence(eventId);
    evidence.value = response.data ?? null;
  } catch (err) {
    evidenceError.value = normalizeApiError(err).message;
    evidence.value = null;
  } finally {
    evidenceLoading.value = false;
  }
};

export const useAiExplainer = () => {
  const open = async (options: AiExplainerOpenOptions) => {
    const params = options.params ?? {};
    const eventId = options.eventId?.trim() || null;
    currentEventId.value = eventId;
    error.value = '';
    evidenceError.value = '';
    fallback.value = false;
    explanation.value = null;
    evidence.value = null;
    visible.value = true;

    if (eventId) {
      const targetLabel =
        options.content?.target ??
        interpolate(i18n.global.t('aiExplainer.eventTarget'), {
          eventId,
          anomalyType: params.anomalyType,
          riskLevel: params.riskLevel,
        });
      content.value = {
        target: targetLabel,
        summary: i18n.global.t('aiExplainer.loadingSummary'),
        threat: '…',
        recommendation: '…',
      };
      await loadEventExplanation(eventId, targetLabel);
      if (options.content) {
        content.value = { ...content.value, ...options.content };
      }
      return;
    }

    const resolved = resolveStaticContent(options.contextKey, params);
    content.value = {
      ...resolved,
      ...options.content,
    };
  };

  const close = () => {
    visible.value = false;
  };

  const deploySafeguards = () => {
    close();
    return i18n.global.t('aiExplainer.safeguardsDeployed');
  };

  return {
    visible: readonly(visible),
    loading: readonly(loading),
    generating: readonly(generating),
    evidenceLoading: readonly(evidenceLoading),
    error: readonly(error),
    evidenceError: readonly(evidenceError),
    fallback: readonly(fallback),
    content: readonly(content),
    explanation: readonly(explanation),
    normalizedExplanation,
    evidence: readonly(evidence),
    currentEventId: readonly(currentEventId),
    open,
    close,
    deploySafeguards,
    generate,
    loadEvidence,
  };
};
