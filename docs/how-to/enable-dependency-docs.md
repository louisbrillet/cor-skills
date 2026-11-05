# How to enable dependency documentation

Give agents a committed, version-aware map of official documentation for each direct dependency. Node (`package.json`) and Python (`pyproject.toml` or `requirements.txt`) projects.

1. Run `cor-setup` and answer `Yes (Recommended)` to dependency documentation.
2. Setup copies the generator to `.cor/scripts/`:
    - Node: `gen-dependency-docs.mjs`, plus a `docs:deps` script in `package.json`.
    - Python: `gen-dependency-docs.py`. Setup records a command that runs inside the project environment, e.g. `uv run python .cor/scripts/gen-dependency-docs.py`.
3. Setup runs the script once. It writes `docs/DEPENDENCIES.md`. If git ignores that file, setup asks before adding a `.gitignore` negation.
4. Setup adds a `## Dependency Documentation` section to each configured instruction file (`CLAUDE.md`, `.github/copilot-instructions.md`, `AGENTS.md`).
5. After any direct dependency or lockfile change, regenerate the map:

    ```bash
    npm run docs:deps                                      # Node
    uv run python .cor/scripts/gen-dependency-docs.py      # Python
    ```

    Use `pnpm docs:deps`, `yarn docs:deps`, or `bun run docs:deps` to match your Node lockfile; `poetry run python ...` or `pdm run python ...` for Python. The exact command is stored under `Generate:` in `.cor/config.md`. `cor-code` does this itself when a task changes dependencies.

If generation fails behind a corporate TLS proxy, set `NODE_EXTRA_CA_CERTS` (Node) or `SSL_CERT_FILE` (Python) to your CA bundle. Do not disable TLS verification.
