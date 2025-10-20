import { createContext, useContext, useState, ReactNode } from 'react';
import { LanguageCode, TranslationKey, getTranslation } from './translations';

interface LanguageContextType {
  language: LanguageCode;
  setLanguage: (lang: LanguageCode) => void;
  t: (key: TranslationKey) => string;
}

const defaultLanguage: LanguageCode = 'en';

// Create the language context
const LanguageContext = createContext<LanguageContextType>({
  language: defaultLanguage,
  setLanguage: () => {},
  t: (key) => getTranslation(key, defaultLanguage)
});

// Language provider component
export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<LanguageCode>(() => {
    // Try to get language from localStorage
    const savedLang = localStorage.getItem('language');
    if (savedLang && ['en', 'nl', 'es', 'fr'].includes(savedLang)) {
      return savedLang as LanguageCode;
    }
    return defaultLanguage;
  });
  
  // Save language to localStorage when it changes
  const handleSetLanguage = (lang: LanguageCode) => {
    setLanguage(lang);
    localStorage.setItem('language', lang);
  };
  
  // Translation function
  const t = (key: TranslationKey) => getTranslation(key, language);
  
  return (
    <LanguageContext.Provider value={{ language, setLanguage: handleSetLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

// Hook to use language context
export function useLanguage() {
  return useContext(LanguageContext);
}