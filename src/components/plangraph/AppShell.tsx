'use client';

import Link from 'next/link';
import { CircleHelp, Settings } from 'lucide-react';
import ProjectEventToasts from './dashboard/ProjectEventToasts';
import LocaleToggle from './LocaleToggle';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Toaster } from '@/components/ui/sonner';

export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="sticky top-0 z-50 bg-background border-b flex items-center justify-between h-14 px-4">
        <Link href="/" className="font-bold text-lg tracking-tight hover:opacity-80 transition-opacity">
          PlanGraph
        </Link>
        <div className="flex items-center gap-1">
          <DropdownMenu>
            <DropdownMenuTrigger
              aria-label="What is PlanGraph?"
              className="inline-flex size-8 items-center justify-center rounded-md outline-none transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring"
            >
              <CircleHelp className="h-4 w-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <DropdownMenuLabel>What&apos;s PlanGraph?</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="flex-col items-start gap-1 whitespace-normal">
                <span className="font-medium">Local-first planning</span>
                <span className="text-xs text-muted-foreground">
                  PlanGraph turns ideas or existing folders into executable Markdown steps.
                </span>
              </DropdownMenuItem>
              <DropdownMenuItem className="flex-col items-start gap-1 whitespace-normal">
                <span className="font-medium">Your tools stay in charge</span>
                <span className="text-xs text-muted-foreground">
                  Claude Code, Cursor, Antigravity, or manual work run through your local setup.
                </span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <LocaleToggle />
          <Link
            href="/settings"
            aria-label="Settings"
            className="inline-flex items-center justify-center size-8 rounded-md hover:bg-muted transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Settings className="h-4 w-4" />
          </Link>
        </div>
      </header>
      <main className="flex-1">{children}</main>
      <ProjectEventToasts />
      <Toaster />
    </div>
  );
}
