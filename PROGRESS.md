# PlanGraph — Build Progress

## Session 10 — Settings Page + Memory Panel
- **Completed:** 2026-04-26T02:00:00Z
- **Files added/modified:** 6
- **Key outcomes:**
  - `src/components/plangraph/AppShell.tsx` — gear icon now navigates to `/settings` (changed `<button>` to `<Link href="/settings">`)
  - `src/app/settings/page.tsx` — full profile-editing page: skill level (radio-style), languages (preset chips + custom input), executor tools (multi-select chips), communication style, preferred locale; saves via `POST /api/profile`; shows "Saved!" confirmation; redirect to `/onboarding` if no profile exists; RTL-aware
  - `src/app/api/projects/[id]/memory/route.ts` — `GET` returns `project.memory`; `POST` validates body, appends `MemoryEntry` to `project.memory[]`, writes project JSON, appends to `MEMORY.md` via `storage.appendMemory()`, writes `MEMORY_ADDED` audit entry
  - `src/app/project/[id]/page.tsx` — step detail panel gains a **Memory** section: lists existing step-scoped entries with category badge (decision/purple, convention/blue, issue/red, note/gray) + date; "Add note" button reveals inline form (category select + textarea); `handleAddMemory` callback POSTs to `/api/projects/[id]/memory` and merges the returned entry into local project state without reload
  - `src/lib/i18n/translations/en.json` + `ar.json` — added `settings.*` namespace (title, all field labels, save states, skill/comm/locale label maps) and `project.stepPanel.memory.*` namespace (title, empty, addNote, cancel, save, placeholder, categories)
  - `npm run build` succeeds cleanly; 103/103 tests pass
- **Notes:** Memory entries are scoped to individual steps (filtered by `stepId` in the panel). They are stored in two places: the project JSON (`project.memory[]`) for fast UI reads, and `MEMORY.md` for a human-readable developer log.

## Session 9 — Step Execution & Project List
- **Completed:** 2026-04-26T01:00:00Z
- **Files added/modified:** 6
- **Key outcomes:**
  - `src/app/api/projects/[id]/steps/[stepId]/route.ts` — PATCH handler: updates step status + timestamps, propagates readiness (done → unlocks dependents), propagates blocked (failed → blocks dependents), writes audit log
  - `src/app/project/[id]/page.tsx` — step detail panel gains: status badge, Start/Done/Failed/Reopen/Review buttons (context-aware), executor prompt display with copy-to-clipboard, optimistic state update (no page reload after PATCH); header gains progress bar (done/total)
  - `src/app/page.tsx` — home page now fetches and lists recent projects: name, template badge, progress bar (done/total steps), last-updated date; empty state for new users; "New Project" stays as primary CTA
  - `src/lib/i18n/translations/en.json` + `ar.json` — new keys: `project.progress`, `project.stepPanel.prompt/copy/copied/statusLabel/actions.*/ status.*`, `home.recentProjects/noProjects/projectStepsDone`
  - `npm run build` succeeds cleanly; 103/103 tests pass
- **Notes:** Status propagation: marking a step `done` sets all steps whose full dependency set is now satisfied to `ready`; marking `failed` sets direct dependents that are `ready`/`not_started` to `blocked`.

## Session 8 — Plan Builder + Project Graph View
- **Completed:** 2026-04-26T00:00:00Z
- **Files added/modified:** 11
- **Key outcomes:**
  - `src/core/plan-builder/builder.ts` — `buildProject(summary, opts)`: topological sort, blueprint→Step conversion with locale/executor, layered x/y position assignment, affects map
  - `src/core/plan-builder/__tests__/builder.test.ts` — 13 tests (all pass); total 103/103
  - `src/app/api/projects/route.ts` — POST creates project from ScopeSummary, GET lists all projects
  - `src/app/api/projects/[id]/route.ts` — GET single project (async params per Next.js 16)
  - `src/components/plangraph/StepNode.tsx` — custom React Flow node: step number, title, type badge (6 color-coded types), status dot (7 states)
  - `src/app/project/[id]/page.tsx` — full-screen React Flow graph with MiniMap, Controls, dot Background; slide-in step detail panel (goal, libraries, criteria, restrictions)
  - `src/app/discovery/page.tsx` — "Generate Plan" opens Dialog asking for project name + optional root path; POSTs to `/api/projects`; navigates to `/project/[id]`
  - `src/core/types.ts` — added `ProjectKind` (fixes pre-existing type error in templates)
  - `src/core/discovery/types.ts` — re-exports `ProjectKind` from central types (no breaking change)
  - Translations: added `project.*` and `generate.*` namespaces to both `en.json` and `ar.json`
  - `npm run build` succeeds cleanly; 103/103 tests pass
- **Notes:** `ProjectKind` was declared in `discovery/types.ts` but imported from `core/types.ts` by templates — fixed by moving the declaration to `core/types.ts` and re-exporting from discovery.

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

## Session 6 — Idea Discovery Dialog
- **Completed:** 2026-04-25T18:30:00Z
- **Files added/modified:** 9
- **Key outcomes:**
  - `src/core/discovery/types.ts` — `ProjectKind`, `Question`, `ScopeSummary` types
  - `src/core/discovery/keyword-detector.ts` — `detectKind()` with EN+AR keyword maps for all 11 project types
  - `src/core/discovery/question-bank.ts` — 4 common questions + per-kind question sets (3–4 questions each) with full EN+AR translations
  - `src/core/discovery/rules-engine.ts` — `DiscoveryEngine` class: batched questioning (3 per round), answer tracking, back navigation, deterministic `buildSummary()` that derives features, stack, exclusions, and estimates
  - `src/app/api/discovery/route.ts` — POST `start` and POST `step` handlers; in-memory session store keyed by UUID
  - `src/app/discovery/page.tsx` — 3-phase client UI (idea entry → Q&A rounds → scope summary); Suspense-wrapped for `useSearchParams`; RTL-aware; back navigation through question history
  - `src/lib/i18n/translations/en.json` + `ar.json` — `discovery.*` namespace added
  - `src/app/page.tsx` — "New Project" now routes to `/discovery`
  - 18/18 tests still pass; `npm run build` succeeds
- **Notes:** `useSearchParams` wrapped in Suspense as required by Next.js 16. Skip button passes explicit answers to avoid stale closure.

## Session 7 — Templates library
- **Completed:** 2026-04-25T19:00:00Z
- **Files added/modified:** 9
- **Key outcomes:**
  - `src/core/templates/types.ts` — `StepBlueprint` and `Template` interfaces
  - `src/core/templates/library/nextjs-saas.ts` — 8 base + 4 conditional steps (web-app)
  - `src/core/templates/library/browser-extension.ts` — 8 base + 2 conditional steps
  - `src/core/templates/library/rest-api.ts` — 8 base + 3 conditional steps
  - `src/core/templates/library/cli-tool.ts` — 8 base + 0 conditional steps
  - `src/core/templates/library/telegram-bot.ts` — 8 base + 3 conditional steps
  - `src/core/templates/library/landing-page.ts` — 8 base + 4 conditional steps
  - `src/core/templates/registry.ts` — `getTemplate`, `getTemplateForKind`, `listTemplates`
  - `src/core/templates/__tests__/templates.test.ts` — 72 template tests (all pass); total 90/90
- **Notes:** All text fields bilingual EN+AR. All libraries are real, maintained packages. Pure data — no file I/O.

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
