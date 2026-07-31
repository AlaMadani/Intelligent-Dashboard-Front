// ---- Types & Constants ----
export type ThemeMode = 'light' | 'dark';

export const THEME_STORAGE_KEY = 'noveo-care-theme';

// ---- Resolve Initial Theme ----
export const resolveInitialTheme = (): ThemeMode => {
  if (typeof window === 'undefined') {
    return 'dark';
  }

  const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
  return storedTheme === 'light' || storedTheme === 'dark' ? storedTheme : 'dark';
};

// ---- Apply Theme ----
export const applyTheme = (mode: ThemeMode, setQuasarDark?: (value: boolean) => void) => {
  if (typeof document === 'undefined') {
    return;
  }

  const root = document.documentElement;
  root.dataset.theme = mode;
  root.classList.toggle('dark', mode === 'dark');
  root.classList.toggle('light', mode === 'light');
  setQuasarDark?.(mode === 'dark');
};

// ---- Persist Theme ----
export const persistTheme = (mode: ThemeMode) => {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(THEME_STORAGE_KEY, mode);
};
