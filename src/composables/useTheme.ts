import { readonly, ref } from 'vue';
import { useQuasar } from 'quasar';
import {
  applyTheme,
  persistTheme,
  resolveInitialTheme,
  type ThemeMode,
} from 'src/utils/theme';

const themeMode = ref<ThemeMode>(
  typeof window === 'undefined' ? 'dark' : resolveInitialTheme(),
);

export const useTheme = () => {
  const $q = useQuasar();

  const setTheme = (mode: ThemeMode) => {
    themeMode.value = mode;
    applyTheme(mode, (value) => $q.dark.set(value));
    persistTheme(mode);
  };

  return {
    themeMode: readonly(themeMode),
    setTheme,
  };
};
