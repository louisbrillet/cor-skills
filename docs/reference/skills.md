# Skills

Every skill shipped in `skills/`, with its invocation, inputs, outputs, and stability.

## Overview

| Skill | Phase | Claude Code command | Status |
| --- | --- | --- | --- |
| `cor-setup` | Init | `/cor:setup` | stable |
| `cor-think` | 1 - Think | `/cor:think` | stable |
| `cor-research` | Optional, between Think and Plan | - | stable |
| `cor-plan` | 2 - Plan | `/cor:plan` | stable |
| `cor-code` | 3 - Code | `/cor:code [task-id]` | stable |
| `cor-test` | 4 - Test | `/cor:test` | stable |
| `cor-work` | Any (router) | `/cor:work` | stable |
| `token-caveman` | Always | `/token:caveman` | stable |
| `authoring-skills` | Meta | - | stable |
| `cor-design` | Before Plan | `/cor:design` | beta |
| `cor-refacto` | Think + Plan | `/cor:refacto` | beta |
| `cor-docs` | After Code | `/cor:docs` | beta |
| `ux-frameworks` | Any | - | beta |
| `ui-design-system-principles` | Any UI work | - | beta |

Status comes from the `status` frontmatter field. `beta` skills declare `stability: experimental` and may change without backward compatibility.

## cor-setup

Runs once per repository. Requires nothing.

| Step | Question | Result |
| --- | --- | --- |
| 0 | Extensions in use (multi-select: Claude Code, GitHub Copilot, Codex, Other) | `Extensions` |
| 1 | - (detects stack from `package.json`, `tsconfig.json`, `Gemfile`, ...) | `Stack` |
| 2 | Confirm check commands | `Checks` |
| 3 | Worktree support | `.worktreeinclude`, `post-checkout` hook |
| 4 | Dependency documentation (Node only) | `docs/DEPENDENCIES.md`, `docs:deps` script |
| 5 | Plan storage: `markdown`, `memory`, `session` | `Plan Storage` |
| 6 | - | writes `.cor/config.md` |

Default checks by stack:

| Stack | Default checks |
| --- | --- |
| TypeScript + ESLint + Vitest | `tsc --noEmit`, `eslint --fix`, `vitest run` |
| TypeScript + Biome | `tsc --noEmit`, `biome check --apply` |
| Ruby on Rails | `rubocop -a` |
| Python | `ruff check --fix`, `mypy` |
| Go | `go vet ./...`, `go build ./...` |
| Rust | `cargo check`, `cargo clippy` |

## cor-think

Interrogates the user in rounds of 2 to 4 questions across five areas: problem definition, context and scope, constraints, unknowns and risks, acceptance criteria. Every question is multiple choice with a recommended option.

Output after each round: an `Understanding so far` block with HIGH, MEDIUM, or LOW confidence per area and a `Still unclear` list. Writes no files.

## cor-research

Inputs: Think context, project manifests and lockfiles.

Output: `.cor/research_<slug>.md` with sections `Decision summary`, `Project evidence`, `Findings`, `Options considered`, `Plan inputs`, `Unresolved questions`, `Sources`. Asks before overwriting an existing file. Writes no code and no plan tasks.

## cor-plan

Requires `.cor/config.md`. Reads Think context and matching `.cor/research_*.md`.

Output: an ordered task list `T01`, `T02`, ... confirmed by the user, saved per `Plan Storage`. Test tasks carry a tag:

| Tag | Meaning |
| --- | --- |
| `[unit]` | unit tests to write or update |
| `[integration]` | integration tests to write or update |
| `[UAT]` | user acceptance test walked through manually |

When plans already exist, offers: merge as a new phase, overwrite (only if untouched), or create a separate file.

## cor-code

Requires `.cor/config.md` and a plan. Optional argument: task ID.

Per task: write checkpoint, implement, run every check, mark complete, write notes, continue to next task without confirmation.

Pauses only when tool output reveals information that changes the approach (for example a conflicting existing schema, a version conflict, or a duplicate implementation). Does not pause for lint or test failures; it fixes them.

Gates before implementing against a third-party API: resolve version from lockfile, inspect version-matched APIs, search existing usages, prefer native primitives. Reads `docs/DEPENDENCIES.md` when present.

## cor-test

Runs only tasks tagged `[unit]`, `[integration]`, or `[UAT]`. Uses test commands from `Checks`; asks for one if missing. `[UAT]` tasks print manual steps and ask `yes`, `no`, or `partially`. A failed UAT creates a follow-up task.

## cor-work

Router. Requires `.cor/config.md`. Reads plans and `research_*.md`, prints a `COR Status` block, then hands off:

| State | Routes to |
| --- | --- |
| No config | `cor-setup` |
| No plan, no completed Think | `cor-think` |
| No plan, Think done, evidence-sensitive question open | recommends `cor-research` |
| No plan, Think or Research done | `cor-plan` |
| Pending implementation tasks | `cor-code` |
| Only pending test tasks | `cor-test` |
| All tasks done | reports done |

## token-caveman

Response style that drops articles, filler, and pleasantries while keeping technical terms, code, and error messages exact. Switches back to full sentences for security warnings, irreversible actions, and order-sensitive steps.

## authoring-skills

Two workflows, author and audit, both ending with `scripts/validate_skill.py` passing. Bundles `references/checklist.md`, `references/patterns.md`, `references/evaluations.md`. See [Scripts](scripts.md#validate_skillpy).

## cor-design

Fixed phase order: Audit, Brief, Variant Generation, Scoring, Narrowing, Hand-off.

| Input | Values |
| --- | --- |
| Design context | `greenfield`, `brownfield` |
| Target scope | `shell`, `core screen`, both |
| Constraints | accessibility, timeline, non-goals |
| Iteration mode | `manual` (default), `auto` |

Outputs: three variants in `.cor/design-lab/`, a scorecard, a decision log, and a hand-off for `cor-plan`. Templates: `templates/ui-style-lab.html`, `templates/scorecard-template.md`, `templates/decision-log-template.md`, `templates/handoff-template.md`.

## cor-refacto

Order: deep code analysis, Think, Plan. Writes no code.

Refactor gates; a candidate failing one is marked `REJECTED`:

| Gate | Rule |
| --- | --- |
| KISS | reject if understanding cost increases |
| YAGNI | no speculative extension points |
| Rule of Three | do not unify on first or second occurrence |
| Least Surprise | naming and behavior contracts align |
| No behavior drift | output, side effects, order, state transitions identical |
| No coupling hubs | no `utils`, `helpers`, `common` buckets |
| No mixed intent | no feature work mixed with refactoring |

Separate plan file name: `.cor/plan_<N>_refacto_<slug>.md`.

## cor-docs

| Parameter | Required | Default |
| --- | --- | --- |
| `base` | yes | asked; suggests `Default Base Branch` from `.cor/docs.md`, else `main` |
| `head` | no | current branch |
| `docs-dir` | no | `Docs Directory` from `.cor/docs.md`, else `docs` |

Diffs `<base>...<head>` (from the merge base). Writes only in the docs directory, `mkdocs.yml` or `zensical.toml`, and `.cor/docs.md`. Validates with [check_docs.py](scripts.md#check_docspy).

## ux-frameworks

Applies Nielsen's heuristics, Garrett's Five Planes, Gestalt/PARC, Morville's Honeycomb, and Yablonski's Laws of UX. Bundles one reference file per framework plus `references/audit-template.md`.

## ui-design-system-principles

Design tokens, color, typography, spacing, layout, components, charts, and accessibility rules for frontend output. Acts as scoring authority for `cor-design`. Bundles `references/tailwind-shadcn.md`.

## Skill format

Each skill is a directory under `skills/` containing `SKILL.md` with YAML frontmatter:

| Field | Rule |
| --- | --- |
| `name` | lowercase letters, numbers, hyphens; max 64 chars; equals directory name; no `anthropic` or `claude` |
| `description` | max 1024 chars; third person; states what and when to use |
| `status` | `stable` or `beta` |
| `stability` | `guaranteed` or `experimental` |

Optional subdirectories: `references/`, `scripts/`, `templates/`, `evaluations/`. `SKILL.md` stays under 500 lines and links bundled files one level deep. Skills are registered in `.claude-plugin/plugin.json`.
