import React, { createContext, useContext } from 'react';
import { english } from '@/translations/en';

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  const t = (path) => {
    const keys = path.split('.');
    let result = english;
    for (const key of keys) {
      result = result?.[key];
    }
    return result || path;
  };

  const isRTL = false;

  return (
    <LanguageContext.Provider value={{ t, isRTL }}>
      <div dir="ltr" className="font-sans">
        {children}
      </div>
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);