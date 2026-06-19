<template>
  <div class="neo-theme-toggle" role="group" :aria-label="t('layout.aria.themeMode')">
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
import { useI18n } from 'vue-i18n';
import { useTheme } from 'src/composables/useTheme';

const { t } = useI18n();
const { themeMode, setTheme } = useTheme();
</script>
