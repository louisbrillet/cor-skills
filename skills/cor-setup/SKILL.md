---
name: cor-setup
description: "Initialize a project for the COR (CodingOnRails) methodology. Detects the tech stack, proposes check commands, and writes a .cor/config.md file. Run once per repo before using any other COR skills. Claude Code users: invoke as /cor:setup."
status: stable
stability: guaranteed
---

# COR Setup — Project Initializer

You are running the COR (CodingOnRails) repo-specific setup. This runs once per project to detect the tech stack, configure check commands, and set the plan storage preference. Output is saved to `.cor/config.md`.

---

## Environment Detection

Determine which interactive question tool is available. Check in this order:

| Priority | Signal                          | Environment   | Question tool         |
| -------- | ------------------------------- | ------------- | --------------------- |
| 1        | `AskUserQuestion` available     | Claude Code   | `AskUserQuestion`     |
| 2        | `vscode_askQuestions` available | Copilot       | `vscode_askQuestions` |
| 3        | neither                         | Codex / other | inline numbered list  |

Store as **active environment**. Use consistently for all interactive prompts in this skill.

---

## Step 0 — Configure Extensions

Ask which AI coding extensions will be used in this project. Multi-select — the user may use more than one.

Options: Claude Code / GitHub Copilot / Codex / Other

**Claude Code**: `AskUserQuestion` with `multiSelect: true`. Options: `Claude Code`, `GitHub Copilot`, `Codex`, `Other`.

**Copilot**: `vscode_askQuestions` — prompt: "Which AI coding extensions will be used in this project? Enter all that apply (comma-separated)." Choices: `["1. Claude Code", "2. GitHub Copilot", "3. Codex", "4. Other — specify in free text"]`. Parse the comma-separated response.

**Codex / other**: Inline numbered list. Instruct: "Enter all numbers that apply, comma-separated."

Wait for the response. Record as the **configured extensions** list.

---

## Step 1 — Detect Stack

Use Bash to check for these files in the current working directory:

- `package.json` — Node/JS/TS project
- `tsconfig.json` — TypeScript enabled
- `.eslintrc*` or `eslint.config.*` — ESLint configured
- `.prettierrc*` — Prettier configured
- `Gemfile` — Ruby/Rails
- `pyproject.toml` or `requirements.txt` — Python
- `go.mod` — Go
- `Cargo.toml` — Rust

If `package.json` exists, read it and extract:

- Framework: `next`, `react`, `vue`, `svelte`, `express`
- Test runner: `vitest`, `jest`, `mocha`, `playwright`
- Linting: `eslint`, `prettier`, `biome`

If no stack indicators are found at all, ask the user: "I couldn't detect a stack. What are you working with?" and wait for an answer before continuing.

---

## Step 2 — Propose Check Commands

Based on your detection, propose a specific, ordered list of check commands that will run at the end of every code task. Adapt to what is actually present — do not suggest commands for tools that aren't configured.

**Reference defaults by stack:**

TypeScript + ESLint + Prettier + Vitest (Next.js / React):
npx tsc --noEmit
npx eslint . --fix --ext .ts,.tsx
npx vitest run --passWithNoTests

TypeScript + ESLint only:
npx tsc --noEmit
npx eslint . --fix --ext .ts,.tsx

TypeScript + Biome:
npx tsc --noEmit
npx biome check --apply .

Ruby on Rails + RuboCop:
bundle exec rubocop -a

Python + ruff + mypy:
ruff check . --fix
mypy .

Go:
go vet ./...
go build ./...

Present the list clearly. Then ask: "Do these checks look right? Remove, modify, or add any command, then confirm."

Wait for explicit confirmation before continuing. If the user modifies the list, record the final confirmed version.

---

## Step 3 — Worktree Support (optional)

Ask the user: "Set up worktree support? This lets any tool (`git worktree add`, VS Code, Claude Code, Codex, OpenCode, GitHub Copilot CLI, ...) automatically copy git-ignored local files (`.env`, local DB, local settings, ...) into every new worktree, so you don't have to recreate them by hand." Choices: `Yes (Recommended)` / `No, skip`.

If the user says no, skip to Step 4 and omit the `## Worktree Support` section in Step 5's config (or write `disabled`).

If yes:

1. **Detect candidate files.** Run `git status --ignored --porcelain` (and inspect `.gitignore`) to find git-ignored files that look like per-developer/local state: `.env`, `.env.local`, `.env.*.local`, `*.local.*`, `*secrets*`, local DB files (`*.db`, `*.sqlite`, `*.sqlite3`), `.claude/settings.local.json`, `local.settings.json`, and similar. Do not include build output, dependency, or cache directories (`node_modules`, `dist`, `.next`, `vendor`, `__pycache__`, etc.) — those must be reinstalled/rebuilt per worktree, not copied.
2. **Confirm the list** with the user before writing anything: "Here are the git-ignored files I'd copy into new worktrees: [list]. Add, remove, or confirm."
3. **Write `.worktreeinclude`** at the repo root with the confirmed list, one glob pattern per line, `.gitignore` syntax, with a short header comment explaining its purpose. This file alone is enough for tools that read it natively (Claude Code, Codex, OpenCode).
4. **Add a Husky-based fallback** so it also works with tools that don't read `.worktreeinclude` natively (e.g. GitHub Copilot CLI) and with plain `git worktree add`, by hooking into `post-checkout` (which git always fires when creating a worktree):
   - Only do this for **Node.js projects** (`package.json` present) — Husky is an npm-ecosystem tool. Detect the package manager from the lockfile (`pnpm-lock.yaml` → pnpm, `yarn.lock` → yarn, `bun.lockb` → bun, else npm) and use it for install commands below.
   - Install Husky as a dev dependency (e.g. `pnpm add -D husky`) and add `"prepare": "husky"` to `package.json` `scripts` if not already present. This makes `core.hooksPath` self-configure on every `install`, on any machine/clone, with no manual git config needed.
   - Run the package manager's Husky init (e.g. `npx husky init` / `pnpm exec husky init`). This creates `.husky/` and a default `pre-commit` hook running the project's test script — **delete that default `pre-commit` hook** unless the project actually has a `test` script that should gate commits (this project's tests are opt-in, not part of Step 2's checks).
   - Create `.husky/post-checkout` (executable, `chmod +x`) with this exact content:

```sh
#!/usr/bin/env sh
# Copies git-ignored files/folders listed in .worktreeinclude from the main
# worktree into any *new* linked worktree.
#
# `git worktree add` always performs a checkout, so this fires no matter
# which tool created the worktree (plain `git worktree add`, VS Code, Claude
# Code, Codex, OpenCode, GitHub Copilot CLI, ...). Husky wires this into
# core.hooksPath automatically on `pnpm install` (via the "prepare" script),
# so every clone/worktree gets it without manual git config.
#
# Standard post-checkout args: <prev-HEAD> <new-HEAD> <branch-checkout-flag>
is_branch_checkout="$3"

# Only act on branch/worktree checkouts, not single-file checkouts.
[ "$is_branch_checkout" = "1" ] || exit 0

git_common_dir=$(git rev-parse --git-common-dir 2>/dev/null) || exit 0
[ -n "$git_common_dir" ] || exit 0
git_common_dir=$(cd "$git_common_dir" && pwd)

# The main worktree is the parent of the common git dir.
main_worktree=$(dirname "$git_common_dir")
current_worktree=$(git rev-parse --show-toplevel 2>/dev/null) || exit 0
[ -n "$current_worktree" ] || exit 0

# Nothing to do when checking out inside the main worktree itself.
[ "$current_worktree" != "$main_worktree" ] || exit 0

include_file="$main_worktree/.worktreeinclude"
[ -f "$include_file" ] || exit 0

while IFS= read -r pattern || [ -n "$pattern" ]; do
  # Skip blank lines and comments (.gitignore-style syntax).
  case "$pattern" in
    ''|'#'*) continue ;;
  esac

  (
    cd "$main_worktree" || exit 0
    for match in $pattern; do
      [ -e "$match" ] || continue

      # Only copy files/folders that are actually git-ignored; tracked
      # files are already handled by git itself.
      git check-ignore -q -- "$match" || continue

      dest="$current_worktree/$match"
      [ -e "$dest" ] && continue

      mkdir -p "$(dirname "$dest")"
      cp -R "$main_worktree/$match" "$dest"
      echo "[.worktreeinclude] copied '$match' into $current_worktree"
    done
  )
done < "$include_file"
```

- **Non-Node projects** (Ruby, Python, Go, ...): Husky doesn't apply. Instead, commit a `.githooks/post-checkout` with the same script content and instruct the user to run `git config core.hooksPath .githooks` once per clone (mention this manually in the confirmation message, since there is no package-manager `prepare` step to automate it).

5. **Verify it actually works** before confirming: create a throwaway worktree (`git worktree add -b cor-setup-worktree-test /tmp/cor-setup-wt-test HEAD`), check the confirmed files were copied, then clean up (`git worktree remove --force ...` and `git branch -D cor-setup-worktree-test`).
6. Record the outcome (`husky` / `githooks` / `disabled`) for Step 5's config.

---

## Step 4 — Plan Storage

Ask the user: "Where should task plans live for this project?"

1. Markdown file — saved to `.cor/plan.md` in the repo. Tracked by git, survives context resets. Best for team projects or anything long-running.
2. Agent memory — loaded at session start, invisible in the repo. Best for solo, exploratory work.
3. Session tasks — the task panel (if your agent supports it). Resets on new session. Best for short, self-contained tasks.

Wait for the user to choose before continuing.

---

## Step 5 — Write Config

Create `.cor/` if it does not exist. Write `.cor/config.md` with this exact structure (no extra sections):

# COR Config

## Stack

[detected stack, e.g. "TypeScript / Next.js / React"]

## Checks

[one confirmed check command per line, exactly as the user confirmed]

## Worktree Support

[one of: husky | githooks | disabled — if husky/githooks, list the confirmed .worktreeinclude patterns beneath it]

## Plan Storage

[one of: markdown | memory | session]

## Extensions

[comma-separated list from Step 0, e.g. "claude-code, copilot"]

Then confirm: "Setup complete. Config saved to `.cor/config.md`. Use the **cor-think** skill to start thinking about your first task, or **cor-work** to continue an in-progress one."
