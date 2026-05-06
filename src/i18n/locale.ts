// Resolve app locale from explicit config or browser region/language hints.
export const DEFAULT_LOCALE = 'en-US';
export const DEFAULT_FALLBACK_LOCALE = 'en-US';
const SUPPORTED_LOCALES = new Set(['en-US', 'ar', 'fr-FR', 'es-ES']);

const LOCALE_ALIASES: Record<string, string> = {
  en: 'en-US',
  'en-us': 'en-US',
  ar: 'ar',
  fr: 'fr-FR',
  'fr-fr': 'fr-FR',
  es: 'es-ES',
  'es-es': 'es-ES',
};

const ARABIC_REGIONS = new Set([
  'AE',
  'BH',
  'DJ',
  'DZ',
  'EG',
  'IQ',
  'JO',
  'KM',
  'KW',
  'LB',
  'LY',
  'MA',
  'MR',
  'OM',
  'PS',
  'QA',
  'SA',
  'SD',
  'SO',
  'SY',
  'TN',
  'YE',
]);

const FRENCH_REGIONS = new Set(['FR', 'BE', 'CH', 'LU', 'MC']);

const SPANISH_REGIONS = new Set([
  'AR',
  'BO',
  'CL',
  'CO',
  'CR',
  'CU',
  'DO',
  'EC',
  'ES',
  'GT',
  'HN',
  'MX',
  'NI',
  'PA',
  'PE',
  'PR',
  'PY',
  'SV',
  'UY',
  'VE',
]);

const LANGUAGE_TO_LOCALE: Record<string, string> = {
  ar: 'ar',
  fr: 'fr-FR',
  es: 'es-ES',
  en: 'en-US',
};

const normalizeLocale = (value: string | undefined) => {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  const alias = LOCALE_ALIASES[trimmed.toLowerCase()];
  if (alias) return alias;
  try {
    const canonical = Intl.getCanonicalLocales(trimmed)[0];
    if (!canonical) return null;
    return LOCALE_ALIASES[canonical.toLowerCase()] ?? canonical;
  } catch {
    return null;
  }
};

const localeFromRegion = (region: string | undefined) => {
  if (!region) return null;
  if (ARABIC_REGIONS.has(region)) return 'ar';
  if (FRENCH_REGIONS.has(region)) return 'fr-FR';
  if (SPANISH_REGIONS.has(region)) return 'es-ES';
  return null;
};

const readBrowserCandidates = () => {
  if (typeof navigator === 'undefined') return [] as string[];
  const fromList = Array.isArray(navigator.languages) ? navigator.languages : [];
  const fallback = typeof navigator.language === 'string' ? [navigator.language] : [];
  return [...fromList, ...fallback];
};

const detectLocaleFromBrowser = () => {
  const candidates = readBrowserCandidates();
  for (const candidate of candidates) {
    const normalized = normalizeLocale(candidate);
    try {
      const locale = new Intl.Locale(normalized ?? candidate);
      const regionMatch = localeFromRegion(locale.region?.toUpperCase());
      if (regionMatch) return regionMatch;
      if (normalized && SUPPORTED_LOCALES.has(normalized)) {
        return normalized;
      }
      const languageMatch = LANGUAGE_TO_LOCALE[locale.language];
      if (languageMatch) return languageMatch;
    } catch {
      continue;
    }
  }
  return null;
};

export const resolveAppLocale = (
  preferredLocale: string | undefined,
  fallbackLocale: string | undefined,
) => {
  const normalizedFallback =
    normalizeLocale(fallbackLocale) ?? DEFAULT_FALLBACK_LOCALE;
  const normalizedPreferred = normalizeLocale(preferredLocale);

  if (normalizedPreferred && normalizedPreferred.toLowerCase() !== 'auto') {
    return {
      locale: normalizedPreferred,
      fallbackLocale: normalizedFallback,
    };
  }

  return {
    locale: detectLocaleFromBrowser() ?? DEFAULT_LOCALE,
    fallbackLocale: normalizedFallback,
  };
};
