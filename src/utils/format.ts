// Shared value formatters keep scores, dates, percentages, and durations consistent in the UI.
export const formatScore = (value: number | null | undefined) =>
  value == null ? '0.00' : value.toFixed(2);

export const formatDate = (value: string | null | undefined) => {
  if (!value) return 'n/a';
  const date = new Date(value);
  return new Intl.DateTimeFormat('en-GB', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
};

export const formatPercent = (value: number | null | undefined, digits = 1) => {
  if (value == null || Number.isNaN(value)) return 'n/a';
  return `${(value * 100).toFixed(digits)}%`;
};

// Duration formatting compresses raw seconds into human-readable hour/minute/second text.
export const formatDurationSeconds = (value: number | null | undefined) => {
  if (value == null || Number.isNaN(value)) return 'n/a';
  const total = Math.max(0, Math.round(value));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
};
