# START HERE — PlanGraph Build System

> **For:** Milan
> **Purpose:** This file is the entry point. Open Claude Code in this folder, paste the master prompt below, and the build will proceed session by session — automatically tracked, automatically committed.

---

## 📁 What should be in this folder before you start

```
plangraph/
├── START_HERE.md                  ← this file
├── PLANGRAPH_BUILD_PROMPTS.md     ← the 20-session build guide
└── (nothing else yet)
```

That's it. No `node_modules`, no `package.json`, no `src/`. Claude Code will create everything as it works through the sessions.

---

## ⚡ Quick start (5 commands)

```bash
# 1. Make sure you're in the plangraph folder
cd plangraph

# 2. Initialize git (required — sessions auto-commit)
git init

# 3. Create the progress tracker file
echo "1" > .current-session

# 4. Start Claude Code
claude

# 5. Paste the MASTER PROMPT below as your first message
```

After Session 1 completes, just open `claude` again and say:

```
Continue with the next session.
```

That's the entire workflow.

---

## 🎯 THE MASTER PROMPT (copy this to Claude Code)

Copy everything between the `<<<START>>>` and `<<<END>>>` markers (do not include the markers themselves):

```
<<<START>>>

You are helping Milan build a project called PlanGraph by following a structured multi-session build guide. This is a SERIOUS, DISCIPLINED build process. Read these instructions fully before doing anything.

═══════════════════════════════════════════════════════════
THE FILES YOU MUST KNOW ABOUT
═══════════════════════════════════════════════════════════

1. PLANGRAPH_BUILD_PROMPTS.md
   - The complete build guide.
   - Contains 20 sessions, each marked with a heading like "## SESSION N — Title".
   - Each session has a fenced code block (```text ... ```) containing the EXACT instructions to execute for that session.
   - The file also contains appendices (A, B, C, D) for reference. Do NOT execute appendices as sessions.

2. .current-session
   - Plain text file with a single integer.
   - Tells you which session number to execute next.
   - You will read this at the start of every invocation and write to it after a session completes successfully.

3. PROGRESS.md
   - You will create and update this file.
   - Acts as a human-readable log of completed sessions.

═══════════════════════════════════════════════════════════
YOUR EXECUTION ALGORITHM (follow strictly, every time)
═══════════════════════════════════════════════════════════

STEP 1 — Read state:
  - Read `.current-session`. Parse the integer. Call it N.
  - If N > 20: print "🎉 All sessions complete! Run through Appendix D's final checklist in PLANGRAPH_BUILD_PROMPTS.md." and STOP.
  - If N < 1 or unparseable: print an error and STOP. Do not guess.

STEP 2 — Locate the session:
  - Open PLANGRAPH_BUILD_PROMPTS.md.
  - Find the heading "## SESSION N — <title>".
  - Extract the COMPLETE content of the FIRST ```text fenced block under that heading.
  - That extracted block is your task for this invocation.

STEP 3 — Pre-flight check:
  - If N > 1, verify the previous session's commit exists in git log.
  - If git log doesn't show "Session <N-1>:", warn the user but proceed if they confirm.
  - If `package.json` exists and N > 1, do NOT re-run `create-next-app` or anything destructive.

STEP 4 — Announce:
  - Tell Milan, in 2–3 short sentences:
    - Which session you're starting (number + title)
    - What it will produce (high-level)
    - Estimated time for him to wait

STEP 5 — Execute:
  - Treat the extracted ```text block as authoritative instructions.
  - Follow every step it lists, in order.
  - Honor every CONSTRAINT it states.
  - If it says "do NOT do X", you must not do X — even if it would be helpful.
  - If it says "create file Y", create exactly that file.
  - Do not add features, files, or dependencies the session doesn't list.

STEP 6 — Verify:
  - Run any verification commands the session specifies (e.g. `npm run test`, `npm run build`, `npm run dev`).
  - If something fails: try to fix it within the same session's scope. Do not expand scope to fix unrelated issues.
  - If you cannot fix it after 2–3 attempts: STOP, report the failure clearly, and do NOT increment .current-session.

STEP 7 — Record:
  - Append a new entry to PROGRESS.md (create the file if it doesn't exist) with this exact format:

    ## Session N — <title>
    - **Completed:** <ISO datetime>
    - **Files added/modified:** <count or short list>
    - **Key outcomes:** <2–4 bullets>
    - **Notes:** <anything Milan should know, or "—">

STEP 8 — Commit:
  - Run: `git add -A`
  - Run: `git commit -m "Session N: <title>"`
  - If there's nothing to commit, that's a red flag — investigate and report.

STEP 9 — Advance the counter:
  - Write the integer N+1 to `.current-session` (overwrite the file).
  - Use a safe write: write to `.current-session.tmp`, then rename.

STEP 10 — Hand off:
  - Print a clean summary block to Milan:
    ─────────────────────────────────────
    ✅ Session N complete: <title>
    📂 Files changed: <number>
    🧪 Verification: <pass/fail summary>
    📝 Logged to: PROGRESS.md
    🔖 Committed: "Session N: <title>"
    ⏭️  Next: Session N+1 — <next title>
       To continue, restart Claude Code and say:
       "Continue with the next session."
    ─────────────────────────────────────
  - STOP. Do not start the next session. Do not chat further unless Milan asks.

═══════════════════════════════════════════════════════════
SPECIAL COMMANDS MILAN MAY GIVE YOU
═══════════════════════════════════════════════════════════

If Milan says "Continue with the next session" or "Continue":
  → Run the algorithm above starting at Step 1.

If Milan says "Redo the current session" or "Retry":
  → Run `git status`. If there are uncommitted changes, ask before reverting.
  → If clean, decrement nothing — .current-session already points to the right one.
  → Re-execute starting at Step 2.

If Milan says "Skip to session X":
  → ASK FOR CONFIRMATION. Skipping breaks dependencies.
  → If confirmed, write X to .current-session and execute starting at Step 2.

If Milan says "Show me what's next" or "What's next?":
  → Read .current-session, find the corresponding session heading and goal in PLANGRAPH_BUILD_PROMPTS.md.
  → Print the session number, title, goal, and verification criteria.
  → Do NOT start executing. Wait for him to say "continue".

If Milan says "Show progress" or "Status":
  → Read .current-session and PROGRESS.md.
  → Print a compact status: completed sessions, current position, sessions remaining.
  → Do NOT execute anything.

If Milan says "Roll back the last session":
  → Run `git log --oneline | head -5` and show him.
  → Ask which commit to reset to.
  → Run `git reset --hard <commit>` only after confirmation.
  → Decrement .current-session accordingly.

═══════════════════════════════════════════════════════════
HARD RULES (never violate these)
═══════════════════════════════════════════════════════════

1. ONE session per invocation. Never run two in a row, even if they're small.
2. NEVER skip ahead unless Milan explicitly says "skip to session X".
3. NEVER modify PLANGRAPH_BUILD_PROMPTS.md — it is the source of truth, read-only.
4. NEVER write outside the current project folder.
5. NEVER call external APIs (no Anthropic API, no OpenAI, no fetch to internet) unless a session explicitly requires it.
6. NEVER `npm install` packages not listed in the session.
7. NEVER auto-increment .current-session if a session failed verification.
8. ALWAYS commit on success. ALWAYS update PROGRESS.md on success.
9. ALWAYS treat each session's CONSTRAINTS section as binding.
10. ALWAYS stop after one session and wait.

═══════════════════════════════════════════════════════════
START NOW
═══════════════════════════════════════════════════════════

Read `.current-session` and execute that session, following the 10-step algorithm above.

<<<END>>>
```

---

## 🔁 What to type for sessions 2 through 20

After the first session is done, every subsequent session takes one short message in Claude Code:

```
Continue with the next session.
```

That's it. Claude Code remembers everything via `.current-session`, `PROGRESS.md`, and the git log.

---

## 🧰 Useful one-liners

While building, you'll want these:

| You want to… | Type to Claude Code |
|---|---|
| Run the next session | `Continue with the next session.` |
| See where you are | `Show progress.` |
| Preview the next session before running | `Show me what's next.` |
| Retry the current session | `Redo the current session.` |
| Jump to a specific session (careful!) | `Skip to session 12.` |
| Roll back the last session | `Roll back the last session.` |

---

## ⚠️ Things to keep in mind

**1. Always inspect after each session.**
Claude Code will commit and stop. Before saying "continue", take 2 minutes to:
- Run `npm run dev` and click around (after the relevant sessions)
- Read the latest `git log -1` commit message
- Skim the new files

**2. If something feels wrong, stop.**
You can always:
```bash
git log --oneline
git reset --hard <previous-commit-hash>
echo "<session-number-to-retry>" > .current-session
```

**3. The first session takes the longest.**
Session 1 sets up Next.js, Tailwind, shadcn, and many dependencies. Expect 5–15 minutes. Later sessions are typically faster but more focused.

**4. Sessions 11, 14, 15, 18 are the "wow" sessions.**
- Session 11: the vertical box-graph appears (matches your sketch!)
- Session 14: file watcher works — drop a report, see auto-progress
- Session 15: Claude Code adapter (the real magic)
- Session 18: snapshot + rollback

**5. After Session 20:**
You'll have a working PlanGraph. Run through Appendix D's checklist in `PLANGRAPH_BUILD_PROMPTS.md`. Then:
```bash
git tag v0.1.0
git remote add origin <your-github-url>
git push -u origin main --tags
```

---

## 🧭 Map of where you are in the build

Track yourself here as you go:

- [ ] Session 1 — Project skeleton
- [ ] Session 2 — Security base
- [ ] Session 3 — Core types + storage
- [ ] Session 4 — i18n bilingual layout
- [ ] Session 5 — Onboarding flow
- [ ] Session 6 — Idea Discovery Dialog
- [ ] Session 7 — Templates library
- [ ] Session 8 — Plan generator
- [ ] Session 9 — Markdown writer
- [ ] Session 10 — Project workspace shell
- [ ] Session 11 — React Flow box-graph 🎨
- [ ] Session 12 — Step viewer + status
- [ ] Session 13 — Memory Bank system
- [ ] Session 14 — Executor adapter base ⚙️
- [ ] Session 15 — Claude Code adapter ⚡
- [ ] Session 16 — Cursor + Antigravity adapters
- [ ] Session 17 — Dashboard + project list
- [ ] Session 18 — Snapshot + rollback 🛡️
- [ ] Session 19 — Step validation + audit
- [ ] Session 20 — Project importer + final polish ✅

---

## 🤝 If you get stuck

1. Read `PROGRESS.md` to see what was done.
2. Read `git log --oneline` to confirm commits match progress.
3. If a session is failing repeatedly, paste the error to Claude Code and ask it to diagnose **without** advancing the counter.
4. The Appendix C in `PLANGRAPH_BUILD_PROMPTS.md` has recovery commands.

---

**Good luck, Milan. One session at a time. 🚀**
