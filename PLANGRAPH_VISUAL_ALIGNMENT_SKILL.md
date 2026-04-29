---
name: plangraph-visual-alignment
description: Use this skill when working on PlanGraph visual alignment, dashboard/UI polish, RTL/LTR consistency, glassmorphism dark SaaS design, reference screenshot matching, and browser visual QA. Do not use for backend-only tasks or feature implementation unless the task explicitly affects the visual interface.
---

# PlanGraph Visual Alignment Skill

> A reusable Codex skill for making PlanGraph screens look like a premium dark SaaS product, not a functional MVP/debug interface.

This file can be used in two ways:

1. **As a Codex Skill**: place it at:

```text
.agents/skills/plangraph-visual-alignment/SKILL.md
```

2. **As a project visual guide**: place it at the repository root as:

```text
VISUAL_STYLE_GUIDE.md
```

When using it in a Codex prompt, say:

```text
Use the plangraph-visual-alignment skill. Read the reference screenshots under docs/vision/assets before editing. This is a visual alignment pass, not a feature implementation task.
```

---

## Official references for Codex skills and guidance

Use these links when updating or improving this skill:

- Codex Agent Skills documentation: https://developers.openai.com/codex/skills
- OpenAI skills catalog on GitHub: https://github.com/openai/skills
- Reusable Codex skills workflow: https://developers.openai.com/codex/use-cases/reusable-codex-skills
- Codex AGENTS.md custom instructions: https://developers.openai.com/codex/guides/agents-md
- AGENTS.md open format: https://agents.md/

Important implementation notes from the official docs:

- A Codex skill is a directory with a required `SKILL.md` file.
- Repository skills can be placed under `.agents/skills`.
- `SKILL.md` should include `name` and `description` metadata.
- Codex can use skills explicitly when invoked or implicitly when the task matches the skill description.
- `AGENTS.md` is useful for repository-wide working rules, while Skills are better for repeatable specialized workflows.

---

# 1. Core mission

PlanGraph is not only a functional planning app. It should feel like a premium local-first AI planning and execution workspace.

Every visual alignment pass must optimize for:

- Visual similarity to `docs/vision/assets/*` reference screenshots.
- Strong product identity: **PlanGraph — AI Planning & Execution**.
- Arabic-first RTL support with correct bilingual behavior.
- Dark midnight/navy design with violet/blue glow.
- Glassmorphism cards, compact spacing, and premium SaaS hierarchy.
- Clear dashboard information architecture.
- Zero visible debug/MVP controls in the main visual focus.
- No browser runtime issue overlays caused by app code.

Success is not only:

```text
npm run test passes
npm run build passes
```

Success also requires:

```text
The screen visually matches the reference direction, spacing, hierarchy, and polish.
```

---

# 2. Visual identity

## Product tone

PlanGraph should feel like:

- Premium developer productivity tool.
- AI planning cockpit.
- Local workspace control center.
- Calm, precise, technical, and trustworthy.

It should not feel like:

- A raw MVP.
- A debug admin panel.
- A generic Tailwind dashboard.
- A random collection of cards.
- A page generated without visual hierarchy.

## Brand keywords

Use these as design intent:

```text
midnight, glass, graph, execution, planning, glow, intelligence, control, flow, calm precision
```

---

# 3. Color system

Use a dark navy base. Avoid pure black everywhere.

Recommended visual palette:

```css
--pg-bg: #050914;
--pg-bg-soft: #07111f;
--pg-panel: rgba(10, 18, 34, 0.72);
--pg-panel-strong: rgba(14, 24, 44, 0.88);
--pg-border: rgba(96, 165, 250, 0.20);
--pg-border-strong: rgba(129, 140, 248, 0.42);
--pg-text: #f8fafc;
--pg-muted: #94a3b8;
--pg-subtle: #64748b;
--pg-primary: #7c3aed;
--pg-primary-2: #2563eb;
--pg-cyan: #06b6d4;
--pg-success: #22c55e;
--pg-warning: #f59e0b;
--pg-danger: #ef4444;
```

Use gradients sparingly:

```css
background:
  radial-gradient(circle at 20% 10%, rgba(37, 99, 235, 0.22), transparent 32%),
  radial-gradient(circle at 80% 0%, rgba(124, 58, 237, 0.20), transparent 36%),
  linear-gradient(180deg, #07111f 0%, #050914 100%);
```

Semantic glow rules:

- Violet = primary actions and selected state.
- Blue/cyan = information and graph/AI identity.
- Green = active/success/completed.
- Amber = warning/limited/review.
- Red = failed/blocked/errors.

Do not use strong saturated colors everywhere. Glow should create hierarchy, not noise.

---

# 4. Typography and hierarchy

## Arabic mode

Arabic UI must feel intentionally RTL.

Rules:

- Use `dir="rtl"` for the main content area when locale is Arabic.
- Text should be right-aligned in Arabic content cards.
- Avoid mixing English labels unless they are product/tool names such as `Claude Code`, `Codex`, `Cursor`, `Antigravity`, `Next.js`.
- Arabic labels should be natural, not literal awkward translations.

Preferred Arabic dashboard copy:

```text
مرحباً أحمد 👋
إليك نظرة شاملة على أعمالك اليوم
مشروع جديد
المشروع النشط
الخطوة التالية المقترحة
العناصر المعطلة
النشاط الأخير
حالة المشغلات
حالة التحقق
اللقطات
الذاكرة
إجراءات سريعة
فتح المشروع
فتح المخطط
```

## English mode

English mode must not show Arabic dashboard content.

Preferred English dashboard copy:

```text
Welcome back, Ahmed 👋
Here is a complete view of your work today
New Project
Active Project
Suggested Next Step
Blocked Items
Recent Activity
Adapters Status
Validation Status
Snapshots
Memory
Quick Actions
Open Project
Open Graph
```

## Type scale

Use fewer sizes, more consistently:

```text
Page title: 34–42px, bold
Section title: 18–22px, semibold
Card KPI number: 32–42px, bold
Body: 14–16px
Caption: 12–13px
Pills/badges: 11–13px
```

Avoid tiny Arabic text in dense cards. Arabic needs slightly more breathing room.

---

# 5. Layout rules

## Desktop shell

The reference dashboard uses a left sidebar with Arabic content in the main panel.

Rules:

- Sidebar on desktop: **left side**.
- Main content can be RTL internally when Arabic.
- Sidebar width: about `248px–280px`.
- Sidebar should be fixed/sticky and full-height.
- Main content should not hide behind the sidebar.
- Avoid floating debug controls over the dashboard.

Suggested desktop structure:

```text
┌──────────── sidebar ────────────┬──────────────────────── main dashboard ───────────────────────┐
│ PlanGraph logo                  │ Header: greeting + New Project button + subtle controls       │
│ nav                             │ KPI row                                                        │
│ workspace mini card             │ main grid: active project + right status column                │
│ user card                       │ lower status cards                                             │
└─────────────────────────────────┴───────────────────────────────────────────────────────────────┘
```

## One-screen dashboard goal

On common desktop widths such as 1440px to 1920px:

- KPI row must be visible without scroll.
- Active project card and right column must be visible without long scroll.
- Lower cards should start within the first viewport.
- Quick actions should appear early, ideally without excessive scroll.

If content overflows, reduce:

- Card vertical padding.
- Empty gaps.
- Oversized headers.
- Decorative elements that do not help information hierarchy.

Do not remove important information only to fit the viewport. Compress smartly.

---

# 6. AppShell rules

## Sidebar

Sidebar must look like a premium glass navigation panel.

Required behavior:

- Preserve all existing routes.
- Do not break navigation.
- Active route must have violet/blue glow and a clear selected border.
- User/workspace card must not be clipped.
- Future routes may remain but should not dominate the page.

Arabic labels:

```text
الرئيسية
المشاريع
القوالب
المكتبة
التنفيذ
التاريخ
اللقطات والاستيراد
التحقق والتدقيق والتقارير
الإعدادات
```

English labels:

```text
Home
Projects
Templates
Library
Execution
History
Snapshots & Import
Validation, Audit & Reports
Settings
```

Group labels:

Arabic:

```text
مساحة العمل
التشغيل
النظام
```

English:

```text
Workspace
Operations
System
```

## Header utility controls

Language/help/notification controls are allowed, but must be secondary.

They should not:

- Cover content.
- Look like the main hero element.
- Create browser hydration/router issues.
- Distract from dashboard hierarchy.

Do not place a large floating pill at the top unless it matches the reference. Prefer small controls in header corner or sidebar.

## Profile edit controls

Do not show `اسمك / حفظ` or `name / save` as a prominent dashboard header element.

If profile editing must remain:

- Move it to Settings.
- Or make it a subtle user card action.
- Or hide it behind a small profile button.

---

# 7. Dashboard composition

The Dashboard should not become a project grid.

Home Dashboard must show overview. Project grid belongs to the projects page.

## Required sections

### Header

Arabic:

```text
مرحباً أحمد 👋
إليك نظرة شاملة على أعمالك اليوم
[مشروع جديد]
```

English:

```text
Welcome back, Ahmed 👋
Here is a complete view of your work today
[New Project]
```

### KPI row

Cards:

1. Project progress / تقدم المشاريع
2. Active projects / المشاريع النشطة
3. Completed nodes / العقد المكتملة
4. Total execution time / وقت التنفيذ الإجمالي
5. Execution success rate / معدل نجاح التنفيذ

KPI card rules:

- Glass background.
- Icon glow circle.
- Muted label.
- Large number.
- Small trend text.
- Compact, consistent height.

### Active project card

This is the main visual focus.

Required content:

- Project icon tile.
- Title.
- Description.
- Status pill.
- Progress bar and percentage.
- Metadata row.
- Primary action: `فتح المشروع` / `Open Project` or `فتح المخطط` / `Open Graph`.

Data rules:

- Use real data if available.
- Use polished fallback only when data is missing.
- Do not fake state over real state.
- Preserve navigation and project opening behavior.

### Right status column

Arabic:

```text
الخطوة التالية المقترحة
العناصر المعطلة
النشاط الأخير
```

English:

```text
Suggested Next Step
Blocked Items
Recent Activity
```

Rules:

- Keep it visually connected to the active project card.
- Do not let it fall far below the fold.
- Use compact cards with clear status pills.

### Lower status cards

Arabic:

```text
حالة المشغلات
حالة التحقق
اللقطات
الذاكرة
```

English:

```text
Adapters Status
Validation Status
Snapshots
Memory
```

Rules:

- Four cards in a compact row/grid.
- Use semantic colors.
- Avoid huge empty space.

### Quick actions

Arabic:

```text
إنشاء مشروع
من قالب
استيراد مخطط
إنشاء لقطة
تحليل المخطط
تصدير التقرير
```

English:

```text
Create Project
Use Template
Import Plan
Create Snapshot
Analyze Graph
Export Report
```

Rules:

- Must appear earlier, not buried after a long scroll.
- Cards should be compact but tactile.
- Primary action should be visually stronger than secondary actions.

---

# 8. Glassmorphism card recipe

Use consistent card styling.

Good card style:

```css
background: linear-gradient(180deg, rgba(15, 23, 42, 0.88), rgba(15, 23, 42, 0.62));
border: 1px solid rgba(96, 165, 250, 0.18);
box-shadow:
  0 18px 60px rgba(0, 0, 0, 0.30),
  inset 0 1px 0 rgba(255, 255, 255, 0.04);
backdrop-filter: blur(18px);
border-radius: 24px;
```

Selected/active style:

```css
border-color: rgba(129, 140, 248, 0.55);
box-shadow:
  0 0 0 1px rgba(99, 102, 241, 0.25),
  0 18px 60px rgba(79, 70, 229, 0.22),
  inset 0 1px 0 rgba(255,255,255,0.06);
```

Avoid:

- Flat black cards.
- Inconsistent border radii.
- Random gradients per card.
- Oversized padding in small cards.
- Too many competing glows.

---

# 9. RTL/LTR quality bar

## Arabic mode checklist

- [ ] Root/main dashboard `dir="rtl"` where appropriate.
- [ ] Sidebar labels are Arabic.
- [ ] Dashboard labels are Arabic.
- [ ] Buttons are Arabic.
- [ ] Status badges are Arabic.
- [ ] Navigation still works.
- [ ] Icon alignment feels natural in RTL.
- [ ] No random English except tool/product names.

## English mode checklist

- [ ] Main content is English.
- [ ] Sidebar labels are English.
- [ ] Buttons are English.
- [ ] Cards are English.
- [ ] Status badges are English.
- [ ] No Arabic labels remain in normal dashboard content.
- [ ] LTR layout is coherent, or layout is stable with fully English content if full direction switching is out of scope.

## Language toggle rules

- Persist user choice reliably.
- Avoid hydration mismatch.
- Avoid router actions before initialization.
- Do not trigger page-level crashes or overlays.
- Test switching Arabic → English → Arabic.
- Test navigation after switching language.

---

# 10. Browser QA requirements

Passing build/test is not enough.

For every visual pass:

```powershell
npm.cmd run test
npm.cmd run build
npm.cmd run dev
```

Then inspect:

```text
http://localhost:3000
```

QA checks:

- [ ] No visible browser/dev issue overlay caused by app code.
- [ ] No console errors from the edited page/components.
- [ ] No hydration mismatch warnings.
- [ ] No missing route prefetch issues caused by new links.
- [ ] No layout shift after hydration.
- [ ] No clipped sidebar bottom card.
- [ ] No horizontal overflow at desktop width.
- [ ] Dashboard remains usable at 1440px width.
- [ ] Arabic mode screenshot acceptable.
- [ ] English mode screenshot acceptable.

If a visible `Issues` overlay appears:

1. Inspect the actual runtime warnings/errors.
2. Fix the app-caused issue.
3. Do not hide the overlay artificially.
4. Do not ignore it because build passes.

---

# 11. Visual comparison workflow

Before editing:

1. Open the target reference screenshots in `docs/vision/assets/`.
2. Open the current page in browser.
3. Compare visually.
4. List the top mismatches.
5. Patch only the allowed files.

For Dashboard Session 4, primary references are:

```text
docs/vision/assets/01-dashboard-overview-v1.png
docs/vision/assets/08-dashboard-overview-v2.png
```

Comparison criteria:

```text
layout position
sidebar placement
header hierarchy
card density
KPI row shape
active project prominence
right column placement
quick actions position
language consistency
glass/glow quality
scroll length
runtime errors
```

Do not rely only on code inspection. Visual work needs visual QA.

---

# 12. Patch discipline

When the user asks for a visual alignment patch:

- Do not execute the next session.
- Do not advance session counters unless explicitly requested.
- Do not modify runtime workspace data.
- Do not rewrite MVP 1 logic.
- Do not add product features.
- Do not commit automatically unless explicitly requested.
- Keep changes scoped to allowed files.
- Preserve real data flow and existing navigation.
- Use polished fallbacks only when real data is missing.

For MVP 2 Dashboard visual patches, allowed files are usually:

```text
src/components/plangraph/AppShell.tsx
src/app/page.tsx
src/app/globals.css only if needed
existing i18n/messages files only if translation fixes are required
```

If a fix requires touching other files, stop and explain why before editing.

---

# 13. Visual scoring rubric

At the end of a visual patch, score the result honestly:

```text
Reference similarity: 0–10
RTL Arabic quality: 0–10
English mode quality: 0–10
Dashboard hierarchy: 0–10
One-screen compactness: 0–10
Glassmorphism polish: 0–10
Runtime cleanliness: 0–10
```

Do not claim the patch is complete if:

- Translation is mixed.
- Browser Issues overlay remains.
- Sidebar is on the wrong side relative to the reference.
- Quick actions are buried too low.
- Debug/profile controls dominate the header.
- The active project card is not the main focus.

Suggested decision:

```text
Average 8.0+ and no runtime overlay → ready for user screenshot review.
Average 7.0–7.9 → likely needs one small polish patch.
Below 7.0 → not ready for commit.
```

---

# 14. Ready-to-use Codex prompt for a Dashboard visual patch

Use this when asking Codex to perform a dashboard visual alignment pass.

```text
Use the plangraph-visual-alignment skill.
Read CODEX_MVP2_VISUAL_EXECUTION_GUIDE.md.
Read docs/vision/assets/01-dashboard-overview-v1.png and docs/vision/assets/08-dashboard-overview-v2.png as visual references.

Do a visual alignment patch for Session 4 only.

Do NOT execute Session 5.
Do NOT advance .codex-mvp2-session.
Do NOT commit.
Do NOT modify runtime workspace data.
Do NOT rewrite MVP 1 logic.
Do NOT add product features.

Allowed files:
- src/components/plangraph/AppShell.tsx
- src/app/page.tsx
- src/app/globals.css only if needed
- existing i18n/messages files only if necessary for translation consistency

Design quality bar:
- Treat this as a senior product UI design pass, not a normal functional patch.
- Match the reference screenshots as closely as possible.
- Fix visual hierarchy, spacing, glassmorphism, RTL/LTR consistency, and browser runtime issues.
- Build/test passing is required but not enough.

Primary goals:
1. Arabic mode must be fully Arabic and RTL coherent.
2. English mode must be fully English and visually coherent.
3. Sidebar must be on the left on desktop, matching the reference.
4. Remove or de-emphasize debug/MVP-looking controls.
5. Make the dashboard more compact and closer to one-screen layout.
6. Make the active project card the main focus.
7. Keep quick actions visible earlier.
8. Resolve visible browser Issues overlay if caused by app code.

Verification:
- Run npm.cmd run test
- Run npm.cmd run build
- Run npm.cmd run dev
- Inspect / in Arabic and English modes
- Confirm no visible app-caused Issues overlay
- Confirm .codex-mvp2-session unchanged
- Stop dev server

Summarize changed files, visual fixes, i18n fixes, build/test results, browser QA result, and remaining visual gaps.
```

---

# 15. Ready-to-use prompt to install this as a repo skill

Use this once inside Codex if the file is at the repo root as `PLANGRAPH_VISUAL_ALIGNMENT_SKILL.md`:

```text
Create a repository Codex skill from PLANGRAPH_VISUAL_ALIGNMENT_SKILL.md.

Place it at:
.agents/skills/plangraph-visual-alignment/SKILL.md

Rules:
- Preserve the YAML front matter exactly.
- Preserve all instructions.
- Do not modify app source code.
- Do not run sessions.
- Do not commit automatically.

After creating the skill, tell me the exact file path created and how to invoke it in future prompts.
```

Then restart Codex if the skill does not appear immediately.

---

# 16. Optional AGENTS.md snippet

Add this to repository-level `AGENTS.md` if you want Codex to always remember the visual quality bar:

```markdown
## PlanGraph visual quality bar

For UI work, use `.agents/skills/plangraph-visual-alignment/SKILL.md` when available.

PlanGraph UI must feel like a premium dark SaaS dashboard, not an MVP/debug interface. For visual alignment tasks, compare against `docs/vision/assets/` screenshots, preserve RTL/LTR consistency, run browser QA, and do not consider the task complete if visible app-caused dev issue overlays remain.
```

---

# 17. Final rule

For PlanGraph, visual alignment is a product requirement, not decoration.

A screen is not done until it is:

```text
functional + tested + visually aligned + bilingual coherent + runtime clean
```
