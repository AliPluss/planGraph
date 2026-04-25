'use client';

import { useTranslation } from 'react-i18next';
import '@/lib/i18n/i18n';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function Home() {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col items-center justify-center flex-1 p-8 text-center">
      <h1 className="text-4xl font-bold mb-3">{t('home.welcome')}</h1>
      <p className="text-muted-foreground text-lg mb-8">{t('app.tagline')}</p>
      <div className="flex gap-4 flex-wrap justify-center">
        <Button asChild size="lg">
          <Link href="/onboarding">{t('home.newProject')}</Link>
        </Button>
        <Button asChild variant="outline" size="lg">
          <Link href="/import">{t('home.openProject')}</Link>
        </Button>
      </div>
    </div>
  );
}
