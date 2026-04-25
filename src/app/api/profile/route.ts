import { NextRequest, NextResponse } from 'next/server';
import { storage } from '@/core/storage/storage';
import type { UserProfile } from '@/core/types';

export async function GET() {
  const profile = await storage.readProfile();
  return NextResponse.json({ profile });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as Partial<UserProfile>;

    if (!body.level || !body.tools || !body.preferredLocale || !body.communicationStyle) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const now = new Date().toISOString();
    const existing = await storage.readProfile();

    const profile: UserProfile = {
      level: body.level,
      languages: body.languages ?? [],
      tools: body.tools,
      preferredLocale: body.preferredLocale,
      communicationStyle: body.communicationStyle,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    };

    await storage.writeProfile(profile);

    const action = existing ? 'PROFILE_UPDATED' : 'PROFILE_CREATED';
    // Audit requires a projectId — profile audit is global, skip for now
    // (audit is per-project in Session 19)

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
