<template>
  <div id="theme-toggle" class="neo-theme-toggle" role="group" :aria-label="t('layout.aria.themeMode')"
    data-assistant-id="theme-toggle"
    data-assistant-type="toggle"
    data-assistant-label="Theme Toggle"
    data-assistant-description="Toggle switch to change between dark mode and light mode for the dashboard."
    data-assistant-actions="HIGHLIGHT_ELEMENT,CLICK_ELEMENT"
  >
    <button
      type="button"
      class="neo-theme-toggle__option"
      :class="{ 'neo-theme-toggle__option--active': themeMode === 'light' }"
      :aria-pressed="themeMode === 'light'"
      :aria-label="t('layout.aria.useLightTheme')"
      @click="setTheme('light')"
    >
      <q-icon name="light_mode" />
    </button>
    <button
      type="button"
      class="neo-theme-toggle__option"
      :class="{ 'neo-theme-toggle__option--active': themeMode === 'dark' }"
      :aria-pressed="themeMode === 'dark'"
      :aria-label="t('layout.aria.useDarkTheme')"
      @click="setTheme('dark')"
    >
      <q-icon name="dark_mode" />
    </button>
  </div>
</template>

<script setup lang="ts">
// ---- Imports ----
import { useI18n } from 'vue-i18n';
import { useTheme } from 'src/composables/useTheme';

// ---- Setup ----
const { t } = useI18n();
const { themeMode, setTheme } = useTheme();
</script>
