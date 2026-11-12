# Skills

Every skill shipped under `plugins/<plugin>/skills/`, with its plugin, invocation, inputs, outputs, and stability.

## Overview

Two plugins. `cor` is the workflow and everything that reads or writes `.cor/`. `toolbox` holds standalone helpers with no dependency on the workflow. A new skill goes to `toolbox` unless it reads or writes `.cor/` or is referenced by a `cor` skill.

| Skill | Plugin | Phase | Slash command | Status |
| --- | --- | --- | --- | --- |
| `cor-setup` | `cor` | Init | `/cor:cor-setup` | stable |
| `cor-think` | `cor` | 1 - Think | `/cor:cor-think` | stable |
| `cor-research` | `cor` | Optional, between Think and Plan | - | stable |
| `cor-plan` | `cor` | 2 - Plan | `/cor:cor-plan` | stable |
| `cor-code` | `cor` | 3 - Code | `/cor:cor-code [task-id]` | stable |
| `cor-test` | `cor` | 4 - Test | `/cor:cor-test` | stable |
| `cor-work` | `cor` | Any (router) | `/cor:cor-work` | stable |
| `cor-review` | `cor` | Measure + Think + Plan | `/cor:cor-review` | stable |
| `cor-docs` | `cor` | After Code | `/cor:cor-docs` | stable |
| `cor-design` | `cor` | Before Plan | `/cor:cor-design` | beta |
| `cor-refacto` | `cor` | Think + Plan | `/cor:cor-refacto` | beta |
| `ux-frameworks` | `cor` | Any | - | beta |
| `ui-design-system-principles` | `cor` | Any UI work | - | beta |
| `show-me` | `toolbox` | Any | `/toolbox:show-me` | beta |
| `token-caveman` | `toolbox` | Always | `/toolbox:token-caveman` | stable |
| `authoring-skills` | `toolbox` | Meta | - | stable |

Slash commands are `/<plugin>:<skill>` when installed as a plugin (Claude Code, Copilot CLI). Skills installed with `npx skills` are invoked by skill name. Status comes from the `status` frontmatter field. `beta` skills declare `stability: experimental` and may change without backward compatibility.

## cor-setup

Runs once per repository. Requires nothing.

| Step | Question | Result |
| --- | --- | --- |
| 0 | Extensions in use (multi-select: Claude Code, GitHub Copilot, Codex, Other) | `Extensions` |
| 1 | - (detects stack from `package.json`, `tsconfig.json`, `Gemfile`, ...) | `Stack` |
| 2 | Confirm check commands | `Checks` |
| 3 | Worktree support | `.worktreeinclude`, `post-checkout` hook |
| 4 | Dependency documentation (Node and Python) | `docs/DEPENDENCIES.md`, generation command (`docs:deps` script for Node) |
| 5 | Artifact canvas (only if GitHub Copilot selected; opt-in, default no) | `.github/extensions/cor-artifacts/`, `Artifact Canvas` |
| 6 | Auto commit per task (default yes) | `Auto Commit` |
| 7 | Plan storage: `markdown`, `memory`, `session` | `Plan Storage` |
| 8 | - | writes `.cor/config.md` |

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

Per task: write checkpoint, implement, run every check, mark complete, write notes, commit (when `Auto Commit` is `auto`: one Conventional Commits commit per task, including the plan and checkpoint), continue to next task without confirmation.

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

## cor-review

Order: measure, read, Review Findings, Think, Plan. Writes no code. Shares the cor-refacto gates and adds one: **Pin before change** (a `[unit]` task precedes any structural task on code under 80 % covered).

Measurement pass (tools from `unclebob/crapper`, `unclebob/dryer`, `unclebob/mutator`):

| Tool | Candidate when | Plan validation |
| --- | --- | --- |
| crapper | CRAP ≥ 10 | touched functions < 10 unless arbitrated |
| dryer | similarity ≥ 0.8 | no new pair; assumed exceptions listed |
| mutator | survivor or uncovered site | 0 survivors on touched files |

A threshold marks a candidate; the gates decide. Conflicts are recorded in an **Arbitrations** table so later runs do not reopen them. Bugs found during review go under **Out of scope**.

Writes the measurement commands into `.cor/config.md` under `### Optional quality gates (cor-review)`; `cor-code` runs them after implementation tasks of a review plan.

Separate plan file name: `.cor/plan_<N>_review_<slug>.md`.

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

## show-me

User-invoked only (`disable-model-invocation: true`). Reads the relevant code, then answers with the smallest fitting view: pseudocode, call tree, component tree, file tree, Mermaid (sequence, state, flowchart, ER), diff sketch, full block, or a single self-contained HTML artifact. HTML artifacts go to `.cor/show-me/<slug>.html` when `.cor/` exists, else `./show-me-<slug>.html`. Max three views per answer; names must exist in the repository.

## Skill format

Each skill is a directory under `plugins/<plugin>/skills/` containing `SKILL.md` with YAML frontmatter:

| Field | Rule |
| --- | --- |
| `name` | lowercase letters, numbers, hyphens; max 64 chars; equals directory name; no `anthropic` or `claude` |
| `description` | max 1024 chars; third person; states what and when to use |
| `status` | `stable` or `beta` |
| `stability` | `guaranteed` or `experimental` |

Optional subdirectories: `references/`, `scripts/`, `templates/`, `evaluations/`. `SKILL.md` stays under 500 lines and links bundled files one level deep. Plugins are listed in `.claude-plugin/marketplace.json` at the repository root; each plugin directory carries a root `plugin.json` (Agent Plugins 1.0, read by Copilot and VS Code) and a `.claude-plugin/plugin.json` (Claude Code). Skills are discovered from the plugin's `skills/` directory; the marketplace entry also lists them for the `skills` CLI.
