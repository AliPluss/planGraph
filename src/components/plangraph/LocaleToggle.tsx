'use client';

import { useTranslation } from 'react-i18next';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Languages } from 'lucide-react';

const LOCALES = [
  { code: 'en', label: 'English', native: 'English' },
  { code: 'ar', label: 'Arabic', native: 'العربية' },
];

export default function LocaleToggle() {
  const { i18n } = useTranslation();
  const current = i18n.language?.startsWith('ar') ? 'ar' : 'en';

  const handleChange = (code: string) => {
    i18n.changeLanguage(code);
    document.documentElement.setAttribute('lang', code);
    document.documentElement.setAttribute('dir', code === 'ar' ? 'rtl' : 'ltr');
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2">
          <Languages className="h-4 w-4" />
          <span className="uppercase text-xs font-medium">{current}</span>
        </Button>
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
