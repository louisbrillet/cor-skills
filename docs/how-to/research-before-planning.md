# How to research before planning

Get an evidence-backed recommendation when the implementation depends on third-party packages, version-specific APIs, external standards, security guidance, or an architecture choice.

Prerequisite: a completed `cor-think` round for the task.

1. Run `cor-research` after `cor-think` and before `cor-plan`. `cor-work` also recommends it when Think left such a question open.
2. Let it inspect your project first: resolved versions from lockfiles, runtime, and existing primitives.
3. Review the handoff it saves as `.cor/research_<slug>.md`. It contains a decision summary, project evidence, options considered, plan inputs, unresolved questions, and sources.
4. Run `cor-plan`. It reads matching `research_*.md` files. If several match, choose which one applies.

`cor-research` does not write code or plan tasks.
