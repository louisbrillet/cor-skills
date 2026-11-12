# How to author or audit a skill

Write a new skill in this repository, or check existing ones, against the Agent Skills authoring best practices.

1. Ask your agent to use `authoring-skills`.
2. For a new skill, follow its order: baseline gap, three evaluations in `plugins/<plugin>/skills/<name>/evaluations/`, frontmatter, minimum body, progressive disclosure, validation, evaluation run.
3. Validate the skill:

    ```bash
    python plugins/toolbox/skills/authoring-skills/scripts/validate_skill.py plugins/<plugin>/skills/<skill-name>
    ```

4. Fix every `ERROR`. For each `WARN`, fix it or state why it is intentional. Re-run until clean.
5. Pick the plugin: `toolbox` by default, `cor` only if the skill reads or writes `.cor/` or is referenced by a `cor` skill. Add it to that plugin's `skills[]` entry in `.claude-plugin/marketplace.json`, to the README skills table, and to [Skills](../reference/skills.md).
6. To audit the whole collection:

    ```bash
    python plugins/toolbox/skills/authoring-skills/scripts/validate_skill.py plugins/*/skills/*/
    ```

See [Skill format](../reference/skills.md#skill-format) for frontmatter rules.
