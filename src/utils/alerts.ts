import type { SecurityAlert } from 'src/types/soc';

export type Severity = 'High' | 'Medium' | 'Low';

// Map alert scores to human-friendly severity buckets.
export const severityLabel = (alert: SecurityAlert): Severity => {
  if (alert.anomalyScore == null || alert.thresholdUsed == null) return 'Low';
  if (alert.anomalyScore >= alert.thresholdUsed * 1.25) return 'High';
  if (alert.anomalyScore >= alert.thresholdUsed) return 'Medium';
  return 'Low';
};

// Align severity with Quasar color tokens.
export const severityColor = (alert: SecurityAlert) => {
  const severity = severityLabel(alert);
  if (severity === 'High') return 'negative';
  if (severity === 'Medium') return 'warning';
  return 'positive';
};

// Flag alerts that breach their configured threshold.
export const isAboveThreshold = (alert: SecurityAlert) =>
  alert.anomalyScore != null &&
  alert.thresholdUsed != null &&
  alert.anomalyScore >= alert.thresholdUsed;

// Normalize numeric scores for UI display.
export const formatScore = (value: number | null) =>
  value == null ? '0.00' : value.toFixed(2);

// Format ISO timestamps into the UI locale.
export const formatDate = (value: string | null) => {
  if (!value) return 'n/a';
  const date = new Date(value);
  return new Intl.DateTimeFormat('en-GB', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
};
