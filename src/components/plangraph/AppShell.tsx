'use client';

import Link from 'next/link';
import { Settings } from 'lucide-react';
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
          <button
            aria-label="Settings"
            className="inline-flex items-center justify-center size-8 rounded-md hover:bg-muted transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Settings className="h-4 w-4" />
          </button>
        </div>
      </header>
      <main className="flex-1">{children}</main>
    </div>
  );
}
