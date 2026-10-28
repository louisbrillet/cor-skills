# How to document a branch

Update the project's Diataxis documentation from the changes on a branch. `cor-docs` is experimental.

1. Run `cor-docs` (`/cor:docs`) with the base branch, for example "document `feat/export` against `main`". The head branch defaults to the current branch; the docs directory defaults to `docs`.
2. If the docs directory does not exist, choose a generator: `mkdocs.yml` (recommended, also read by Zensical), `zensical.toml`, or none. Setup creates the four quadrant directories and `.cor/docs.md`.
3. Review the impact map. Each quadrant is marked create, update, remove, or none, with a reason and evidence.
4. Answer the questions it asks about changes whose purpose the code does not show. If you decline, it documents only the facts it can read from the code.
5. Check the report and preview the site:

    ```bash
    mkdocs serve
    ```

See [Scripts](../reference/scripts.md#check_docspy) for the docs check.
