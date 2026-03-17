export interface SecurityAlert {
  id: number;
  userKey: number | null;
  ipAddress: string | null;
  alertType: string | null;
  anomalyScore: number | null;
  thresholdUsed: number | null;
  aiExplanation: string | null;
  detectedAt: string | null;
}

export interface AuditTrailEvent {
  id: string;
  createdAt: string;
  success: boolean;
  action: string;
  object: string;
  objectId: string;
  userKey: number;
  details: string;
  ipAddress: string;
  content: Record<string, unknown> | null;
}
