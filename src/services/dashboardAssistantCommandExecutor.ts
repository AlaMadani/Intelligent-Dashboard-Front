import type { LocationQueryRaw, Router } from 'vue-router';
import { Dark } from 'quasar';
import { i18n } from 'src/boot/i18n';
import { ROUTE_NAMES } from 'src/router/route-names';
import type { DashboardCommand } from 'src/types/dashboardAssistant';
import { driver } from 'driver.js';
import 'driver.js/dist/driver.css';
import {
  ASSISTANT_REFRESH_FORECAST_EVENT,
  ASSISTANT_REFRESH_ALERTS_EVENT,
  ASSISTANT_REFRESH_CHURN_EVENT,
  ASSISTANT_REFRESH_RUNTIME_EVENT,
  ASSISTANT_REFRESH_SECURITY_OVERVIEW_EVENT,
} from 'src/constants/events';
import {
  applyTheme,
  persistTheme,
  type ThemeMode,
} from 'src/utils/theme';

const isDev = process.env.NODE_ENV === 'development';

const log = (label: string, data: unknown) => {
  if (isDev) {
    console.log(`[DashboardAssistant] ${label}`, data);
  }
};

const ELEMENT_ID_ALIASES: Record<string, string> = {
  'overview-top-anomalies': 'overview-top-anomaly-types',
};

const resolveElementId = (id: string): string => ELEMENT_ID_ALIASES[id] ?? id;

const collectCurrentAssistantIds = (): string[] => {
  const fromDataIds = [...document.querySelectorAll<HTMLElement>('[data-assistant-id]')]
    .map((el) => el.getAttribute('data-assistant-id'))
    .filter(Boolean) as string[];
  const fromIds = [...document.querySelectorAll<HTMLElement>('[id]')]
    .map((el) => el.id)
    .filter(Boolean);
  return [...new Set([...fromDataIds, ...fromIds])].sort();
};

const ROUTE_ALIASES: Record<string, string> = {
  'security-overview': ROUTE_NAMES.SECURITY_OVERVIEW,
  alerts: ROUTE_NAMES.ALERTS,
  'alert-investigation': ROUTE_NAMES.ALERT_INVESTIGATION,
  user360: ROUTE_NAMES.USER_360,
  'user-360': ROUTE_NAMES.USER_360_DETAIL,
  churn: ROUTE_NAMES.CHURN,
  forecast: ROUTE_NAMES.FORECAST,
  runtime: ROUTE_NAMES.RUNTIME_HEALTH,
  'runtime-health': ROUTE_NAMES.RUNTIME_HEALTH,
  account: ROUTE_NAMES.ACCOUNT,
};

const resolveRouteName = (name: string | undefined): string | undefined => {
  if (!name) return undefined;
  if (Object.values(ROUTE_NAMES).includes(name as typeof ROUTE_NAMES[keyof typeof ROUTE_NAMES])) {
    return name;
  }
  return ROUTE_ALIASES[name];
};

let driverObj: ReturnType<typeof driver> | null = null;

const clearScrollLock = () => {
  const classes = ['q-body--prevent-scroll', 'no-scroll', 'overflow-hidden', 'modal-open'];
  document.body.classList.remove(...classes);
  document.documentElement.classList.remove(...classes);
  document.body.style.overflow = '';
  document.documentElement.style.overflow = '';
};

const destroyDriver = () => {
  if (driverObj) {
    try {
      driverObj.destroy();
    } catch {
      /* driver may already be destroyed */
    }
    driverObj = null;
  }
  clearScrollLock();
};

const findElementById = (id: string): HTMLElement | null => {
  const resolvedId = resolveElementId(id);
  return document.getElementById(resolvedId) || document.querySelector(`[data-assistant-id="${resolvedId}"]`);
};

const waitForElement = (id: string, retries = 10): Promise<HTMLElement | null> => {
  return new Promise((resolve) => {
    const el = findElementById(id);
    if (el) {
      resolve(el);
      return;
    }
    if (retries <= 0) {
      resolve(null);
      return;
    }
    setTimeout(() => {
      resolve(waitForElement(id, retries - 1));
    }, 200);
  });
};

const waitForNavigation = async (): Promise<void> => {
  await new Promise((resolve) => setTimeout(resolve, 100));
  await new Promise((resolve) => {
    const check = () => {
      if (document.readyState === 'complete') {
        resolve(undefined);
      } else {
        requestAnimationFrame(check);
      }
    };
    check();
  });
  await new Promise((resolve) => setTimeout(resolve, 200));
};

const handleNavigate = async (command: DashboardCommand, router: Router): Promise<string | null> => {
  const rawName = command.routeName;
  const resolvedName = resolveRouteName(rawName);

  log('NAVIGATE command received', { rawName, resolvedName, params: command.params, query: command.query });

  if (!resolvedName) {
    console.warn('[DashboardAssistant] Unknown route name:', rawName);
    return i18n.global.t('dashboardAssistant.routeUnavailable');
  }

  try {
    await router.push({
      name: resolvedName,
      params: command.params ?? {},
      query: (command.query ?? {}) as LocationQueryRaw,
    });
    log('NAVIGATE success', { resolvedName });
    return null;
  } catch (err) {
    console.error('[DashboardAssistant] NAVIGATE failed:', err);
    return i18n.global.t('dashboardAssistant.routeUnavailable');
  }
};

const handleHighlightElement = async (command: DashboardCommand): Promise<string | null> => {
  const rawElementId = command.elementId;
  if (!rawElementId) return null;

  const elementId = resolveElementId(rawElementId);

  log('HIGHLIGHT_ELEMENT command received', { raw: rawElementId, resolved: elementId, message: command.message });

  if (isDev) {
    console.debug('[DashboardAssistantExecutor] element lookup', {
      elementId,
      raw: rawElementId,
      route: typeof window !== 'undefined' ? window.location.pathname : 'ssr',
    });
  }

  destroyDriver();

  const element = await waitForElement(elementId);
  if (!element) {
    console.warn('[DashboardAssistantExecutor] highlight target not found', {
      rawElementId,
      resolved: elementId,
      availableAssistantIds: collectCurrentAssistantIds(),
    });
    return i18n.global.t('dashboardAssistant.elementNotFound');
  }

  element.scrollIntoView({ behavior: 'smooth', block: 'center' });
  await new Promise((resolve) => setTimeout(resolve, 400));

  driverObj = driver({
    showProgress: false,
    animate: true,
    overlayColor: 'rgba(0, 0, 0, 0.45)',
    onDestroyed: () => {
      driverObj = null;
      clearScrollLock();
    },
  });

  driverObj.highlight({
    element: `#${elementId}`,
    popover: {
      title: i18n.global.t('dashboardAssistant.hereItIs'),
      description: command.message ?? '',
      side: 'bottom' as const,
      align: 'start' as const,
    },
  });

  log('HIGHLIGHT_ELEMENT success', { elementId });
  return null;
};

const handleSearchAlert = (command: DashboardCommand, router: Router) => {
  const q = command.query?.q ?? command.params?.query ?? '';
  log('SEARCH_ALERT command received', { query: q });
  void router.push({
    name: ROUTE_NAMES.ALERTS,
    query: { q } as LocationQueryRaw,
  });
};

const handleSearchUser = (command: DashboardCommand, router: Router) => {
  const q = command.query?.insuredId ?? command.params?.insuredId ?? '';
  log('SEARCH_USER command received', { query: q });
  if (q) {
    void router.push({
      name: ROUTE_NAMES.USER_360_DETAIL,
      params: { insuredId: q },
    });
  }
};

const handleSearchSession = (command: DashboardCommand, router: Router) => {
  const q = command.query?.sessionId ?? command.params?.sessionId ?? '';
  log('SEARCH_SESSION command received', { query: q });
  if (q) {
    void router.push({
      name: ROUTE_NAMES.ALERTS,
      query: { sessionId: q } as LocationQueryRaw,
    });
  }
};

const handleOpenPanel = (
  command: DashboardCommand,
  panelActions: {
    openAdvancedContext?: () => void;
    openEvidencePayload?: () => void;
    openExplainAi?: () => void;
  },
): string | null => {
  const panelId = command.panelId;
  if (!panelId) return null;

  log('OPEN_PANEL command received', { panelId, message: command.message });

  switch (panelId) {
    case 'advanced-context':
      panelActions.openAdvancedContext?.();
      return null;
    case 'evidence-payload':
      panelActions.openEvidencePayload?.();
      return null;
    case 'explain-ai':
      panelActions.openExplainAi?.();
      return null;
    default:
      console.warn('[DashboardAssistant] Unknown panel ID:', panelId);
      return i18n.global.t('dashboardAssistant.panelUnavailable');
  }
};

const handleSetFilter = (command: DashboardCommand): string | null => {
  const target = command.target;
  const value = command.value;
  if (!target || !value) return null;

  log('SET_FILTER command received', { target, value });

  const filterEvents: Record<string, string> = {
    'churn-risk-filter': 'assistant:filter-churn-risk',
    'churn-risk': 'assistant:filter-churn-risk',
    'alerts-risk-filter': 'assistant:filter-alerts-risk',
    'alerts-risk': 'assistant:filter-alerts-risk',
    'alerts-filter-insured-id': 'assistant:filter-alerts-insured-id',
    'alerts-insured': 'assistant:filter-alerts-insured-id',
    'alerts-filter-session-id': 'assistant:filter-alerts-session-id',
    'alerts-session': 'assistant:filter-alerts-session-id',
    'alerts-filter-anomaly-type': 'assistant:filter-alerts-anomaly-type',
    'alerts-anomaly': 'assistant:filter-alerts-anomaly-type',
    'alerts-filter-date-from': 'assistant:filter-alerts-date-from',
    'alerts-date-from': 'assistant:filter-alerts-date-from',
    'alerts-filter-date-to': 'assistant:filter-alerts-date-to',
    'alerts-date-to': 'assistant:filter-alerts-date-to',
  };

  const eventName = filterEvents[target];
  if (eventName) {
    window.dispatchEvent(new CustomEvent(eventName, { detail: { value } }));
    return null;
  }

  console.warn('[DashboardAssistant] Unknown filter target:', target);
  return `Filter "${target}" is not supported yet.`;
};

const handleRefreshView = (command: DashboardCommand): string | null => {
  const target = command.target;
  if (!target) return null;

  log('REFRESH_VIEW command received', { target });

  const dispatchRefresh = (eventName: string) => {
    document.dispatchEvent(new CustomEvent(eventName));
    log('Refresh event dispatched', { eventName });
  };

  switch (target) {
    case 'forecast':
      dispatchRefresh(ASSISTANT_REFRESH_FORECAST_EVENT);
      return null;
    case 'alerts':
      dispatchRefresh(ASSISTANT_REFRESH_ALERTS_EVENT);
      return null;
    case 'churn':
      dispatchRefresh(ASSISTANT_REFRESH_CHURN_EVENT);
      return null;
    case 'runtime':
      dispatchRefresh(ASSISTANT_REFRESH_RUNTIME_EVENT);
      return null;
    case 'security-overview':
      dispatchRefresh(ASSISTANT_REFRESH_SECURITY_OVERVIEW_EVENT);
      return null;
    default:
      console.warn('[DashboardAssistant] Unknown refresh target:', target);
      return `Refresh for "${target}" is not supported yet.`;
  }
};

const handleToggleTheme = (command: DashboardCommand): string | null => {
  const value = command.value as ThemeMode | undefined;
  log('TOGGLE_THEME command received', { value });

  try {
    const mode: ThemeMode = value === 'light' ? 'light' : 'dark';
    applyTheme(mode, (isDark) => Dark.set(isDark));
    persistTheme(mode);

    log('TOGGLE_THEME applied', { mode });
    return mode === 'light' ? 'Light mode enabled.' : 'Dark mode enabled.';
  } catch (err) {
    console.error('[DashboardAssistant] TOGGLE_THEME failed:', err);
    return "I couldn't switch the theme.";
  }
};

const handleClickElement = (command: DashboardCommand): string | null => {
  const elementId = command.elementId;
  if (!elementId) return null;

  log('CLICK_ELEMENT command received', { elementId });

  const el = findElementById(elementId);
  if (!el) {
    console.warn('[DashboardAssistant] CLICK_ELEMENT target not found:', elementId);
    return `I couldn't find the "${elementId}" element to click.`;
  }

  try {
    el.click();
    log('CLICK_ELEMENT executed', { elementId });
    return null;
  } catch (err) {
    console.error('[DashboardAssistant] CLICK_ELEMENT failed:', elementId, err);
    return `I couldn't click "${elementId}".`;
  }
};

export interface PanelActions {
  openAdvancedContext?: () => void;
  openEvidencePayload?: () => void;
  openExplainAi?: () => void;
}

export const executeCommands = async (
  commands: DashboardCommand[],
  router: Router,
  panelActions?: PanelActions,
): Promise<string[]> => {
  log('Executing commands', commands);
  const messages: string[] = [];
  let didNavigate = false;

  for (const command of commands) {
    log('Executing command', command);
    switch (command.type) {
      case 'NAVIGATE': {
        const msg = await handleNavigate(command, router);
        if (msg) messages.push(msg);
        didNavigate = true;
        if (didNavigate) {
          await waitForNavigation();
        }
        break;
      }
      case 'HIGHLIGHT_ELEMENT': {
        if (didNavigate) {
          await waitForNavigation();
        }
        const msg = await handleHighlightElement(command);
        if (msg) messages.push(msg);
        break;
      }
      case 'SEARCH_ALERT':
        handleSearchAlert(command, router);
        break;
      case 'SEARCH_USER':
        handleSearchUser(command, router);
        break;
      case 'SEARCH_SESSION':
        handleSearchSession(command, router);
        break;
      case 'OPEN_PANEL': {
        const msg = handleOpenPanel(command, panelActions ?? {});
        if (msg) messages.push(msg);
        break;
      }
      case 'SET_FILTER': {
        const msg = handleSetFilter(command);
        if (msg) messages.push(msg);
        break;
      }
      case 'REFRESH_VIEW': {
        const msg = handleRefreshView(command);
        if (msg) messages.push(msg);
        break;
      }
      case 'TOGGLE_THEME': {
        const msg = handleToggleTheme(command);
        if (msg) messages.push(msg);
        break;
      }
      case 'CLICK_ELEMENT': {
        const msg = handleClickElement(command);
        if (msg) messages.push(msg);
        break;
      }
      case 'NO_ACTION':
        break;
      default:
        console.warn('[DashboardAssistant] Unsupported command type:', command.type, command);
    }
  }

  log('Command execution results', messages);
  return messages;
};

export const cleanupAssistant = () => {
  destroyDriver();
};

// ── Dev debug utilities ──────────────────────────────────────────────

if (isDev && typeof window !== 'undefined') {
  (window as unknown as Record<string, unknown>).__assistantDebugListIds = () =>
    [...document.querySelectorAll('[id]')].map((el) => el.id).sort();

  (window as unknown as Record<string, unknown>).__assistantDebugHasId = (id: string) =>
    !!document.getElementById(id);

  (window as unknown as Record<string, unknown>).__assistantDebugHasDataAssistantId = (id: string) =>
    !!document.querySelector(`[data-assistant-id="${id}"]`);

  (window as unknown as Record<string, unknown>).__assistantDebugListDataAssistantIds = () =>
    [...document.querySelectorAll('[data-assistant-id]')]
      .map((el) => el.getAttribute('data-assistant-id'))
      .filter(Boolean) as string[];

  (window as unknown as Record<string, unknown>).__assistantDebugHighlight = async (id: string) => {
    await handleHighlightElement({ type: 'HIGHLIGHT_ELEMENT', elementId: id, message: `Debug: highlighting #${id}` });
  };

  (window as unknown as Record<string, unknown>).__assistantDebugTheme = () => ({
    mode: document.documentElement.dataset.theme as ThemeMode | undefined,
    quasarDark: Dark.isActive,
    localStorage: window.localStorage.getItem('noveo-care-theme'),
    htmlClass: document.documentElement.classList.value,
  });

  (window as unknown as Record<string, unknown>).__assistantDebugSetTheme = (mode: ThemeMode) => {
    applyTheme(mode, (isDark) => Dark.set(isDark));
    persistTheme(mode);
    return ((window as unknown as Record<string, unknown>).__assistantDebugTheme as () => unknown)?.();
  };

  (window as unknown as Record<string, unknown>).__assistantDebugRefresh = (target: string) => {
    log('Debug REFRESH_VIEW', { target });
    handleRefreshView({ type: 'REFRESH_VIEW', target, message: `Debug: refreshing ${target}` });
  };

  (window as unknown as Record<string, unknown>).__assistantDebugVisibleElements = () => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const manifest = require('src/assistant/dashboardAssistantManifest.json');
      const route = { name: '', path: window.location.pathname };
      function resolveRouteId(r: { name: string; path: string }): string {
        for (const mr of manifest.routes) {
          if (mr.routeName === r.name || mr.id === r.name) return mr.id;
        }
        for (const mr of manifest.routes) {
          if (mr.path && r.path.startsWith(mr.path)) return mr.id;
        }
        if (r.path.startsWith('/security-overview')) return 'security-overview';
        if (r.path.startsWith('/alerts/')) return 'alert-investigation';
        if (r.path.startsWith('/alerts')) return 'alerts';
        if (r.path.startsWith('/users/')) return 'user-360';
        if (r.path.startsWith('/users')) return 'user360';
        if (r.path.startsWith('/churn')) return 'churn';
        if (r.path.startsWith('/forecast')) return 'forecast';
        if (r.path.startsWith('/runtime')) return 'runtime-health';
        if (r.path.startsWith('/account')) return 'account';
        return '';
      }
      const currentRouteId = resolveRouteId(route);
      const seen = new Set<string>();
      const results: Array<Record<string, unknown>> = [];

      for (const el of manifest.elements) {
        if (!el.routeId || el.routeId === currentRouteId) {
          const domEl = document.getElementById(el.id);
          seen.add(el.id);
          results.push({
            id: el.id,
            type: el.type,
            label: el.label,
            description: el.description,
            routeId: currentRouteId,
            visible: domEl !== null,
            actions: el.actionsSupported ?? ['HIGHLIGHT_ELEMENT'],
            ...(domEl ? { textContent: domEl.textContent?.trim().slice(0, 200) } : {}),
            source: 'manifest',
          });
        }
      }

      const domNodes = document.querySelectorAll<HTMLElement>('[data-assistant-id]');
      for (const n of domNodes) {
        const id = n.getAttribute('data-assistant-id');
        if (!id || seen.has(id)) continue;
        seen.add(id);
        results.push({
          id,
          type: n.getAttribute('data-assistant-type') || n.tagName.toLowerCase(),
          label: n.getAttribute('data-assistant-label') || id,
          description: n.getAttribute('data-assistant-description') || '',
          routeId: currentRouteId,
          visible: n.getBoundingClientRect().width > 0 && n.getBoundingClientRect().height > 0,
          actions: (n.getAttribute('data-assistant-actions') || 'HIGHLIGHT_ELEMENT').split(',').map((a: string) => a.trim()),
          textContent: n.textContent?.trim().slice(0, 200) || undefined,
          source: 'dom',
        });
      }

      return results;
    } catch {
      return [];
    }
  };

  (window as unknown as Record<string, unknown>).__assistantDebugMissingManifestIds = (manifestPath?: string) => {
    const path = manifestPath || '/src/assistant/dashboardAssistantManifest.json';
    console.log(`[DashboardAssistant] Scanning DOM for manifest IDs from ${path}...`);
    fetch(path)
      .then((r: Response) => r.json())
      .then((manifest: { elements: Array<{ id: string; label: string; routeId: string | null }> }) => {
        const found: string[] = [];
        const missing: Array<{ id: string; label: string }> = [];
        const domOnly: string[] = [];
        for (const el of manifest.elements) {
          const domEl = document.getElementById(el.id) || document.querySelector(`[data-assistant-id="${el.id}"]`);
          if (domEl) {
            found.push(el.id);
          } else {
            missing.push({ id: el.id, label: el.label });
          }
        }
        const allDataIds = [...document.querySelectorAll('[data-assistant-id]')]
          .map((e) => e.getAttribute('data-assistant-id'));
        for (const did of allDataIds) {
          if (did && !manifest.elements.some((e: { id: string }) => e.id === did)) {
            domOnly.push(did);
          }
        }
        console.log(`[DashboardAssistant] DOM Scan Complete:`);
        console.log(`  Total manifest elements: ${manifest.elements.length}`);
        console.log(`  Found in DOM: ${found.length}`);
        console.log(`  Missing from DOM: ${missing.length}`);
        console.log(`  DOM-only (data-assistant-id not in manifest): ${domOnly.length}`);
        if (missing.length > 0) {
          console.log(`  Missing IDs:`);
          for (const m of missing) {
            console.log(`    - ${m.id} ("${m.label}")`);
          }
        }
        if (domOnly.length > 0) {
          console.log(`  DOM-only data-assistant-id elements:`);
          for (const d of domOnly) {
            console.log(`    - ${d}`);
          }
        }
        (window as unknown as Record<string, unknown>).__assistantDebugScanResult = { found, missing, domOnly, total: manifest.elements.length };
      })
      .catch((err: Error) => {
        console.error(`[DashboardAssistant] Failed to load manifest from ${path}:`, err);
      });
  };
}
