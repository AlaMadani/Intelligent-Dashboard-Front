export interface NormalizedCountryTelemetry {
  label: string;
  count: number;
  display?: string;
}

const toNumber = (value: unknown) => {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isNaN(parsed) ? null : parsed;
  }
  return null;
};

const normalizeRankedCountries = (
  values: unknown[],
  limit: number
): NormalizedCountryTelemetry[] => {
  const labels = values
    .map((value) => (typeof value === 'string' ? value.trim() : ''))
    .filter((value) => value.length > 0)
    .slice(0, limit);

  const total = labels.length;
  return labels.map((label, index) => ({
    label,
    count: Math.max(total - index, 1),
    display: `Rank ${index + 1}`,
  }));
};

export const normalizeCountryTelemetry = (
  raw: unknown,
  limit = 6
): NormalizedCountryTelemetry[] => {
  if (!raw) return [];

  if (Array.isArray(raw)) {
    if (raw.every((value) => typeof value === 'string')) {
      return normalizeRankedCountries(raw, limit);
    }

    return raw
      .flatMap((value) => {
        if (!value || typeof value !== 'object' || Array.isArray(value)) return [];
        const record = value as Record<string, unknown>;
        const label =
          typeof record.label === 'string'
            ? record.label
            : typeof record.country === 'string'
              ? record.country
              : typeof record.code === 'string'
                ? record.code
                : '';
        const count = toNumber(record.count) ?? toNumber(record.value) ?? null;
        if (!label || count == null) return [];
        return [{ label, count }];
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  }

  if (typeof raw !== 'object') return [];

  const entries = Object.entries(raw as Record<string, unknown>);
  if (!entries.length) return [];

  const looksLikeIndexedList = entries.every(([key, value]) => /^\d+$/.test(key) && typeof value === 'string');
  if (looksLikeIndexedList) {
    return normalizeRankedCountries(
      entries
        .sort((a, b) => Number(a[0]) - Number(b[0]))
        .map(([, value]) => value),
      limit
    );
  }

  return entries
    .flatMap(([label, value]) => {
      const count = toNumber(value);
      if (count == null) return [];
      return [{ label, count }];
    })
    .sort((a, b) => b.count - a.count)
    .slice(0, limit)
    .map((item) => ({
      ...item,
      display: item.count.toLocaleString('en-GB'),
    }));
};

export const formatTimelineLabel = (value: string | null | undefined, fallback: string) => {
  if (!value) return fallback;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return fallback;
  return new Intl.DateTimeFormat('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};
