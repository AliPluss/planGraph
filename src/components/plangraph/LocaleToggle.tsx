'use client';

import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Languages } from 'lucide-react';

const LOCALES = [
  { code: 'en', native: 'English' },
  { code: 'ar', native: 'العربية' },
];

export default function LocaleToggle() {
  const { i18n } = useTranslation();
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  // Always 'en' on server to match SSR; real value after mount
  const current = mounted ? (i18n.language?.startsWith('ar') ? 'ar' : 'en') : 'en';

  const handleChange = (code: string) => {
    i18n.changeLanguage(code);
    document.documentElement.setAttribute('lang', code);
    document.documentElement.setAttribute('dir', code === 'ar' ? 'rtl' : 'ltr');
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="inline-flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring">
        <Languages className="h-4 w-4" />
        <span className="uppercase text-xs font-medium">{current}</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {LOCALES.map((locale) => (
          <DropdownMenuItem
            key={locale.code}
            onClick={() => handleChange(locale.code)}
            className={current === locale.code ? 'font-semibold' : ''}
          >
            {locale.native}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
