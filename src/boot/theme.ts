// ---- Imports ----
import { defineBoot } from '#q-app/wrappers';
import { Dark } from 'quasar';
import { applyTheme, resolveInitialTheme } from 'src/utils/theme';

// ---- Boot Export ----
export default defineBoot(() => {
  applyTheme(resolveInitialTheme(), (value) => Dark.set(value));
});
