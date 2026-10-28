# How to author or audit a skill

Write a new skill in this repository, or check existing ones, against the Agent Skills authoring best practices.

1. Ask your agent to use `authoring-skills`.
2. For a new skill, follow its order: baseline gap, three evaluations in `skills/<name>/evaluations/`, frontmatter, minimum body, progressive disclosure, validation, evaluation run.
3. Validate the skill:

    ```bash
    python skills/authoring-skills/scripts/validate_skill.py skills/<skill-name>
    ```

4. Fix every `ERROR`. For each `WARN`, fix it or state why it is intentional. Re-run until clean.
5. Register the skill in `.claude-plugin/plugin.json` and in the README skills table.
6. To audit the whole collection:

    ```bash
    python skills/authoring-skills/scripts/validate_skill.py skills/*/
    ```

See [Skill format](../reference/skills.md#skill-format) for frontmatter rules.
