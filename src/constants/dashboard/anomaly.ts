// Shared anomaly tier palette used by overview and analytics visualizations.
export const ANOMALY_TIER_COLORS: Record<string, string> = {
  TIER1: '#2f8f83',
  TIER2: '#e3a548',
  TIER3: '#cf5d4a',
  /** Runtime session-level alerts from the updated pipeline. */
  SESSION_RUNTIME: '#5c6bc0',
  ML_ERROR: '#617ca8',
  UNKNOWN: '#8899a8',
};

export const FALLBACK_ANOMALY_TIER_COLOR = '#8899a8';

