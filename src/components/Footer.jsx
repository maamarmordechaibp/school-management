import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';

/**
 * Footer — minimal, unobtrusive "Developed by CodeLab" line shown on every
 * page. The word "CodeLab" links to the developer site in a new tab.
 */
const Footer = () => {
  const { t } = useLanguage();

  return (
    <footer className="mt-8 pt-4 pb-2 text-center">
      <p className="text-xs text-[#9CA3AF]">
        {t('footer.developedBy')}{' '}
        <a
          href="https://codelabsus.com"
          target="_blank"
          rel="noopener noreferrer"
          className="font-semibold text-slate-500 hover:text-primary underline-offset-2 hover:underline transition-colors"
        >
          CodeLab
        </a>
      </p>
    </footer>
  );
};

export default Footer;
