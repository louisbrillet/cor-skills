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

## Step 3 — Plan Storage

Ask the user: "Where should task plans live for this project?"

1. Markdown file — saved to `.cor/plan.md` in the repo. Tracked by git, survives context resets. Best for team projects or anything long-running.
2. Agent memory — loaded at session start, invisible in the repo. Best for solo, exploratory work.
3. Session tasks — the task panel (if your agent supports it). Resets on new session. Best for short, self-contained tasks.

Wait for the user to choose before continuing.

---

## Step 4 — Write Config

Create `.cor/` if it does not exist. Write `.cor/config.md` with this exact structure (no extra sections):

# COR Config

## Stack

[detected stack, e.g. "TypeScript / Next.js / React"]

## Checks

[one confirmed check command per line, exactly as the user confirmed]

## Plan Storage

[one of: markdown | memory | session]

## Extensions

[comma-separated list from Step 0, e.g. "claude-code, copilot"]

Then confirm: "Setup complete. Config saved to `.cor/config.md`. Use the **cor-think** skill to start thinking about your first task, or **cor-work** to continue an in-progress one."
