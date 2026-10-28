# How to enable worktree support

Copy git-ignored local files (`.env`, local databases, local settings) into every new git worktree automatically.

1. Run `cor-setup` and answer `Yes (Recommended)` to worktree support.
2. Confirm or edit the list of git-ignored files it proposes. Build, dependency, and cache directories are excluded.
3. Setup writes `.worktreeinclude` at the repository root, one `.gitignore`-style pattern per line. Claude Code, Codex, and OpenCode read it natively.
4. For tools that do not read it, setup installs a `post-checkout` hook:
    - Node projects: Husky, with `"prepare": "husky"` in `package.json`. Nothing else to do.
    - Other projects: `.githooks/post-checkout`. Run this once per clone:

    ```bash
    git config core.hooksPath .githooks
    ```

5. Setup verifies the hook with a throwaway worktree, then removes it.
