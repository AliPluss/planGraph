'use client';

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import en from './translations/en.json';
import ar from './translations/ar.json';

if (!i18n.isInitialized) {
  i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
      resources: {
        en: { translation: en },
        ar: { translation: ar },
      },
      fallbackLng: 'en',
      detection: {
        order: ['localStorage', 'navigator'],
        caches: ['localStorage'],
      },
      interpolation: {
        escapeValue: false,
      },
    });
}

export default i18n;
