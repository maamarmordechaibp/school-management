import React from 'react';
import { Languages } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

/**
 * LanguageToggle — a large, always-visible segmented control to switch the
 * entire UI between English (LTR) and Hebrew (RTL). Designed for a
 * non-technical user: clear text labels, big tap target, no icons-only.
 * The choice is persisted in localStorage by LanguageContext.
 */
const LanguageToggle = ({ className = '' }) => {
  const { lang, setLang } = useLanguage();

  return (
    <div
      role="group"
      aria-label="Language"
      className={`inline-flex items-center rounded-full border border-slate-200 bg-white p-1 shadow-sm ${className}`}
    >
      <Languages size={16} className="text-slate-400 mx-1.5 flex-shrink-0" aria-hidden="true" />
      <button
        type="button"
        onClick={() => setLang('en')}
        aria-pressed={lang === 'en'}
        className={`min-h-[36px] px-3 rounded-full text-sm font-semibold transition-colors ${
          lang === 'en'
            ? 'bg-primary text-white shadow-sm'
            : 'text-slate-600 hover:bg-slate-100'
        }`}
      >
        English
      </button>
      <button
        type="button"
        onClick={() => setLang('he')}
        aria-pressed={lang === 'he'}
        className={`min-h-[36px] px-3 rounded-full text-sm font-semibold font-hebrew transition-colors ${
          lang === 'he'
            ? 'bg-primary text-white shadow-sm'
            : 'text-slate-600 hover:bg-slate-100'
        }`}
      >
        עברית
      </button>
    </div>
  );
};

export default LanguageToggle;
