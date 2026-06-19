export interface AiExplainerContent {
  target: string;
  summary: string;
  threat: string;
  recommendation: string;
}

export type AiExplainerContextKey = string;

export interface AiExplainerOpenOptions {
  contextKey: AiExplainerContextKey;
  params?: Record<string, string | number | undefined | null>;
  content?: Partial<AiExplainerContent>;
  eventId?: string;
}

export interface AiExplainerState {
  visible: boolean;
  loading: boolean;
  generating: boolean;
  error: string;
  fallback: boolean;
  content: AiExplainerContent | null;
  eventId: string | null;
}
