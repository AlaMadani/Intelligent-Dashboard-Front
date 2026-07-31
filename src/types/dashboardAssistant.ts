// ---- UI Elements ----
export interface AssistantVisibleElement {
  id: string;
  type: string;
  label: string;
  description: string;
  routeId: string;
  visible: boolean;
  actions: string[];
  textContent?: string;
  ariaLabel?: string;
  title?: string;
  disabled?: boolean;
  bounds?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

// ---- Snapshots ----
export interface UISnapshot {
  routeId: string;
  routeName: string;
  path: string;
  theme: string;
  layout: {
    sidebarVisible: boolean;
    topbarVisible: boolean;
    userMenuOpen: boolean;
  };
  pageTitle: string;
  visibleElementCount: number;
  timestamp: string;
}

// ---- Request ----
export interface DashboardAssistantRequest {
  message: string;
  currentRoute: string;
  currentContext: Record<string, string>;
  visibleElements?: AssistantVisibleElement[];
  uiSnapshot?: UISnapshot;
  debug?: boolean;
  model?: string;
}

// ---- Commands ----
export type DashboardCommandType =
  | 'NAVIGATE'
  | 'HIGHLIGHT_ELEMENT'
  | 'SEARCH_ALERT'
  | 'SEARCH_USER'
  | 'SEARCH_SESSION'
  | 'OPEN_PANEL'
  | 'SET_FILTER'
  | 'REFRESH_VIEW'
  | 'NO_ACTION'
  | 'EXPLAIN_WITH_AI'
  | 'TOGGLE_THEME'
  | 'CHANGE_PASSWORD'
  | 'LIST_CAPABILITIES'
  | 'LIST_HIGHLIGHTABLE'
  | 'CLICK_ELEMENT';

export interface DashboardCommand {
  type: DashboardCommandType;
  routeName?: string;
  params?: Record<string, string>;
  query?: Record<string, string>;
  elementId?: string;
  panelId?: string;
  target?: string;
  value?: string;
  message?: string;
}

export interface AssistantDebugMetadata {
  timestamp: string;
  currentRoute: string;
  decisionSource: 'model' | 'deterministic';
  receivedVisibleElementIds: string[];
  candidateIds: string[];
  omittedVisibleElementIds: string[];
  selectedElementId?: string;
  rejectedReason?: string;
}

// ---- Response ----
export interface DashboardAssistantResponse {
  responseType?: string;
  message: string;
  commands: DashboardCommand[];
  requiresConfirmation: boolean;
  warnings: string[];
  debug?: AssistantDebugMetadata;
}

// ---- Context ----
export interface DashboardAssistantContext {
  currentRoute: string;
  currentContext: Record<string, string>;
  visibleElements?: AssistantVisibleElement[];
  uiSnapshot?: UISnapshot;
}
