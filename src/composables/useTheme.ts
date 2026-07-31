import { readonly, ref } from 'vue';
import { useQuasar } from 'quasar';
import {
  applyTheme,
  persistTheme,
  resolveInitialTheme,
  type ThemeMode,
} from 'src/utils/theme';

// ---- Module-Level State ----
const themeMode = ref<ThemeMode>(
  typeof window === 'undefined' ? 'dark' : resolveInitialTheme(),
);

// ---- Composable ----
export const useTheme = () => {
  const $q = useQuasar();

  // ---- Methods ----
  const setTheme = (mode: ThemeMode) => {
    themeMode.value = mode;
    applyTheme(mode, (value) => $q.dark.set(value));
    persistTheme(mode);
  };

  // ---- Return ----
  return {
    themeMode: readonly(themeMode),
    setTheme,
  };
};
