// Shared anomaly tier palette used by overview and analytics visualizations.
export const ANOMALY_TIER_COLORS: Record<string, string> = {
  TIER1: '#2e7d63',
  TIER2: '#a76518',
  TIER3: '#b34b3c',
  /** Runtime session-level alerts from the updated pipeline. */
  SESSION_RUNTIME: '#3d6d8e',
  ML_ERROR: '#5f7f78',
  UNKNOWN: '#83909b',
};

export const FALLBACK_ANOMALY_TIER_COLOR = '#83909b';
