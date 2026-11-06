# How to view artifacts in Copilot

Show `.cor/` plans as a live task board and research reports as a navigable page in a GitHub Copilot canvas panel. Optional, GitHub Copilot only, experimental.

1. Run `cor-setup`, select `GitHub Copilot` among the extensions, and answer `Yes, install` to the artifact canvas question. The default is `No, skip`.
2. Setup copies the extension to `.github/extensions/cor-artifacts/` and records `Artifact Canvas: enabled` in `.cor/config.md`. Commit the folder to share it with your team.
3. Work as usual. When the canvas is enabled and the agent exposes `open_canvas`:
    - `cor-plan` opens the saved plan;
    - `cor-research` opens the saved report;
    - `cor-code` opens the active plan once per session. Checked tasks, the progress bar, and the current checkpoint task update live.
4. To open it yourself, ask the agent: "open the COR artifacts canvas".

The canvas is read-only. Markdown files under `.cor/` stay the source of truth, so plans remain readable in diffs and by other agents.

## Other agents

Claude Code, Codex, and other agents never load `.github/extensions/`. The skills only call the canvas when `open_canvas` is available, so they behave exactly as without it.

## Disable

Delete `.github/extensions/cor-artifacts/` and set `## Artifact Canvas` to `disabled` in `.cor/config.md`.
