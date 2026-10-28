# Project files

Files COR skills create or read in your project repository.

| Path | Written by | Read by |
| --- | --- | --- |
| `.cor/config.md` | `cor-setup` | all phase skills |
| `.cor/plan.md`, `.cor/plan_<N>_<slug>.md` | `cor-plan`, `cor-refacto` | `cor-code`, `cor-test`, `cor-work` |
| `.cor/checkpoint.md` | `cor-code` | `cor-code`, `cor-work` |
| `.cor/research_<slug>.md` | `cor-research` | `cor-plan`, `cor-work` |
| `.cor/design-lab/` | `cor-design` | user, `cor-plan` |
| `.cor/scripts/gen-dependency-docs.mjs` | `cor-setup` | `docs:deps` script |
| `.cor/docs.md` | `cor-docs` | `cor-docs` |
| `docs/DEPENDENCIES.md` | `docs:deps` script | `cor-code` |
| `.worktreeinclude` | `cor-setup` | Claude Code, Codex, OpenCode, `post-checkout` hook |
| `CLAUDE.md`, `AGENTS.md`, `.github/copilot-instructions.md`, `.claude/rules/*.md` | `cor-setup`, `cor-code` notes | your agent |

## .cor/config.md

```markdown
# COR Config

## Stack
TypeScript / Next.js / React

## Checks
tsc --noEmit
eslint --fix

## Worktree Support
husky | githooks | disabled

## Plan Storage
markdown | memory | session

## Dependency Documentation
disabled | enabled
Map: docs/DEPENDENCIES.md
Generate: npm run docs:deps

## Extensions
claude-code, copilot
```

| Plan storage | Location |
| --- | --- |
| `markdown` | `.cor/plan.md` or `.cor/plan_<N>_<slug>.md` |
| `memory` | agent memory; Claude Code uses `~/.claude/projects/<project-path>/memory/cor_plan.md` |
| `session` | agent task panel (`TodoWrite` in Claude Code, `todo_write` in Copilot) |

## Plan files

```markdown
# COR Plan — <short title>

## Context
<goal, 1-2 sentences>
### Root cause / current state
### Decisions locked in Think
### Scope
### Invariants
### Acceptance criteria

## Tasks
- [ ] T01: <description>
- [x] T02: <description> [unit]
```

Only the opening Context sentences and Acceptance criteria are required. Merged work is appended as `## Phase <N> — <summary>` with continued task IDs.

## .cor/checkpoint.md

```text
plan: .cor/plan_2_checkout_flow.md
task: T03
phase: implementing
started: 2026-05-12T14:30:00
```

| `phase` | Meaning |
| --- | --- |
| `implementing` | code change in progress |
| `checks` | running configured checks |
| `marking-complete` | checks passed, updating plan |
| `done` | task finished cleanly |

The file is overwritten, never deleted.

## .cor/docs.md

```markdown
# COR Docs Config

## Docs Directory
docs

## Generator
mkdocs | zensical | none
Config: mkdocs.yml | zensical.toml | none

## Audience
<who reads the docs>

## Default Base Branch
main
```

## COR Notes

`cor-code` writes agent-facing notes under a `## COR Notes` section in the instruction file that matches the note scope. Setup notes for humans go to `README.md` instead. Scoping rules: `skills/cor-code/references/instruction-files.md`.
