'use client';

import Link from 'next/link';
import { Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import LocaleToggle from './LocaleToggle';

export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="sticky top-0 z-50 bg-background border-b flex items-center justify-between h-14 px-4">
        <Link href="/" className="font-bold text-lg tracking-tight hover:opacity-80 transition-opacity">
          PlanGraph
        </Link>
        <div className="flex items-center gap-1">
          <LocaleToggle />
          <Button variant="ghost" size="icon" aria-label="Settings">
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </header>
      <main className="flex-1">{children}</main>
    </div>
  );
}
