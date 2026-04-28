# PlanGraph — Build Progress

## Session 15 — Claude Code adapter
- **Completed:** 2026-04-28T17:53:36+02:00
- **Files added/modified:** 11
- **Key outcomes:**
  - Registered the Claude Code executor adapter while preserving the Session 14 adapter contract and manual/report watcher flow.
  - Made Open Terminal the default Claude Code mode, writing `.plangraph/PROMPT.md`, `.gitignore`, and README instructions inside the project workspace.
  - Added explicit subprocess mode with SafeCommandRunner streaming, live SSE output handles, stop support, report writing, and optional token/cost execution logs.
  - Added project UI controls for executor selection, Claude Code mode selection, detection banner, live output drawer, and execution log display.
- **Notes:** `npm run test` passes (127/127). `npm run build` passes; the existing Turbopack NFT tracing warning remains. Both commands needed `npm.cmd`; test needed escalation after sandbox EPERM, and build needed escalation for Next font fetching.

## Session 14 — Executor adapter base
- **Completed:** 2026-04-28T17:44:39+02:00
- **Files added/modified:** 12
- **Key outcomes:**
  - Added the Session 14 executor adapter contract, Manual adapter behavior, and a registry that reports unimplemented executors until later sessions.
  - Added a PathGuard-scoped `ReportWatcher` plus SSE endpoints for report detection.
  - Added `/api/run` and `/api/report`, with run/status audit events and report-driven step completion.
  - Updated the project workspace so report events save `reportFile`, refresh project state, show completion feedback, and select the next executable step.
- **Notes:** `npm run test` passes (127/127). `npm run build` passes; the existing Turbopack NFT tracing warning remains. Both commands needed `npm.cmd`; sandboxed test/build hit Windows script policy or network restrictions.

## Session 13 — Memory Bank system
- **Completed:** 2026-04-28T17:37:18+02:00
- **Files added/modified:** 16
- **Key outcomes:**
  - Added `MemoryManager` with structured Decisions, Conventions, Issues, File Map, and Notes rendering for `MEMORY.md`.
  - Added `/api/memory` plus updated scoped project memory writes so sanitized entries update both `project.json` and `MEMORY.md`.
  - Added `/project/[id]/memory` with rendered Markdown tabs and an add-entry dialog.
  - Added step-completion decision capture and latest memory injection into executor prompts, capped at 3000 characters.
- **Notes:** `npm run test` passes (127/127). `npm run build` passes; the pre-existing Turbopack NFT tracing warning remains.

## Recovery Sync — Sessions 8–12
- **Completed:** 2026-04-28T17:27:42+02:00
- **Scope:** Audited actual repository state against `PLANGRAPH_BUILD_PROMPTS.md` Sessions 8–12, repaired only missing/weak gaps, and preserved accepted path/architecture divergences.
- **Sessions repaired:**
  - Session 8 — completed plan generator gaps in existing `src/core/plan-builder` architecture: exported topo helper, richer executor-aware prompts, template protected files carried into generated steps.
  - Session 9 — completed markdown writer gaps: richer `OVERVIEW.md`, protected files/status sections, and all executor prompt variants in step markdown while preserving `/api/projects` flow.
  - Session 10 — completed workspace shell gaps: added `/project` index and PATCH support for `/api/projects/[id]` so existing `ExecutorSelector` persists correctly.
  - Session 11 — extracted graph into `src/components/plangraph/graph/*`, added synthetic root/delivery nodes, and switched to vertical dagre layout.
  - Session 12 — extracted step details into `src/components/plangraph/step/StepDetails.tsx`, added Overview/Markdown/Prompts/Status tabs, and added scoped markdown read route.
- **Verification:** `npm run test` passes (127/127). `npm run build` passes on Next.js 16.2.4.
- **Counter:** `.current-session` synced to `13`.
- **Notes:** Build still reports the existing Turbopack NFT tracing warning from storage path usage in app routes; it is a warning, not a failed build.

## Session 12 — Claude Code Adapter + Report Parser
- **Completed:** 2026-04-26T04:00:00Z
- **Files added/modified:** 11
- **Key outcomes:**
  - `src/core/types.ts` — added `ReportSummary` interface `{ status, summary, durationMs, exitCode }` (shared by adapters and UI)
  - `src/core/security/command-runner.ts` — `spawn()` now uses `shell: process.platform === 'win32'` for cross-platform CLI invocation (fixes npm/claude on Windows)
  - `src/core/markdown/report-parser.ts` — `buildReport(stepTitle, output, exitCode, durationMs)` produces structured markdown; `parseReport(content)` extracts `ReportSummary` from any report file, handling both auto-generated and free-form human-written reports
  - `src/core/adapters/types.ts` — `ExecutionResult` gains `autoRunning?: boolean`; `ExecutorAdapter` gains optional `executeAsync(ctx): Promise<void>`; re-exports `ReportSummary`
  - `src/core/adapters/claude-code-adapter.ts` — `supportsAutoRun: true`; `prepare()` writes `PROMPT.md` and returns `autoRunning: true`; `executeAsync()` runs `claude --print <prompt>` via `SafeCommandRunner.runStream()`, writes structured `<stepId>_report.md` to reports dir (captures exit code, duration, full stdout/stderr)
  - `src/core/adapters/registry.ts` — `claudeCodeAdapter` registered alongside `manualAdapter`
  - `src/app/api/projects/[id]/run/route.ts` — after `adapter.prepare()`, fire-and-forgets `adapter.executeAsync()` if defined; includes `autoRunning` in response JSON
  - `src/app/api/projects/[id]/watch/route.ts` — on `add` event, reads and `parseReport()`s the file; includes `reportSummary` in SSE payload
  - `src/app/project/[id]/page.tsx` — SSE handler now extracts `reportSummary`, updates `RunModal` state in-place, and PATCHes step to `'failed'` (vs `'done'`) based on `reportSummary.status`; banner shows "Step failed" in red for error reports; `RunModal` shows spinner when `autoRunning && !reportSummary`, a green/red summary card when report arrives, and hides instructions section for auto-run mode
  - `src/lib/i18n/translations/en.json` + `ar.json` — added `run.autoRunning`, `run.reportSuccess`, `run.reportError`, `run.duration`, `run.stepFailed`
  - `src/core/markdown/__tests__/report-parser.test.ts` — 11 tests covering `buildReport` and `parseReport` (round-trips, truncation, free-form, error detection)
  - `npm run build` succeeds cleanly; 114/114 tests pass
- **Notes:** `executeAsync` is fire-and-forget from the route handler (void + .catch logging); the chokidar watcher independently detects the written report. `claude --print` passes the full prompt as a positional arg — safe up to 5000 chars (InputSanitizer limit). The `parseReport` function handles both structured (auto-generated) and free-form (human-written) reports gracefully.

## Session 11 — Markdown Writer + Executor Adapters + Report Watcher
- **Completed:** 2026-04-26T03:00:00Z
- **Verified on 2026-04-26 (covers spec Session 9 — Markdown Writer):** `md-writer.ts` ✅. `api/project/route.ts` → accepted divergence (using `api/projects/`). **Repaired:** added `src/core/markdown/__tests__/md-writer.test.ts` (9 tests: OVERVIEW.md, ROADMAP.md, MEMORY.md, steps/*.md creation, goal content, prompt section, success criteria, MEMORY.md not overwritten, reports/ dir). 124/124 tests pass.
- **Files added/modified:** 10
- **Key outcomes:**
  - `src/core/markdown/md-writer.ts` — `MarkdownWriter` class: `writeProject()` writes `OVERVIEW.md`, `ROADMAP.md`, `MEMORY.md` skeleton (if missing), and per-step `steps/<id>.md` with full content (goal, libraries table, success criteria, restrictions, rich executor prompts); exports `buildRichPrompt()` for use by adapters
  - `src/core/adapters/types.ts` — `ExecutionContext`, `ExecutionResult`, `ExecutorAdapter` interfaces
  - `src/core/adapters/manual-adapter.ts` — Manual adapter: `prepare()` builds a rich prompt, writes it to `<projectRoot>/.plangraph/PROMPT.md` (+ `.gitignore`), returns file path and human-readable instructions
  - `src/core/adapters/registry.ts` — `getAdapter(tool)` factory; falls back to `manualAdapter` for unimplemented tools
  - `src/app/api/projects/[id]/run/route.ts` — `POST { stepId }`: invokes the project's executor adapter, writes `PROMPT.md`, appends `EXECUTOR_INVOKED` audit entry, returns `{ instructions, promptText, promptFilePath, executor }`
  - `src/app/api/projects/[id]/watch/route.ts` — `GET` SSE stream: uses chokidar to watch `workspace/projects/<id>/reports/` for new `<stepId>_report.md` files; sends `{ stepId, event: "report_detected" }` events; heartbeat every 25s; cleans up watcher on client disconnect
  - `src/app/api/projects/route.ts` — `POST` now calls `mdWriter.writeProject()` after creating a project, so all markdown files are generated immediately
  - `src/app/project/[id]/page.tsx` — Start button now calls `handleRunStep()` which POSTs to `/run` and opens a `RunModal`; SSE `EventSource` set up on mount to auto-PATCH step to `done` when a report appears; `completedStep` banner shown for 4 seconds; `RunModal` shows instructions, prompt preview, copy button, report path, and a "watching" indicator
  - `src/lib/i18n/translations/en.json` + `ar.json` — added `run.*` namespace (title, instructions, copyPrompt, copiedPrompt, promptFile, reportPath, watching, stepComplete, dismiss, close)
  - `npm run build` succeeds cleanly; 103/103 tests pass
- **Notes:** SSE uses the Web Streams API (ReadableStream) and is marked `export const dynamic = 'force-dynamic'`. The report watcher uses chokidar v5 with `awaitWriteFinish` to avoid reading partial files. All paths go through PathGuard via `getReportsDir()`.

## Session 10 — Settings Page + Memory Panel
- **Completed:** 2026-04-26T02:00:00Z
- **Verified on 2026-04-26 (covers spec Session 10 — Project Workspace Shell):** `project/[id]/page.tsx` ✅. `api/projects PATCH` → accepted divergence. **Repaired:** added 5 missing spec files: `src/app/project/[id]/layout.tsx` (passthrough server layout), `src/components/plangraph/ProjectProvider.tsx` (Zustand-wired client provider), `src/lib/store/project-store.ts` (Zustand store with project/selectedStepId/setProject/selectStep/refresh), `src/components/plangraph/StepListPlaceholder.tsx` (step list with status icons), `src/components/plangraph/ExecutorSelector.tsx` (executor dropdown with PATCH). Build ✅, 124/124 tests pass.
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
- **Verified on 2026-04-26:** All spec artifacts confirmed present. Accepted divergences: `src/core/planner/` → `src/core/plan-builder/` (equivalent functionality, all tests pass). `api/projects/route.ts` ✅, `api/projects/[id]/route.ts` ✅, `StepNode.tsx` ✅, `project/[id]/page.tsx` with ReactFlow ✅. No repairs needed.
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

## Session 16 — Cursor + Antigravity adapters
- **Completed:** 2026-04-28T18:01:45.7569962+02:00
- **Files added/modified:** 9
- **Key outcomes:**
  - Added Cursor and Antigravity executor adapters that write `.plangraph/PROMPT.md` plus tool-specific setup files inside the project root.
  - Registered both adapters while preserving the existing Claude Code adapter.
  - Added executor prepare/status routes and selector UI instructions for Cursor and Antigravity setup.
  - Added adapter tests for generated Cursor rules, Antigravity skill files, and prompt artifacts.
- **Notes:** `npm run test` and `npm run build` passed via `npm.cmd`; sandboxed test/build attempts were blocked by Windows spawn/network restrictions.
