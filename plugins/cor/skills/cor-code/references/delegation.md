# Delegated implementation

Read this when `.cor/config.md` has `## Delegation` set to `enabled` and a subagent tool is available. You stay the orchestrator; a subagent (the worker) writes the code for one task.

## Roles

| Responsibility | Orchestrator (you) | Worker (subagent) |
| --- | --- | --- |
| Resume detection, config, plan, task selection | yes | no |
| `.cor/checkpoint.md`, plan checkboxes, todo tool | yes | never |
| Code and test edits for the task | no | yes |
| Running `Checks` (Step 3) | yes, always | may run them to self-verify |
| Questions to the user, pause policy | yes | never; reports back instead |
| Notes (Step 5) and commit (Step 6) | yes | never |

Subagents usually cannot ask the user questions or update the todo list, and they start without this conversation. Keep everything that needs either with you.

## Model

- `Worker model` is a name: pass it as the subagent tool's model parameter. Do not translate it to another name.
- `Worker model` is `inherit` or missing: do not pass a model.
- The tool has no model parameter, or rejects the name: run the worker without a model and tell the user once per run that the worker used the session model and why. Do not substitute a model of your own choosing.

## Brief

The worker knows nothing you do not tell it. Send one brief per task containing:

1. The task ID and description, verbatim from the plan.
2. The active plan file path, with the instruction to read its Context section first. For `memory` or `session` storage, paste the Context instead.
3. Findings from earlier tasks in this run that the task depends on (new symbols, file paths, decisions).
4. The implementation rules from Step 2 of `SKILL.md`, pasted: the surgical rules, the external dependency gate, and the dependency documentation gate.
5. The check commands from config, stated as available for self-verification.
6. These limits:
   - Implement this task only. Do not start or prepare other tasks.
   - Do not edit `.cor/` files, do not commit, stash, or push, do not touch the todo list.
   - Do not ask the user anything. If a finding would change the approach (see Pause Policy examples), stop and report it instead of deciding.
7. The report to return:
   - `STATUS: DONE` or `STATUS: BLOCKED`
   - files changed
   - what was implemented, and any deviation from the task description with its reason
   - checks run and their result
   - anything notable for future work (gotchas, decisions, setup steps)

## After the worker returns

1. `STATUS: BLOCKED`: apply the Pause Policy yourself with the worker's finding. After the user answers, send a new brief that includes the decision.
2. Inspect `git status` and the diff. Revert or question changes outside the task's scope before going further.
3. Continue with Step 3 and run every check yourself. A worker's report that checks passed is not a passing check.
4. A check fails: send the failing output to the same worker when the tool can resume it, otherwise to a new worker with the original brief plus the failure. After two failed worker attempts, fix the root cause yourself.
5. Use the worker's notable findings as input to Step 5.

## Limits

- One worker per task, one task at a time. Never run workers in parallel: there is one checkpoint and one commit per task.
- A crash during delegation leaves the checkpoint at `phase: implementing`; Step 0 handles it like any other interruption.
- Delegation never relaxes a rule of this skill. Checks, pause policy, notes, and commit behave as without it.
