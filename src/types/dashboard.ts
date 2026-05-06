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
