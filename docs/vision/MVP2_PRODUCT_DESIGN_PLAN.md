# PlanGraph MVP 2 Product Design Plan

## Purpose

MVP 2 is the product-design and experience layer that sits on top of the completed MVP. The goal is not to restart PlanGraph, but to turn the existing local-first planning tool into a polished, coherent product with a clear visual identity, complete core screens, and documented UX direction.

## MVP 2 Definition

MVP 2 focuses on:

- Dashboard V2
- Projects and Templates V2
- AI Planning Chat design direction
- Graph Workspace V2
- Node Details Panel V2
- Execution Center V2
- Library and Memory Bank
- Snapshots, Restore, and Import
- Validation, Audit, and Reports
- Settings and Workspace configuration
- Node system documentation
- AI Model Graph Vision documentation

MVP 2 does not require advanced automation features such as MCP, full whiteboard mode, direct multi-agent orchestration, or production-grade AI planning. Those belong to MVP 3.

## Design System Direction

PlanGraph should use a premium dark interface:

- Deep navy and charcoal background
- Purple/indigo primary accent
- Cyan, green, amber, red status colors
- Glassmorphism cards
- Rounded panels
- Grid-based graph canvas
- Arabic RTL first, with English support later
- Clear iconography
- Local-first and trustworthy feel

## Screen Coverage

### 1. Dashboard Overview

Assets:

- `assets/01-dashboard-overview-v1.png`
- `assets/08-dashboard-overview-v2.png`

Purpose: show project progress, active project, executors/adapters, validation, snapshots, memory, quick actions, next step, blocked items, and activity.

### 2. Projects and Templates

Assets:

- `assets/02-projects-templates-v1.png`
- `assets/10-projects-templates-v2.png`

Purpose: browse projects, preview project maps, filter by status, reuse templates, and open or duplicate projects.

### 3. AI Planning Chat

Assets:

- `assets/03-ai-planning-chat-v1.png`
- `assets/11-ai-planning-chat-v2.png`

Purpose: allow the user to describe a project idea, answer clarifying questions, attach files, preview the generated plan, and create the project.

### 4. Graph Workspace

Assets:

- `assets/04-graph-workspace-v1.png`
- `assets/09-graph-workspace-v2.png`

Purpose: the main heart of PlanGraph: visual graph canvas, nodes, links, minimap, zoom/pan, and node details panel.

### 5. Execution Center

Assets:

- `assets/05-execution-center-v1.png`
- `assets/12-execution-center-v2.png`

Purpose: manage step-by-step execution, select executor, preview prompt/patch, monitor logs, track status and token estimates.

### 6. Library and Memory

Asset:

- `assets/13-library-memory.png`

Purpose: central place for Markdown files, notes, reports, prompts, templates, attachments, and memory entities.

### 7. Snapshots and Import

Asset:

- `assets/14-snapshots-import.png`

Purpose: restore safe states, compare snapshots, and import existing projects.

### 8. Validation, Audit, and Reports

Asset:

- `assets/15-validation-audit-reports.png`

Purpose: track project health, warnings, critical issues, audit trail, and generated reports.

### 9. Settings and Workspace

Asset:

- `assets/16-settings-workspace.png`

Purpose: configure workspace, executors, local storage, language, theme, token settings, privacy, and user profile.

### 10. Vision and Node System

Assets:

- `assets/06-ai-model-graph-map.png`
- `assets/07-node-system.png`
- `assets/17-ai-model-graph-vision.png`

Purpose: explain the product vision, node categories, and layered architecture.

## Recommended Implementation Order

1. Add all design assets and docs under `docs/vision/`.
2. Update README with a short MVP 2 section and a link to these docs.
3. Implement Dashboard V2 shell and shared design tokens.
4. Implement Projects and Templates V2.
5. Implement Graph Workspace V2.
6. Implement Node Details Panel V2.
7. Implement Execution Center V2.
8. Implement Library and Memory page.
9. Implement Snapshots and Import page.
10. Implement Validation, Audit, and Reports page.
11. Implement Settings and Workspace page.

## MVP 3 Boundary

Move the following to MVP 3:

- Real AI planning chat with BYOK/Ollama
- Dynamic graph editing beyond basic node movement
- Code/Patch Node execution logic
- Direct multi-tool orchestration
- Upload processing with AI context extraction
- Whiteboard / Sketch Mode
- MCP server
- CLI

## Commit Recommendation

```bash
git add docs/vision
git commit -m "docs: add MVP 2 product design vision"
git push
```
