# State and memory

COR keeps workflow state and learned project knowledge in plain files inside your repository, because visible state is what keeps the developer in control.

## Plain files instead of hidden memory

Plans, checkpoints, research handoffs, and configuration live in `.cor/`. Notes the agent learns go into the instruction files your agent already reads: `CLAUDE.md`, `AGENTS.md`, or Copilot instructions. You can read, edit, diff, and commit all of it. Nothing depends on a service or an opaque memory store. A developer who can see exactly what the agent knows can correct it.

Plan storage is still a choice. `markdown` survives context resets and suits team or long-running work. `memory` and `session` stay out of the repository for solo or short-lived work.

## Crash resilience through a checkpoint

`cor-code` writes `.cor/checkpoint.md` before touching any file and updates its `phase` as the task advances. A new session that finds a phase other than `done` knows exactly which plan and task were interrupted and at which stage. It then reruns the checks to judge the damage instead of trusting the conversation history, which may be gone. Overwriting the file with `phase: done` instead of deleting it keeps the signal unambiguous.

## Notes that accumulate

After each task, `cor-code` records only non-obvious discoveries: hidden constraints, surprising API behavior, decisions and their reasons, mistakes to avoid. Routine tasks produce no note. Over time the instruction files become project-specific memory that every future session loads.

Notes are scoped. A rule that applies to one module goes into a path-scoped file so it does not cost tokens in every session. Agents load scoped files differently, which is why `cor-code` follows a dedicated reference instead of guessing.

## Token cost as a design constraint

Every line in an instruction file or skill is paid on every load. This drives several choices: `token-caveman` compresses responses, skills keep `SKILL.md` under 500 lines and move bulk material to references, and notes are archived or split when they grow.

See also: [Project files](../reference/project-files.md), [How to resume interrupted work](../how-to/resume-work.md).
