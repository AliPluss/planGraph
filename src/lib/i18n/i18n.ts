'use client';

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './translations/en.json';
import ar from './translations/ar.json';

// Always init with 'en' so server and client render identical HTML on first pass.
// I18nProvider switches to the user's saved locale after hydration.
if (!i18n.isInitialized) {
  i18n.use(initReactI18next).init({
    lng: 'en',
    resources: {
      en: { translation: en },
      ar: { translation: ar },
    },
    fallbackLng: 'en',
    interpolation: { escapeValue: false },
  });
}

export default i18n;
