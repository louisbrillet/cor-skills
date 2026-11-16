# Message style

## Contents

- Derive the convention from the log
- Subject
- Body
- Trailers
- Examples

## Derive the convention from the log

```bash
git --no-pager log --format=%s -10
```

Read these ten subjects and copy three things:

1. **Prefix form** — `feat(scope):` (Conventional Commits), `Area: summary`, or bare sentence. Use whichever dominates. If the log is empty or mixed, default to `Area: summary`.
2. **Language** — French log → French subjects. Do not translate the repo.
3. **Tense** — imperative (`Add`, `Fix`) vs descriptive (`Adds`, `Added`). Match it.

## Subject

- ≤ 72 characters; aim for ≤ 60.
- Names the behavior or outcome, not the files: `Bookmarks: local favorites store and /favoris page`, not `Update client-store.ts and add page.tsx`.
- No trailing period.
- One intent. If "and" joins two unrelated things, the group should have been split.

## Body

Add a body only when the subject cannot carry the why:

- a non-obvious decision (`auto-read on mount replaced by explicit toggle: users scrolled past pages without reading`)
- a migration or breaking change
- a reference to an issue or plan task (`#42`, `.cor/plan.md T3`)

Wrap at 72. Blank line between subject and body. No file lists — `git show --stat` already has them.

## Trailers

Append whatever trailer the environment mandates (for example a `Co-authored-by:` line), after a blank line, last in the message.

## Examples

Good:

```
Course page: explicit 'mark page as done' toggle instead of auto-read on mount
```

```
Docs: Diataxis structure with MkDocs (tutorials, how-to, reference, explanation)

Moves mvp-cadrage.md under explanation/ and adds mkdocs.yml nav.
```

Bad — file list, no intent:

```
Update layout.tsx, page.tsx, client-store.ts
```

Bad — two intents:

```
Add bookmarks and fix chat scroll effect
```
