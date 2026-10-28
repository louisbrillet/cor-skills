# Scripts

Scripts bundled with skills. All run from the repository root of the project they act on.

## validate_skill.py

Path: `skills/authoring-skills/scripts/validate_skill.py`. Python 3, standard library only.

```bash
python skills/authoring-skills/scripts/validate_skill.py <skill-dir> [<skill-dir> ...]
python skills/authoring-skills/scripts/validate_skill.py skills/*/
```

| Level | Checks |
| --- | --- |
| ERROR | missing frontmatter, `name`, or `description`; `name` over 64 chars, invalid characters, reserved word, or not equal to directory; `description` over 1024 chars or containing XML-like tags; `SKILL.md` body over 500 lines; Windows-style paths; no `SKILL.md` |
| WARN | first-person `description`; `description` without a "when" clause; referenced file missing; bundled file never referenced from `SKILL.md`; duplicate file names; reference file over 100 lines without a table of contents |

`evaluations/` is excluded from reachability checks.

Exit codes: `0` no ERROR, `1` at least one ERROR. WARN never fails the run.

## check_docs.py

Path: `skills/cor-docs/scripts/check_docs.py`. Python 3, standard library only.

```bash
python skills/cor-docs/scripts/check_docs.py [--root <repo-root>] [--docs-dir <dir>]
```

| Option | Default |
| --- | --- |
| `--root` | `.` |
| `--docs-dir` | `Docs Directory` in `<root>/.cor/docs.md`, else `docs` |

| Level | Checks |
| --- | --- |
| ERROR | docs directory missing; missing root `index.md`; missing quadrant directory or its `index.md`; broken relative link or image; page missing from `nav` in `mkdocs.yml`, `mkdocs.yaml`, or `zensical.toml`; `nav` entry pointing to a missing file |
| WARN | page outside the four quadrant directories (except `assets/`); page without H1; page not linked from its quadrant `index.md`; tutorial or how-to page without numbered steps |

Links inside fenced code blocks are ignored. Nav checks run only when a config file with a `nav` key exists.

Exit codes: `0` no ERROR, `1` at least one ERROR.

## gen-dependency-docs.mjs

Bundled path: `skills/cor-setup/scripts/gen-dependency-docs.mjs`. Copied by `cor-setup` to `.cor/scripts/gen-dependency-docs.mjs`. Node 18 or later.

```bash
node .cor/scripts/gen-dependency-docs.mjs [path/to/package.json] [--out docs/DEPENDENCIES.md]
```

| Argument | Default |
| --- | --- |
| package manifest | `package.json` |
| `--out` | `docs/DEPENDENCIES.md` |

Covers `dependencies` and `devDependencies`. Version source, in order: `node_modules/<pkg>/package.json`, `package-lock.json` or `npm-shrinkwrap.json`, then the `package.json range`. Output table columns: package, version observed with source, docs entry point (`llms.txt` when found, else homepage), fallback (repository or homepage).

Exit code `1` when the manifest cannot be read or has no dependencies. Network or TLS errors produce a warning on stderr, not a failure.
