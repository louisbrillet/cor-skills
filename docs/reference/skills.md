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
| `cor-refacto` | `cor` | Think + Plan | `/cor:cor-refacto` | deprecated |
| `ux-frameworks` | `cor` | Any | - | beta |
| `ui-design-system-principles` | `cor` | Any UI work | - | beta |
| `show-me` | `toolbox` | Any | `/toolbox:show-me` | beta |
| `token-caveman` | `toolbox` | Always | `/toolbox:token-caveman` | stable |
| `authoring-skills` | `toolbox` | Meta | - | stable |
| `feature-map` | `toolbox` | Any | `/toolbox:feature-map` | beta |
| `feature-flag` | `toolbox` | Plan | `/toolbox:feature-flag` | beta |
| `feature-unflag` | `toolbox` | Plan | `/toolbox:feature-unflag` | beta |
| `codebase-map` | `toolbox` | Any | `/toolbox:codebase-map` | beta |
| `smart-commit` | `toolbox` | After Code | `/toolbox:smart-commit` | beta |
| `cap-screen-recording` | `toolbox` | Any | `/toolbox:cap-screen-recording` | beta |

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
| 7 | Delegate implementation to a subagent on another model (opt-in, default no) | `Delegation`, `Worker model` |
| 8 | Plan storage: `markdown`, `memory`, `session` | `Plan Storage` |
| 9 | - | writes `.cor/config.md` |

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

When `Delegation` is `enabled` and the agent has a subagent tool, one subagent on the configured `Worker model` implements each task; the main session still writes the checkpoint, runs every check, marks the task, writes notes, and commits. Falls back to the main session when no subagent tool exists.

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

## feature-map

Builds `docs/feature-map.md`: capabilities, then features with kind, entrypoints (`file:line`), modules per layer, dependencies, tests, flag, and a confidence tag (`EXTRACTED`, `INFERRED`, `AMBIGUOUS`). Overview as a Mermaid `flowchart LR` tree (product, capabilities, features); optional `flowchart` per capability.

| Step | Behavior |
| --- | --- |
| Detect | stacks from manifests; entrypoint kinds per package (`http-route`, `graphql-operation`, `screen`, `command`, `job`, `event`, `task`, `isr`) |
| Harvest | grep signals per framework from `references/entrypoint-patterns.md`; deterministic extractor (dependency-cruiser, pydeps, `go list`) only when already installed |
| Cluster | FSD slice, route prefix, dominant domain module, or package; 4 to 12 capabilities |
| Flags | providers, read sites, aliases, lifecycle stage from `references/flag-detection.md`; never proposes adding a flag |
| Update | diff by feature within capability; manual blocks `<!-- manual -->` preserved; meta comment stores git sha, layers, kinds |

Writes only under `docs/`. Asks at most one question round, on `AMBIGUOUS` items only. Template: `references/map-template.md`.

## feature-flag

Plan-only. Requires `docs/feature-map.md` (or an explicit file and symbol, tagged `INFERRED`). Writes no application code.

| Step | Behavior |
| --- | --- |
| Provider | detection order from `references/providers.md`: existing SDK, home-grown module, env, compile-time; none found -> recommended default per context (OpenFeature + in-memory/env provider, typed config module, Kconfig for firmware) |
| Boundary | entrypoint (not registered when off) > dispatcher (absent response) > internal branch (variants only); one read site per feature |
| Contract | key `<capability>.<feature>`, type, default equal to current behavior, owner, lifetime (`release`, `experiment`, `permission`, `kill-switch`), review date |
| Plan | template `references/plan-template.md`; saved per `Plan Storage`, or `docs/feature-map.plan.md` without `.cor/config.md`; separate file `.cor/plan_<N>_flag_<slug>.md` |

Refuses features tagged `AMBIGUOUS` or sharing an entrypoint; points to `cor-refacto`.

## feature-unflag

Plan-only. Reads the `## Flags` table of `docs/feature-map.md`. Deletes nothing.

| Mode | Result |
| --- | --- |
| `keep-on` | condition removed, on-branch stays, legacy path and off-tests deleted |
| `keep-off` | condition removed, on-branch deleted, feature disabled permanently |
| `delete` | flag, exclusive feature modules, tests, translations, analytics, fixtures removed |
| `dead` | zero read sites: declaration, config, docs, provider cleanup only |

Reference search covers exact key, generated aliases, accessor imports, config, infra, tests, docs (`references/reference-finding.md`). Exclusive module test: absent from every other feature block and no import from outside the feature. Post-removal simplifications mirror stale-flag cleanup (constant conditions, unused imports, empty enums). Persistence is never deleted; a deprecation note is added. The full deletion list is confirmed before the plan is saved. Separate file `.cor/plan_<N>_unflag_<slug>.md`.

## codebase-map

Builds `docs/codebase-map.md` from an import graph.

| Section | Content |
| --- | --- |
| Layers | layer, role, slice and file counts |
| View A | `flowchart` with one `subgraph` per layer, one node per slice; upward imports `classDef bad`, same-layer cross imports `classDef warn`, cycles `classDef cycle` |
| View B | context: internal units and external systems (databases, queues, HTTP APIs) with the package that proved each |
| View C | capability overlay joining `docs/feature-map.md` features to slices; omitted without a feature map |
| Health | per slice: files, fan-in, fan-out, cycles, upward, cross, external, tests |

Layout detection: `fsd`, `layered`, `domain-first`, `go-packages`, `python-packages`, `mixed`. Extractors only when installed (`dependency-cruiser`, `pydeps`, `go list`, `cargo metadata`, steiger for FSD violations); otherwise import grep per language (`references/graph-extraction.md`). Diagrams under 40 nodes; `flowchart` only. Idempotent update with a manual block.

## smart-commit

Turns uncommitted work into a series of atomic commits. Writes nothing but commits.

| Step | Behavior |
| --- | --- |
| Read | `git status`, last 10 commits, `git diff HEAD`; reads the diff of every non-trivial file |
| Triage | excludes secrets, build output, and local noise per `references/exclusions.md`; reports them and proposes `.gitignore` entries |
| Group | one commit per intent: splits by product area, refactor vs behavior change, independent revertability |
| Commit | stages by path or `git add -p`; message follows the repo's log convention per `references/message-style.md` |
| Verify | clean tree except triaged exclusions; reports created commits |

Respects an explicit index when the user asks to commit staged changes. Never uses `git add -A`, `git commit -a`, `--no-verify`, or rewrites pushed commits.

## cap-screen-recording

Records a scripted demo of an application window with the Cap CLI, edits it, and exports it. macOS only; requires Cap Desktop at `/Applications/Cap.app` with screen-recording permission.

| Step | Behavior |
| --- | --- |
| Check | `cap-cli doctor --json` must report `captureReady: true` |
| Stage | clean target window (dedicated Chrome app window for web UIs); `targets --json` gives the window id |
| Record | `record start --window <id>` while a timeline script drives the app (HTTP endpoints, file edits, `osascript`) |
| Edit | `project-config.json` in the `.cap` project: wallpaper background, padding, rounding, shadow, manual zoom segments; raw copy kept |
| Export | `export --quality social` to MP4; optional GIF through Cap or ffmpeg with a palette |
| Verify | frame grid of the raw segment and of the export, viewed before delivery |
| Deliver | opens the project in Cap's editor with `open -a` unless told otherwise |

Output goes to `<project-root>/media/<slug>.cap` with exports beside it. Asks before replacing an existing project and before committing `.cap` projects.

## Skill format

Each skill is a directory under `plugins/<plugin>/skills/` containing `SKILL.md` with YAML frontmatter:

| Field | Rule |
| --- | --- |
| `name` | lowercase letters, numbers, hyphens; max 64 chars; equals directory name; no `anthropic` or `claude` |
| `description` | max 1024 chars; third person; states what and when to use |
| `status` | `stable`, `beta`, or `deprecated` |
| `stability` | `guaranteed` or `experimental` |

Optional subdirectories: `references/`, `scripts/`, `templates/`, `evaluations/`. `SKILL.md` stays under 500 lines and links bundled files one level deep. Plugins are listed in `.claude-plugin/marketplace.json` at the repository root; each plugin directory carries a root `plugin.json` (Agent Plugins 1.0, read by Copilot and VS Code) and a `.claude-plugin/plugin.json` (Claude Code). Skills are discovered from the plugin's `skills/` directory; the marketplace entry also lists them for the `skills` CLI.
