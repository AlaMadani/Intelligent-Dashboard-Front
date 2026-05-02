// Dashboard utility helpers reshape raw telemetry into UI-friendly structures.
export interface NormalizedCountryTelemetry {
  label: string;
  count: number;
  display?: string;
}

export interface AnomalyKeySource {
  id?: number | null;
  insuredId?: string | null;
  sessionId?: string | null;
  eventId?: string | null;
  detectedAt?: string | null;
  anomalyType?: string | null;
}

// Coerce mixed backend payload values into numbers whenever possible.
const toNumber = (value: unknown) => {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isNaN(parsed) ? null : parsed;
  }
  return null;
};

// Ranked country arrays are converted into pseudo-counts so they can still be visualized.
const normalizeRankedCountries = (
  values: unknown[],
  limit: number,
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

// Accept multiple backend country payload shapes and normalize them into one chart contract.
export const normalizeCountryTelemetry = (
  raw: unknown,
  limit = 6,
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

  const looksLikeIndexedList = entries.every(
    ([key, value]) => /^\d+$/.test(key) && typeof value === 'string',
  );
  if (looksLikeIndexedList) {
    return normalizeRankedCountries(
      entries.sort((a, b) => Number(a[0]) - Number(b[0])).map(([, value]) => value),
      limit,
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

// Merge live stats country data with session-level country codes for richer geo.
export const mergeCountriesWithSessions = (
  liveRaw: unknown,
  sessions: { countryCode?: string | null }[],
  limit = 6,
): NormalizedCountryTelemetry[] => {
  const liveCountries = normalizeCountryTelemetry(liveRaw, limit);

  const sessionCountries = new Map<string, number>();
  for (const session of sessions) {
    if (session.countryCode) {
      sessionCountries.set(
        session.countryCode,
        (sessionCountries.get(session.countryCode) ?? 0) + 1,
      );
    }
  }
  const sessionEntries = Array.from(sessionCountries.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([label, count]) => ({ label, count }));

  if (!liveCountries.length) return sessionEntries;
  if (!sessionEntries.length) return liveCountries;

  const seen = new Set(liveCountries.map((c) => c.label));
  const merged = [...liveCountries];
  for (const entry of sessionEntries) {
    if (!seen.has(entry.label)) {
      merged.push(entry);
      seen.add(entry.label);
    }
  }
  return merged.slice(0, limit);
};

// Timeline labels collapse timestamps into a compact hour/minute representation.
export const formatTimelineLabel = (value: string | null | undefined, fallback: string) => {
  if (!value) return fallback;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return fallback;
  return new Intl.DateTimeFormat('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

// Prefer the natural event identity so streamed alerts can merge with their persisted copy later.
export const anomalyEventKey = (event: AnomalyKeySource) => {
  const insuredId = event.insuredId?.trim();
  const sessionId = event.sessionId?.trim();
  const eventId = event.eventId?.trim();

  if (insuredId && sessionId && eventId) {
    return `${insuredId}:${sessionId}:${eventId}`;
  }
  if (event.id != null) {
    return `id:${event.id}`;
  }
  return `${insuredId ?? 'unknown'}:${sessionId ?? 'unknown'}:${eventId ?? 'event'}:${event.detectedAt ?? ''}:${event.anomalyType ?? ''}`;
};
