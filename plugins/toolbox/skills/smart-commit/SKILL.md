---
name: smart-commit
description: "Turns uncommitted work into a small series of atomic, well-described git commits: reads the real diff, groups hunks by intent, excludes secrets and build noise, matches the repository's existing message style, and verifies a clean tree. Use when the user says commit, commit this, commit what's been done, commit smartly, split into commits, or asks for a commit message for pending changes."
status: beta
stability: experimental
---

# Smart Commit

Commit by intent, not by file list. One logical change per commit, message in the repo's own voice.

---

## Workflow

```
Commit Progress:
- [ ] Step 1: Read the state
- [ ] Step 2: Triage what must not be committed
- [ ] Step 3: Group changes by intent
- [ ] Step 4: Commit each group
- [ ] Step 5: Verify
```

**Step 1 — Read the state.** Run all three before deciding anything:

```bash
git --no-pager status --short
git --no-pager log --oneline -10
git --no-pager diff HEAD --stat
```

Then read the actual diff of every non-trivial file (`git --no-pager diff HEAD -- <path>`). A stat line is not enough to write a message.

**Step 2 — Triage what must not be committed.** Check the full change list against [references/exclusions.md](references/exclusions.md). Anything matching is left out, reported to the user, and a `.gitignore` entry is proposed if missing. Never commit a file containing a credential even if the user said "commit everything".

**Step 3 — Group changes by intent.** A group is a set of hunks a reviewer would want to read together. Split when any of these are true:

- different product area (feature vs docs vs tooling vs dependency bump)
- one part is a refactor and another is a behavior change
- one part could be reverted independently without breaking the other

Merge when files only make sense together (a component plus the store it reads). Ten unrelated files → several commits. One feature across ten files → one commit.

If the user staged something explicitly ("commit the staged changes"), respect the index: commit exactly what is staged, do not touch the rest. Otherwise reset the index and rebuild it per group.

**Step 4 — Commit each group.** Stage by path (`git add <paths>`), or `git add -p` when one file carries two intents. Never `git add -A` / `git add .`. Write the message with [references/message-style.md](references/message-style.md): subject copies the style of the last ten commits (prefix convention, language, tense), body explains why when the subject cannot. Append the co-author trailer the environment requires, if any.

**Step 5 — Verify.** Do not proceed while this fails:

```bash
git --no-pager status --short   # must be empty, or only the triaged exclusions
git --no-pager log --oneline -N # N = commits just created
```

Report the created commits as the final answer. If a commit landed with the wrong grouping, fix it with `git reset --soft HEAD~1` and redo — before anything is pushed only.

---

## Hard rules

- Read the diff before writing a message.
- No `git add -A`, `git add .`, `git commit -a`.
- No `--no-verify`. If a hook fails, fix the cause or stop and report.
- No amend, rebase, or force-push of commits that already exist on a remote.
- No new files created to "complete" a commit; commit what exists.

## Bundled resources

- [references/exclusions.md](references/exclusions.md) — what to keep out of a commit and how to report it.
- [references/message-style.md](references/message-style.md) — subject/body rules and how to derive the repo's convention from its log.
