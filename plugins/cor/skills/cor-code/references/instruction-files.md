# Note destinations, scoping, and maintenance

Read this before writing a note in Step 5 of cor-code, whenever the note is not a plain `README.md` setup entry.

## Contents

- Note destination by audience
- Path-scoped `.claude/rules/` (Claude Code + Copilot)
- Nested `AGENTS.md` + `CLAUDE.md` stub (Codex-scoped sessions)
- Fallback index in root `AGENTS.md` (Codex)
- Hard rule: never `@import` a scoped file
- Per-agent destination summary
- Note format and maintenance policy

## Note destination by audience

First, classify the note by audience:

| Audience                                   | Destination                     |
| ------------------------------------------ | ------------------------------- |
| Human developers (setup, config, env vars) | `README.md`                     |
| AI agents — project-wide rules             | agent instruction file (global) |
| AI agents — scoped to a module / directory | agent instruction file (scoped) |

**README.md** — use for any setup/config info: env vars to add, config files to create, services to start, migrations to run. This is the canonical place a new developer looks. Find the most relevant existing section (`## Configuration`, `## Environment Variables`, `## Setup`, `## Getting Started`) and append there. If no suitable section exists, create a minimal `## Configuration` section. Write in plain prose or a bullet list — no COR Notes comment block, no tags. Keep it concise and human-friendly.

For all other note types, use the appropriate agent file per agent. Two independent scoping mechanisms exist for narrowing a rule below "loads for the whole project" — they are not interchangeable, and mixing them wrong is what silently defeats scoping (see the hard rule below).

**Path-scoped `.claude/rules/` — Claude Code + VS Code Copilot, not Codex**

Verified against both vendors' current docs: VS Code Copilot reads `.claude/rules/*.md` natively (default `chat.instructionsFilesLocations`), using the **same** `paths` frontmatter key as Claude Code — not `applyTo` (VS Code docs: "For `.claude/rules` instructions files, VS Code uses a `paths` property instead of `applyTo`"). One file, no duplication, for any project that targets Claude Code and/or Copilot.

- Scope with a `paths` YAML frontmatter array (glob patterns relative to workspace root):
  ```markdown
  ---
  paths:
    - "src/lib/anchor-*.ts"
    - "src/lib/block-overlap*.ts"
  ---
  ```
- A file with **no** `paths` key loads unconditionally at every session start — same as a global `CLAUDE.md`. A file **with** `paths` loads only when the agent reads a file matching one of the globs; it is otherwise invisible. A file is one or the other, never both.
- One file per topic, descriptive name (e.g. `k8s.md`, `docx-conversion.md`, `src-git.md`).
- **Codex does not read this directory at all.** If the project also targets Codex, this content needs the nested-`AGENTS.md` treatment below too — Codex simply never sees anything scoped only through `.claude/rules/`.
- Best for a rule that doesn't map to one real subdirectory — a flat `src/lib/` full of prefix-named files, or a concern that legitimately spans several unrelated folders (e.g. two workers in different files that must stay symmetric).

**Nested `AGENTS.md` + a one-line `CLAUDE.md` stub — Claude Code always, Codex/Copilot only in a session scoped to that directory**

Codex builds its instruction chain **once per session** — at launch, or at whatever directory it was started/`--cd`'d into — by concatenating `AGENTS.md`/`AGENTS.override.md` from the project root down to that working directory. It does **not** re-resolve this as it edits different files during a running session, and its official docs show no `@import`/file-reference syntax — treat any claim that Codex supports importing another file from `AGENTS.md` as unverified until you've confirmed it against current docs, and never assume it silently. Concretely: a Codex session started at the repo root will **never** pick up `<subdir>/AGENTS.md` on its own, no matter how many files under `<subdir>/` it touches later in that session; only a session actually started inside (or `--cd`'d into) `<subdir>/` sees it. VS Code Copilot reads nested `AGENTS.md` files dynamically like Claude Code, but only if `chat.useNestedAgentsMdFiles` is enabled — experimental, off by default.

Still worth doing when the rule is genuinely about one real directory (`k8s/`, a route folder, a component folder) and the team sometimes runs Codex sessions scoped to exactly that directory (`codex --cd k8s`):

1. Put the rule body in `<subdir>/AGENTS.md` (plain `## COR Notes`, no frontmatter).
2. Add a sibling `<subdir>/CLAUDE.md` with exactly one line, `@AGENTS.md`. Claude Code discovers nested `CLAUDE.md` files lazily — only when it reads a file inside `<subdir>/`, never at launch, and unlike Codex it *does* re-resolve this per file throughout the session — and at that point follows the import into the sibling `AGENTS.md`.

For content spanning several unrelated files or folders, forcing it into one subdirectory's `AGENTS.md` would hide it from every other file it actually applies to — use path-scoped `.claude/rules/` instead, and accept that Codex won't get it automatically (see the fallback below).

**Fallback for Codex when nothing above fits — an index in root `AGENTS.md`, read on demand**

Root `AGENTS.md` is the one file every repo-root Codex session is guaranteed to load, in full, unconditionally, every time — there is no way around that cost, so keep it small rather than pasting rule bodies into it. Instead, list each `.claude/rules/<topic>.md` file with the paths it covers, and instruct Codex to read the matching one itself before editing a file in that area. This trades automatic injection for agent-directed reading: Codex has its own file-read tools, so an explicit "read `.claude/rules/src-git.md` before touching `docs-git.ts`" line works even though Codex never auto-loads that file. This is what this project's root `AGENTS.md` does — use it as the reference shape.

**Hard rule: never `@import` a scoped file into a project's root `AGENTS.md`/`CLAUDE.md`.** An `@path` import always loads eagerly and unconditionally at every session start, regardless of any `paths` frontmatter the imported file carries — the import does not "activate" the scoping, it silently defeats it, and the file becomes indistinguishable in effect from an unscoped global rule. (Measured on this project: a root `AGENTS.md` importing four `.claude/rules/*.md` files that already carried correct `paths` frontmatter forced roughly 150 KB into every single turn of every session, for months, purely because the `@import` bypassed the frontmatter. Removing the four import lines — nothing else — was most of the fix.) A scoped file must be found by the agent's own native discovery (sitting in `.claude/rules/`, or in a subdirectory's own `AGENTS.md`/`CLAUDE.md`) — never referenced by `@import` from a broader file.

**Claude Code — global only**

- Project-wide → root `CLAUDE.md` (or `.claude/CLAUDE.md`). Keep this to genuinely universal content; anything narrower belongs in `.claude/rules/` or a nested `AGENTS.md`+`CLAUDE.md` pair, per above.

**Copilot — additional scoped option**

- `.github/instructions/<topic>.instructions.md` with `applyTo` frontmatter (comma-separated glob string in one string, not a YAML array):
  ```markdown
  ---
  applyTo: "app/controllers/api/**/*.rb"
  ---
  ```
  Use this only when the project does **not** also target Claude Code — otherwise `.claude/rules/` covers both with one file and one frontmatter key.

**Codex — root file is an index, not a content dump**

- Root `AGENTS.md` is read in full, unconditionally, every session — keep genuinely universal rules there directly, but for everything scoped, list it as "topic → file to read" (see the fallback pattern above) rather than pasting it in or `@`-importing it.
- Create the file with a minimal header if it doesn't exist.

### Note format and maintenance policy

Find or create a `## COR Notes` section in the target file. Write entries in english. Keep each entry compact (one line), with a tag and a stable ID:

```markdown
## COR Notes

### Active Rules

- [rule][API-AUTH-001] Always use explicit HTTP status codes with `render json:`
- [gotcha][API-AUTH-002] API-only controllers may skip `before_action` unless explicitly included
```

Tags: `[gotcha]` `[rule]` `[decision]` `[skip]` `[error]` `[practice]` `[setup]`

When updating instruction files, enforce these rules:

1. Keep one canonical rule body in one file (`.claude/rules/<topic>.md`). Do not duplicate the same rule text across `AGENTS.md`, `CLAUDE.md`, and `.github/copilot-instructions.md`.
2. Keep scoped rule files in this section order: `## COR Notes`, `### Active Rules`, `### Active Decisions`, `### Gotchas` (optional), `### Runbook`, `### Archive`.
3. Keep only reusable/current constraints in active sections. Move historical or plan-specific context to `.cor/instruction-archive/<topic>.cor-notes.archive.md`, then leave a pointer in `### Archive`.
4. Deduplicate before appending: if an equivalent rule exists, update it in place instead of adding a near-duplicate line.
5. Avoid volatile wording like `current version is X` unless the same change updates the code source of truth; prefer references to source files (for example `src/lib/db.ts`).
6. Keep active rule files concise (target <= 120 lines or <= 40 bullets). If a file exceeds this, there are two separate levers — apply whichever fits, and don't reach for the wrong one:
   - **Archive** genuinely historical or plan-specific entries (superseded decisions, one-off migration notes) to `.cor/instruction-archive/<topic>.cor-notes.archive.md`, with a pointer left in `### Archive`. This is for content that is no longer live, regardless of size.
   - **Split** if the file is still over budget because it legitimately covers several distinct, still-live subsystems bundled together (this is what happened to a 221-line `src.md` covering git integration, the AI loop, DOCX rendering, and more, all at once). Move each subsystem's rules into its own new sibling file (e.g. `src.md` → `src-git.md`, `src-loop-batch.md`, `src-docs-ops.md`, ...), each with its own narrower `paths` frontmatter scoped to that subsystem's actual files. Keep rule IDs unchanged when moving — only the file changes. Leave in the original file only what is genuinely cross-cutting: a rule that can matter from a file that has nothing else to do with the subsystem it describes (e.g. a client/server bundling boundary, a date-formatting convention, a concurrency lock spanning many routes). When in doubt whether a rule is cross-cutting enough to stay, prefer moving it — an over-cautious split costs a few extra tokens on the rare turn that needed it; leaving too much in the base file costs those tokens on every turn.
7. Do not add per-task HTML timeline headers (`<!-- T.. -->`) in active files. Keep timeline detail in archive files.

For Copilot scoped files, place the `## COR Notes` section below frontmatter — never inside frontmatter.
