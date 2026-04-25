'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import '@/lib/i18n/i18n';
import Link from 'next/link';

export default function Home() {
  const { t } = useTranslation();
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    fetch('/api/profile')
      .then((r) => r.json())
      .then(({ profile }) => {
        if (!profile) {
          router.replace('/onboarding');
        } else {
          setChecking(false);
        }
      })
      .catch(() => setChecking(false));
  }, [router]);

  if (checking) {
    return (
      <div className="flex flex-1 items-center justify-center text-muted-foreground text-sm">
        {t('common.loading')}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center flex-1 p-8 text-center">
      <h1 className="text-4xl font-bold mb-3">{t('home.welcome')}</h1>
      <p className="text-muted-foreground text-lg mb-8">{t('app.tagline')}</p>
      <div className="flex gap-4 flex-wrap justify-center">
        <Link
          href="/discovery"
          prefetch={false}
          className="inline-flex items-center justify-center rounded-lg bg-primary px-5 h-10 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          {t('home.newProject')}
        </Link>
        <Link
          href="/import"
          prefetch={false}
          className="inline-flex items-center justify-center rounded-lg border border-border bg-background px-5 h-10 text-sm font-medium hover:bg-muted transition-colors"
        >
          {t('home.openProject')}
        </Link>
      </div>
    </div>
  );
}
