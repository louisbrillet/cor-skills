---
name: cap-screen-recording
description: Record, edit (background, rounded corners, zooms) and export polished screen-recording demos (MP4/GIF) on macOS with the Cap CLI, then open the result in Cap's editor. Use when the user asks to record a demo, screencast, README GIF, or product video.
status: beta
stability: experimental
---

# Cap CLI: screen recording demos

Cap Desktop is installed at `/Applications/Cap.app` (Homebrew cask `cap`). Its agent-oriented CLI:

```bash
C=/Applications/Cap.app/Contents/MacOS/cap-cli
```

Add `--json` to any command for machine-readable output. `$C guide --json` prints the full capability/schema manifest. The `cap` shim may not be on PATH; use the absolute path.

## Output location

Save the `.cap` project and its exports in a media folder at the **root of the current project**: `<project-root>/media/` by default (`git rev-parse --show-toplevel`, or the working directory outside git). Use another folder only when the user names one. Never leave the deliverable `.cap` in `/tmp`; only scratch files (frame PNGs, timeline script, Chrome profile) go there.

```bash
ROOT=$(git rev-parse --show-toplevel 2>/dev/null || pwd); M="$ROOT/media"; mkdir -p "$M"
SLUG=<short-kebab-name>   # e.g. artifact-canvas-demo
# project: $M/$SLUG.cap   raw copy: $M/$SLUG-raw.cap   exports: $M/$SLUG.mp4 (+ .gif)
```

If `$M/$SLUG.cap` exists, ask before replacing or pick a new slug (`--path` must not exist). `.cap` projects are large (raw segments); ask before committing them, and suggest a `.gitignore` entry such as `media/*.cap/` when the user wants only the MP4/GIF versioned.

## Workflow

1. **Check readiness.** `$C doctor --json` → `captureReady: true`, `permissions.screenRecording: "granted"`.
2. **Stage a clean window** (see Staging). Reset the demo to its initial state.
3. **Find the target.** `$C targets --json` → `windows[]` with `id`, `name`, `ownerName`, `bounds`. Prefer `--window <id>` over `--screen`: no desktop, dock, or notifications.
4. **Record while driving the demo** from a script (see Scripted demos):

   ```bash
   $C record start --window <id> --duration 40 --path "$M/$SLUG.cap" --json > /tmp/rec.json 2>&1 &
   sleep 2.5; ./timeline.sh; wait
   ```

   `--path` must not exist. Stdout is noisy (ffmpeg DASH logs); the last line is `{"type":"stopped",...}`. Or `--detach` then `$C record stop --id <recordingId> --json`.
5. **Validate.** `$C project validate "$M/$SLUG.cap" --json` → `missing: []`.
6. **Inspect raw frames** before editing, to place zooms on real timestamps (see Verify).
7. **Edit** `project-config.json` (see Editing). Keep a raw copy: `cp -R "$M/$SLUG.cap" "$M/$SLUG-raw.cap"`.
8. **Export.** `$C export "$M/$SLUG.cap" -o "$M/$SLUG.mp4" --quality social --json`. Progress events stream; last is `{"type":"Completed","path":...}`. Output keeps window aspect (e.g. 1728x1080 for a 1440x900 window), 60 fps.
9. **Verify the export** with a frame grid, fix and re-export if needed.
10. **Deliver.** Exports sit next to the project in `$M/`; add the optional GIF there. Clean up `/tmp` scratch files and staging windows.
11. **Open the result in Cap's editor (default).** Always do this unless the user said it is not needed:

    ```bash
    open -a /Applications/Cap.app "$M/$SLUG.cap"
    ```

    Cap registers `.cap` as its document type, so this opens the **Cap Editor** on the edited project (background, zooms, timeline intact) even when the project is outside Cap's library. Confirm with `$C targets --json` (a window named `Cap Editor`, `ownerName: "Cap"`) or `$C screenshot --window <id> --path /tmp/editor.png --json`. A `Welcome to Cap` window may also open; tell the user it can be closed. Tell the user the project path in `media/`.

## Staging a clean window

For web UIs, open a dedicated Chrome app window (no tabs, no address bar) with a throwaway profile:

```bash
P=/tmp/chrome-demo; rm -rf $P; mkdir -p $P/Default
echo '{"translate":{"enabled":false},"browser":{"has_seen_welcome_page":true}}' > $P/Default/Preferences
open -na "Google Chrome" --args --user-data-dir=$P --no-first-run --no-default-browser-check \
  --disable-features=Translate --app=http://127.0.0.1:PORT/ --window-size=1440,900 --window-position=80,60
```

- The translate bubble ("Traduire cette page ?") appears as a **separate window** in `targets` and over the page. `--disable-features=Translate` alone did not suppress it; the `Preferences` file with `translate.enabled: false` did.
- Re-run `targets` after launching: window ids change on every relaunch.
- Close it after recording: find the PID with `pgrep -f "user-data-dir=$P" | head -1`, then `kill <numeric PID>` (sandboxed shells may reject `kill $(...)`).

## Scripted demos

The agent cannot click in other apps. Drive the scene programmatically during recording:

- the app's own HTTP endpoints (`curl -X POST ...`), file edits the UI watches, AppleScript/`osascript`, or a terminal script;
- write a timeline script with explicit `sleep`s and a comment per beat with its approximate timestamp; these timestamps become zoom positions;
- reset all demo state before recording; do a dry run first when the flow is new;
- start the recorder, `sleep ~2.5` (recorder warm-up), then run the timeline; size `--duration` to timeline + ~3 s.

## Editing = modifying `<project>.cap/project-config.json` before export

Fields use camelCase. Top-level keys: `aspectRatio`, `background`, `camera`, `audio`, `cursor`, `timeline`, `captions`, `clips`, `annotations`, `screenMotionBlur`, `screenMovementSpring`, `colorCorrection`.

```python
import json
p = 'media/artifact-canvas-demo.cap/project-config.json'; d = json.load(open(p))
# House standard (tuned by the user in Cap Editor)
d['background'].update(
    source={"type": "wallpaper",
            "path": "/Applications/Cap.app/Contents/Resources/assets/backgrounds/macOS/tahoe-light.jpg"},
    blur=20.3, padding=8.4, rounding=6.0, shadow=55.2)
d['timeline']['zoomSegments'] = [
    # subtle zoom on a detail; one strong zoom on the main live action
    {"start": 5.7, "end": 8.4, "amount": 1.27, "mode": {"manual": {"x": 0.42, "y": 0.32}}},
    {"start": 16.0, "end": 31.5, "amount": 1.5, "mode": {"manual": {"x": 0.33, "y": 0.5}}},
]
d['cursor']['hideWhenIdle'] = True
json.dump(d, open(p, 'w'), indent=2)
```

- **Default look** (user-approved): macOS wallpaper `tahoe-light.jpg` blurred (`blur` ~20), `padding` ~8, small `rounding` 6 (close to a native window, not a pill), `shadow` ~55, no border, idle cursor hidden. Apply it unless the user asks for another style.
- Other bundled wallpapers: `/Applications/Cap.app/Contents/Resources/assets/backgrounds/{macOS,blue,purple,orange,dark,cities}/` (e.g. `macOS/tahoe-dark.jpg` for dark UIs, `macOS/sequoia-light.jpg`). Skip `*-thumbnail.jpg`.
- Zooms: at most one strong zoom (`amount` ~1.5) on the main live action, plus short subtle ones (~1.25, 2-3 s) for details. Aim x/y (normalized 0..1) at the region that changes.
- When the user retouches a project in Cap Editor, diff its `project-config.json` against the raw copy to learn their preferences, and fold them into this default.
- Other editable keys: `cursor` (size, animationStyle), `timeline.textSegments`, `captionSegments`, `maskSegments`, `sceneSegments`, `background.frame`/`border`.

## Verify

Never ship an export unseen. Build a frame grid and view the PNG:

```bash
O=demo.mp4; ffprobe -v error -show_entries stream=width,height,r_frame_rate:format=duration,size -of compact $O
for t in 2 8 13 24 31 37; do ffmpeg -v error -y -ss $t -i $O -frames:v 1 -vf scale=560:-1 f_$t.png; done
ffmpeg -v error -y -i f_2.png -i f_8.png -i f_13.png -i f_24.png -i f_31.png -i f_37.png \
  -filter_complex "[0][1][2]hstack=3[a];[3][4][5]hstack=3[b];[a][b]vstack" grid.png
```

Use the same grid on the raw `content/segments/segment-0/display.mp4` before editing. Check one full-size frame for text legibility. Delete the PNGs afterwards.

## GIF

`$C export --format gif` (or `mov`) exists; `--resolution WxH`, `--fps N`, `--quality maximum|social|web|potato` tune size. For a smaller README GIF use ffmpeg with a palette:

```bash
ffmpeg -v error -y -i demo.mp4 -vf "fps=12,scale=960:-1:flags=lanczos,split[a][b];[a]palettegen=max_colors=128[p];[b][p]paletteuse=dither=bayer" demo.gif
```

A 40 s, 960 px GIF is ~10 MB: too heavy for most READMEs. Shorten, lower fps or width, or ship the MP4.

## Gotchas (verified)

- A zoom segment starting at `0.0` showed no visible zoom in a test export; start zooms ≥ ~1 s in.
- `mode: "auto"` zoom needs cursor data; with an idle cursor it may not zoom. Prefer `manual` with explicit x/y.
- `cap-cli` has no "open in editor" command; use `open -a /Applications/Cap.app <project>.cap`.
- Cap's editor window may not show in `targets` or AppleScript. Confirm via the log instead: `tail ~/Library/Logs/so.cap.desktop/cap-gpui.log.$(date -u +%F)` → `editor instance ready path=...`. Re-running `open -a` on an open project just focuses it.
- Do not move or rename a `.cap` while Cap has it open (it keeps `.recovery-*` files inside); Cap then hangs and must be quit. Save to `media/` from the start.
- Retouches made in Cap Editor are saved to `project-config.json` but **not** to existing exports: re-run `export` after the user edits.
- `$C recordings list` only scans Cap's desktop library; projects recorded with `--path` elsewhere do not appear there, but still open in the editor via `open -a`.
- `upload` requires Cap Cloud auth (`CAP_API_KEY`); not needed for local export.
