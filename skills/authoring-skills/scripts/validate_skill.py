#!/usr/bin/env python3
"""Validate skill directories against Agent Skills authoring best practices.

Usage:
    python scripts/validate_skill.py <skill-dir> [<skill-dir> ...]
    python scripts/validate_skill.py skills/*/

Exit codes: 0 = no ERROR findings, 1 = at least one ERROR.
WARN findings never fail the run; they are judgment calls for the author.
"""

import os
import re
import sys

# Anthropic frontmatter limits (platform-enforced, not style preferences).
NAME_MAX_CHARS = 64
DESCRIPTION_MAX_CHARS = 1024

# Progressive-disclosure budget from the best-practices guide.
# SKILL.md over this should be split into reference files.
SKILL_BODY_MAX_LINES = 500
# Reference files past this need a table of contents so partial reads still
# reveal the full scope of the file.
REFERENCE_TOC_THRESHOLD_LINES = 100

RESERVED_WORDS = ("anthropic", "claude")
NAME_PATTERN = re.compile(r"^[a-z0-9-]+$")
FRONTMATTER_PATTERN = re.compile(r"\A---\n(.*?)\n---\n", re.DOTALL)
# Bundled-resource directories. Only paths under these (or markdown links) are
# treated as references to skill files; other inline-code paths are project
# paths the skill talks about, not files it ships.
BUNDLE_DIRS = ("references", "reference", "scripts", "templates", "assets", "examples")
# Matches markdown links and inline-code paths pointing at bundled files.
LOCAL_REF_PATTERN = re.compile(
    r"\]\(([^)\s]+?\.(?:md|py|sh|js|ts|html|json|csv))\)"
    r"|`((?:%s)/[A-Za-z0-9_./-]+\.(?:md|py|sh|js|ts|html|json|csv))`" % "|".join(BUNDLE_DIRS)
)
FIRST_PERSON_PATTERN = re.compile(r"\b(I can|I will|I help|you can use this|let me)\b", re.I)
WINDOWS_PATH_PATTERN = re.compile(r"[A-Za-z0-9_-]+\\[A-Za-z0-9_-]+\.[a-z]{2,4}")

FINDINGS = []


def report(level, skill, message):
    FINDINGS.append((level, skill, message))


def parse_frontmatter(text):
    """Return (frontmatter_dict, body) or (None, text) when frontmatter is absent."""
    match = FRONTMATTER_PATTERN.match(text)
    if not match:
        return None, text
    fields = {}
    key = None
    for line in match.group(1).splitlines():
        kv = re.match(r"^([A-Za-z0-9_-]+):\s*(.*)$", line)
        if kv:
            key = kv.group(1)
            fields[key] = kv.group(2).strip()
        elif key and line.strip():
            fields[key] = (fields[key] + " " + line.strip()).strip()
    for key, value in fields.items():
        if len(value) >= 2 and value[0] == value[-1] and value[0] in "\"'":
            fields[key] = value[1:-1]
    return fields, text[match.end():]


def check_frontmatter(skill, fields, dirname):
    if fields is None:
        report("ERROR", skill, "SKILL.md has no YAML frontmatter")
        return

    name = fields.get("name", "")
    if not name:
        report("ERROR", skill, "frontmatter is missing required field `name`")
    else:
        if len(name) > NAME_MAX_CHARS:
            report("ERROR", skill, f"name is {len(name)} chars (max {NAME_MAX_CHARS})")
        if not NAME_PATTERN.match(name):
            report("ERROR", skill, f"name `{name}` must be lowercase letters, numbers, hyphens only")
        if any(word in name.lower() for word in RESERVED_WORDS):
            report("ERROR", skill, f"name `{name}` contains a reserved word")
        if name != dirname:
            report("ERROR", skill, f"name `{name}` does not match directory `{dirname}`")

    description = fields.get("description", "")
    if not description:
        report("ERROR", skill, "frontmatter is missing required field `description`")
        return
    if len(description) > DESCRIPTION_MAX_CHARS:
        report("ERROR", skill, f"description is {len(description)} chars (max {DESCRIPTION_MAX_CHARS})")
    if "<" in description and ">" in description:
        report("ERROR", skill, "description contains XML-like tags")
    first_person = FIRST_PERSON_PATTERN.search(description)
    if first_person:
        report("WARN", skill, f"description is not third person: '{first_person.group(0)}'")
    # A usable description names the activation condition, not only the capability.
    trigger_words = ("use when", "use for", "use this", "use it", "trigger", "invoke", "applies when")
    if not any(word in description.lower() for word in trigger_words):
        report("WARN", skill, "description states what but not when — add an explicit trigger clause")


def check_body(skill, body, skill_dir):
    lines = body.splitlines()
    if len(lines) > SKILL_BODY_MAX_LINES:
        report(
            "ERROR",
            skill,
            f"SKILL.md body is {len(lines)} lines (max {SKILL_BODY_MAX_LINES}) — split into reference files",
        )

    windows_path = WINDOWS_PATH_PATTERN.search(body)
    if windows_path:
        report("ERROR", skill, f"Windows-style path `{windows_path.group(0)}` — use forward slashes")

    for match in LOCAL_REF_PATTERN.finditer(body):
        ref = match.group(1) or match.group(2)
        if ref.startswith(("http://", "https://", "#", "/", ".cor/", ".github/", ".claude/")):
            continue
        if not os.path.exists(os.path.join(skill_dir, ref)):
            report("WARN", skill, f"SKILL.md references `{ref}` which does not exist in the skill directory")


def check_bundled_files(skill, body, skill_dir):
    """Every bundled markdown file must be reachable one level deep from SKILL.md."""
    bundled = []
    for root, dirs, files in os.walk(skill_dir):
        # evaluations/ holds test fixtures for the author's harness, not content
        # the agent loads, so it is exempt from the reachability requirement.
        dirs[:] = [d for d in dirs if not d.startswith(".") and d != "evaluations"]
        for filename in files:
            if filename == "SKILL.md" or filename.startswith("."):
                continue
            bundled.append(os.path.relpath(os.path.join(root, filename), skill_dir))

    for rel in bundled:
        if rel.endswith(".md"):
            path = os.path.join(skill_dir, rel)
            with open(path, encoding="utf-8") as handle:
                ref_lines = handle.read().splitlines()
            if len(ref_lines) > REFERENCE_TOC_THRESHOLD_LINES:
                head = "\n".join(ref_lines[:30]).lower()
                if "contents" not in head and "table of contents" not in head:
                    report(
                        "WARN",
                        skill,
                        f"{rel} is {len(ref_lines)} lines with no table of contents near the top",
                    )
        if os.path.basename(rel) not in body and rel not in body:
            report("WARN", skill, f"{rel} is bundled but never referenced from SKILL.md")

    seen = {}
    for rel in bundled:
        base = os.path.basename(rel)
        seen.setdefault(base, []).append(rel)
    for base, paths in seen.items():
        if len(paths) > 1:
            report("WARN", skill, f"duplicate filename `{base}` at {', '.join(sorted(paths))}")


def validate(skill_dir):
    skill_dir = skill_dir.rstrip("/")
    dirname = os.path.basename(skill_dir)
    skill_md = os.path.join(skill_dir, "SKILL.md")
    if not os.path.isfile(skill_md):
        report("ERROR", dirname, f"no SKILL.md found in {skill_dir}")
        return
    with open(skill_md, encoding="utf-8") as handle:
        text = handle.read()
    fields, body = parse_frontmatter(text)
    check_frontmatter(dirname, fields, dirname)
    check_body(dirname, body, skill_dir)
    check_bundled_files(dirname, body, skill_dir)


def main(argv):
    targets = argv[1:]
    if not targets:
        print(__doc__)
        return 1
    for target in targets:
        if not os.path.isdir(target):
            report("ERROR", target, "not a directory")
            continue
        validate(target)

    if not FINDINGS:
        print(f"OK — {len(targets)} skill(s) passed all checks")
        return 0

    errors = [f for f in FINDINGS if f[0] == "ERROR"]
    warnings = [f for f in FINDINGS if f[0] == "WARN"]
    for level, skill, message in errors + warnings:
        print(f"{level:5} {skill}: {message}")
    print(f"\n{len(errors)} error(s), {len(warnings)} warning(s) across {len(targets)} skill(s)")
    return 1 if errors else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
