// ---- Imports ----
import { defineBoot } from '#q-app/wrappers';
import { createI18n } from 'vue-i18n';
import { environment } from 'src/config/environment';
import ar from 'src/i18n/messages/ar';
import enUS from 'src/i18n/messages/en-US';
import esES from 'src/i18n/messages/es-ES';
import frFR from 'src/i18n/messages/fr-FR';
import { isRtlLocale, resolveAppLocale } from 'src/i18n/locale';

// ---- Messages & Locale Config ----
const messages = {
  en: enUS,
  'en-US': enUS,
  ar,
  fr: frFR,
  'fr-FR': frFR,
  es: esES,
  'es-ES': esES,
} as const;

const { locale, fallbackLocale } = resolveAppLocale(
  environment.locale,
  environment.fallbackLocale,
);

export const i18n = createI18n({
  legacy: false,
  locale,
  fallbackLocale,
  messages,
});

// ---- Boot Export ----
export default defineBoot(({ app }) => {
  if (typeof document !== 'undefined') {
    document.documentElement.lang = locale;
    document.documentElement.dir = isRtlLocale(locale) ? 'rtl' : 'ltr';
  }

  app.use(i18n);
});
