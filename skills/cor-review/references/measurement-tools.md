# Measurement pass: crapper, dryer, mutator

## Contents

- What each tool measures
- Install once, next to the project
- Produce coverage the tools can read
- Run the pass
- Read the output
- Record the pass in `.cor/config.md`
- Known pitfalls

## What each tool measures

| Tool | Measures | Threshold the skill uses | Repo |
| --- | --- | --- | --- |
| crapper | CRAP = CC² × (1 − coverage)³ + CC, per function | candidate when CRAP ≥ 10 | `unclebob/crapper` |
| dryer | structural similarity between functions, 0..1 | candidate when score ≥ 0.8 | `unclebob/dryer` |
| mutator | mutation testing: killed / survived / uncovered per function | validation: 0 survivors on touched files | `unclebob/mutator` |

All three detect Python, TypeScript/JavaScript, Go, Java, Rust and Clojure per file. They skip `test`, `spec`, `vendor`, `node_modules`, `target`. Each writes `.metrics/` in the project root; add `.metrics/` and `target/` to `.gitignore`.

A threshold marks a **candidate**. The simplification gates in SKILL.md decide. A flat dispatch over 10 stays as a structure, whatever its coverage (missing coverage becomes a `[unit]` task); a 4-line duplication at 1.0 with two occurrences stays.

## Install once, next to the project

mutator needs crapper checked out as `../crapper` relative to itself. Clone the three side by side, outside the project tree:

```bash
TOOLS=~/.cor-tools   # any directory outside the repo
mkdir -p "$TOOLS" && cd "$TOOLS"
for r in crapper dryer mutator; do [ -d $r ] || git clone --depth 1 https://github.com/unclebob/$r; done
```

The first run of each `./<tool>` script creates its own `.venv`; nothing is installed into the project.

## Produce coverage the tools can read

crapper tries to run the project's tests itself and installs `coverage` with `pip`. In a `uv` or `poetry` venv there is no `pip`, so that fails and coverage scores 0 %. Produce the LCOV report yourself and pass `--use-existing-coverage`.

Python with uv, report path crapper expects:

```bash
mkdir -p target/coverage/python
uv run --with coverage coverage run --data-file=target/coverage/python/.coverage --source=<package> -m pytest -q
uv run --with coverage coverage lcov --data-file=target/coverage/python/.coverage -o target/coverage/python/lcov.info
```

Other stacks: write `target/coverage/<language>/lcov.info` (`typescript`, `go`, `rust`, `java`) with the stack's coverage tool, or let crapper run the tests when its installer works in that environment.

## Run the pass

From the project root:

```bash
"$TOOLS"/crapper/crapper --use-existing-coverage <src-dir>        # table, worst first
"$TOOLS"/dryer/dryer --threshold 0.8 <src-dir>                     # pairs at or above 0.8
"$TOOLS"/mutator/mutator --use-existing-coverage --test-command "<fast test command>" <src-dir>/<file>
```

mutator runs the test command once per mutant. Point it at one file and at the fastest test command that still covers that file, for example `uv run pytest -q -x tests`. To also mutate lines the coverage report says are uncovered, add `--no-coverage`; to rerun killed mutants, add `--mutate-all`.

Expected cost on a 2 000-statement Python package with a 3 s test suite: crapper + dryer under a minute, mutator one to three minutes per file.

## Read the output

crapper columns: `Function  Namespace  CC  Cov%  CRAP`. Namespace is `module.Class` or `module`. Nested functions count inside their parent.

dryer output: `DUPLICATE score=1.00` followed by two `file:start-end` ranges. Score is shape, not meaning: renamed locals and different called functions still score 1.0 if the structure matches.

mutator table: `Killed  Survived  Uncovered  Sites  Score`. `Uncovered` means no test executes the line, so no mutant was run there. A survivor line is printed as `SURVIVED file:line <mutation>`; read that line of code and decide: write the missing test, or the line is dead and the code goes.

## Record the pass in `.cor/config.md`

Under `## Checks`, below the project checks, add a sub-section so cor-code can run it after refactor tasks:

```markdown
### Optional quality gates (cor-review)

Tools in $TOOLS (crapper, dryer, mutator). Run after a refactor task, not on every check.

mkdir -p target/coverage/python && uv run --with coverage coverage run --data-file=target/coverage/python/.coverage --source=<package> -m pytest -q
uv run --with coverage coverage lcov --data-file=target/coverage/python/.coverage -o target/coverage/python/lcov.info
$TOOLS/crapper/crapper --use-existing-coverage <src-dir>          # touched functions < 10
$TOOLS/dryer/dryer --threshold 0.8 <src-dir>                       # no new pair; assumed exceptions listed in the plan
$TOOLS/mutator/mutator --use-existing-coverage --test-command "<test command>" <src-dir>/<file>.py   # 0 survivors
```

## Known pitfalls

- `pip` missing in the venv: crapper's auto-install fails silently to 0 % coverage. Use `--use-existing-coverage`.
- Coverage report path must match crapper's layout (`target/coverage/<language>/lcov.info`), or it reports 0 %.
- mutator without `../crapper` exits: it reads function names from crapper.
- A survivor on an unreachable guard is not a missing test. It signals a state that cannot happen; removing the guard, or making the state unrepresentable, kills it.
- Do not commit `.metrics/` or `target/`; keep raw reports with the plan only as numbers in the Review Findings table.
- The config section may already exist under another name (for example from a manual ub-mode setup). Rewrite it under the `### Optional quality gates (cor-review)` heading rather than adding a second block.
