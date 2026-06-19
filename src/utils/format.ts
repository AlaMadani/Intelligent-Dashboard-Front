import { i18n } from 'src/boot/i18n';
import type { NormalizedLlmExplanation, V36LlmExplanationResponse } from 'src/types/analytics';

const DEFAULT_LOCALE = 'en-US';

export const getCurrentLocale = () => {
  const locale: unknown = i18n.global.locale;
  if (typeof locale === 'string' && locale.trim().length > 0) {
    return locale;
  }
  if (
    locale &&
    typeof locale === 'object' &&
    'value' in locale &&
    typeof locale.value === 'string' &&
    locale.value.trim().length > 0
  ) {
    return locale.value;
  }
  return DEFAULT_LOCALE;
};

export const formatNumber = (
  value: number | null | undefined,
  options?: Intl.NumberFormatOptions,
) => {
  if (value == null || Number.isNaN(value)) return i18n.global.t('common.notAvailable');
  return value.toLocaleString(getCurrentLocale(), options);
};

// Shared value formatters keep scores, dates, percentages, and durations consistent in the UI.
export const formatScore = (value: number | null | undefined) => {
  if (value == null || Number.isNaN(value)) return i18n.global.t('common.notAvailable');
  return formatNumber(value, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

export const formatDate = (value: string | null | undefined) => {
  if (!value) return i18n.global.t('common.notAvailable');
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return i18n.global.t('common.notAvailable');
  return new Intl.DateTimeFormat(getCurrentLocale(), {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
};

export const formatPercent = (value: number | null | undefined, digits = 1) => {
  if (value == null || Number.isNaN(value)) return i18n.global.t('common.notAvailable');
  return `${formatNumber(value * 100, {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })}%`;
};

// Duration formatting compresses raw seconds into human-readable hour/minute/second text.
export const formatDurationSeconds = (value: number | null | undefined) => {
  if (value == null || Number.isNaN(value)) return i18n.global.t('common.notAvailable');
  const total = Math.max(0, Math.round(value));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
};

export const formatNullableScore = (value: number | null | undefined, digits = 2) => {
  if (value == null || Number.isNaN(value)) return i18n.global.t('common.notAvailable');
  return formatNumber(value, {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
};

export const safeArray = <T = unknown>(value: unknown): T[] =>
  Array.isArray(value) ? (value as T[]) : [];

export const safeRecord = (value: unknown): Record<string, unknown> =>
  value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};

export const riskTone = (riskLevel: string | null | undefined) => {
  switch (riskLevel?.trim().toUpperCase()) {
    case 'CRITICAL':
      return 'negative';
    case 'HIGH':
      return 'warning';
    case 'MEDIUM':
      return 'orange';
    case 'LOW':
      return 'positive';
    default:
      return 'grey';
  }
};

export const formatNullableNumber = (
  value: number | null | undefined,
  digits = 2,
) => {
  if (value == null || Number.isNaN(value)) return i18n.global.t('common.notAvailable');
  return formatNumber(value, {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
};

export const formatRiskScore = formatNullableNumber;

export const riskLevelFromScore = (
  score: number | null | undefined,
): string | null => {
  if (score == null || Number.isNaN(score)) return null;
  if (score >= 80) return 'CRITICAL';
  if (score >= 60) return 'HIGH';
  if (score >= 35) return 'MEDIUM';
  return 'LOW';
};

export const formatAssignedPartitions = (
  v: string | number | number[] | null | undefined,
): string => {
  if (v == null) return i18n.global.t('common.notAvailable');
  if (Array.isArray(v)) return v.join(', ');
  if (typeof v === 'number') return String(v);
  return v;
};

export const assignedPartitionCount = (
  v: string | number | number[] | null | undefined,
): number | null => {
  if (v == null) return null;
  if (Array.isArray(v)) return v.length;
  if (typeof v === 'number') return v;
  return 1;
};

export const normalizeRiskLevel = (riskLevel: string | null | undefined) =>
  riskLevel?.trim() ? riskLevel.trim().toUpperCase() : i18n.global.t('common.unknown');

export const formatDurationMs = (value: number | null | undefined) => {
  if (value == null || Number.isNaN(value)) return i18n.global.t('common.notAvailable');
  const totalSeconds = Math.max(0, Math.round(value / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`;
  if (minutes > 0) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
};

export const formatSessionEndReason = (value: string | null | undefined) => {
  switch (value) {
    case 'explicit_logout':
      return i18n.global.t('v36.sessionEndReasons.explicit_logout');
    case 'explicit_sso_disconnect':
      return i18n.global.t('v36.sessionEndReasons.explicit_sso_disconnect');
    case 'inactivity_timeout':
      return i18n.global.t('v36.sessionEndReasons.inactivity_timeout');
    case 'max_open_duration':
      return i18n.global.t('v36.sessionEndReasons.max_open_duration');
    default:
      return i18n.global.t('v36.sessionEndReasons.unknown');
  }
};

export const formatLatencyMs = (value: number | null | undefined) => {
  if (value == null || Number.isNaN(value)) return i18n.global.t('common.notAvailable');
  if (value < 1) return `${formatNumber(value, { maximumFractionDigits: 2 })}ms`;
  if (value < 1000) return `${formatNumber(value, { maximumFractionDigits: 0 })}ms`;
  return `${formatNumber(value / 1000, { maximumFractionDigits: 1 })}s`;
};

export const formatBooleanYesNo = (value: boolean | null | undefined) => {
  if (value == null) return i18n.global.t('common.notAvailable');
  return value ? i18n.global.t('common.yes') : i18n.global.t('common.no');
};

const formatSequenceModeValue = (value: string): string => {
  switch (value) {
    case 'normal':
      return i18n.global.t('v36.runtime.sequenceModeNormal');
    case 'rules_only':
      return i18n.global.t('v36.runtime.sequenceModeRulesOnly');
    case 'degraded':
      return i18n.global.t('v36.runtime.sequenceModeDegraded');
    case 'transformer':
      return i18n.global.t('v36.runtime.modelNameTransformer');
    case 'tcn':
      return i18n.global.t('v36.runtime.modelNameTcn');
    case 'insufficient_context':
      return i18n.global.t('v36.runtime.insufficientSequenceContext');
    default:
      return value;
  }
};

export const formatLoadSheddingMode = (value: string | null | undefined) => {
  if (!value) return i18n.global.t('common.notAvailable');
  return formatSequenceModeValue(value);
};

export const formatAutoOffsetReset = (value: string | null | undefined) => {
  if (!value) return i18n.global.t('common.notAvailable');
  switch (value) {
    case 'earliest':
      return i18n.global.t('v36.runtime.kafka.offsetEarliest');
    case 'latest':
      return i18n.global.t('v36.runtime.kafka.offsetLatest');
    case 'none':
      return i18n.global.t('v36.runtime.kafka.offsetNone');
    default:
      return value;
  }
};

export const formatSequenceMode = (value: string | null | undefined) => {
  if (!value) return i18n.global.t('common.notAvailable');
  return formatSequenceModeValue(value);
};

const MODEL_LATENCY_NAMES: Record<string, string> = {
  xgboostMs: i18n.global.t('v36.runtime.modelNameXgboost'),
  lightgbmMs: i18n.global.t('v36.runtime.modelNameLightgbm'),
  catboostMs: i18n.global.t('v36.runtime.modelNameCatboost'),
  oneclasssvmMs: i18n.global.t('v36.runtime.modelNameOneclasssvm'),
  churnMs: i18n.global.t('v36.runtime.modelNameChurn'),
};

export const formatModelLatencyName = (key: string): string =>
  MODEL_LATENCY_NAMES[key] ?? key;

export const formatModelLatencyValue = (value: number | null | undefined): string => {
  if (value == null) return i18n.global.t('common.notAvailable');
  if (value < 1) return i18n.global.t('common.lessThan1ms');
  return formatLatencyMs(value);
};

export const formatThroughput = (value: number | null | undefined): string => {
  if (value == null) return i18n.global.t('v36.runtime.noRecentThroughput');
  return `${formatNumber(value, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/s`;
};

export const formatUnknownRatio = (value: number | null | undefined): string => {
  if (value == null) return i18n.global.t('common.notAvailable');
  return formatPercent(value, 1);
};

export const autoOffsetResetTone = (value: string | null | undefined) => {
  switch (value) {
    case 'latest':
      return 'info';
    case 'earliest':
      return 'warning';
    default:
      return 'grey';
  }
};

export const sessionEndReasonTone = (value: string | null | undefined) => {
  switch (value) {
    case 'explicit_logout':
    case 'explicit_sso_disconnect':
      return 'info';
    case 'inactivity_timeout':
    case 'max_open_duration':
      return 'warning';
    default:
      return 'grey';
  }
};

export const formatModelRunStatus = (
  score: number | null | undefined,
  usedInFusion: boolean | undefined,
) => {
  if (score == null) return i18n.global.t('v36.common.notRun');
  if (usedInFusion === false && score === 0) return formatNumber(0, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return formatNumber(score, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

export const formatSource = (source: string | null | undefined) => {
  if (!source) return i18n.global.t('common.notAvailable');
  switch (source) {
    case 'redis':
      return i18n.global.t('v36.source.redis');
    case 'sql_fallback':
      return i18n.global.t('v36.source.sqlFallback');
    case 'generated_fallback':
      return i18n.global.t('v36.source.generatedFallback');
    case 'sql':
      return i18n.global.t('v36.source.sql');
    case 'sql-payload':
      return i18n.global.t('v36.source.sqlPayload');
    case 'generated':
      return i18n.global.t('v36.source.generated');
    case 'force_generated':
      return i18n.global.t('v36.source.forceGenerated');
    default:
      return source;
  }
};

export const sourceInfoBanner = (
  source: string | null | undefined,
): { message: string; type: 'info' | 'warning' | 'positive' | 'negative' } | null => {
  if (!source) return null;
  switch (source) {
    case 'redis':
      return null;
    case 'sql_fallback':
      return { message: i18n.global.t('v36.source.sqlFallbackMessage'), type: 'info' };
    case 'generated_fallback':
      return { message: i18n.global.t('v36.source.generatedFallbackMessage'), type: 'warning' };
    case 'sql':
      return { message: i18n.global.t('v36.source.sqlMessage'), type: 'info' };
    case 'sql-payload':
      return { message: i18n.global.t('v36.source.sqlPayloadMessage'), type: 'info' };
    default:
      return null;
  }
};

export const sourceTone = (source: string | null | undefined) => {
  if (!source) return 'grey';
  switch (source) {
    case 'redis':
      return 'positive';
    case 'sql_fallback':
      return 'info';
    case 'generated_fallback':
      return 'warning';
    case 'generated':
      return 'info';
    case 'force_generated':
      return 'info';
    default:
      return 'grey';
  }
};

export const riskLevelDisplay = (riskTier: string | null | undefined, riskLevel: string | null | undefined): string | null =>
  riskTier ?? riskLevel ?? null;

const parseJsonFromString = (input: string | null | undefined): Record<string, unknown> | null => {
  if (!input) return null;
  const jsonMatch = input.match(/```json\s*([\s\S]*?)\s*```/);
  const jsonStr = jsonMatch?.[1]?.trim() ?? input.trim();
  if (!jsonStr.startsWith('{')) return null;
  try {
    const parsed = JSON.parse(jsonStr);
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>;
    }
  } catch { /* not JSON */ }
  return null;
};

export const normalizeExplanationPayload = (
  raw: V36LlmExplanationResponse | null | undefined,
): NormalizedLlmExplanation | null => {
  if (!raw) return null;

  const parsed = parseJsonFromString(raw.summary);

  const pick = <T>(top: T | undefined, parsedVal: unknown, fallback: T | null): T | null =>
    top !== undefined ? top ?? null : (parsedVal !== undefined ? (parsedVal as T) ?? null : fallback);

  const pickArray = (top: string[] | undefined, parsedVal: unknown, fallback: string[] | null): string[] | null =>
    top !== undefined ? top ?? null : (Array.isArray(parsedVal) ? (parsedVal as string[]) : fallback);

  const summary = raw.summary
    ? (parsed && typeof parsed.summary === 'string' ? parsed.summary : raw.summary)
    : (parsed && typeof parsed.summary === 'string' ? parsed.summary : null);

  return {
    schemaVersion: raw.schemaVersion ?? null,
    eventId: raw.eventId ?? null,
    generatedAt: raw.generatedAt ?? null,
    provider: raw.provider ?? null,
    model: raw.model ?? null,
    cached: raw.cached ?? null,
    source: raw.source ?? null,
    forceRefresh: raw.forceRefresh ?? null,
    fallback: raw.fallback ?? null,
    evidenceHash: raw.evidenceHash ?? null,
    summary,
    riskNarrative: pick(raw.riskNarrative, parsed?.riskNarrative, null),
    behaviorNarrative: pick(raw.behaviorNarrative, parsed?.behaviorNarrative, null),
    modelNarrative: pick(raw.modelNarrative, parsed?.modelNarrative, null),
    rulesNarrative: pick(raw.rulesNarrative, parsed?.rulesNarrative, null),
    sequenceNarrative: pick(raw.sequenceNarrative, parsed?.sequenceNarrative, null),
    possibleInterpretation: pick(raw.possibleInterpretation, parsed?.possibleInterpretation, null),
    limitations: pick(raw.limitations, parsed?.limitations, null),
    keyEvidenceBullets: pickArray(raw.keyEvidenceBullets, parsed?.keyEvidenceBullets, null),
    evidenceBullets: pickArray(raw.evidenceBullets, parsed?.evidenceBullets, null),
    recommendedActions: pickArray(raw.recommendedActions, parsed?.recommendedActions, null),
    triggeredRulesExplanation: raw.triggeredRulesExplanation ?? (Array.isArray(parsed?.triggeredRulesExplanation) ? parsed.triggeredRulesExplanation as Array<Record<string, unknown>> : null),
    modelScoreExplanation: raw.modelScoreExplanation ?? (parsed?.modelScoreExplanation as Record<string, unknown> | null | undefined) ?? null,
    disclaimer: pick(raw.disclaimer, parsed?.disclaimer, null),
    raw,
  };
};
