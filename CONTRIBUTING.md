# Contributing to COR Skills

COR Skills is a personal project, maintained by one person in their spare time. It is shared in the hope it is useful, and it stays opinionated.

What that means for contributions:

- **Issues are welcome.** Bug reports, feature requests and skill proposals all help.
- **Pull requests may not be reviewed.** There is no guaranteed response time, and a pull request can be closed if it does not fit the direction of the project. This is not a judgment on its quality.
- **Forks are encouraged.** The [Apache-2.0 license](LICENSE) lets you adapt the skills to your own workflow.

Participation is governed by the [Code of Conduct](CODE_OF_CONDUCT.md).

## Where to go

| You want to | Go to |
|---|---|
| Ask a question or share an idea | [Discussions](https://github.com/louisbrillet/cor-skills/discussions) |
| Report a bug | [Bug report](https://github.com/louisbrillet/cor-skills/issues/new?template=bug_report.yml) |
| Suggest a change to an existing skill | [Feature request](https://github.com/louisbrillet/cor-skills/issues/new?template=feature_request.yml) |
| Propose a new skill | [Skill proposal](https://github.com/louisbrillet/cor-skills/issues/new?template=skill_proposal.yml) |
| Report a vulnerability | [Security policy](SECURITY.md) |

Search existing issues and discussions before opening a new one.

## Pull requests

Open an issue first and wait for a reply before investing time. Typo and broken-link fixes can go straight to a pull request.

If you do open one:

1. Keep it to one change.
2. For any skill change, follow [How to author a skill](docs/how-to/author-a-skill.md) and run the validator:

    ```bash
    python plugins/toolbox/skills/authoring-skills/scripts/validate_skill.py plugins/*/skills/*/
    ```

    `ERROR` findings must be fixed. Explain each remaining `WARN` in the pull request.
3. When adding, renaming or removing a skill, update the plugin manifests, [README.md](README.md) and [docs/reference/skills.md](docs/reference/skills.md).
4. Update the documentation in [docs/](docs/index.md) that your change affects. Preview with `pip install mkdocs && mkdocs serve`.
5. Write commits as [Conventional Commits](https://www.conventionalcommits.org/), with the skill or area as scope: `feat(cor-plan): ...`, `fix(toolbox): ...`, `docs: ...`.

## Licensing of contributions

Contributions are licensed under [Apache-2.0](LICENSE), the license of the project, as set out in section 5 of that license.
