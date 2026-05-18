# COR Skills

**CodingOnRails** — a methodological skill harness for AI coding agents.

Think before you plan. Plan before you code. Code until it's clean. Test only what you said you would.

## Design

Agents can already write code. What they lack is a harness: structured thinking before planning, a confirmed plan before touching code, checks after every task, recoverable state when interrupted. Great frameworks exist for this — BMAD, Speckit, Superpowers. COR is just a different take: lighter, agent-agnostic, token-lean, and unopinionated on methodology. No TDD mandate, no rigid design phases — just the structure I actually want when I code.

There is also a meta dimension: the harness remembers. After each task, COR writes discovered gotchas and best practices back to your native instruction file — `CLAUDE.md`, `AGENTS.md`, Copilot instructions — whatever your agent already reads. Plain text, in your repo, yours to read and edit. No hidden memory, no black-box state. That transparency is deliberate: a developer who can see exactly what the agent knows stays in control, and that control is the foundation of good DX.

- **Agent-native** — Claude Code, GitHub Copilot, Codex. Detects available tools at startup; adapts task tracking, question style, and plan storage per agent.
- **Crash-resilient** — checkpoint written before any file is touched. Survives mid-task interruptions and context resets; resumes exactly where it stopped.
- **Lightweight** — six skills, no added infrastructure. Structured workflow, not rigid one. No opinions on your stack, tooling, or memory setup.
- **Adaptable** — stack-detected defaults you override at setup. Plan storage (markdown / memory / session) is your choice.
- **Transparent** — gotchas and best practices written to your native instruction file after each task. Plain text you own; nothing hidden.
- **Token-efficient** — `token-caveman` ships with COR; cuts ~75% response verbosity without losing technical content.

## Install

```bash
npx skills add louisbrillet/cor-skills
```

The `skills` CLI will ask which skills and which agents to install to. Supports multi-select for both. Works with GitHub Copilot, Codex, Claude Code, Cursor, and [50+ other agents](https://github.com/vercel-labs/skills#supported-agents).

## Skills

| Skill           | Phase     | What it does                                                                                                        |
| --------------- | --------- | ------------------------------------------------------------------------------------------------------------------- |
| `cor-setup`     | Init      | Detects your stack, configures check commands, sets plan storage                                                    |
| `cor-think`     | 1 — Think | Interrogates you with targeted questions, ends with a confidence summary                                            |
| `cor-plan`      | 2 — Plan  | Breaks the work into an ordered task list, saved to your chosen storage                                             |
| `cor-code`      | 3 — Code  | Implements tasks autonomously, running all checks after each; pauses only when new information changes the approach |
| `cor-test`      | 4 — Test  | Runs only the tests that were planned — unit, integration, or UAT                                                   |
| `cor-work`      | Any       | Entry point: reads plan state and routes to the right phase automatically                                           |
| `token-caveman` | Always    | Ultra-compressed response mode — cuts token usage ~75% by dropping filler while preserving technical accuracy       |

## How it works

COR separates AI coding into four distinct phases. You move through them in order; the agent does not skip ahead.

**Think** — Before any code is considered, the agent asks you structured questions across five areas: problem definition, scope, constraints, risks, and acceptance criteria. After each round of questions it produces a confidence summary (HIGH / MEDIUM / LOW per area). You decide when confidence is high enough to move on.

**Plan** — The agent takes everything surfaced in Think and breaks it into an ordered, dependency-respecting task list. Test tasks are tagged explicitly (`[unit]`, `[integration]`, `[UAT]`). You review and confirm the breakdown before it's saved. Nothing is saved until you agree.

**Code** — The agent implements one task at a time without stopping for confirmation. After each task it runs every check command you configured (type-checking, linting, tests). If a check fails it fixes the root cause and re-runs — it never marks a task complete while checks are failing. Between tasks it writes notes to your agent instruction file (`CLAUDE.md`, `AGENTS.md`, or Copilot instructions) when something non-obvious was discovered.

**Test** — Works through any tasks tagged as tests. Unit and integration tests run the commands from your config. UAT tasks present the acceptance criteria and ask you to confirm manually.

## Workflow

**First time in a repo:**

Invoke `cor-setup`. It scans `package.json`, `tsconfig.json`, `Gemfile`, etc. and proposes the right check commands for your stack. You confirm, adjust, and pick where plans are stored.

**Starting a new task:**

Invoke `cor-think` — the agent asks you questions and produces a confidence summary after each round. When confidence is HIGH across all areas, you move on.

Invoke `cor-plan` — takes the thinking output and breaks it into an ordered task list. You confirm the breakdown before it's saved.

Invoke `cor-code` — picks up the first pending task and runs autonomously through the list: implement, run checks, fix failures, mark complete, repeat. It only pauses when a tool or command output reveals something that would materially change the approach (for example: a migration reveals the table already exists with a conflicting schema). Routine linter and test failures are fixed silently.

Invoke `cor-test` — works through any tasks tagged as tests.

**Resuming mid-session:**

Invoke `cor-work` — reads the plan, figures out where you are, and picks up from there. Works across sessions; if the agent was interrupted mid-task it detects the checkpoint and recovers cleanly.

## Plan storage

During `cor-setup` you choose where task plans live:

- **Markdown** — `.cor/plan.md` in the repo. Tracked by git, survives context resets. Best for team projects or anything long-running.
- **Memory** — the agent's memory system. Loaded at session start, invisible in the repo. Best for solo, exploratory work.
- **Session** — the agent's task panel (if supported). Resets on new session, best for short-lived work.

If you have multiple active plans (for example, two features in flight simultaneously), COR saves them as `plan_1_auth_flow.md`, `plan_2_checkout_flow.md`, etc. `cor-code` and `cor-work` list all plans with pending tasks and ask which one to work on.

## Crash recovery

`cor-code` writes a `.cor/checkpoint.md` file before touching any code. It records the active plan path, the current task ID, and the phase (`implementing`, `checks`, or `marking-complete`). When the skill starts it checks for this file. If found and the phase is not `done`, it runs all configured checks to assess the situation and either resumes automatically or surfaces the state to you. When a task finishes cleanly the checkpoint is overwritten with `phase: done` — no file deletion needed.

If a checkpoint from a different plan is detected when starting work, `cor-code` pauses and asks whether to discard it or switch back to the interrupted plan first.

## Notes

After completing each task, `cor-code` assesses what was discovered and appends a note to your agent instruction file if anything non-obvious happened: hidden constraints, surprising API behavior, architectural decisions, errors to avoid, or setup steps a future developer needs. Nothing is written if the task was routine. Notes accumulate as the project grows, building up a project-specific memory for the agent.

## Stack support

`cor-setup` detects your stack and proposes sensible check defaults:

| Stack                        | Default checks                               |
| ---------------------------- | -------------------------------------------- |
| TypeScript + ESLint + Vitest | `tsc --noEmit`, `eslint --fix`, `vitest run` |
| TypeScript + Biome           | `tsc --noEmit`, `biome check --apply`        |
| Ruby on Rails                | `rubocop -a`                                 |
| Python                       | `ruff check --fix`, `mypy`                   |
| Go                           | `go vet ./...`, `go build ./...`             |
| Rust                         | `cargo check`, `cargo clippy`                |

You can remove, modify, or add any command at setup time, or re-run `cor-setup` anytime.

## Agent support

COR adapts its behaviour to the agent running it:

| Agent          | Task tracking              | Questions                           |
| -------------- | -------------------------- | ----------------------------------- |
| Claude Code    | `TodoWrite`                | `AskUserQuestion` (multiple choice) |
| GitHub Copilot | `todo_write` / `todo_read` | `vscode_askQuestions`               |
| Codex / other  | `.cor/plan.md` directly    | Inline numbered list                |

All phases work across all three environments. The agent detects which tools are available at startup and uses the right ones throughout the session.

## License

MIT
