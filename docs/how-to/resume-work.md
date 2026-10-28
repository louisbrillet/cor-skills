# How to resume interrupted work

Continue a COR plan after an interrupted session, a context reset, or a crash mid-task.

Prerequisite: `.cor/config.md` exists and a plan has pending tasks.

1. Run `cor-work` (`/cor:work`).
2. If several plans have pending tasks, pick one from the list. The most recently modified plan is pre-selected.
3. Read the `COR Status` block. `cor-work` routes to Code when implementation tasks remain, to Test when only test tasks remain.
4. If `cor-code` finds `.cor/checkpoint.md` with a phase other than `done`, it runs all configured checks:
    - All checks pass: it re-runs the interrupted task from the start.
    - Only lint or format failures: it auto-fixes and resumes.
    - Test failures, compile errors, or dirty files it cannot map to a task: it pauses. Choose re-implement, skip, or investigate manually.
5. If the checkpoint belongs to a different plan than the one you are starting, choose to discard the old checkpoint or switch back to its plan first.

See [Project files](../reference/project-files.md) for the checkpoint format.
