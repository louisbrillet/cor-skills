# How to review a codebase with metrics

Get a refactor plan where every task is backed by a measured finding and judged by the refactor gates.

1. Clone the three measurement tools side by side, outside the repository: `unclebob/crapper`, `unclebob/dryer`, `unclebob/mutator` (mutator reads function names from `../crapper`).
2. Run `cor-review` (`/cor:review`) and name the scope (a package, a layer, or the whole backend).
3. Let it measure. If your package manager has no `pip` in the venv (uv, poetry), it produces the coverage report itself and passes `--use-existing-coverage`; see the skill's `references/measurement-tools.md`.
4. Read the **Review Findings**: metrics table, candidates with file:line evidence, the **Arbitrations** table where a tool and a gate disagreed, and **Out of scope** bugs.
5. Answer the Think questions. Default on conflict: the gate wins and the arbitration is recorded so it is not reopened later.
6. Confirm the task list. Every structural task on under-covered code is preceded by a `[unit]` pinning task.
7. The plan is saved as `.cor/plan_<N>_review_<slug>.md`. Run `cor-code`; after each refactor task it runs the project checks, then the optional gates on touched functions.
