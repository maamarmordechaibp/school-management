import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { english } from '@/translations/en';
import { hebrew } from '@/translations/he';

const LanguageContext = createContext();

const STORAGE_KEY = 'app_language';
const DICTS = { en: english, he: hebrew };

const getInitialLang = () => {
  if (typeof window === 'undefined') return 'en';
  const saved = window.localStorage.getItem(STORAGE_KEY);
  return saved === 'he' || saved === 'en' ? saved : 'en';
};

export const LanguageProvider = ({ children }) => {
  const [lang, setLangState] = useState(getInitialLang);

  const isRTL = lang === 'he';
  const dir = isRTL ? 'rtl' : 'ltr';

  // Persist the choice + apply direction/lang to the document so the ENTIRE
  // UI flips instantly and the preference survives page refreshes.
  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, lang);
    } catch (e) { /* ignore storage errors */ }
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('dir', dir);
      document.documentElement.setAttribute('lang', lang);
    }
  }, [lang, dir]);

  const setLang = useCallback((next) => {
    if (next === 'en' || next === 'he') setLangState(next);
  }, []);

  const toggleLang = useCallback(() => {
    setLangState((prev) => (prev === 'en' ? 'he' : 'en'));
  }, []);

  // Translate a dotted key path. Falls back to English, then to the raw key,
  // so nothing ever renders blank even if a Hebrew string is missing.
  const t = useCallback(
    (path) => {
      const keys = String(path).split('.');
      const dict = DICTS[lang] || english;

      let result = dict;
      for (const key of keys) {
        result = result?.[key];
      }
      if (result != null && typeof result !== 'object') return result;

      let fallback = english;
      for (const key of keys) {
        fallback = fallback?.[key];
      }
      return fallback != null && typeof fallback !== 'object' ? fallback : path;
    },
    [lang]
  );

  return (
    <LanguageContext.Provider value={{ t, isRTL, lang, dir, setLang, toggleLang }}>
      <div dir={dir} className={isRTL ? 'font-hebrew' : 'font-sans'}>
        {children}
      </div>
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);