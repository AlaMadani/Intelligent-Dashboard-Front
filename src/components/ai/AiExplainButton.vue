<template>
  <button
    type="button"
    class="neo-ai-explain-btn"
    :class="[`neo-ai-explain-btn--${variant}`, { 'neo-ai-explain-btn--dense': dense }]"
    :title="label"
    @click.stop="handleClick"
  >
    <q-icon name="auto_awesome" class="neo-ai-explain-btn__icon" />
    <span v-if="variant !== 'icon'" class="neo-ai-explain-btn__label">{{ label }}</span>
  </button>
</template>

<script setup lang="ts">
// ---- Imports ----
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useAiExplainer } from 'src/composables/useAiExplainer';
import type { AiExplainerOpenOptions } from 'src/types/aiExplainer';

// ---- Props ----
const props = withDefaults(
  defineProps<{
    contextKey: string;
    params?: Record<string, string | number | undefined | null>;
    content?: AiExplainerOpenOptions['content'];
    eventId?: string;
    variant?: 'prominent' | 'compact' | 'icon' | 'banner';
    dense?: boolean;
    labelKey?: string;
  }>(),
  {
    variant: 'prominent',
    dense: false,
    labelKey: 'aiExplainer.explainWithAi',
  },
);

// ---- Composables ----
const { t } = useI18n();
const { open } = useAiExplainer();

// ---- Computed ----
const label = computed(() => {
  if (props.variant === 'compact') {
    return t('aiExplainer.aiExplainer');
  }
  return t(props.labelKey);
});

// ---- Methods ----
const handleClick = () => {
  void open({
    contextKey: props.contextKey,
    ...(props.params ? { params: props.params } : {}),
    ...(props.content ? { content: props.content } : {}),
    ...(props.eventId ? { eventId: props.eventId } : {}),
  });
};
</script>

// ---- Styles ----
<style scoped>
.neo-ai-explain-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  border: none;
  cursor: pointer;
  font-family: inherit;
  font-weight: 600;
  line-height: 1;
  transition:
    background var(--neo-transition-fast),
    border-color var(--neo-transition-fast),
    color var(--neo-transition-fast),
    transform var(--neo-transition-fast),
    box-shadow var(--neo-transition-fast);
}

.neo-ai-explain-btn:focus-visible {
  outline: 2px solid var(--neo-accent);
  outline-offset: 2px;
}

.neo-ai-explain-btn__icon {
  font-size: 14px;
}

.neo-ai-explain-btn--prominent {
  padding: 6px 12px;
  border-radius: 10px;
  border: 1px solid var(--neo-accent-line);
  background: var(--neo-accent-soft);
  color: var(--neo-accent);
  font-size: 12px;
  position: relative;
  isolation: isolate;
  overflow: hidden;
}

.neo-ai-explain-btn--prominent::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 10px;
  background: linear-gradient(135deg, rgba(255,255,255,0.5) 0%, transparent 50%, rgba(255,255,255,0.2) 100%);
  opacity: 0;
  transition: opacity var(--neo-transition-fast);
  pointer-events: none;
}

.neo-ai-explain-btn--prominent:hover::before {
  opacity: 1;
}

.neo-ai-explain-btn--prominent:hover {
  background: rgba(229, 77, 86, 0.22);
  border-color: rgba(229, 77, 86, 0.5);
}

.neo-ai-explain-btn--compact {
  padding: 4px 10px;
  border-radius: 8px;
  background: var(--neo-subtle-bg);
  color: var(--neo-ink-muted);
  font-size: 11px;
  border: 1px solid var(--neo-border-color);
}

.neo-ai-explain-btn--compact:hover {
  background: var(--neo-accent);
  border-color: var(--neo-accent);
  color: #fff;
}

.neo-ai-explain-btn:not(.neo-ai-explain-btn--icon) .neo-ai-explain-btn__label,
.neo-ai-explain-btn:not(.neo-ai-explain-btn--icon) .neo-ai-explain-btn__icon {
  background: var(--neo-diamond);
  background-size: 200% auto;
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  animation: shimmer 3s ease-in-out infinite;
}

.neo-ai-explain-btn:not(.neo-ai-explain-btn--icon):hover .neo-ai-explain-btn__label,
.neo-ai-explain-btn:not(.neo-ai-explain-btn--icon):hover .neo-ai-explain-btn__icon {
  background: none;
  -webkit-background-clip: unset;
  background-clip: unset;
  -webkit-text-fill-color: currentColor;
  animation: none;
}

@keyframes shimmer {
  0%, 100% { background-position: 0% center; }
  50% { background-position: 200% center; }
}

.neo-ai-explain-btn--icon {
  width: 32px;
  height: 32px;
  padding: 0;
  border-radius: 10px;
  background: transparent;
  color: var(--neo-ink-muted);
}

.neo-ai-explain-btn--icon:hover {
  color: var(--neo-accent);
  background: var(--neo-accent-soft);
}

.neo-ai-explain-btn--banner {
  padding: 6px 12px;
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  background: rgba(0, 0, 0, 0.4);
  color: #fff;
  font-size: 12px;
}

.neo-ai-explain-btn--banner:hover {
  background: rgba(0, 0, 0, 0.6);
}

.neo-ai-explain-btn--dense.neo-ai-explain-btn--prominent {
  padding: 4px 10px;
  font-size: 11px;
}
</style>
