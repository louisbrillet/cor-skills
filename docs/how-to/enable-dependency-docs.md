# How to enable dependency documentation

Give agents a committed, version-aware map of official documentation for each direct dependency. Node projects only (`package.json` required).

1. Run `cor-setup` and answer `Yes (Recommended)` to dependency documentation.
2. Setup copies the generator to `.cor/scripts/gen-dependency-docs.mjs` and adds a `docs:deps` script to `package.json`.
3. Setup runs the script once. It writes `docs/DEPENDENCIES.md`. If git ignores that file, setup asks before adding a `.gitignore` negation.
4. Setup adds a `## Dependency Documentation` section to each configured instruction file (`CLAUDE.md`, `.github/copilot-instructions.md`, `AGENTS.md`).
5. After any direct dependency or lockfile change, regenerate the map:

    ```bash
    npm run docs:deps
    ```

    Use `pnpm docs:deps`, `yarn docs:deps`, or `bun run docs:deps` to match your lockfile. `cor-code` does this itself when a task changes dependencies.

If generation fails behind a corporate TLS proxy, set `NODE_EXTRA_CA_CERTS` to your CA bundle. Do not disable TLS verification.
