import React, { createContext, useContext, useState } from 'react';
import { translations } from '../i18n';

const LanguageContext = createContext(null);

// Detect browser/OS language — returns 'he' if Hebrew, 'en' otherwise
const detectLang = () => {
  try {
    const lang = navigator?.language || navigator?.languages?.[0] || 'en';
    return lang.startsWith('he') ? 'he' : 'en';
  } catch {
    return 'en';
  }
};

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(detectLang);

  // t(key) returns the translated string; falls back to the key itself if missing
  const t = (key) => translations[lang]?.[key] ?? translations.en[key] ?? key;

  // Apply RTL direction to <html> whenever the language changes
  React.useEffect(() => {
    document.documentElement.dir = lang === 'he' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
  }, [lang]);

  return (
    <LanguageContext.Provider value={{ lang, setLang, t, isHebrew: lang === 'he' }}>
      {children}
    </LanguageContext.Provider>
  );
}

export const useLanguage = () => {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used inside LanguageProvider');
  return ctx;
};
