# PlanGraph MVP 2 — Codex Visual Execution Guide

> Give this file to Codex inside the PlanGraph repository.
> Codex must execute the MVP 2 visual redesign step by step using the local images in `docs/vision/assets`.

---

## 0. Purpose

PlanGraph already has a working MVP 1. Do **not** rebuild it.

The goal of this guide is to make the current project match the visual direction shown in the provided screenshots as closely as possible, while preserving the existing functionality.

The redesign must be executed incrementally, one session at a time, exactly like the previous PlanGraph build workflow.

---

## 1. Current project assumptions

Before doing any work, Codex must assume:

- This is an existing Next.js + TypeScript project.
- MVP 1 is already implemented and should remain stable.
- MVP 2 Session 1, 2, and 3 may already be done:
  - MVP 2 implementation notes.
  - Design system tokens.
  - App shell / sidebar.
- The visual source files are local and available under:

```text
docs/vision/assets/
```

- The main implementation docs are available under:

```text
docs/vision/AI_MODEL_GRAPH_VISION.md
docs/vision/IMAGE_ASSETS_MAP.md
docs/vision/MVP2_PRODUCT_DESIGN_PLAN.md
docs/vision/MVP2_IMPLEMENTATION_SESSIONS.md
docs/vision/MVP2_IMPLEMENTATION_NOTES.md
```

---

## 2. Approved permissions for Codex

Codex has permission to perform the following actions **inside this repository only**.

### 2.1 Reading permissions

Codex may read:

```text
src/**
docs/vision/**
public/**
package.json
tsconfig.json
next.config.*
README.md
PROGRESS.md
```

Codex must read these files before every session:

```text
docs/vision/MVP2_IMPLEMENTATION_SESSIONS.md
docs/vision/MVP2_PRODUCT_DESIGN_PLAN.md
docs/vision/IMAGE_ASSETS_MAP.md
```

Codex should read the relevant image assets for each session.

### 2.2 Writing permissions

Codex may create or modify:

```text
src/app/**
src/components/plangraph/**
src/components/ui/**
src/core/**
docs/vision/MVP2_IMPLEMENTATION_NOTES.md
PROGRESS.md
.codex-mvp2-session
```

Codex may add new components if the current codebase needs them.

Codex may refactor components only when necessary to match the target UI, but it must keep the existing data flow and behavior stable.

### 2.3 Command permissions

Codex may run:

```powershell
npm.cmd run test
npm.cmd run build
npm.cmd run dev
git status
git diff
git add .
git commit -m "..."
```

Codex must use `npm.cmd` on Windows. Do not use plain `npm run` in PowerShell.

### 2.4 Git permissions

Codex may make one commit per completed session.

Codex must **not** run:

```powershell
git push
```

The user will push manually after reviewing the changes.

### 2.5 Dependency permissions

Codex must avoid installing new dependencies.

Only install a dependency if:

1. It is absolutely necessary for the session.
2. It is already implied by the current project direction.
3. Codex explains why it is needed before installing.

Preferred approach:

- Use existing Tailwind utilities.
- Use current UI components.
- Use CSS for visual polish.
- Use existing React Flow / graph packages if already installed.
- Use existing icon library if already present.

### 2.6 Safety restrictions

Codex must never:

- Delete MVP 1 functionality.
- Rewrite the whole app.
- Replace the architecture without permission.
- Touch `.env`, `.env.local`, secret files, private keys, or tokens.
- Add paid API requirements.
- Send code or secrets to external services.
- Modify files outside the repository.
- Run destructive commands such as `rm -rf`, `git reset --hard`, or `git clean -fd` unless the user explicitly approves.

---

## 3. Visual source assets

The images in `docs/vision/assets` are the source of truth for visual direction.

Use these exact files:

```text
01-dashboard-overview-v1.png
02-projects-templates-v1.png
03-ai-planning-chat-v1.png
04-graph-workspace-v1.png
05-execution-center-v1.png
06-ai-model-graph-map.png
07-node-system.png
08-dashboard-overview-v2.png
09-graph-workspace-v2.png
10-projects-templates-v2.png
11-ai-planning-chat-v2.png
12-execution-center-v2.png
13-library-memory.png
14-snapshots-import.png
15-validation-audit-reports.png
16-settings-workspace.png
17-ai-model-graph-vision.png
```

Important:

- Match the design language, spacing, colors, hierarchy, and component structure as closely as possible.
- Do not use the images as background screenshots.
- Rebuild the UI with real components.
- Keep everything responsive.
- Keep Arabic RTL support first-class.
- Keep English support working.

---

## 4. Global visual rules

Every MVP 2 screen must follow these visual rules:

### 4.1 Theme

Use a dark futuristic dashboard style:

- Deep navy / almost black background.
- Soft radial gradients.
- Glassmorphism panels.
- Thin blue-purple borders.
- Purple / blue primary actions.
- Green success states.
- Amber warning states.
- Red danger states.
- Cyan secondary accents.

### 4.2 Layout

Use:

- Persistent left sidebar.
- Top project switcher / action bar where appropriate.
- Large rounded panels.
- Dense but readable dashboards.
- Strong visual hierarchy.
- Clear selected states.
- Right-side detail inspector panels for graph/execution/library pages.

### 4.3 Components

Prefer reusable components:

```text
MetricCard
Panel
ProgressRing
ProgressBar
StatusBadge
ActionCard
ProjectCard
TemplateCard
GraphNodeCard
InspectorPanel
ActivityList
EmptyState
```

Do not duplicate large UI chunks if a shared component can be safely introduced.

### 4.4 RTL / Arabic

The UI must remain Arabic-friendly:

- RTL layout must not break.
- Text alignment should respect direction.
- Icons should be mirrored only when semantically needed.
- Graph vertical flow should remain top-to-bottom, not reversed.

---

## 5. Step-by-step execution protocol

Codex must execute exactly one session per invocation.

### 5.1 Session tracker

Use this local tracker file:

```text
.codex-mvp2-session
```

If it does not exist, create it with:

```text
4
```

Reason: MVP 2 Sessions 1–3 are assumed to already be completed or handled.

### 5.2 How to run a session

For every invocation, Codex must:

1. Read `.codex-mvp2-session`.
2. Let the number be `N`.
3. Read this guide.
4. Read `docs/vision/MVP2_IMPLEMENTATION_SESSIONS.md`.
5. Read the image references for Session `N`.
6. Execute **Session N only**.
7. Do not execute Session N+1.
8. Run:

```powershell
npm.cmd run test
npm.cmd run build
```

9. If both pass, update `.codex-mvp2-session` to `N+1`.
10. Append a summary to `PROGRESS.md`.
11. Make one commit.
12. Stop and summarize changed files.

### 5.3 If the session already matches the design

If the screen already matches the target closely:

- Do not rewrite it.
- Make only minor polish if needed.
- Update `PROGRESS.md` with a verified note.
- Advance the tracker.
- Commit with:

```text
Verify: MVP 2 Session N — already matches visual target
```

### 5.4 If tests or build fail

If tests or build fail:

- Stop immediately.
- Do not update `.codex-mvp2-session`.
- Do not commit.
- Print the exact failing command and error.
- Suggest a minimal repair plan.

---

## 6. Master prompt to paste into Codex

Paste this into Codex when you want it to continue:

```text
You are working inside the existing PlanGraph repository.

Read CODEX_MVP2_VISUAL_EXECUTION_GUIDE.md.
Read docs/vision/MVP2_IMPLEMENTATION_SESSIONS.md.
Read docs/vision/MVP2_PRODUCT_DESIGN_PLAN.md.
Read docs/vision/IMAGE_ASSETS_MAP.md.

Use .codex-mvp2-session as the current session tracker.
If it does not exist, create it with value 4.

Execute the next MVP 2 visual session only.

Rules:
- Execute exactly one session.
- Use the matching images in docs/vision/assets as visual references.
- Match the screenshots as closely as possible with real UI components, not image backgrounds.
- Preserve MVP 1 behavior.
- Do not rewrite the app from scratch.
- Keep Arabic RTL and English support working.
- Keep changes focused.
- Use existing design tokens and AppShell.
- Run npm.cmd run test and npm.cmd run build.
- If both pass, update .codex-mvp2-session to the next number.
- Append a short entry to PROGRESS.md.
- Make one git commit for this session.
- Do not git push.
- Stop and summarize changed files, verification results, and the next session number.
```

---

# 7. MVP 2 visual sessions

The following sessions are the required step-by-step plan.

---

## Session 4 — Dashboard Overview V2

### Target images

```text
docs/vision/assets/01-dashboard-overview-v1.png
docs/vision/assets/08-dashboard-overview-v2.png
```

### Route / area

```text
src/app/page.tsx
src/components/plangraph/dashboard/**
```

### Goal

Redesign the home dashboard to match the dashboard screenshots.

### Required visual result

The dashboard must include:

- Top greeting section.
- New project button.
- KPI metric cards row.
- Active project panel.
- Adapter status card.
- Validation status card.
- Snapshots card.
- Memory Bank card.
- Next suggested step card.
- Blocked items card.
- Recent activity card.
- Quick actions row.

### Specific requirements

- Use dark glass panels.
- Use gradient borders and subtle glows.
- Use circular progress for project progress.
- Use compact cards with icon circles.
- Right column should feel like the screenshot.
- Keep real links/buttons wired to existing routes when possible.
- Use placeholders only where MVP 1 has no real data.

### Verification

Open:

```text
http://localhost:3000
```

The page should visually resemble `08-dashboard-overview-v2.png` more than the current plain MVP 1 page.

### Commit message

```text
feat: MVP 2 Session 4 dashboard overview
```

---

## Session 5 — Projects and Templates V2

### Target images

```text
docs/vision/assets/02-projects-templates-v1.png
docs/vision/assets/10-projects-templates-v2.png
```

### Route / area

```text
src/app/project/page.tsx
src/components/plangraph/projects/**
src/components/plangraph/templates/**
```

### Goal

Redesign the project gallery and template browsing experience.

### Required visual result

The page must include:

- Header: “Projects and Templates” style section.
- Search bar.
- Sort dropdown.
- Filter chips.
- Grid/list toggle if feasible.
- Project cards with mini graph previews.
- Progress bars.
- Status indicators.
- Node/step counts.
- Recommended templates row.
- Right-side selected project detail panel.

### Specific requirements

- Keep current project list behavior.
- Do not remove existing project opening flow.
- If real project data is limited, use derived mock-safe display data from existing project fields.
- Do not hardcode everything if existing data is available.

### Verification

Open:

```text
http://localhost:3000/project
```

The screen should visually resemble the projects/templates images.

### Commit message

```text
feat: MVP 2 Session 5 projects and templates
```

---

## Session 6 — Graph Workspace V2

### Target images

```text
docs/vision/assets/04-graph-workspace-v1.png
docs/vision/assets/09-graph-workspace-v2.png
docs/vision/assets/06-ai-model-graph-map.png
```

### Route / area

```text
src/app/project/[id]/page.tsx
src/components/plangraph/graph/**
```

### Goal

Redesign the graph workspace so it matches the box-graph planning concept.

### Required visual result

The graph workspace must include:

- Dark grid canvas.
- Top project toolbar.
- Tool buttons for select/pan/zoom/fit.
- Auto-layout button if feasible.
- Colored node cards.
- Top-to-bottom graph flow.
- Curved/directed graph edges.
- Mini-map.
- Zoom controls.
- Right inspector panel.
- Left node/category sidebar if feasible.

### Node visual requirements

Nodes should match the visual language shown in the screenshots:

- Root node: purple / crown / idea style.
- Data nodes: green.
- Research nodes: blue.
- Analysis nodes: amber.
- Design nodes: violet.
- Tools nodes: blue/cyan.
- Execution nodes: yellow.
- Evaluation nodes: pink/red.
- Documentation/delivery nodes: green.

Each node should show:

- Icon.
- Title.
- Subtitle/description.
- Status indicator.
- Notes button or notes text.
- Optional ID badge.

### Specific requirements

- Preserve existing React Flow behavior.
- Do not break selected node behavior.
- Do not recreate graph data from scratch.
- Use existing node/edge data and enhance visualization.
- If node type is missing, infer color from title/type safely.

### Verification

Open a project page:

```text
http://localhost:3000/project/<existing-project-id>
```

The graph canvas should visually resemble `09-graph-workspace-v2.png`.

### Commit message

```text
feat: MVP 2 Session 6 graph workspace
```

---

## Session 7 — Node Details / Inspector Panel V2

### Target images

```text
docs/vision/assets/04-graph-workspace-v1.png
docs/vision/assets/09-graph-workspace-v2.png
docs/vision/assets/07-node-system.png
```

### Route / area

```text
src/components/plangraph/step/**
src/components/plangraph/graph/**
src/app/project/[id]/page.tsx
```

### Goal

Make the right-side details panel feel like a real node inspector.

### Required visual result

The inspector must include:

- Node header card.
- Node type badge.
- Status badge.
- Tabs or segmented control.
- Description section.
- Skills section.
- Libraries/tools section.
- Prompt section.
- Success criteria section.
- Notes section.
- Metadata footer.

### Specific requirements

- If StepDetails exists, polish it.
- If logic is inline, extract a reusable component only if safe.
- Preserve status update actions.
- Preserve prompt copy actions.
- Preserve markdown rendering.
- Make the UI close to the screenshots.

### Verification

Click nodes on the graph. The right panel must update and stay visually consistent.

### Commit message

```text
feat: MVP 2 Session 7 node inspector
```

---

## Session 8 — AI Planning Chat V2

### Target images

```text
docs/vision/assets/03-ai-planning-chat-v1.png
docs/vision/assets/11-ai-planning-chat-v2.png
```

### Route / area

```text
src/app/discovery/**
src/components/plangraph/discovery/**
```

### Goal

Redesign the idea discovery / planning chat experience.

### Required visual result

The page must include:

- Chat conversation layout.
- User bubbles.
- PlanGraph AI bubbles.
- Suggestions chips.
- Attachments row.
- Input bar.
- Plan summary panel.
- Mini graph preview panel.
- Generate plan button.

### Important boundary

This session is UI/UX only.

Do not add real AI API behavior unless it already exists.

### Specific requirements

- Preserve existing discovery rules engine.
- Preserve existing plan generation flow.
- Make the chat feel like the screenshots.
- Use existing data when available.
- Use safe mock/derived values only for visuals.

### Verification

Open discovery/new project route and run through the flow.

### Commit message

```text
feat: MVP 2 Session 8 planning chat
```

---

## Session 9 — Execution Center V2

### Target images

```text
docs/vision/assets/05-execution-center-v1.png
docs/vision/assets/12-execution-center-v2.png
```

### Route / area

```text
src/app/execution/**
src/components/plangraph/execution/**
src/core/adapters/**
```

### Goal

Redesign the execution center where steps are sent to Claude Code, Codex, Cursor, or Antigravity.

### Required visual result

The page must include:

- Execution KPI cards.
- Executor status cards.
- Queue table/list.
- Selected step detail panel.
- Prompt preview.
- Token/usage estimate panel if current data exists.
- Execution log.
- Result report card.
- Run / Review / Retry / Stop buttons.

### Specific requirements

- Preserve existing adapter behavior.
- Do not add paid API requirements.
- Do not force real execution if current app only supports prompt export/watch mode.
- Keep buttons wired to current capabilities.
- Disabled states are allowed for future features.

### Verification

Open:

```text
http://localhost:3000/execution
```

or the existing execution route if named differently.

### Commit message

```text
feat: MVP 2 Session 9 execution center
```

---

## Session 10 — Library and Memory V2

### Target image

```text
docs/vision/assets/13-library-memory.png
```

### Route / area

```text
src/app/library/**
src/app/settings/**
src/components/plangraph/memory/**
src/components/plangraph/library/**
```

### Goal

Create or polish the Library / Memory Bank experience.

### Required visual result

The page must include:

- Summary metric cards.
- Left document tree.
- Central markdown/document preview.
- Right document details panel.
- Linked nodes list.
- Tags.
- Attachments.
- Related notes cards.

### Specific requirements

- Preserve existing memory bank data.
- Use real markdown files if available.
- Do not remove existing settings memory panel unless replaced safely.
- If no `/library` route exists, create it only if it fits existing navigation.

### Verification

Open:

```text
http://localhost:3000/library
```

or check the settings memory section if that is the existing route.

### Commit message

```text
feat: MVP 2 Session 10 library and memory
```

---

## Session 11 — Snapshots and Import V2

### Target image

```text
docs/vision/assets/14-snapshots-import.png
```

### Route / area

```text
src/app/snapshots/**
src/app/import/**
src/components/plangraph/snapshots/**
src/components/plangraph/import/**
src/core/snapshots/**
src/core/importer/**
```

### Goal

Redesign snapshot management and project import UI.

### Required visual result

The page must include:

- Snapshot KPI cards.
- Snapshot table/list.
- Restore buttons.
- Compare panel.
- Import project panel.
- ZIP/folder/git/markdown import options.
- Step-by-step import checklist.

### Specific requirements

- Preserve existing snapshot/rollback logic.
- Preserve existing import existing project logic.
- Do not add unsafe filesystem access beyond current boundaries.
- If browser cannot access folders directly, show UI that matches current implementation capabilities.

### Verification

Open snapshot/import routes if available.

### Commit message

```text
feat: MVP 2 Session 11 snapshots and import
```

---

## Session 12 — Validation, Audit, and Reports V2

### Target image

```text
docs/vision/assets/15-validation-audit-reports.png
```

### Route / area

```text
src/app/validation/**
src/app/reports/**
src/components/plangraph/validation/**
src/components/plangraph/reports/**
src/core/validation/**
src/core/audit/**
```

### Goal

Redesign validation, audit, and reports into a clear quality dashboard.

### Required visual result

The page must include:

- Health score card.
- Successful checks card.
- Warnings card.
- Critical issues card.
- Latest report card.
- Issues/checks table.
- Audit timeline.
- Recent report cards.
- Export buttons.

### Specific requirements

- Preserve existing validation logic.
- Preserve existing audit logs.
- Use derived counts if real data exists.
- Use safe placeholder display only when no data exists.

### Verification

Open validation/report route if available.

### Commit message

```text
feat: MVP 2 Session 12 validation reports
```

---

## Session 13 — Settings and Workspace V2

### Target image

```text
docs/vision/assets/16-settings-workspace.png
```

### Route / area

```text
src/app/settings/**
src/components/plangraph/settings/**
```

### Goal

Redesign settings/workspace into a full control center.

### Required visual result

The page must include:

- Settings header.
- Tabs: General, Workspace, Executors, Tokens, Storage, Integrations.
- Default project settings.
- Local storage path panel.
- Workspace preferences.
- Appearance/language panel.
- Executors list.
- Token/execution preferences.
- Security/privacy panel.
- User/workspace profile card.

### Specific requirements

- Preserve existing settings save/load logic.
- Do not expose secrets.
- Do not save API keys in plain JSON.
- Keep local-first privacy messaging.

### Verification

Open:

```text
http://localhost:3000/settings
```

### Commit message

```text
feat: MVP 2 Session 13 settings workspace
```

---

## Session 14 — Vision / Landing / Documentation Polish

### Target image

```text
docs/vision/assets/17-ai-model-graph-vision.png
```

### Route / area

```text
README.md
docs/vision/**
src/app/about/**
src/app/page.tsx
```

### Goal

Make the repository and product explanation match the vision.

### Required result

- Improve README if needed.
- Add a product vision route if appropriate.
- Add visual documentation references.
- Add “How PlanGraph works” explanation.
- Add screenshots table or image references.
- Explain MVP 1, MVP 2, MVP 3 clearly.

### Specific requirements

- Do not over-market.
- Keep the repo honest: local-first, planning/execution companion, not a finished commercial product.
- Explain current capabilities and future roadmap.

### Verification

Run:

```powershell
npm.cmd run test
npm.cmd run build
```

### Commit message

```text
docs: MVP 2 visual vision polish
```

---

## Session 15 — Final Visual QA and Consistency Pass

### Target images

Use all assets:

```text
docs/vision/assets/*.png
```

### Goal

Perform a final consistency pass across all MVP 2 screens.

### Required checks

Codex must inspect:

- Dashboard.
- Projects/templates.
- Planning chat.
- Graph workspace.
- Execution center.
- Library/memory.
- Snapshots/import.
- Validation/reports.
- Settings.

### Required fixes

Fix only visual consistency issues:

- Spacing.
- Border radius.
- Typography.
- Color consistency.
- Broken RTL alignment.
- Broken mobile layout.
- Repeated component styling.
- Obvious UI regressions.

### Do not

- Add new product features.
- Rewrite screens.
- Change data model.
- Change adapters.

### Final verification

Run:

```powershell
npm.cmd run test
npm.cmd run build
npm.cmd run dev
```

Then print a manual QA checklist with routes to open.

### Commit message

```text
chore: MVP 2 final visual QA pass
```

---

# 8. Manual QA checklist after each session

After Codex finishes each session, the user should run:

```powershell
git status
npm.cmd run test
npm.cmd run build
npm.cmd run dev
```

Then open the relevant route in the browser.

Check:

- Does the page load?
- Does the sidebar still work?
- Does Arabic RTL still look correct?
- Does English still work?
- Are buttons still wired?
- Does the screen visually match the image reference?
- Are there console errors?
- Did Codex avoid changing unrelated files?

If everything is good:

```powershell
git push
```

---

# 9. What Codex should say when done

At the end of each session, Codex must print:

```text
MVP 2 Session N complete.

Changed files:
- ...

Visual target images used:
- ...

Verification:
- npm.cmd run test: passed/failed
- npm.cmd run build: passed/failed

Tracker:
- .codex-mvp2-session updated from N to N+1

Commit:
- <commit hash/message>

Next:
- Session N+1 — <title>

Manual review:
- Open <route>
- Compare against <asset image>
```

---

# 10. Emergency stop rule

If Codex is about to make a large architectural rewrite, it must stop and ask the user.

Examples of forbidden large rewrites:

- Replacing the routing structure.
- Removing MVP 1 APIs.
- Replacing the graph library.
- Replacing the design system entirely.
- Moving most files without a direct need.
- Deleting existing routes.

The correct behavior is:

```text
I found that this requires a larger architecture change than allowed by the MVP 2 visual pass.
I will stop here and propose a minimal safe plan instead.
```

---

# 11. Quick command for the user

After placing this file in the repository root, open Codex and paste:

```text
Read CODEX_MVP2_VISUAL_EXECUTION_GUIDE.md and execute the next session exactly. Use .codex-mvp2-session as the tracker. Execute one session only. Do not git push.
```

