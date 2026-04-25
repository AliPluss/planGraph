<div align="center">

# 🌟 PlanGraph

### Plan once. Execute with any AI tool.

**A local-first project planning tool that turns your ideas into structured execution plans — visualized as an interactive box-graph, with a ready-to-use prompt for every step.**

[![Status](https://img.shields.io/badge/status-in%20development-yellow)](https://github.com)
[![License](https://img.shields.io/badge/license-MIT-blue)](LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js-14-black)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)](https://www.typescriptlang.org)
[![Made with Claude Code](https://img.shields.io/badge/built%20with-Claude%20Code-orange)](https://claude.com/claude-code)

[العربية](#-بالعربية) • [English](#-english) • [Features](#-features) • [How it works](#-how-it-works) • [Roadmap](#-roadmap)

</div>

---

## 🌍 English

### Why PlanGraph?

Have you ever started a project and felt lost?

You write the idea in ChatGPT, copy it to Claude, paste a prompt, execute one step, forget where you stopped, come back two days later, and waste time trying to remember the context. You write a new prompt for every step. You forget what you decided before. AI tools don't talk to each other. The project gets lost.

**PlanGraph solves this.**

It takes your idea and turns it into a complete plan you can see in front of you — a vertical graph of boxes from idea to delivery. Each box is a step with a complete `.md` file: goal, recommended libraries, ready prompt, success criteria. You don't write code. You don't waste tokens explaining context to AI. You select your tool (Claude Code, Cursor, Antigravity, Copilot, or manual), and watch your project being built step by step in front of you.

### What makes PlanGraph different?

- 🆓 **Doesn't spend your tokens** — All planning happens locally without API calls
- 🔌 **Works with your existing subscription** — Claude Pro/Max, Cursor, Antigravity (free), or any tool you use
- 🌐 **Bilingual from day one** — Arabic + English with full RTL support
- 🛡️ **Security first** — Sandboxed file access, automatic git snapshots, secret leak detection
- 📦 **Local-first** — Your data lives on your machine. No cloud. No tracking.
- 🎨 **Beautiful visualization** — Interactive box-graph that matches how you think

---

## 🌍 بالعربية

### لماذا PlanGraph؟

هل بدأت يوماً مشروعاً وشعرت بالضياع؟

تكتب الفكرة في ChatGPT، تنسخها لـ Claude، تلصق prompt، تنفذ خطوة، تنسى أين توقفت، تعود بعد يومين، تضيع وقتاً في تذكر السياق. تكتب prompt جديد لكل خطوة. تنسى ماذا قررت من قبل. الأدوات لا تتفاهم بينها. المشروع يضيع.

**PlanGraph يحل هذا.**

يأخذ فكرتك ويحولها إلى خطة كاملة تراها أمامك — مخطط عمودي من المربعات من الفكرة إلى التسليم. كل مربع خطوة فيها ملف `.md` كامل: الهدف، المكتبات المقترحة، prompt جاهز، معايير النجاح. أنت لا تكتب كود. لا تضيع توكن في شرح السياق للنماذج. تختار أداتك (Claude Code، Cursor، Antigravity، Copilot، أو يدوياً)، وتشاهد مشروعك يُبنى خطوة بخطوة أمامك.

### ما الذي يميز PlanGraph؟

- 🆓 **لا يستهلك توكن** — كل التخطيط يتم محلياً بدون أي API
- 🔌 **يعمل مع اشتراكك الحالي** — Claude Pro/Max، Cursor، Antigravity (مجاني)، أو أي أداة تستخدمها
- 🌐 **ثنائي اللغة من البداية** — عربي + إنجليزي مع دعم كامل لـ RTL
- 🛡️ **الأمان أولاً** — حماية الملفات، snapshots تلقائية، كشف تسرب الأسرار
- 📦 **محلي بالكامل** — بياناتك على جهازك فقط. لا cloud. لا تتبع.
- 🎨 **تصور جميل** — مخطط تفاعلي يطابق طريقة تفكيرك

---

## ✨ Features

### 🎯 Smart project understanding
- **Onboarding** — A short profile (skill level, languages, tools) so the app speaks your language
- **Idea Discovery Dialog** — Adaptive questions that turn a vague idea into a structured scope (no LLM needed)
- **15+ project templates** — Next.js SaaS, Telegram bots, REST APIs, browser extensions, 3D web, n8n workflows, and more

### 📋 Structured plans, not just lists
- **Vertical box-graph** — See your project from idea to delivery, like a mind map
- **One `.md` file per step** — With goal, libraries, ready prompts, success criteria, restrictions
- **Tool-aware prompts** — Different prompt format for Claude Code, Cursor, Antigravity, Copilot, manual

### 🔄 Real execution, not just planning
- **Multi-tool adapters** — Connect to Claude Code (CLI/VS Code), Cursor, Antigravity, GitHub Copilot
- **File watcher** — Drop a step report, app auto-progresses to the next step
- **Memory Bank** — `MEMORY.md` grows automatically with project decisions, so AI never forgets context

### 🛡️ Safety built-in
- **Auto-snapshots** — Git commit before every step, one-click rollback
- **Path Guard** — Sandboxed file access, can't escape project root
- **Protected files** — `.env`, `.git`, `*.key` are never touched
- **Step validation** — After every step: secret scan, build check, protected files check
- **Audit log** — Every action logged in `audit.log`

### 📊 Full transparency
- **Dashboard** — Progress, current step, time spent, tokens (if you use API)
- **Project importer** — Open existing incomplete projects, plan only what's missing
- **Snapshots & rollback** — Try anything without fear

---

## 🎬 How it works

```
1. You describe your idea in plain language
        ↓
2. PlanGraph asks 4-8 clarifying questions (no AI needed)
        ↓
3. Generates a complete plan: vertical box-graph + per-step .md files
        ↓
4. You select your executor: Claude Code / Cursor / Antigravity / Manual
        ↓
5. PlanGraph writes a perfect prompt for the selected tool
        ↓
6. Your tool executes the step, writes a report
        ↓
7. PlanGraph detects the report, updates progress, prepares next step
        ↓
8. Repeat until project complete 🎉
```

### The visual model

```
        ┌──────────────────┐
        │   Project Idea   │
        └────────┬─────────┘
                 │
        ┌────────┴────────┐
        ▼                 ▼
   ┌─────────┐       ┌─────────┐
   │ Setup   │       │  Auth   │
   └────┬────┘       └────┬────┘
        │                 │
        ▼                 ▼
   ┌─────────┐       ┌─────────┐
   │   DB    │       │  API    │
   └────┬────┘       └────┬────┘
        │                 │
        └────────┬────────┘
                 ▼
        ┌──────────────────┐
        │     Delivery     │
        └──────────────────┘
```

---

## 🛠️ Tech stack

- **Framework:** [Next.js 14](https://nextjs.org) (App Router) + TypeScript
- **UI:** [Tailwind CSS](https://tailwindcss.com) + [shadcn/ui](https://ui.shadcn.com)
- **Visualization:** [React Flow](https://reactflow.dev)
- **State:** [Zustand](https://github.com/pmndrs/zustand)
- **i18n:** [react-i18next](https://react.i18next.com) (Arabic + English)
- **Storage:** Local JSON + Markdown files (no database)
- **Security:** [keytar](https://github.com/atom/node-keytar) for secrets, [chokidar](https://github.com/paulmillr/chokidar) for file watching, [simple-git](https://github.com/steveukx/git-js) for snapshots

---

## 🚀 Quick start

> ⚠️ Project is currently under development. Full release coming soon.

```bash
# Clone the repository
git clone https://github.com/YOUR-USERNAME/plangraph.git
cd plangraph

# Install dependencies
npm install

# Run the dev server
npm run dev
```

Open `http://localhost:3000` in your browser.

---

## 🗺️ Roadmap

- [x] **Phase 1: Foundation** — Project skeleton, security base, types, i18n
- [x] **Phase 2: Planning engine** — Onboarding, Idea Discovery, templates, plan generator *(in progress)*
- [ ] **Phase 3: Visual workspace** — Box-graph, step viewer, Memory Bank
- [ ] **Phase 4: Tool adapters** — Claude Code, Cursor, Antigravity, Manual
- [ ] **Phase 5: Polish** — Dashboard, snapshots, validation, project importer

See the full session-by-session build plan in [`PLANGRAPH_BUILD_PROMPTS.md`](./PLANGRAPH_BUILD_PROMPTS.md).

---

## 🧠 The build process (meta!)

This project is being built using PlanGraph's own philosophy: **one structured step at a time**. The complete build plan lives in `PLANGRAPH_BUILD_PROMPTS.md` — 20 sessions, each with a focused prompt for Claude Code. Track progress in `PROGRESS.md`.

This means anyone can clone the repo, follow `START_HERE.md`, and build PlanGraph from scratch using Claude Code, replaying the same disciplined process.

---

## 🤝 Contributing

This is an open-source project. Contributions, feedback, and ideas are welcome!

- 🐛 **Found a bug?** Open an issue
- 💡 **Have an idea?** Start a discussion
- 🛠️ **Want to contribute code?** PRs welcome (please open an issue first to discuss)

---

## 📄 License

MIT License. See [`LICENSE`](LICENSE) for details.

---

## 🙏 Acknowledgments

- Built with [Claude Code](https://claude.com/claude-code) by Anthropic
- Inspired by every developer who lost a project to context-switching fatigue
- Box-graph design inspired by the way humans naturally sketch project plans on paper

---

<div align="center">

### Made with care for builders who want to ship 🚀

**Star ⭐ this repo if you find it useful!**

[Report Bug](https://github.com/YOUR-USERNAME/plangraph/issues) • [Request Feature](https://github.com/YOUR-USERNAME/plangraph/issues) • [Discussions](https://github.com/YOUR-USERNAME/plangraph/discussions)

</div>
