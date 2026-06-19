import { nextTick, readonly, ref } from 'vue';
import { i18n } from 'src/boot/i18n';

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

const resolveResponse = (query: string): string => {
  const { t } = i18n.global;
  const normalized = query.toLowerCase();

  if (
    normalized.includes('ddos') ||
    normalized.includes('flood') ||
    normalized.includes('attack') ||
    normalized.includes('indicators')
  ) {
    return t('companion.responses.ddos');
  }

  if (
    normalized.includes('anomaly') ||
    normalized.includes('anomalies') ||
    normalized.includes('rapid') ||
    normalized.includes('claims')
  ) {
    return t('companion.responses.anomalies');
  }

  if (
    normalized.includes('fraud') ||
    normalized.includes('threat') ||
    normalized.includes('rules') ||
    normalized.includes('constitutes')
  ) {
    return t('companion.responses.threat');
  }

  if (normalized.includes('help') || normalized.includes('commands')) {
    return t('companion.responses.help');
  }

  if (normalized.includes('churn') || normalized.includes('retention')) {
    return t('companion.responses.churn');
  }

  if (normalized.includes('forecast') || normalized.includes('predict')) {
    return t('companion.responses.forecast');
  }

  if (normalized.includes('runtime') || normalized.includes('health') || normalized.includes('kafka')) {
    return t('companion.responses.runtime');
  }

  return t('companion.responses.default');
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

export const useNoveoCompanionChat = () => {
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

  const appendMessage = (text: string, sender: ChatSender) => {
    messages.value.push({ id: nextId(), sender, text });
  };

  const submit = async (query: string) => {
    const trimmed = query.trim();
    if (!trimmed || typing.value) return;

    showSuggestions.value = false;
    appendMessage(trimmed, 'user');
    draft.value = '';
    typing.value = true;

    await nextTick();
    await new Promise((resolve) => window.setTimeout(resolve, 1200));

    typing.value = false;
    appendMessage(resolveResponse(trimmed), 'bot');
  };

  const submitDraft = async () => {
    await submit(draft.value);
  };

  const submitSuggestion = async (query: string) => {
    await submit(query);
  };

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
