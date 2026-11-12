#!/usr/bin/env python3
"""Check a Diataxis docs directory for structure, links, and nav coverage.

Usage:
    python check_docs.py [--root <repo-root>] [--docs-dir <dir>]

--docs-dir defaults to the value in <root>/.cor/docs.md, else "docs".
Exit codes: 0 = no ERROR findings, 1 = at least one ERROR.
WARN findings never fail the run.
"""

import argparse
import os
import re
import sys

QUADRANTS = ("tutorials", "how-to", "reference", "explanation")
STEP_QUADRANTS = ("tutorials", "how-to")
CONFIG_FILES = ("mkdocs.yml", "mkdocs.yaml", "zensical.toml")
LINK_PATTERN = re.compile(r"(?<!!)\[[^\]]*\]\(([^)\s]+)(?:\s+\"[^\"]*\")?\)")
IMAGE_PATTERN = re.compile(r"!\[[^\]]*\]\(([^)\s]+)\)")
NAV_PATH_PATTERN = re.compile(r"[\"']?([A-Za-z0-9_./-]+\.md)[\"']?")
ORDERED_STEP_PATTERN = re.compile(r"^\s*\d+\.\s+\S", re.M)
FENCE_PATTERN = re.compile(r"^(```|~~~).*?^\1", re.M | re.S)

FINDINGS = []


def report(level, path, message):
    FINDINGS.append((level, path, message))


def docs_dir_from_config(root):
    cfg = os.path.join(root, ".cor", "docs.md")
    if not os.path.isfile(cfg):
        return None
    with open(cfg, encoding="utf-8") as f:
        text = f.read()
    match = re.search(r"^## Docs Directory\s*\n+\s*(\S+)", text, re.M)
    return match.group(1).strip("/") if match else None


def list_pages(docs):
    pages = []
    for dirpath, dirs, files in os.walk(docs):
        dirs[:] = [d for d in dirs if not d.startswith(".")]
        for name in files:
            if name.endswith(".md"):
                pages.append(os.path.relpath(os.path.join(dirpath, name), docs).replace(os.sep, "/"))
    return sorted(pages)


def check_layout(docs, pages):
    if "index.md" not in pages:
        report("ERROR", "index.md", "missing root index.md")
    for quadrant in QUADRANTS:
        if not os.path.isdir(os.path.join(docs, quadrant)):
            report("ERROR", quadrant + "/", "missing quadrant directory")
        elif quadrant + "/index.md" not in pages:
            report("ERROR", quadrant + "/index.md", "missing quadrant index.md")
    for page in pages:
        top = page.split("/")[0]
        if page != "index.md" and top not in QUADRANTS and top != "assets":
            report("WARN", page, "page is outside the four Diataxis directories")


def strip_code(text):
    return FENCE_PATTERN.sub("", text)


def check_page(docs, page):
    path = os.path.join(docs, page)
    with open(path, encoding="utf-8") as f:
        raw = f.read()
    text = strip_code(raw)
    if not re.search(r"^# \S", text, re.M):
        report("WARN", page, "no H1 title")
    for target in LINK_PATTERN.findall(text) + IMAGE_PATTERN.findall(text):
        if re.match(r"^[a-z][a-z0-9+.-]*:", target) or target.startswith("#"):
            continue
        rel = target.split("#")[0].split("?")[0]
        if not rel:
            continue
        resolved = os.path.normpath(os.path.join(os.path.dirname(path), rel))
        if not os.path.exists(resolved):
            report("ERROR", page, f"broken link `{target}`")
    parts = page.split("/")
    if len(parts) > 1 and parts[-1] != "index.md" and parts[0] in STEP_QUADRANTS:
        if not ORDERED_STEP_PATTERN.search(text):
            report("WARN", page, f"{parts[0]} page has no numbered steps")


def check_quadrant_indexes(docs, pages):
    for quadrant in QUADRANTS:
        index = os.path.join(docs, quadrant, "index.md")
        if not os.path.isfile(index):
            continue
        with open(index, encoding="utf-8") as f:
            linked = {
                os.path.normpath(os.path.join(quadrant, t.split("#")[0])).replace(os.sep, "/")
                for t in LINK_PATTERN.findall(f.read())
            }
        for page in pages:
            if page.startswith(quadrant + "/") and page != quadrant + "/index.md" and page not in linked:
                report("WARN", page, f"not listed in {quadrant}/index.md")


def check_nav(root, docs, pages):
    configs = [c for c in CONFIG_FILES if os.path.isfile(os.path.join(root, c))]
    if not configs:
        return
    for config in configs:
        with open(os.path.join(root, config), encoding="utf-8") as f:
            text = f.read()
        nav_match = re.search(r"^nav\s*[:=]", text, re.M)
        if not nav_match:
            continue
        nav_paths = set(NAV_PATH_PATTERN.findall(text[nav_match.start():]))
        for entry in sorted(nav_paths):
            if not os.path.isfile(os.path.join(docs, entry)):
                report("ERROR", config, f"nav entry `{entry}` does not exist in docs dir")
        for page in pages:
            if page.split("/")[0] != "assets" and page not in nav_paths:
                report("ERROR", page, f"page missing from nav in {config}")


def main():
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("--root", default=".")
    parser.add_argument("--docs-dir", default=None)
    args = parser.parse_args()

    root = os.path.abspath(args.root)
    docs_dir = args.docs_dir or docs_dir_from_config(root) or "docs"
    docs = os.path.join(root, docs_dir)
    if not os.path.isdir(docs):
        print(f"ERROR  {docs_dir}: docs directory not found")
        return 1

    pages = list_pages(docs)
    check_layout(docs, pages)
    for page in pages:
        check_page(docs, page)
    check_quadrant_indexes(docs, pages)
    check_nav(root, docs, pages)

    for level, path, message in FINDINGS:
        print(f"{level:<6} {docs_dir}/{path}: {message}")
    errors = sum(1 for f in FINDINGS if f[0] == "ERROR")
    warnings = len(FINDINGS) - errors
    print(f"\n{len(pages)} page(s) checked: {errors} error(s), {warnings} warning(s)")
    return 1 if errors else 0


if __name__ == "__main__":
    sys.exit(main())
