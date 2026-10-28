# The COR workflow

COR separates AI-assisted coding into gated phases because agents write code well but skip the thinking, confirmation, and verification around it.

## A harness, not a methodology

Agents can already write code. What they lack is structure: questions before planning, a confirmed plan before touching code, checks after every task, and state that survives interruption. Frameworks such as BMAD, Speckit, and Superpowers address the same gap. COR aims to be lighter and agent-agnostic, and takes no position on methodology: no TDD mandate and no rigid design phases.

## Why separate phases

Each phase produces something the next one depends on:

- **Think** produces a shared understanding with explicit confidence per area. Planning on LOW confidence creates tasks that encode guesses.
- **Research** (optional) produces cited evidence when the right answer depends on current libraries, versions, or standards that the model may remember wrongly.
- **Plan** produces a standalone task list. It must be executable by an agent with no memory of the conversation, so decisions are recorded with their reasons.
- **Code** consumes one task at a time and must leave all checks passing.
- **Test** runs only what was planned, so testing scope is decided up front, not invented at the end.

Skipping ahead is blocked: `cor-plan` requires config, `cor-code` requires a plan, `cor-work` never jumps to Test while implementation tasks remain.

## Autonomy with narrow pauses

Confirmation is concentrated where it is cheap and valuable: Think answers, the task list, and narrowing decisions in design. During Code, the agent runs without asking. It pauses only when tool output reveals information that changes the approach. Routine lint and test failures are fixed, not escalated, because asking about them costs attention without adding judgment.

## Checks as the definition of done

The user configures check commands once in `cor-setup`. A task is complete only when every check passes. This replaces "looks done" with a verifiable state and makes resumption safe: rerunning the checks tells a fresh session whether the last task finished.

## Optional and experimental branches

`cor-design` and `cor-refacto` add specialized Think and Plan variants for UI exploration and behavior-preserving refactors. `cor-docs` closes the loop by documenting the result. They are marked beta because their structure may still change.

See also: [Skills](../reference/skills.md), [Ship your first change with COR](../tutorials/first-change.md).
