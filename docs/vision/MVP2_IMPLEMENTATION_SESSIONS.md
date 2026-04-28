# MVP 2 Implementation Sessions

This file turns the MVP 2 product vision into small, safe implementation sessions for Codex or Claude Code.

MVP 2 is focused on the product shell, visual redesign, project experience, graph workspace, documentation-driven UI, and execution screens. It must not add MVP 3 intelligence features yet.

## Source documents

Use these files as the source of truth:

- `docs/vision/MVP2_PRODUCT_DESIGN_PLAN.md`
- `docs/vision/AI_MODEL_GRAPH_VISION.md`
- `docs/vision/IMAGE_ASSETS_MAP.md`
- `docs/vision/assets/*`

## Global rules for every session

- Do not restart the project.
- Do not rewrite working MVP 1 logic.
- Keep changes small and reviewable.
- Do not add AI API integrations in MVP 2.
- Do not add MCP, CLI, whiteboard, or advanced automation yet.
- Preserve local-first behavior.
- Preserve existing tests.
- After each session run:

```bash
npm run test
npm run build
```

If either command fails, stop and fix before continuing.

---

## Session 1 — Audit current UI and map MVP 2 targets

### Goal
Review the current app structure and compare it with the MVP 2 vision docs. Create a short implementation checklist before touching UI code.

### Likely files touched

- `docs/vision/MVP2_IMPLEMENTATION_NOTES.md`

### Tasks

- Read all MVP 2 vision docs.
- Inspect the current `src/app` and `src/components` structure.
- Identify which pages already exist and which MVP 2 pages need redesign.
- Write a checklist of implementation targets.

### Verification

```bash
npm run test
npm run build
```

---

## Session 2 — Design tokens and shared UI foundation

### Goal
Create the shared visual foundation for MVP 2: dark theme, spacing, cards, panels, badges, and reusable layout primitives.

### Likely files touched

- `src/app/globals.css`
- `src/components/plangraph/`
- `src/components/ui/`

### Tasks

- Add reusable CSS variables for the PlanGraph dark visual system.
- Create shared card/panel styles.
- Standardize purple, blue, cyan, green, amber, and danger accents.
- Keep existing functionality unchanged.

### Verification

```bash
npm run test
npm run build
```

---

## Session 3 — App shell V2

### Goal
Upgrade the main app shell to match the MVP 2 design direction.

### Likely files touched

- `src/components/plangraph/AppShell.tsx`
- shared navigation components if they exist
- `src/app/layout.tsx`

### Tasks

- Improve sidebar layout.
- Add consistent navigation sections.
- Add workspace/project switcher area.
- Add user card area at the bottom.
- Ensure Arabic and English layouts still work.

### Verification

```bash
npm run test
npm run build
```

---

## Session 4 — Dashboard V2

### Goal
Redesign the home/dashboard page according to the MVP 2 dashboard screenshots.

### Likely files touched

- `src/app/page.tsx`
- dashboard components under `src/components/plangraph/`

### Tasks

- Add KPI cards.
- Add active project card.
- Add adapter status panel.
- Add validation, snapshots, and memory summary cards.
- Add next-step, blocked-items, recent-activity, and quick-actions panels.
- Use realistic local mock data only if live data is not available yet.

### Verification

```bash
npm run test
npm run build
```

---

## Session 5 — Projects and templates V2

### Goal
Redesign the projects/templates page to match the MVP 2 project gallery design.

### Likely files touched

- `src/app/project` or projects route currently used by the app
- project list components
- template components

### Tasks

- Add project cards with graph preview, status, progress, and actions.
- Add search, filter, and sorting controls.
- Add selected project details panel.
- Add recommended templates section.

### Verification

```bash
npm run test
npm run build
```

---

## Session 6 — Graph workspace V2 visual redesign

### Goal
Upgrade the graph workspace visuals while preserving the existing graph logic.

### Likely files touched

- `src/app/project/[id]/page.tsx`
- `src/components/plangraph/graph/*`
- `src/components/plangraph/StepNode.tsx` or equivalent

### Tasks

- Apply dark grid canvas styling.
- Improve node cards by type.
- Improve connectors, minimap, toolbar, and zoom controls.
- Keep existing graph data flow working.
- Do not replace the graph library unless already planned and safe.

### Verification

```bash
npm run test
npm run build
```

---

## Session 7 — Node details panel V2

### Goal
Redesign the node details panel to clearly show everything a node needs for execution.

### Likely files touched

- `src/components/plangraph/step/*`
- project workspace page

### Tasks

- Add sections for description, skills, libraries, tools, prompt, success criteria, notes, status.
- Improve copy-prompt controls.
- Improve status controls.
- Preserve existing Markdown rendering.

### Verification

```bash
npm run test
npm run build
```

---

## Session 8 — AI planning chat visual shell

### Goal
Create or redesign the AI planning chat page as a visual planning shell for MVP 2.

### Likely files touched

- `src/app/discovery/*`
- discovery/chat components

### Tasks

- Improve chat layout.
- Add idea summary panel.
- Add suggested sections, skills, tools, and graph preview panel.
- Add attachment preview UI as visual shell only.
- Do not add real AI API integration yet.

### Verification

```bash
npm run test
npm run build
```

---

## Session 9 — Execution Center V2

### Goal
Create or improve the execution center page for step-by-step execution management.

### Likely files touched

- execution route if it exists
- adapter/executor UI components
- `src/core/adapters/*` only if display data needs minor adjustment

### Tasks

- Add execution queue UI.
- Add selected step execution panel.
- Add executor cards for Claude Code, Codex, Cursor, and Antigravity.
- Add prompt preview, report preview, token estimate placeholder, and logs panel.
- Keep execution integrations file-based and local-first.

### Verification

```bash
npm run test
npm run build
```

---

## Session 10 — Library and Memory V2

### Goal
Create or improve the library/memory page for Markdown files, reports, prompts, notes, and project memory.

### Likely files touched

- library route if it exists
- settings/memory route if memory currently lives there
- memory components

### Tasks

- Add document tree/list.
- Add Markdown preview panel.
- Add metadata side panel.
- Add linked nodes, tags, attachments, and memory entries UI.
- Preserve current storage behavior.

### Verification

```bash
npm run test
npm run build
```

---

## Session 11 — Snapshots, restore, and import V2

### Goal
Improve the snapshots/restore/import experience using the MVP 2 design direction.

### Likely files touched

- `src/app/import/*`
- snapshots components or routes
- import components

### Tasks

- Add snapshots list/timeline UI.
- Add restore/compare panel.
- Add import options for ZIP, existing folder, Git repository, and Markdown project as UI states.
- Keep actual import behavior limited to what already exists.

### Verification

```bash
npm run test
npm run build
```

---

## Session 12 — Validation, audit, and reports V2

### Goal
Create or improve the validation/audit/reports page.

### Likely files touched

- validation route if it exists
- reports/audit components
- validation UI components

### Tasks

- Add health score cards.
- Add checks/issues table.
- Add audit timeline.
- Add reports cards.
- Add export/open report buttons where supported.

### Verification

```bash
npm run test
npm run build
```

---

## Session 13 — Settings and workspace V2

### Goal
Redesign settings and workspace configuration.

### Likely files touched

- `src/app/settings/page.tsx`
- settings components

### Tasks

- Add tabs for general, workspace, executors, token, storage, integrations.
- Add adapter settings cards.
- Add local-first/privacy settings.
- Add user/workspace profile card.
- Preserve existing settings storage.

### Verification

```bash
npm run test
npm run build
```

---

## Session 14 — Final MVP 2 polish

### Goal
Polish the MVP 2 experience and ensure consistency across all pages.

### Likely files touched

- app pages
- shared UI components
- docs if needed

### Tasks

- Fix inconsistent spacing, labels, and colors.
- Check Arabic and English UI.
- Check empty states and basic responsive behavior.
- Update README or docs only if necessary.
- Do not add new features.

### Verification

```bash
npm run test
npm run build
```

---

## MVP 2 completion checklist

MVP 2 is complete when:

- Dashboard V2 is implemented.
- Projects/Templates V2 is implemented.
- Graph Workspace V2 is implemented.
- Node Details V2 is implemented.
- AI Planning Chat shell is implemented.
- Execution Center V2 is implemented.
- Library/Memory V2 is implemented.
- Snapshots/Import V2 is implemented.
- Validation/Audit/Reports V2 is implemented.
- Settings/Workspace V2 is implemented.
- `npm run test` passes.
- `npm run build` passes.
- No MVP 3 features were mixed into MVP 2.

## MVP 3 backlog

Keep these out of MVP 2:

- Real AI planning chat using APIs.
- BYOK providers.
- Ollama integration.
- MCP server.
- CLI.
- Whiteboard mode.
- Advanced token-aware orchestration.
- Automatic code patching.
- Multi-agent execution.
