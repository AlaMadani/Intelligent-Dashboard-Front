import { i18n } from 'src/boot/i18n';

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
export const formatScore = (value: number | null | undefined) =>
  formatNumber(value ?? 0, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

export const formatDate = (value: string | null | undefined) => {
  if (!value) return i18n.global.t('common.notAvailable');
  const date = new Date(value);
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
