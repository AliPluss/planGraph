'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import '@/lib/i18n/i18n';
import Link from 'next/link';
import { ArchiveRestore, Plus, UserRound } from 'lucide-react';
import { toast } from 'sonner';
import ProjectGrid from '@/components/plangraph/dashboard/ProjectGrid';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import type { UserProfile } from '@/core/types';

export default function Home() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [displayName, setDisplayName] = useState('');
  const [savingName, setSavingName] = useState(false);

  useEffect(() => {
    fetch('/api/profile')
      .then((r) => r.json())
      .then(({ profile }) => {
        if (!profile) {
          router.replace('/onboarding');
        } else {
          setProfile(profile);
          setDisplayName(profile.displayName ?? '');
          setChecking(false);
        }
      })
      .catch(() => setChecking(false));
  }, [router]);

  async function saveDisplayName() {
    if (!profile || !displayName.trim()) return;
    setSavingName(true);
    try {
      const nextProfile = { ...profile, displayName: displayName.trim() };
      const res = await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nextProfile),
      });
      if (!res.ok) throw new Error('Could not save name');
      setProfile(nextProfile);
      toast.success('Name saved');
    } catch (error) {
      toast.error(String(error));
    } finally {
      setSavingName(false);
    }
  }

  if (checking) {
    return (
      <div className="flex flex-1 items-center justify-center text-muted-foreground text-sm">
        Loading...
      </div>
    );
  }

  const isArabic = profile?.preferredLocale === 'ar';
  const greeting = profile?.displayName
    ? isArabic ? `مرحباً، ${profile.displayName}` : `Hi, ${profile.displayName}`
    : isArabic ? 'مرحباً، أيها البنّاء' : 'Hi, builder';

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">{greeting}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {isArabic
              ? 'تابع العمل الحالي أو ابدأ خطة تنفيذية جديدة.'
              : 'Pick up current work or start a new executable plan.'}
          </p>
        </div>

        {profile && !profile.displayName && (
          <div className="flex w-full max-w-sm items-center gap-2">
            <UserRound className="size-4 text-muted-foreground" />
            <Input
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              placeholder="Your name"
              className="h-9"
            />
            <Button size="sm" onClick={() => void saveDisplayName()} disabled={!displayName.trim() || savingName}>
              Save
            </Button>
          </div>
        )}
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <Link href="/discovery" prefetch={false}>
          <Card className="h-full rounded-lg transition-colors hover:bg-muted/50">
            <CardContent className="flex items-center gap-4 p-5">
              <span className="inline-flex size-10 items-center justify-center rounded-md bg-primary text-primary-foreground">
                <Plus className="size-5" />
              </span>
              <div>
                <h2 className="text-base font-semibold">{isArabic ? 'مشروع جديد' : 'New project'}</h2>
                <p className="text-sm text-muted-foreground">
                  {isArabic ? 'أنشئ خطة جديدة من فكرة.' : 'Create a fresh plan from an idea.'}
                </p>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/import" prefetch={false}>
          <Card className="h-full rounded-lg transition-colors hover:bg-muted/50">
            <CardContent className="flex items-center gap-4 p-5">
              <span className="inline-flex size-10 items-center justify-center rounded-md bg-muted text-muted-foreground">
                <ArchiveRestore className="size-5" />
              </span>
              <div>
                <h2 className="text-base font-semibold">{isArabic ? 'استيراد مشروع قائم' : 'Import existing'}</h2>
                <p className="text-sm text-muted-foreground">
                  {isArabic
                    ? 'افحص مجلداً محلياً وأنشئ خطة لما تبقى.'
                    : 'Scan a local folder and plan the remaining work.'}
                </p>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      <Card className="rounded-lg">
        <CardContent className="p-5">
          <p className="text-sm font-medium">Tip of the day</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Keep executor reports short and factual so PlanGraph can advance steps cleanly.
          </p>
        </CardContent>
      </Card>

      <div>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Projects
        </h2>
        <ProjectGrid />
      </div>
    </div>
  );
}
