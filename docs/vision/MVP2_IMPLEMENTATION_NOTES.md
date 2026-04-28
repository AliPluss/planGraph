# MVP 2 Implementation Notes

Session 1 audit completed on 2026-04-29.

## Current App Structure

### Existing app routes

- `/` in `src/app/page.tsx`: home/dashboard-like entry with profile check, new project/import actions, tip card, and project grid.
- `/project` in `src/app/project/page.tsx`: basic projects index with latest-project shortcut and project list.
- `/project/[id]` in `src/app/project/[id]/page.tsx`: main graph workspace with React Flow canvas, executor selector, run modal, validation modal, memory capture, and step details panel.
- `/project/[id]/dashboard` in `src/app/project/[id]/dashboard/page.tsx`: project dashboard with progress, metrics, status distribution, recent audit activity, and snapshots tab.
- `/project/[id]/memory` in `src/app/project/[id]/memory/page.tsx`: project memory page with Markdown preview and category filters.
- `/project/[id]/audit` in `src/app/project/[id]/audit/page.tsx`: project audit log page.
- `/discovery` in `src/app/discovery/page.tsx`: guided project discovery and project generation flow.
- `/import` in `src/app/import/page.tsx`: existing-folder scan and imported plan creation flow.
- `/settings` in `src/app/settings/page.tsx`: profile, language, executor, communication style, and locale settings.
- `/onboarding` in `src/app/onboarding/page.tsx`: first-run onboarding.

### Existing component areas

- `src/components/plangraph/AppShell.tsx`: compact top navigation shell with locale toggle, help menu, settings link, toasts.
- `src/components/plangraph/dashboard/*`: project grid, project event toasts, snapshot panel.
- `src/components/plangraph/graph/*`: React Flow graph canvas plus root, step, and delivery node components.
- `src/components/plangraph/step/StepDetails.tsx`: current step detail panel component.
- `src/components/plangraph/run/LiveOutputDrawer.tsx`: live run output drawer.
- `src/components/plangraph/audit/AuditLogViewer.tsx`: audit log viewer.
- `src/components/plangraph/validation/ValidationReportModal.tsx`: validation report modal.
- `src/components/ui/*`: shared shadcn-style primitives.

## MVP 2 Target Mapping

- Dashboard V2: partially exists across `/` and `/project/[id]/dashboard`; needs a cohesive home-level command center with KPI cards, active project, executor/adapter status, validation, snapshots, memory, next step, blocked items, activity, and quick actions.
- Projects and Templates V2: partially exists in `/project` and `ProjectGrid`; needs project gallery cards, graph previews, search/filter/sort, selected details panel, and templates section.
- AI Planning Chat shell: partially exists in `/discovery`; needs chat-style visual shell, idea summary panel, suggested skills/tools/sections, graph preview, and attachment preview UI without real AI API integration.
- Graph Workspace V2: exists in `/project/[id]` with React Flow; needs dark grid canvas styling, improved node cards by type, connector/minimap/toolbar polish, and preserved graph data flow.
- Node Details Panel V2: exists in `StepDetails` and inline legacy panel code; needs clearer sections for description, skills, libraries, tools, prompt, success criteria, notes, status, and copy controls while preserving Markdown behavior.
- Execution Center V2: execution currently lives inside project workspace modals/drawers; needs a dedicated or clearer execution management screen with queue, executor cards, prompt/report previews, token estimate placeholder, and logs panel.
- Library and Memory V2: partially exists in `/project/[id]/memory`; needs document list/tree, Markdown preview, metadata panel, linked nodes, tags, attachments, and memory entries UI.
- Snapshots and Import V2: snapshots exist inside `/project/[id]/dashboard`; import exists at `/import`; needs unified visual treatment with snapshots timeline/list, restore/compare panel, and import option states for ZIP, folder, Git, and Markdown project without expanding behavior beyond current support.
- Validation, Audit, and Reports V2: audit exists at `/project/[id]/audit` and validation modal exists; needs health cards, checks/issues table, audit timeline, report cards, and supported export/open report actions.
- Settings and Workspace V2: exists at `/settings`; needs tabs for general, workspace, executors, token, storage, integrations, adapter cards, privacy/local-first settings, and profile/workspace card.
- App Shell V2: exists as a top bar; needs sidebar layout, navigation sections, project/workspace switcher, user card, and RTL/English preservation.
- Shared design system: current UI uses basic theme primitives; needs MVP 2 dark visual tokens, panels/cards/badges, and accent colors before page redesign work.

## Implementation Checklist

- [ ] Session 2: add MVP 2 dark design tokens and shared UI foundation.
- [ ] Session 3: redesign the app shell with navigation sections, workspace/project switcher, user card, and RTL support.
- [ ] Session 4: redesign the dashboard/home command center.
- [ ] Session 5: redesign projects and templates gallery.
- [ ] Session 6: visually redesign the graph workspace while preserving React Flow logic.
- [ ] Session 7: redesign the node details panel around execution-ready node data.
- [ ] Session 8: redesign discovery as the AI planning chat visual shell only.
- [ ] Session 9: create or clarify Execution Center V2 using existing local-first execution behavior.
- [ ] Session 10: expand library/memory UI around Markdown documents and memory entries.
- [ ] Session 11: improve snapshots, restore, compare, and import UI states within existing behavior.
- [ ] Session 12: improve validation, audit, and reports UI.
- [ ] Session 13: redesign settings and workspace configuration.
- [ ] Session 14: final consistency pass for spacing, labels, colors, Arabic/English, empty states, and responsive behavior.

## Boundaries Confirmed

- Do not add real AI API integrations in MVP 2.
- Do not add MCP, CLI, whiteboard mode, or advanced automation.
- Preserve local-first behavior and existing MVP 1 logic.
- Keep future changes small and session-scoped.
