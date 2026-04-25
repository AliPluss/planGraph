'use client';

import { useEffect } from 'react';
import '@/lib/i18n/i18n';
import { useTranslation } from 'react-i18next';

export default function I18nProvider({ children }: { children: React.ReactNode }) {
  const { i18n } = useTranslation();

  useEffect(() => {
    // After hydration, switch to the user's saved locale.
    // This runs only on the client, so it never causes a hydration mismatch.
    const saved = localStorage.getItem('i18nextLng');
    const lang = saved?.startsWith('ar') ? 'ar' : 'en';
    if (lang !== i18n.language) {
      i18n.changeLanguage(lang);
    }
    document.documentElement.setAttribute('lang', lang);
    document.documentElement.setAttribute('dir', lang === 'ar' ? 'rtl' : 'ltr');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <>{children}</>;
}
