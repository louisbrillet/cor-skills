# How to plan a refactor

Produce a refactor plan that keeps behavior identical and rejects changes that do not reduce complexity.

1. Run `cor-refacto` (`/cor:refacto`) and name the code to improve.
2. Let it finish the deep code analysis. It writes exploration findings before asking any question.
3. Answer the Think questions on scope, risks, and constraints.
4. Review the task list. Candidates that fail a refactor gate are marked `REJECTED` with a reason. See [Skills](../reference/skills.md#cor-refacto) for the gates.
5. Choose where to save the plan. A separate file is named `.cor/plan_<N>_refacto_<slug>.md`.
6. Run `cor-code` to implement it. `cor-refacto` does not change code.
