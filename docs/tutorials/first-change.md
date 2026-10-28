# Ship your first change with COR

By the end of this tutorial you will have installed COR, configured a repository, and taken one small change through Think, Plan, Code, and Test.

You need a git repository with code your agent can build or lint, and one supported agent (Claude Code, GitHub Copilot, or Codex). Pick a small change, such as adding an input check to one function.

1. Install the skills from your repository root:

    ```bash
    npx skills add louisbrillet/cor-skills
    ```

    When asked, select at least `cor-setup`, `cor-think`, `cor-plan`, `cor-code`, `cor-test`, and `cor-work`, then select your agent. You should see the skills listed as installed.

2. Ask your agent to run `cor-setup` (in Claude Code: `/cor:setup`). Answer its questions:
    - Select the extensions you use.
    - Accept or edit the proposed check commands.
    - Answer `No, skip` to worktree support and dependency documentation for now.
    - Choose `markdown` plan storage.

    You should see `.cor/config.md` created.

3. Ask your agent to run `cor-think` (`/cor:think`) and describe your change in one sentence. Answer each round of questions. After each round the agent prints an `Understanding so far` summary with a confidence level per area. When every area is HIGH, answer that you want to proceed.

4. Run `cor-plan` (`/cor:plan`). The agent proposes an ordered task list such as `T01`, `T02`, and asks you to confirm. Confirm it. You should see `.cor/plan.md` with one `- [ ]` line per task.

5. Run `cor-code` (`/cor:code`). The agent writes `.cor/checkpoint.md`, implements `T01`, runs every check from `.cor/config.md`, marks the task `- [x]`, and moves to the next task without asking. When it finishes you should see `All tasks complete.` or a prompt to run `cor-test`.

6. If your plan contains tasks tagged `[unit]`, `[integration]`, or `[UAT]`, run `cor-test` (`/cor:test`). For a `[UAT]` task, follow the steps it prints and answer `yes`, `no`, or `partially`.

7. Run `cor-work` (`/cor:work`). You should see a `COR Status` block showing every task complete.

You have completed one full COR cycle. Next:

- Resume interrupted work: [How to resume interrupted work](../how-to/resume-work.md).
- See what each skill reads and writes: [Skills](../reference/skills.md) and [Project files](../reference/project-files.md).
- Understand the phase design: [The COR workflow](../explanation/workflow.md).
