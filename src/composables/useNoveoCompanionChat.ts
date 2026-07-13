import { nextTick, onBeforeUnmount, readonly, ref, type ComputedRef, type Ref } from 'vue';
import { useRouter } from 'vue-router';
import { i18n } from 'src/boot/i18n';
import { sendDashboardAssistantMessage } from 'src/services/dashboardAssistant';
import { executeCommands, cleanupAssistant } from 'src/services/dashboardAssistantCommandExecutor';
import { ASSISTANT_ADVANCED_CONTEXT_EVENT, ASSISTANT_EVIDENCE_PAYLOAD_EVENT, ASSISTANT_EXPLAIN_AI_EVENT } from 'src/constants/events';
import type { DashboardAssistantContext } from 'src/types/dashboardAssistant';

const isDev = process.env.NODE_ENV === 'development';

if (typeof window !== 'undefined') {
  const w = (window as unknown) as Record<string, unknown>;
  w.__assistantDebug = {
    isEnabled: isDev,
    toggle: () => {
      const win = (window as unknown) as Record<string, unknown>;
      win.__assistantDebug = { ...(win.__assistantDebug as Record<string, unknown>), isEnabled: !(win.__assistantDebug as Record<string, unknown>)?.isEnabled };
      console.log('[DashboardAssistant] Debug:', (win.__assistantDebug as Record<string, unknown>).isEnabled ? 'ON' : 'OFF');
    },
    getVisibleElements: () => {
      console.log('[DashboardAssistant] Visible elements:', (window as unknown as Record<string, unknown>).__assistantDebugContext);
    },
  };
}

if (typeof window !== 'undefined') {
  const w = (window as unknown) as Record<string, unknown>;
  w.__assistantDebugMissingManifestIds = (manifestPath?: string) => {
    const path = manifestPath || '/src/assistant/dashboardAssistantManifest.json';
    console.log(`[DashboardAssistant] Scanning DOM for manifest IDs from ${path}...`);
    fetch(path)
      .then((r) => r.json())
      .then((manifest: { elements: Array<{ id: string; label: string; routeId: string | null }> }) => {
        const found: string[] = [];
        const missing: Array<{ id: string; label: string }> = [];
        for (const el of manifest.elements) {
          const domEl = document.getElementById(el.id);
          if (domEl) {
            found.push(el.id);
          } else {
            missing.push({ id: el.id, label: el.label });
          }
        }
        console.log(`[DashboardAssistant] DOM Scan Complete:`);
        console.log(`  Total manifest elements: ${manifest.elements.length}`);
        console.log(`  Found in DOM: ${found.length}`);
        console.log(`  Missing from DOM: ${missing.length}`);
        if (missing.length > 0) {
          console.log(`  Missing IDs:`);
          for (const m of missing) {
            console.log(`    - ${m.id} ("${m.label}")`);
          }
        }
        (window as unknown as Record<string, unknown>).__assistantDebugScanResult = { found, missing, total: manifest.elements.length };
      })
      .catch((err: Error) => {
        console.error(`[DashboardAssistant] Failed to load manifest from ${path}:`, err);
      });
  };
}
const log = (label: string, data: unknown) => {
  if (isDev) {
    console.log(`[DashboardAssistant] ${label}`, data);
  }
};

const buildAssistantRequestPreview = (): DashboardAssistantContext | null => {
  if (typeof window === 'undefined') return null;
  const w = window as unknown as Record<string, unknown>;
  return (w.__assistantDebugContext as DashboardAssistantContext) ?? null;
};

if (typeof window !== 'undefined') {
  const w = (window as unknown) as Record<string, unknown>;
  w.__assistantDebugRequestPayload = () => {
    const ctx = buildAssistantRequestPreview();
    if (!ctx) {
      console.warn('[DashboardAssistant] No context available. Make a request first.');
      return null;
    }
    console.log('[DashboardAssistant] Request payload preview:', JSON.parse(JSON.stringify(ctx)));
    return ctx;
  };
}

export type ChatSender = 'user' | 'bot';

export interface ChatMessage {
  id: string;
  sender: ChatSender;
  text: string;
}

const open = ref(false);
const typing = ref(false);
const showSuggestions = ref(true);
const unread = ref(true);
const messages = ref<ChatMessage[]>([]);
const draft = ref('');

let messageCounter = 0;

const nextId = () => {
  messageCounter += 1;
  return `chat-${messageCounter}`;
};

const appendMessage = (text: string, sender: ChatSender) => {
  messages.value.push({ id: nextId(), sender, text });
};

const seedWelcome = () => {
  messages.value = [
    {
      id: nextId(),
      sender: 'bot',
      text: i18n.global.t('companion.welcome'),
    },
  ];
  showSuggestions.value = true;
};

if (messages.value.length === 0) {
  seedWelcome();
}

export const useNoveoCompanionChat = (
  assistantContextRef?: ComputedRef<DashboardAssistantContext> | DashboardAssistantContext,
  selectedModelRef?: ComputedRef<string> | Ref<string>,
) => {
  const router = useRouter();

  const getSelectedModel = (): string | undefined => {
    if (!selectedModelRef) return undefined;
    if ('value' in selectedModelRef) {
      return (selectedModelRef as unknown as Record<string, unknown>).value as string;
    }
    return selectedModelRef;
  };

  const getContext = (): DashboardAssistantContext => {
    if (!assistantContextRef) return { currentRoute: '', currentContext: {}, visibleElements: [] };
    if ('value' in assistantContextRef) {
      return (assistantContextRef as unknown as Record<string, unknown>).value as DashboardAssistantContext;
    }
    return assistantContextRef;
  };

  const toggle = () => {
    open.value = !open.value;
    if (open.value) {
      unread.value = false;
    }
  };

  const close = () => {
    open.value = false;
  };

  const reset = () => {
    draft.value = '';
    typing.value = false;
    seedWelcome();
  };

  const submit = async (query: string) => {
    const trimmed = query.trim();
    if (!trimmed || typing.value) return;

    showSuggestions.value = false;
    appendMessage(trimmed, 'user');
    draft.value = '';
    typing.value = true;

    await nextTick();

    try {
      const ctx = getContext();
      const currentRoute = ctx.currentRoute ?? '';
      const currentContext = ctx.currentContext ?? {};
      const visibleElements = ctx.visibleElements ?? [];

      if (isDev && typeof window !== 'undefined') {
        ((window as unknown) as Record<string, unknown>).__assistantDebugContext = visibleElements;
      }

      const uiSnapshot = ctx.uiSnapshot ?? undefined;

      log('Sending message', { message: trimmed, currentRoute, currentContext, uiSnapshot });
      if (visibleElements.length > 0) {
        log('visibleElements', visibleElements.map((e: { id: string }) => e.id));
      } else {
        log('visibleElements', '(none)');
      }

      if (isDev) {
        console.log(`[DashboardAssistant] Full payload`, {
          message: trimmed,
          currentRoute,
          visibleElementCount: visibleElements.length,
          visibleElementIds: visibleElements.map((e: { id: string }) => e.id),
          hasUiSnapshot: !!uiSnapshot,
        });
      }

      const modelVal = getSelectedModel();
      const envelope = await sendDashboardAssistantMessage({
        message: trimmed,
        currentRoute,
        currentContext,
        visibleElements,
        ...(uiSnapshot !== undefined ? { uiSnapshot } : {}),
        debug: isDev,
        ...(modelVal ? { model: modelVal } : {}),
      });

      log('Raw response from sendDashboardAssistantMessage', envelope);

      const data = envelope.data;
      typing.value = false;

      log('Unwrapped assistant data', data);
      log('Commands received', data.commands);

      if (isDev && data.debug) {
        console.log('=== [DashboardAssistant Debug Metadata] ===');
        console.log('Decision source:', data.debug.decisionSource);
        console.log('Current route:', data.debug.currentRoute);
        console.log('Received visibleElementIds:', data.debug.receivedVisibleElementIds);
        console.log('Candidate element IDs:', data.debug.candidateIds);
        console.log('Omitted visibleElementIds:', data.debug.omittedVisibleElementIds);
        console.log('Selected element ID:', data.debug.selectedElementId);
        if (data.debug.rejectedReason) {
          console.log('Rejected reason:', data.debug.rejectedReason);
        }
        console.log('==========================================');
      }

      if (data.message) {
        appendMessage(data.message, 'bot');
      }

      if (data.requiresConfirmation) {
        appendMessage(i18n.global.t('dashboardAssistant.confirmationNotEnabled'), 'bot');
      } else if (data.commands?.length) {
        log('Calling executeCommands with', data.commands);
        const executionMessages = await executeCommands(data.commands, router, {
          openEvidencePayload: () => {
            document.dispatchEvent(new CustomEvent(ASSISTANT_EVIDENCE_PAYLOAD_EVENT));
          },
          openExplainAi: () => {
            document.dispatchEvent(new CustomEvent(ASSISTANT_EXPLAIN_AI_EVENT));
          },
          openAdvancedContext: () => {
            document.dispatchEvent(new CustomEvent(ASSISTANT_ADVANCED_CONTEXT_EVENT));
          },
        });
        log('executeCommands returned', executionMessages);
        for (const msg of executionMessages) {
          if (msg) appendMessage(msg, 'bot');
        }
      } else {
        log('No commands to execute', null);
      }

      if (data.warnings?.length) {
        for (const warning of data.warnings) {
          appendMessage(`⚠ ${warning}`, 'bot');
        }
      }
    } catch (err) {
      log('Error in submit', err);
      typing.value = false;
      appendMessage(i18n.global.t('dashboardAssistant.serviceUnreachable'), 'bot');
    }
  };

  const submitDraft = async () => {
    await submit(draft.value);
  };

  const submitSuggestion = async (query: string) => {
    await submit(query);
  };

  onBeforeUnmount(() => {
    cleanupAssistant();
  });

  return {
    open: readonly(open),
    typing: readonly(typing),
    showSuggestions: readonly(showSuggestions),
    unread: readonly(unread),
    messages: readonly(messages),
    draft,
    toggle,
    close,
    reset,
    submitDraft,
    submitSuggestion,
  };
};

