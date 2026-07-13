<template>
  <div class="neo-companion">
    <Transition name="neo-companion-panel">
      <section v-if="open" class="neo-companion__panel" :aria-label="t('companion.ariaLabel')">
        <header class="neo-companion__header">
          <div class="neo-companion__identity">
            <div class="neo-companion__avatar">
              <q-icon name="auto_awesome" />
              <span class="neo-companion__status" aria-hidden="true"></span>
            </div>
            <div>
              <h3>{{ t('companion.title') }}</h3>
              <p>{{ t('companion.subtitle') }}</p>
            </div>
          </div>
          <div class="neo-companion__header-actions">
            <div class="neo-companion__model-picker-wrap">
              <button
                ref="modelTriggerRef"
                type="button"
                class="neo-companion__model-trigger"
                @click="toggleModelMenu"
                :title="selectedModelLabel"
              >
                <span class="neo-companion__model-trigger-label">{{ selectedModelLabel }}</span>
                <q-icon
                  name="arrow_drop_down"
                  class="neo-companion__model-trigger-arrow"
                  :class="{ 'neo-companion__model-trigger-arrow--open': modelMenuOpen }"
                />
              </button>
            </div>
            <button type="button" class="neo-companion__icon-btn" :title="t('companion.reset')" @click="reset">
              <q-icon name="refresh" />
            </button>
            <button type="button" class="neo-companion__icon-btn" :title="t('companion.minimize')" @click="close">
              <q-icon name="minimize" />
            </button>
          </div>
        </header>

        <div ref="feedRef" class="neo-companion__feed">
          <article
            v-for="message in messages"
            :key="message.id"
            class="neo-companion__message"
            :class="`neo-companion__message--${message.sender}`"
          >
            <div v-if="message.sender === 'bot'" class="neo-companion__bot-icon">
              <q-icon name="smart_toy" />
            </div>
            <div class="neo-companion__bubble">
              <p v-if="message.sender === 'bot'" class="neo-companion__label">{{ t('companion.assistantLabel') }}</p>
              <p class="neo-companion__text">{{ message.text }}</p>
            </div>
          </article>

          <div v-if="showSuggestions" class="neo-companion__suggestions">
            <p>{{ t('companion.operationalQueries') }}</p>
            <button
              v-for="suggestion in suggestions"
              :key="suggestion.key"
              type="button"
              class="neo-companion__suggestion"
              @click="submitSuggestion(t(suggestion.labelKey))"
            >
              <span>{{ t(suggestion.labelKey) }}</span>
              <q-icon name="chevron_right" />
            </button>
          </div>
        </div>

        <div v-if="typing" class="neo-companion__typing">
          <q-icon name="memory" class="neo-companion__typing-icon" />
          <span>{{ t('companion.typing') }}</span>
        </div>

        <div v-if="voiceError" class="neo-companion__voice-error">
          <q-icon name="warning" />
          <span>{{ voiceError }}</span>
        </div>

        <div v-if="sessionActive" class="neo-companion__voice-status">
          <template v-if="voiceSessionState === 'listening'">
            <q-icon name="mic" />
            <span>Listening...</span>
          </template>
          <template v-else-if="voiceSessionState === 'recording-utterance'">
            <q-icon name="mic" class="neo-companion__voice-status-icon--active" />
            <span>Hearing you...</span>
          </template>
          <template v-else-if="voiceSessionState === 'transcribing'">
            <q-icon name="hourglass_top" />
            <span>Transcribing...</span>
          </template>
          <template v-else-if="voiceSessionState === 'assistant-thinking'">
            <q-icon name="smart_toy" />
            <span>Assistant responding...</span>
          </template>
        </div>

        <form class="neo-companion__composer" @submit.prevent="handleSubmit">
          <input
            v-model="draft"
            type="text"
            :placeholder="t('companion.placeholder')"
            :aria-label="t('companion.placeholder')"
            :disabled="voiceSessionState === 'transcribing' || voiceSessionState === 'assistant-thinking'"
          />
          <label
            class="neo-companion__voice-setting"
            :class="{ 'neo-companion__voice-setting--on': autoSendVoiceTranscript }"
            :title="autoSendVoiceTranscript ? 'Auto-send: on' : 'Auto-send: off'"
          >
            <input type="checkbox" v-model="autoSendVoiceTranscript" class="neo-companion__voice-setting-input" />
            <q-icon name="send" />
          </label>
          <label
            class="neo-companion__voice-setting"
            :class="{ 'neo-companion__voice-setting--on': voiceReadAssistantResponses }"
            :title="voiceReadAssistantResponses ? 'Read aloud: on' : 'Read aloud: off'"
          >
            <input type="checkbox" v-model="voiceReadAssistantResponses" class="neo-companion__voice-setting-input" />
            <q-icon name="volume_up" />
          </label>
          <button
            type="button"
            class="neo-companion__mic-btn"
            :class="{
              'neo-companion__mic-btn--active': sessionActive,
              'neo-companion__mic-btn--recording': voiceSessionState === 'recording-utterance',
              'neo-companion__mic-btn--transcribing': voiceSessionState === 'transcribing' || voiceSessionState === 'assistant-thinking',
              'neo-companion__mic-btn--error': voiceSessionState === 'error',
            }"
            :disabled="voiceSessionState === 'transcribing' || voiceSessionState === 'assistant-thinking'"
            :title="sessionActive ? 'Stop voice session' : 'Start voice session'"
            @click="toggleVoiceSession"
          >
            <q-icon
              :name="voiceIcon"
              class="neo-companion__mic-icon"
            />
          </button>
          <button type="submit" :aria-label="t('companion.send')">
            <q-icon name="send" />
          </button>
        </form>
      </section>
    </Transition>

    <Transition name="neo-companion-model">
      <div
        v-if="modelMenuOpen"
        class="neo-companion__model-menu"
        :style="menuStyle"
      >
        <button
          v-for="opt in modelOptions"
          :key="opt.value"
          type="button"
          class="neo-companion__model-option"
          :class="{ 'neo-companion__model-option--active': selectedModel === opt.value }"
          @mousedown.prevent="selectModel(opt.value)"
        >
          <q-icon
            name="check"
            class="neo-companion__model-option-check"
            :class="{ 'neo-companion__model-option-check--visible': selectedModel === opt.value }"
          />
          <span class="neo-companion__model-option-label">{{ opt.label }}</span>
        </button>
      </div>
    </Transition>

    <button type="button" class="neo-companion__launcher" @click="toggle">
      <span v-if="unread && !open" class="neo-companion__badge" aria-hidden="true"></span>
      <q-icon name="auto_awesome" class="neo-companion__launcher-icon" />
      <span>{{ t('companion.launcher') }}</span>
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch, type CSSProperties } from 'vue';
import { useRoute } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useNoveoCompanionChat } from 'src/composables/useNoveoCompanionChat';
import { useAssistantVisibleElements } from 'src/assistant/useAssistantVisibleElements';
import { transcribeAudio } from 'src/services/asrService';
import type { DashboardAssistantContext } from 'src/types/dashboardAssistant';

const { t } = useI18n();
const route = useRoute();
const feedRef = ref<HTMLElement | null>(null);
const isDev = process.env.NODE_ENV === 'development';

const MODEL_STORAGE_KEY = 'dashboardAssistant_model';
const DEFAULT_MODEL = 'nvidia/nemotron-3-nano-omni-30b-a3b-reasoning';

const modelOptions = [
  { label: 'Omni-Reasoning (text + voice, fast)', value: DEFAULT_MODEL },
  { label: 'Nemotron 30B (text only, very fast)', value: 'nvidia/nemotron-3-nano-30b-a3b' },
  { label: 'Llama 3.1 8B (text only, very fast, weak reasoning)', value: 'meta/llama-3.1-8b-instruct' },
];

const selectedModel = ref(
  localStorage.getItem(MODEL_STORAGE_KEY) || DEFAULT_MODEL,
);

watch(selectedModel, (val) => {
  localStorage.setItem(MODEL_STORAGE_KEY, val);
});

const modelMenuOpen = ref(false);
const modelTriggerRef = ref<HTMLElement | null>(null);

const selectedModelLabel = computed(() => {
  const found = modelOptions.find((o) => o.value === selectedModel.value);
  return found ? found.label : selectedModel.value;
});

const menuStyle = computed((): CSSProperties => {
  if (!modelMenuOpen.value || !modelTriggerRef.value) return {};
  const rect = modelTriggerRef.value.getBoundingClientRect();
  return {
    position: 'fixed',
    top: `${rect.bottom + 4}px`,
    right: `${window.innerWidth - rect.right}px`,
    zIndex: 10000,
  } as CSSProperties;
});

const toggleModelMenu = () => {
  modelMenuOpen.value = !modelMenuOpen.value;
};

const selectModel = (val: string) => {
  selectedModel.value = val;
  modelMenuOpen.value = false;
};

const handleModelClickOutside = (e: MouseEvent) => {
  if (!modelMenuOpen.value) return;
  const target = e.target as Node;
  const trigger = modelTriggerRef.value;
  const menus = document.querySelectorAll('.neo-companion__model-menu');
  const menuEl = menus.length > 0 ? menus[0] : null;
  if (trigger && !trigger.contains(target) && menuEl && !menuEl.contains(target)) {
    modelMenuOpen.value = false;
  }
};

// Voice session state machine
type VoiceSessionState =
  | 'idle'
  | 'listening'
  | 'recording-utterance'
  | 'transcribing'
  | 'assistant-thinking'
  | 'error';

// Settings
const AUTO_SEND_VOICE_STORAGE_KEY = 'dashboardAssistant_autoSendVoice';
const autoSendVoiceTranscript = ref(
  localStorage.getItem(AUTO_SEND_VOICE_STORAGE_KEY) !== 'false',
);
watch(autoSendVoiceTranscript, (val) => {
  localStorage.setItem(AUTO_SEND_VOICE_STORAGE_KEY, String(val));
});

const VOICE_READ_RESPONSES_STORAGE_KEY = 'dashboardAssistant_voiceReadResponses';
const voiceReadAssistantResponses = ref(
  localStorage.getItem(VOICE_READ_RESPONSES_STORAGE_KEY) === 'true',
);
watch(voiceReadAssistantResponses, (val) => {
  localStorage.setItem(VOICE_READ_RESPONSES_STORAGE_KEY, String(val));
});

// Reactive state
const sessionActive = ref(false);
const voiceSessionState = ref<VoiceSessionState>('idle');
const voiceError = ref('');
const lastTranscript = ref('');
const lastBlobSize = ref(0);
const lastAsrLatencyMs = ref(0);
const currentRms = ref(0);
const voiceThreshold = ref(0.010);
const sessionId = ref(0);

// Non-reactive session variables
let vsStream: MediaStream | null = null;
let vsAudioContext: AudioContext | null = null;
let vsAnalyser: AnalyserNode | null = null;
let vadRaf = 0;
let speechStarted = false;
let lastSpeechAt = 0;
let utteranceStartedAt = 0;
let recorder: MediaRecorder | null = null;
let chunks: Blob[] = [];
let utteranceFinalizing = false;
let transcribing = false;
let assistantTurnActive = false;
let vsSessionId = 0;
let mimeType = 'audio/webm';

const SILENCE_DURATION_MS = 1000;
const MIN_UTTERANCE_MS = 600;
const MAX_UTTERANCE_DURATION_MS = 12000;
const MIN_BLOB_SIZE_BYTES = 3000;

// VAD helpers
function calculateRms(buffer: Float32Array): number {
  let sum = 0;
  for (const sample of buffer) sum += sample * sample;
  return Math.sqrt(sum / buffer.length);
}

const AUDIO_MIME_CANDIDATES = [
  'audio/webm;codecs=opus',
  'audio/webm',
  'audio/ogg;codecs=opus',
  'audio/ogg',
  'audio/wav',
];

const detectMimeType = (): string | null => {
  for (const m of AUDIO_MIME_CANDIDATES) {
    if (MediaRecorder.isTypeSupported(m)) return m;
  }
  return null;
};

function setVoiceState(next: VoiceSessionState, reason?: string) {
  if (isDev) console.log('[Voice] state', voiceSessionState.value, '->', next, reason || '');
  voiceSessionState.value = next;
}

const voiceIcon = computed(() => {
  if (!sessionActive.value) return 'keyboard_voice';
  switch (voiceSessionState.value) {
    case 'listening': return 'mic';
    case 'recording-utterance': return 'mic';
    case 'transcribing': return 'hourglass_top';
    case 'assistant-thinking': return 'hourglass_top';
    case 'error': return 'mic_off';
    default: return 'keyboard_voice';
  }
});

const toggleVoiceSession = () => {
  if (sessionActive.value) {
    stopVoiceSession();
  } else {
    void startVoiceSession();
  }
};

const handleSubmit = async () => {
  voiceError.value = '';
  await submitDraft();
};

// ─── Session lifecycle ───────────────────────────────────────

async function startVoiceSession() {
  try {
    vsSessionId += 1;
    sessionId.value = vsSessionId;
    voiceError.value = '';
    sessionActive.value = true;
    transcribing = false;
    assistantTurnActive = false;
    utteranceFinalizing = false;
    speechStarted = false;
    lastSpeechAt = 0;
    utteranceStartedAt = 0;

    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
    });
    vsStream = stream;

    mimeType = detectMimeType() || 'audio/webm';

    vsAudioContext = new AudioContext();
    const source = vsAudioContext.createMediaStreamSource(stream);
    vsAnalyser = vsAudioContext.createAnalyser();
    vsAnalyser.fftSize = 256;
    source.connect(vsAnalyser);

    startVadLoop(vsSessionId);
    startNewUtteranceRecorder(vsSessionId);

    setVoiceState('listening', 'session-started');
    if (isDev) console.log('[Voice] session started', { sessionId: vsSessionId });
  } catch (err) {
    sessionActive.value = false;
    setVoiceState('error', 'start-failed');
    if (err instanceof DOMException && err.name === 'NotAllowedError') {
      voiceError.value = 'Microphone permission was denied.';
    } else if (err instanceof DOMException && err.name === 'NotFoundError') {
      voiceError.value = 'No microphone found.';
    } else {
      voiceError.value = 'Voice input is not supported in this browser.';
    }
    if (isDev) console.error('[Voice] session start failed', err);
  }
}

function stopVoiceSession() {
  vsSessionId += 1;
  sessionId.value = vsSessionId;
  sessionActive.value = false;
  transcribing = false;
  assistantTurnActive = false;
  utteranceFinalizing = false;

  if (vadRaf) {
    cancelAnimationFrame(vadRaf);
    vadRaf = 0;
  }

  if (recorder) {
    recorder.onstop = null;
    if (recorder.state === 'recording') {
      try { recorder.stop(); } catch { /* already stopped */ }
    }
    recorder = null;
  }

  chunks = [];
  speechStarted = false;
  lastSpeechAt = 0;
  utteranceStartedAt = 0;

  if (vsAudioContext) {
    vsAudioContext.close().catch(() => {});
    vsAudioContext = null;
    vsAnalyser = null;
  }

  if (vsStream) {
    vsStream.getTracks().forEach((t) => t.stop());
    vsStream = null;
  }

  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }

  setVoiceState('idle', 'session-stopped');
  currentRms.value = 0;
  if (isDev) console.log('[Voice] session stopped', { sessionId: vsSessionId });
}

// ─── VAD loop (speech boundaries only) ──────────────────────

function startVadLoop(activeSessionId: number) {
  if (!vsAnalyser) return;
  const buffer = new Float32Array(vsAnalyser.frequencyBinCount);

  const loop = () => {
    if (!sessionActive.value) return;
    if (activeSessionId !== vsSessionId) return;

    vsAnalyser!.getFloatTimeDomainData(buffer);
    const rms = calculateRms(buffer);
    currentRms.value = rms;

    const now = Date.now();

    if (rms > voiceThreshold.value) {
      if (!speechStarted) {
        speechStarted = true;
        if (utteranceStartedAt === 0) utteranceStartedAt = now;
        setVoiceState('recording-utterance', 'speech-started');
        if (isDev) console.log('[Voice] speech started', { rms: rms.toFixed(4) });
      }
      lastSpeechAt = now;
    }

    if (speechStarted) {
      const silenceMs = now - lastSpeechAt;

      if (silenceMs >= SILENCE_DURATION_MS) {
        if (isDev) console.log('[Voice] silence detected', { silenceMs });
        finalizeCurrentUtterance('silence', activeSessionId);
        vadRaf = requestAnimationFrame(loop);
        return;
      }

      if (now - utteranceStartedAt >= MAX_UTTERANCE_DURATION_MS) {
        if (isDev) console.log('[Voice] max duration reached', { durationMs: now - utteranceStartedAt });
        finalizeCurrentUtterance('max-duration', activeSessionId);
        vadRaf = requestAnimationFrame(loop);
        return;
      }
    }

    vadRaf = requestAnimationFrame(loop);
  };

  vadRaf = requestAnimationFrame(loop);
}

// ─── Recorder lifecycle ─────────────────────────────────────

function startNewUtteranceRecorder(activeSessionId: number) {
  if (!sessionActive.value || activeSessionId !== vsSessionId) return;

  cleanupRecorderOnly();

  chunks = [];
  speechStarted = false;
  lastSpeechAt = 0;
  utteranceStartedAt = 0;
  utteranceFinalizing = false;

  if (!vsStream) return;

  const r = new MediaRecorder(vsStream, { mimeType });
  r.ondataavailable = (e: BlobEvent) => {
    if (e.data && e.data.size > 0) chunks.push(e.data);
  };
  r.onstop = () => {
    if (activeSessionId !== vsSessionId) return;
    void handleRecorderStopped(activeSessionId);
  };
  r.start(250);
  recorder = r;

  setVoiceState('listening', 'recorder-started');
  if (isDev) console.log('[Voice] recorder started');
}

function cleanupRecorderOnly() {
  if (recorder) {
    recorder.onstop = null;
    if (recorder.state === 'recording') {
      try { recorder.stop(); } catch { /* already stopped */ }
    }
    recorder = null;
  }
}

function finalizeCurrentUtterance(reason: 'silence' | 'max-duration' | 'manual-stop', activeSessionId: number) {
  if (activeSessionId !== vsSessionId) return;
  if (utteranceFinalizing) return;
  if (!recorder || recorder.state !== 'recording') return;

  utteranceFinalizing = true;
  transcribing = true;
  setVoiceState('transcribing', reason);

  if (isDev) console.log('[Voice] finalizing utterance', {
    reason,
    durationMs: utteranceStartedAt > 0 ? Date.now() - utteranceStartedAt : 0,
    chunksCount: chunks.length,
  });

  recorder.stop();
}

async function handleRecorderStopped(activeSessionId: number) {
  if (activeSessionId !== vsSessionId) return;

  try {
    const blob = new Blob(chunks, { type: mimeType });
    lastBlobSize.value = blob.size;
    chunks = [];

    const durationMs = utteranceStartedAt > 0 ? Date.now() - utteranceStartedAt : 0;

    if (!speechStarted || durationMs < MIN_UTTERANCE_MS || blob.size < MIN_BLOB_SIZE_BYTES) {
      if (isDev) console.log('[Voice] utterance ignored', { durationMs, size: blob.size, speechStarted });
      transcribing = false;
      utteranceFinalizing = false;
      if (sessionActive.value && activeSessionId === vsSessionId) {
        startNewUtteranceRecorder(activeSessionId);
      }
      return;
    }

    if (isDev) console.log('[Voice] ASR upload started', { size: blob.size, durationMs });

    const result = await transcribeAudio(blob);
    lastTranscript.value = result.transcript || '';
    lastAsrLatencyMs.value = result.latencyMs || 0;

    const transcript = (result.transcript || '').trim();

    if (isDev) console.log('[Voice] ASR transcript received', { transcript, latencyMs: result.latencyMs });

    if (!transcript) {
      transcribing = false;
      utteranceFinalizing = false;
      if (sessionActive.value && activeSessionId === vsSessionId) {
        startNewUtteranceRecorder(activeSessionId);
      }
      return;
    }

    draft.value = transcript;

    if (autoSendVoiceTranscript.value) {
      assistantTurnActive = true;
      setVoiceState('assistant-thinking', 'auto-send');
      if (isDev) console.log('[Voice] assistant send started', { transcript });

      await nextTick();
      await submitDraft();

      assistantTurnActive = false;
      if (isDev) console.log('[Voice] assistant send finished');
    } else {
      if (isDev) console.log('[Voice] auto-send off, transcript inserted');
      // Pause session — user must edit/send manually
      stopVoiceSession();
      return;
    }
  } catch (error) {
    voiceError.value = 'Voice transcription failed. Please try again.';
    if (isDev) console.warn('[Voice] error', error);
  } finally {
    transcribing = false;
    utteranceFinalizing = false;

    if (sessionActive.value && activeSessionId === vsSessionId) {
      startNewUtteranceRecorder(activeSessionId);
      if (isDev) console.log('[Voice] recorder restarted');
    }
  }
}

onMounted(() => {
  document.addEventListener('mousedown', handleModelClickOutside);

  if (isDev && typeof window !== 'undefined') {
    const w = window as unknown as Record<string, unknown>;
    w.__assistantDebugVoice = () => ({
      sessionActive: sessionActive.value,
      state: voiceSessionState.value,
      rms: currentRms.value,
      voiceThreshold: voiceThreshold.value,
      speechStarted,
      lastSpeechAt,
      lastSpeechAgoMs: lastSpeechAt > 0 ? Date.now() - lastSpeechAt : 0,
      utteranceFinalizing,
      transcribing,
      assistantTurnActive,
      recorderState: recorder ? recorder.state : 'none',
      chunksCount: chunks.length,
      lastBlobSize: lastBlobSize.value,
      lastTranscript: lastTranscript.value,
      lastAsrLatencyMs: lastAsrLatencyMs.value,
      lastError: voiceError.value,
      sessionId: vsSessionId,
      autoSendVoiceTranscript: autoSendVoiceTranscript.value,
      voiceReadAssistantResponses: voiceReadAssistantResponses.value,
    });
    w.__assistantStartVoiceSession = () => { void startVoiceSession(); };
    w.__assistantStopVoiceSession = () => { stopVoiceSession(); };
    w.__assistantVoiceSetThreshold = (val: number) => {
      voiceThreshold.value = val;
      console.log('[Voice] threshold set to', val);
    };
    w.__assistantSpeakTest = (text?: string) => {
      speakAssistantMessage(text || 'This is a test of the voice read aloud feature.');
    };
    w.__assistantCheckAsrStatus = async () => {
      try {
        const res = await fetch('/api/v1/asr/status');
        const data = await res.json();
        console.log('[DashboardAssistantVoice] ASR status:', JSON.stringify(data, null, 2));
        return data;
      } catch (err) {
        console.error('[DashboardAssistantVoice] status check failed', err);
        return null;
      }
    };
  }
});

onBeforeUnmount(() => {
  document.removeEventListener('mousedown', handleModelClickOutside);
  if (sessionActive.value) {
    stopVoiceSession();
  }
});

const visibleElements = useAssistantVisibleElements();

const assistantContext = computed<DashboardAssistantContext>(() => {
  const ctx: Record<string, string> = {};
  if (route.params.eventId) ctx.eventId = String(route.params.eventId);
  if (route.params.insuredId) ctx.insuredId = String(route.params.insuredId);
  if (route.params.sessionId) ctx.sessionId = String(route.params.sessionId);
  let theme = 'light';
  try {
    const appEl = document.getElementById('q-app') as unknown as {
      __vue_app__?: { config: { globalProperties: { $q: { dark: { isActive: boolean } } } } };
    } | null;
    const q = appEl?.__vue_app__?.config?.globalProperties?.$q;
    if (q?.dark) {
      theme = q.dark.isActive ? 'dark' : 'light';
      ctx.theme = theme;
    }
  } catch {
    // ignore - theme state unavailable
  }
  ctx.routeName = String(route.name ?? '');
  ctx.routeId = String(route.name ?? '');
  const visibleElementsVal = visibleElements.value;
  const uiSnapshot = {
    routeId: ctx.routeId,
    routeName: ctx.routeName,
    path: route.path,
    theme,
    layout: {
      sidebarVisible: !!document.querySelector('.q-drawer--on'),
      topbarVisible: !!document.querySelector('.q-header'),
      userMenuOpen: !!document.querySelector('#btn-user-avatar[aria-expanded="true"], .user-menu--open'),
    },
    pageTitle: document.title || ctx.routeName,
    visibleElementCount: visibleElementsVal.length,
    timestamp: new Date().toISOString(),
  };

  if (process.env.NODE_ENV === 'development') {
    console.log('[DashboardAssistant] sending request', {
      message: '...',
      currentRoute: String(route.name ?? ''),
      routeId: ctx.routeId,
      visibleElementCount: visibleElementsVal.length,
      visibleElementIds: visibleElementsVal.map(e => e.id),
      theme,
      uiSnapshot,
    });
  }

  return {
    currentRoute: String(route.name ?? ''),
    currentContext: ctx,
    visibleElements: visibleElementsVal,
    uiSnapshot,
  };
});

const {
  open,
  typing,
  showSuggestions,
  unread,
  messages,
  draft,
  toggle,
  close,
  reset,
  submitDraft,
  submitSuggestion,
} = useNoveoCompanionChat(assistantContext, selectedModel);

const suggestions = [
  { key: 'ddos', labelKey: 'companion.suggestions.ddos' },
  { key: 'anomalies', labelKey: 'companion.suggestions.anomalies' },
  { key: 'fraud', labelKey: 'companion.suggestions.fraud' },
];

const scrollFeed = async () => {
  await nextTick();
  if (feedRef.value) {
    feedRef.value.scrollTop = feedRef.value.scrollHeight;
  }
};

watch([messages, typing, open], () => {
  void scrollFeed();
});

// ─── TTS ─────────────────────────────────────────────────────

function speakAssistantMessage(text: string) {
  if (!voiceReadAssistantResponses.value) return;
  if (sessionActive.value) return; // skip during voice session to avoid feedback
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  if (!text || text.startsWith('⚠')) return;

  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 1;
  utterance.pitch = 1;

  utterance.onstart = () => {
    if (isDev) console.log('[Voice] TTS started');
  };
  utterance.onend = () => {
    if (isDev) console.log('[Voice] TTS ended');
  };
  utterance.onerror = () => {
    if (isDev) console.warn('[Voice] TTS error');
  };

  window.speechSynthesis.speak(utterance);
}

// ─── Watchers ────────────────────────────────────────────────

// Speak new assistant messages via TTS (only outside voice session)
watch(messages, (msgs) => {
  if (msgs.length === 0) return;
  const last = msgs[msgs.length - 1];
  if (last && last.sender === 'bot' && voiceReadAssistantResponses.value) {
    speakAssistantMessage(last.text);
  }
});

// Stop voice session when panel is closed
watch(open, (val) => {
  if (!val && sessionActive.value) {
    stopVoiceSession();
  }
});
</script>

<style scoped>
.neo-companion {
  position: fixed;
  right: 24px;
  bottom: 24px;
  z-index: 6500;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 16px;
}

.neo-companion__panel {
  width: min(400px, calc(100vw - 32px));
  height: min(500px, calc(100vh - 120px));
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border-radius: 18px;
  border: var(--neo-border);
  background: var(--neo-surface);
  box-shadow: var(--neo-shadow-hover);
}

.neo-companion__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 16px;
  color: var(--neo-ai-chrome-text);
  background: var(--neo-ai-chrome-bg);
  border-bottom: 1px solid var(--neo-accent-line);
}

.neo-companion__identity {
  display: flex;
  align-items: center;
  gap: 10px;
}

.neo-companion__avatar {
  position: relative;
  width: 36px;
  height: 36px;
  display: grid;
  place-items: center;
  border-radius: 12px;
  background: var(--neo-accent);
}

.neo-companion__status {
  position: absolute;
  right: -1px;
  bottom: -1px;
  width: 10px;
  height: 10px;
  border: 2px solid #fff;
  border-radius: 999px;
  background: var(--neo-success);
}

.neo-companion__identity h3 {
  margin: 0;
  font-size: 14px;
  font-weight: 700;
}

.neo-companion__identity p {
  margin: 2px 0 0;
  color: var(--neo-ai-chrome-muted);
  font-size: 10px;
}

.neo-companion__header-actions {
  display: flex;
  align-items: center;
  gap: 4px;
}

.neo-companion__model-picker-wrap {
  position: relative;
  display: flex;
  align-items: center;
}
.neo-companion__model-trigger {
  display: flex;
  align-items: center;
  gap: 2px;
  height: 28px;
  padding: 0 4px;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: var(--neo-ai-chrome-control);
  cursor: pointer;
  white-space: nowrap;
  overflow: hidden;
}
.neo-companion__model-trigger:hover {
  background: var(--neo-ai-chrome-control-hover-bg);
  color: var(--neo-ai-chrome-text);
}
.neo-companion__model-trigger-label {
  font-size: 10px;
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 80px;
}
.neo-companion__model-trigger-arrow {
  font-size: 16px;
  transition: transform 0.2s ease;
  flex-shrink: 0;
}
.neo-companion__model-trigger-arrow--open {
  transform: rotate(180deg);
}
.neo-companion__model-menu {
  min-width: 220px;
  max-width: min(320px, calc(100vw - 32px));
  padding: 6px;
  border: 1px solid var(--neo-accent-line);
  border-radius: 12px;
  background: var(--neo-surface);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.18);
  overflow: hidden;
}
.neo-companion__model-option {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 8px 10px;
  border: none;
  border-radius: 8px;
  background: transparent;
  color: var(--neo-ink);
  font-size: 11px;
  font-family: inherit;
  line-height: 1.4;
  text-align: left;
  cursor: pointer;
}
.neo-companion__model-option:hover {
  background: var(--neo-accent-soft);
  color: var(--neo-accent);
}
.neo-companion__model-option--active {
  color: var(--neo-accent);
  font-weight: 600;
}
.neo-companion__model-option-check {
  font-size: 14px;
  color: var(--neo-accent);
  opacity: 0;
  flex-shrink: 0;
  transition: opacity 0.15s ease;
}
.neo-companion__model-option-check--visible {
  opacity: 1;
}
.neo-companion__model-option-label {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.neo-companion-model-enter-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}
.neo-companion-model-leave-active {
  transition: opacity 0.1s ease, transform 0.1s ease;
}
.neo-companion-model-enter-from,
.neo-companion-model-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}

@media (max-width: 640px) {
  .neo-companion__model-menu {
    right: 12px;
    min-width: 200px;
  }
  .neo-companion__model-trigger-label {
    max-width: 60px;
  }
}

.neo-companion__icon-btn {
  width: 28px;
  height: 28px;
  display: grid;
  place-items: center;
  border: none;
  border-radius: 8px;
  background: transparent;
  color: var(--neo-ai-chrome-control);
  cursor: pointer;
}

.neo-companion__icon-btn:hover {
  background: var(--neo-ai-chrome-control-hover-bg);
  color: var(--neo-ai-chrome-text);
}

.neo-companion__feed {
  flex: 1;
  overflow: auto;
  padding: 16px;
  display: grid;
  gap: 14px;
}

.neo-companion__message {
  display: flex;
  gap: 8px;
  align-items: flex-start;
}

.neo-companion__message--user {
  justify-content: flex-end;
}

.neo-companion__bot-icon {
  width: 28px;
  height: 28px;
  display: grid;
  place-items: center;
  border-radius: 10px;
  background: var(--neo-accent-soft);
  color: var(--neo-accent);
  flex-shrink: 0;
}

.neo-companion__bubble {
  max-width: 85%;
  padding: 12px;
  border-radius: 16px;
  font-size: 12px;
  line-height: 1.55;
}

.neo-companion__message--bot .neo-companion__bubble {
  border-top-left-radius: 4px;
  background: var(--neo-card-bg-tint);
  color: var(--neo-ink-soft);
}

.neo-companion__message--user .neo-companion__bubble {
  border-top-right-radius: 4px;
  background: var(--neo-accent);
  color: #fff;
  box-shadow: 0 8px 20px rgba(229, 77, 86, 0.24);
}

.neo-companion__label {
  margin: 0 0 4px;
  color: var(--neo-accent);
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.neo-companion__text {
  margin: 0;
  white-space: pre-wrap;
}

.neo-companion__suggestions {
  display: grid;
  gap: 8px;
}

.neo-companion__suggestions > p {
  margin: 0;
  color: var(--neo-ink-muted);
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.neo-companion__suggestion {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 10px 12px;
  border: var(--neo-border);
  border-radius: 12px;
  background: var(--neo-card-bg-tint);
  color: var(--neo-ink-soft);
  font-size: 12px;
  text-align: left;
  cursor: pointer;
}

.neo-companion__suggestion:hover {
  border-color: var(--neo-accent-line);
  background: var(--neo-accent-soft);
  color: var(--neo-accent);
}

.neo-companion__suggestion :deep(.q-icon) {
  opacity: 0;
  transition: opacity var(--neo-transition-fast);
}

.neo-companion__suggestion:hover :deep(.q-icon) {
  opacity: 1;
}

.neo-companion__typing {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 16px 8px;
  color: var(--neo-ink-muted);
  font-size: 12px;
}

.neo-companion__typing-icon {
  animation: neo-companion-spin 1s linear infinite;
}

@keyframes neo-companion-spin {
  to {
    transform: rotate(360deg);
  }
}

.neo-companion__mic-btn {
  width: 36px;
  height: 36px;
  display: grid;
  place-items: center;
  border: none;
  border-radius: 50%;
  background: transparent;
  color: var(--neo-ai-chrome-control);
  cursor: pointer;
  transition: background 0.2s, color 0.2s, transform 0.2s;
  flex-shrink: 0;
}
.neo-companion__mic-btn:hover {
  background: var(--neo-accent-soft);
  color: var(--neo-accent);
}
.neo-companion__mic-btn--recording {
  background: var(--neo-critical);
  color: #fff;
  animation: neo-companion-pulse 1s ease-in-out infinite;
}
.neo-companion__mic-btn--recording:hover {
  background: var(--neo-critical);
  color: #fff;
}
.neo-companion__mic-btn--transcribing {
  background: var(--neo-accent);
  color: #fff;
}
.neo-companion__mic-btn--error {
  color: var(--neo-critical);
}
.neo-companion__mic-icon {
  font-size: 18px;
}

.neo-companion__voice-error {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  font-size: 12px;
  color: var(--neo-critical);
  background: var(--neo-card-bg-tint);
  border-top: var(--neo-border);
}
.neo-companion__voice-error .q-icon {
  font-size: 14px;
}

.neo-companion__composer {
  display: flex;
  gap: 8px;
  padding: 12px;
  border-top: var(--neo-border);
  background: var(--neo-card-bg-tint);
}

.neo-companion__composer input {
  flex: 1;
  min-width: 0;
  padding: 10px 12px;
  border: var(--neo-border);
  border-radius: 12px;
  background: var(--neo-input-bg);
  color: var(--neo-ink);
  font-size: 12px;
}

.neo-companion__composer input:focus {
  outline: none;
  border-color: var(--neo-accent);
  box-shadow: 0 0 0 1px var(--neo-accent-line);
}

.neo-companion__composer button {
  width: 40px;
  height: 40px;
  display: grid;
  place-items: center;
  border: none;
  border-radius: 12px;
  background: var(--neo-accent);
  color: #fff;
  cursor: pointer;
}

.neo-companion__composer button:hover {
  background: var(--neo-accent-hover);
}

.neo-companion__launcher {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 12px;
  padding: 14px 20px;
  border: 2px solid var(--neo-ai-launcher-border);
  border-radius: 999px;
  background: var(--neo-ai-launcher-bg);
  color: var(--neo-ai-launcher-text);
  box-shadow: var(--neo-shadow-hover);
  cursor: pointer;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  transition: transform var(--neo-transition-med);
}

.neo-companion__launcher:hover {
  transform: scale(1.03);
}

.neo-companion__launcher-icon {
  animation: neo-companion-pulse 2s ease-in-out infinite;
}

.neo-companion__badge {
  position: absolute;
  top: -4px;
  right: -4px;
  width: 16px;
  height: 16px;
  border: 2px solid #fff;
  border-radius: 999px;
  background: var(--neo-critical);
  animation: neo-companion-pulse 2s ease-in-out infinite;
}

@keyframes neo-companion-pulse {
  0%,
  100% {
    opacity: 1;
  }

  50% {
    opacity: 0.72;
  }
}

.neo-companion-panel-enter-active,
.neo-companion-panel-leave-active {
  transition:
    opacity 220ms ease,
    transform 260ms cubic-bezier(0.2, 0, 0, 1);
}

.neo-companion-panel-enter-from,
.neo-companion-panel-leave-to {
  opacity: 0;
  transform: translateY(16px) scale(0.95);
}

@media (max-width: 640px) {
  .neo-companion {
    right: 16px;
    bottom: 16px;
  }

  .neo-companion__launcher span {
    display: none;
  }

  .neo-companion__launcher {
    width: 56px;
    height: 56px;
    padding: 0;
    justify-content: center;
  }
}

/* ─── Voice session UI ────────────────────────────────── */

.neo-companion__voice-status {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  font-size: 11px;
  font-weight: 600;
  color: var(--neo-ink-soft);
  background: var(--neo-card-bg-tint);
  border-top: var(--neo-border);
}

.neo-companion__voice-status .q-icon {
  font-size: 14px;
}

.neo-companion__voice-status-icon--active {
  animation: neo-companion-pulse 0.8s ease-in-out infinite;
  color: var(--neo-critical);
}

.neo-companion__voice-setting {
  position: relative;
  width: 28px;
  height: 28px;
  display: grid;
  place-items: center;
  border-radius: 8px;
  cursor: pointer;
  color: var(--neo-ai-chrome-control);
  font-size: 16px;
  flex-shrink: 0;
  transition: color 0.15s;
}

.neo-companion__voice-setting:hover {
  color: var(--neo-ai-chrome-text);
  background: var(--neo-ai-chrome-control-hover-bg);
}

.neo-companion__voice-setting--on {
  color: var(--neo-accent);
}

.neo-companion__voice-setting-input {
  display: none;
}

.neo-companion__mic-btn--active {
  background: var(--neo-accent-soft);
  color: var(--neo-accent);
}
</style>
