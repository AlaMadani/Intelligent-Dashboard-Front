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

        <form class="neo-companion__composer" @submit.prevent="submitDraft">
          <input
            v-model="draft"
            type="text"
            :placeholder="t('companion.placeholder')"
            :aria-label="t('companion.placeholder')"
          />
          <button type="submit" :aria-label="t('companion.send')">
            <q-icon name="send" />
          </button>
        </form>
      </section>
    </Transition>

    <button type="button" class="neo-companion__launcher" @click="toggle">
      <span v-if="unread && !open" class="neo-companion__badge" aria-hidden="true"></span>
      <q-icon name="auto_awesome" class="neo-companion__launcher-icon" />
      <span>{{ t('companion.launcher') }}</span>
    </button>
  </div>
</template>

<script setup lang="ts">
import { nextTick, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useNoveoCompanionChat } from 'src/composables/useNoveoCompanionChat';

const { t } = useI18n();
const feedRef = ref<HTMLElement | null>(null);

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
} = useNoveoCompanionChat();

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
  gap: 4px;
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
</style>
