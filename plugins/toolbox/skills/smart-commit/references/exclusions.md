# Exclusions

## Contents

- Always exclude
- Exclude unless the user names them
- Detecting secrets in content
- Reporting

## Always exclude

| Category        | Typical paths                                                             |
| --------------- | ------------------------------------------------------------------------- |
| Credentials     | `.env`, `.env.*` (except `.env.example`), `*.pem`, `*.key`, `id_rsa*`, `credentials.json`, `*.p12` |
| Build output    | `dist/`, `build/`, `out/`, `.next/`, `target/`, `__pycache__/`, `*.pyc`   |
| Caches / state  | `*.tsbuildinfo`, `.eslintcache`, `.turbo/`, `.cache/`, `coverage/`        |
| Editor / OS     | `.DS_Store`, `Thumbs.db`, `.idea/`, `.vscode/*` (unless already tracked)  |
| Local tooling   | agent session folders, scratch notes, `*.log`                             |

A path already tracked in the repository is not noise by definition — commit changes to it unless it now contains a secret.

## Exclude unless the user names them

- Lockfile changes with no matching manifest change (`pnpm-lock.yaml` without `package.json`).
- Generated agent-rule blocks re-added by tooling (for example the Next.js `AGENTS.md` block) when nothing else in that file changed.
- Large binary or data fixtures the user did not mention.

Ask only if the ambiguity blocks a correct grouping; otherwise leave them out and say so.

## Detecting secrets in content

Grep the staged diff before each commit:

```bash
git --no-pager diff --cached | grep -nE '(sk-[A-Za-z0-9]{20,}|AKIA[0-9A-Z]{16}|ghp_[A-Za-z0-9]{36}|-----BEGIN [A-Z ]*PRIVATE KEY-----|api[_-]?key\s*[:=]\s*["\x27][^"\x27]{12,})'
```

Any hit → unstage that file, report the line, and do not commit it. A placeholder in `.env.example` (`OPENAI_API_KEY=`) is fine; a real-looking value is not.

## Reporting

End the run with one line per excluded path:

```
Excluded: .env (contains OPENAI_API_KEY) — add to .gitignore
Excluded: tsconfig.tsbuildinfo (build cache) — already ignored? no → add `*.tsbuildinfo`
```
