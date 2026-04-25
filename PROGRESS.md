# PlanGraph — Build Progress

## Session 1 — Project skeleton
- **Completed:** 2026-04-25T16:00:00Z
- **Files added/modified:** 20+
- **Key outcomes:**
  - Next.js 16 bootstrapped with TypeScript, Tailwind v4, ESLint, App Router, `src/` dir, `@/*` alias
  - shadcn/ui initialized with 13 components added
  - All additional deps installed: reactflow, zustand, i18next, react-i18next, chokidar, simple-git, keytar, react-markdown, remark-gfm
  - Placeholder folders created for all core modules and workspace
  - `page.tsx` and `layout.tsx` updated with PlanGraph branding; dev server boots cleanly
- **Notes:** Next.js 16.2.4 installed (latest). Tailwind v4. shadcn uses `sonner` instead of deprecated `toast`.

## Session 2 — Security base
- **Completed:** 2026-04-25T16:20:00Z
- **Files added/modified:** 8
- **Key outcomes:**
  - `PathGuard` — validates paths stay inside a base root, blocks forbidden system paths and traversal
  - `SafeWriter` — atomic JSON/text writes via `.tmp` → rename pattern with `.backup` on overwrite
  - `SafeCommandRunner` — allowlisted command spawner (`git`, `npm`, `node`, `claude`, `cursor`, `code`); includes `runStream`
  - `InputSanitizer` — strips control chars, truncates to 5000 chars, filters prompt-injection patterns, redacts secrets from logs
  - `SecretManager` — OS keychain wrapper via `keytar`
  - `src/middleware.ts` — blocks non-localhost requests with HTTP 403
  - `next.config.ts` — adds X-Frame-Options, nosniff, no-referrer, CSP headers
  - `docs/SECURITY.md` — threat model documentation
  - All 11 tests pass (`npm run test`)
- **Notes:** PathGuard raw-path check added to handle Windows path resolution differences for Unix-style forbidden paths.

## Session 3 — Core types + storage
- **Completed:** 2026-04-25T16:40:00Z
- **Files added/modified:** 5
- **Key outcomes:**
  - `src/core/types.ts` — complete type system: UserProfile, Project, Step, Edge, MemoryEntry, AuditEntry, all enums
  - `src/core/storage/paths.ts` — central path resolver using PathGuard for all workspace locations
  - `src/core/storage/storage.ts` — Storage facade with atomic reads/writes via SafeWriter; profile, project CRUD, memory append, audit log append
  - `src/core/storage/__tests__/storage.test.ts` — 7 storage tests (round-trips, memory, audit)
  - All 18 tests pass (`npm run test`)
- **Notes:** —

## Session 4 — i18n bilingual layout
- **Completed:** 2026-04-25T17:00:00Z
- **Files added/modified:** 9
- **Key outcomes:**
  - `src/lib/i18n/config.ts` — locale constants and type
  - `src/lib/i18n/translations/en.json` + `ar.json` — bilingual strings for app, nav, common, home namespaces
  - `src/lib/i18n/i18n.ts` — i18next init with LanguageDetector (localStorage → navigator → default)
  - `src/components/plangraph/I18nProvider.tsx` — client component that syncs `html[lang]` and `html[dir]` to current locale
  - `src/components/plangraph/LocaleToggle.tsx` — dropdown to switch EN ↔ AR, updates html dir immediately
  - `src/components/plangraph/AppShell.tsx` — sticky top bar with PlanGraph wordmark + LocaleToggle + Settings icon
  - `src/app/layout.tsx` — wraps children with I18nProvider + AppShell, sets initial dir="ltr"
  - `src/app/page.tsx` — uses useTranslation(), shows welcome heading + New/Open buttons
  - `src/proxy.ts` — localhost-only check migrated to Next.js 16 proxy convention (middleware deprecated in v16)
  - Dev server boots cleanly; locale toggle switches EN/AR with RTL flip
- **Notes:** Next.js 16 renamed `middleware.ts` to `proxy.ts` (new file convention). Both kept for now; middleware file is the legacy one.

## Session 5 — Onboarding flow
- **Completed:** 2026-04-25T18:00:00Z
- **Files added/modified:** 7
- **Key outcomes:**
  - `src/app/onboarding/page.tsx` — 4-step wizard: skill level, languages (chips + custom), executor tools, preferences; review screen with edit links; posts to API on finish
  - `src/app/api/profile/route.ts` — GET returns profile or null; POST validates and writes via Storage
  - `src/lib/store/onboarding-store.ts` — Zustand store for in-memory wizard state
  - Translation keys added under `onboarding.*` in both `en.json` and `ar.json`
  - `src/app/page.tsx` — checks `/api/profile` on mount; redirects to `/onboarding` if missing
  - Dev server boots cleanly; 18/18 tests pass
- **Notes:** —
