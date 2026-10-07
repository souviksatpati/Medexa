import { create } from "zustand";
import {
  type LanguageCode,
  SUPPORTED_LANGUAGES,
  DEFAULT_LANGUAGE,
  type LanguageInfo,
} from "./languages";
import { TRANSLATIONS, type TranslationSchema } from "./translations";
import { PORTAL_TRANSLATIONS } from "./portalTranslations";

const STORAGE_KEY = "medexa_preferred_language";

const getInitialLanguage = (): LanguageCode => {
  if (typeof window === "undefined") return DEFAULT_LANGUAGE;
  try {
    const saved = localStorage.getItem(STORAGE_KEY) as LanguageCode | null;
    if (saved && SUPPORTED_LANGUAGES.some((l) => l.code === saved)) {
      return saved;
    }
  } catch (e) {
    console.warn("Could not read language from localStorage", e);
  }
  return DEFAULT_LANGUAGE;
};

const initialLang = getInitialLanguage();
if (typeof window !== "undefined") {
  document.documentElement.lang = initialLang;
}

interface LanguageState {
  language: LanguageCode;
  setLanguage: (lang: LanguageCode) => void;
  t: <S extends keyof TranslationSchema, K extends keyof TranslationSchema[S]>(
    section: S,
    key: K
  ) => string;
  tPortal: (key: string, fallback?: string, langOverride?: LanguageCode) => string;
  getLanguageInfo: () => LanguageInfo;
}

export const useLanguageStore = create<LanguageState>((set, get) => ({
  language: initialLang,

  setLanguage: (lang: LanguageCode) => {
    try {
      if (typeof window !== "undefined") {
        localStorage.setItem(STORAGE_KEY, lang);
        document.documentElement.lang = lang;
      }
    } catch (e) {
      console.warn("Could not write language to localStorage", e);
    }
    set({ language: lang });
  },

  t: <S extends keyof TranslationSchema, K extends keyof TranslationSchema[S]>(
    section: S,
    key: K
  ): string => {
    const lang = get().language;
    const currentDict = TRANSLATIONS[lang] || TRANSLATIONS[DEFAULT_LANGUAGE];
    const sectionObj = currentDict[section] as Record<string, string> | undefined;
    if (sectionObj && sectionObj[key as string] !== undefined) {
      return sectionObj[key as string];
    }
    const fallbackSection = TRANSLATIONS[DEFAULT_LANGUAGE][section] as Record<string, string> | undefined;
    return (fallbackSection && fallbackSection[key as string]) || (key as string);
  },

  tPortal: (key: string, fallback?: string, langOverride?: LanguageCode): string => {
    const lang = langOverride || get().language;
    
    // Check portalTranslations first
    if (PORTAL_TRANSLATIONS[lang]?.[key]) {
      return PORTAL_TRANSLATIONS[lang][key];
    }

    // Check translations.ts portal dictionary
    const currentDict = TRANSLATIONS[lang] || TRANSLATIONS[DEFAULT_LANGUAGE];
    const portal = currentDict.portal as Record<string, string> | undefined;
    if (portal && portal[key]) {
      return portal[key];
    }

    // Check default english portalTranslations
    if (PORTAL_TRANSLATIONS[DEFAULT_LANGUAGE]?.[key]) {
      return PORTAL_TRANSLATIONS[DEFAULT_LANGUAGE][key];
    }

    // Check default translations.ts portal dictionary
    const defaultPortal = TRANSLATIONS[DEFAULT_LANGUAGE].portal as Record<string, string> | undefined;
    return (defaultPortal && defaultPortal[key]) || fallback || key;
  },

  getLanguageInfo: (): LanguageInfo => {
    const lang = get().language;
    const found = SUPPORTED_LANGUAGES.find((l) => l.code === lang);
    return found || SUPPORTED_LANGUAGES[0];
  },
}));
