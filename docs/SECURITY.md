# PlanGraph Security Model

## What PlanGraph does with files

PlanGraph reads and writes files strictly within:
- `workspace/` — project metadata, step Markdown files, memory, and audit logs
- The user's chosen project root folder (for snapshot/rollback and report watching)

PlanGraph **never** writes outside these roots. All file paths are validated through `PathGuard` before any read/write operation.

## Why localhost-only

PlanGraph is a personal, local tool. It is not designed to be exposed to the network. The Next.js middleware blocks all requests whose `Host` header is not `localhost` or `127.0.0.1`, returning HTTP 403.

This prevents:
- Accidental public exposure (e.g., running behind a misconfigured reverse proxy)
- CSRF attacks from other browser tabs targeting a local port

## Protected files

Starting in Session 18, each project tracks a `protectedFiles` list — patterns like `.env`, `*.pem`, `secrets/**` — that the step validator checks after each executor run. Any change to a protected file triggers a `needs_review` status and a warning dialog.

## Atomic writes

All JSON and text writes go through `SafeWriter`, which:
1. Writes to a `.tmp` file first
2. Verifies the `.tmp` by reading it back
3. Copies the existing file to `.backup`
4. Renames `.tmp` → final path

This means a crash mid-write leaves the `.backup` intact, not a corrupt main file.

## Secret handling

- `InputSanitizer.sanitizeForLog()` strips known API key patterns from log output
- `SecretManager` uses the OS keychain (`keytar`) for any stored credentials — never plain files
- PlanGraph never transmits secrets over the network

## Reporting security issues

Open an issue on the project's GitHub repository. For sensitive disclosures, email the maintainer directly (contact details in the repository).
