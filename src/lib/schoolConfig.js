/**
 * Central school identity. These are the defaults shown everywhere in the UI
 * (login screen, sidebar, browser tab, letters, emails). They mirror the
 * values seeded in migrations/024_school_identity_settings.sql, so an admin
 * can override any of them at runtime via the `app_settings` table without
 * touching code.
 */

export const SCHOOL_NAME_YI = 'תלמוד תורה תולדות יעקב יוסף דחסידי סקווירא - מאנסי';
export const SCHOOL_SUBTITLE_YI = 'בנשיאות כ"ק מרן אדמו"ר שליט"א';
export const SCHOOL_NAME_EN = 'Talmud Torah Toldos Yaakov Yosef d\'Skvere - Monsey';
export const SCHOOL_SHORT_EN = 'TTYY Skvere Monsey';
export const SCHOOL_LOGO_URL = '/school-logo.png';
export const SCHOOL_FAVICON_URL = '/school-logo.png';

export const schoolConfig = {
  nameYi: SCHOOL_NAME_YI,
  subtitleYi: SCHOOL_SUBTITLE_YI,
  nameEn: SCHOOL_NAME_EN,
  shortEn: SCHOOL_SHORT_EN,
  logoUrl: SCHOOL_LOGO_URL,
  faviconUrl: SCHOOL_FAVICON_URL,
};

export default schoolConfig;
