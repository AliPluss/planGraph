'use client';

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './translations/en.json';
import ar from './translations/ar.json';

// No LanguageDetector — it touches history/URL APIs which conflict with
// the Next.js App Router before it initialises. We read localStorage manually.
if (!i18n.isInitialized) {
  const saved =
    typeof window !== 'undefined'
      ? (localStorage.getItem('i18nextLng') ?? 'en')
      : 'en';
  const lng = saved.startsWith('ar') ? 'ar' : 'en';

  i18n.use(initReactI18next).init({
    lng,
    resources: {
      en: { translation: en },
      ar: { translation: ar },
    },
    fallbackLng: 'en',
    interpolation: { escapeValue: false },
  });
}

export default i18n;
