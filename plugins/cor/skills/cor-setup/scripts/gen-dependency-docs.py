#!/usr/bin/env python3
"""Generates a version-aware map of official dependency documentation for Python projects.

Usage: python gen-dependency-docs.py [path/to/pyproject.toml|requirements.txt] [--out docs/DEPENDENCIES.md]

Run it inside the project environment (e.g. `uv run python ...`) so installed versions are detected.
Standard library only; requires Python 3.11+ (tomllib).
"""

from __future__ import annotations

import datetime
import json
import re
import sys
import urllib.error
import urllib.request
from concurrent.futures import ThreadPoolExecutor
from importlib import metadata
from pathlib import Path
from urllib.parse import quote, urlparse

try:
    import tomllib
except ModuleNotFoundError:
    sys.exit("Python 3.11+ is required (tomllib).")

TIMEOUT_S = 8
CONCURRENCY = 8
USER_AGENT = "cor-gen-dependency-docs/1.0"

# Packages whose PyPI metadata does not point to their official docs site.
OVERRIDES: dict[str, str] = {}

REQUIREMENT_NAME = re.compile(r"^\s*([A-Za-z0-9](?:[A-Za-z0-9._-]*[A-Za-z0-9])?)")
network_errors: set[str] = set()


def normalize(name: str) -> str:
    return re.sub(r"[-_.]+", "-", name).lower()


def parse_requirement(requirement: str) -> tuple[str, str] | None:
    match = REQUIREMENT_NAME.match(requirement)
    if not match:
        return None
    rest = requirement[match.end() :].split(";", 1)[0]
    rest = re.sub(r"^\s*\[[^\]]*\]", "", rest).strip()
    return match.group(1), rest or "*"


def read_requirements_txt(path: Path) -> list[str]:
    lines = []
    for raw in path.read_text(encoding="utf-8").splitlines():
        line = raw.split(" #", 1)[0].strip()
        if line and not line.startswith(("#", "-")):
            lines.append(line)
    return lines


def declared_requirements(manifest: Path) -> list[str]:
    if manifest.name != "pyproject.toml":
        return read_requirements_txt(manifest)
    data = tomllib.loads(manifest.read_text(encoding="utf-8"))
    project = data.get("project", {})
    requirements = list(project.get("dependencies", []))
    for group in project.get("optional-dependencies", {}).values():
        requirements += group
    for group in data.get("dependency-groups", {}).values():
        requirements += [item for item in group if isinstance(item, str)]
    poetry = data.get("tool", {}).get("poetry", {})
    poetry_tables = [poetry.get("dependencies", {}), poetry.get("dev-dependencies", {})]
    poetry_tables += [group.get("dependencies", {}) for group in poetry.get("group", {}).values()]
    for table in poetry_tables:
        for name, spec in table.items():
            if name.lower() == "python":
                continue
            version = spec if isinstance(spec, str) else spec.get("version", "*") if isinstance(spec, dict) else "*"
            requirements.append(f"{name} {version}")
    return requirements


def lockfile_versions(root: Path) -> dict[str, tuple[list[str], str]]:
    versions: dict[str, tuple[list[str], str]] = {}
    for lock_name in ("uv.lock", "poetry.lock", "pdm.lock"):
        lock_path = root / lock_name
        if not lock_path.exists():
            continue
        try:
            packages = tomllib.loads(lock_path.read_text(encoding="utf-8")).get("package", [])
        except tomllib.TOMLDecodeError:
            continue
        for package in packages:
            name, version = package.get("name"), package.get("version")
            if not name or not version:
                continue
            found, _ = versions.setdefault(normalize(name), ([], lock_name))
            if version not in found:
                found.append(version)
    return versions


def in_project_environment(root: Path) -> bool:
    if sys.prefix == sys.base_prefix:
        return False
    try:
        Path(sys.prefix).resolve().relative_to(root.resolve())
        return True
    except ValueError:
        return False


def observed_version(name: str, declared: str, root: Path, locked: dict, use_installed: bool) -> tuple[str, str]:
    if use_installed:
        try:
            return metadata.version(name), "installed"
        except metadata.PackageNotFoundError:
            pass
    if normalize(name) in locked:
        found, lock_name = locked[normalize(name)]
        return " / ".join(found), lock_name
    if declared.startswith("==") and "*" not in declared:
        return declared[2:].strip(), "pinned"
    return declared, "manifest range"


def http_get(url: str, accept: str) -> tuple[str, str, str] | None:
    request = urllib.request.Request(url, headers={"User-Agent": USER_AGENT, "Accept": accept})
    try:
        with urllib.request.urlopen(request, timeout=TIMEOUT_S) as response:
            content_type = response.headers.get("content-type", "")
            return response.geturl(), content_type, response.read().decode("utf-8", "replace")
    except urllib.error.HTTPError:
        return None
    except (urllib.error.URLError, OSError) as error:
        if not isinstance(getattr(error, "reason", None), TimeoutError) and not isinstance(error, TimeoutError):
            network_errors.add(urlparse(url).hostname or url)
        return None


def fetch_text(url: str) -> str | None:
    result = http_get(url, "text/plain, text/markdown, */*")
    if not result:
        return None
    final_url, content_type, body = result
    if "text/html" in content_type or re.match(r"^\s*<(!doctype|html)", body, re.IGNORECASE) or len(body.strip()) < 50:
        return None
    return final_url


def pick_url(urls: dict[str, str], pattern: str) -> str | None:
    for label, url in urls.items():
        if re.search(pattern, label, re.IGNORECASE) and url:
            return url
    return None


def registry_metadata(name: str) -> dict[str, str | None]:
    result = http_get(f"https://pypi.org/pypi/{quote(name)}/json", "application/json")
    if not result:
        return {}
    try:
        info = json.loads(result[2]).get("info", {})
    except json.JSONDecodeError:
        return {}
    urls = {label: url for label, url in (info.get("project_urls") or {}).items() if isinstance(url, str)}
    docs = info.get("docs_url") or pick_url(urls, r"doc")
    homepage = pick_url(urls, r"^home\s*page$|^home$") or info.get("home_page")
    repository = pick_url(urls, r"source|repo|code|github") or next(
        (url for url in [*urls.values(), homepage or ""] if "github.com" in url or "gitlab.com" in url), None
    )
    return {"homepage": docs or homepage, "repository": repository}


def llms_candidates(homepage: str | None) -> list[str]:
    if not homepage:
        return []
    url = urlparse(homepage)
    if not url.scheme.startswith("http") or url.hostname in {"github.com", "gitlab.com", "pypi.org"}:
        return []
    origin = f"{url.scheme}://{url.netloc}"
    segments = [segment for segment in url.path.split("/") if segment]
    candidates = [f"{origin}/llms.txt"]
    for index in range(len(segments), 0, -1):
        candidate = f"{origin}/{'/'.join(segments[:index])}/llms.txt"
        if candidate not in candidates:
            candidates.append(candidate)
    return candidates


def resolve_dependency(name: str, version: tuple[str, str]) -> dict:
    registry = registry_metadata(name)
    homepage = OVERRIDES.get(normalize(name)) or registry.get("homepage")
    entry = {"name": name, "version": version, "homepage": homepage, "repository": registry.get("repository"), "llms": None}
    for candidate in llms_candidates(homepage):
        index = fetch_text(candidate)
        if index:
            entry["llms"] = index
            break
    return entry


def main() -> None:
    args = sys.argv[1:]
    out_value = "docs/DEPENDENCIES.md"
    if "--out" in args:
        position = args.index("--out")
        out_value = args[position + 1]
        del args[position : position + 2]
    if args:
        manifest = Path(args[0]).resolve()
    else:
        manifest = next((Path(n).resolve() for n in ("pyproject.toml", "requirements.txt") if Path(n).exists()), Path("pyproject.toml").resolve())
    output = Path(out_value).resolve()
    if not manifest.exists():
        sys.exit(f"Cannot read dependency manifest: {manifest}")

    root = manifest.parent
    dependencies: dict[str, tuple[str, list[str]]] = {}
    for requirement in declared_requirements(manifest):
        parsed = parse_requirement(requirement)
        if not parsed:
            continue
        name, spec = parsed
        _, specs = dependencies.setdefault(normalize(name), (name, []))
        if spec not in specs:
            specs.append(spec)
    if not dependencies:
        sys.exit(f"No dependencies found in {manifest}")

    locked = lockfile_versions(root)
    use_installed = in_project_environment(root)
    if not use_installed:
        sys.stderr.write("NOTE: not running inside the project virtualenv; using lockfile versions only.\n")

    items = sorted(dependencies.values(), key=lambda item: normalize(item[0]))
    versions = [observed_version(name, " | ".join(specs), root, locked, use_installed) for name, specs in items]
    sys.stderr.write(f"Resolving {len(items)} dependencies...\n")
    with ThreadPoolExecutor(CONCURRENCY) as pool:
        entries = list(pool.map(resolve_dependency, [name for name, _ in items], versions))

    indexed = [entry for entry in entries if entry["llms"]]
    try:
        script_path = Path(__file__).resolve().relative_to(Path.cwd().resolve()).as_posix()
    except ValueError:
        script_path = ".cor/scripts/gen-dependency-docs.py"
    lines = [
        "# Dependency documentation map",
        "",
        f"<!-- GENERATED by {script_path} on {datetime.date.today().isoformat()}. Do not edit by hand. -->",
        "",
        "Official documentation entry points for this project’s direct dependencies. Before relying on an API example, check the version source below.",
        "",
        f"Coverage: {len(indexed)}/{len(entries)} dependencies expose an `llms.txt` index.",
        "",
        "| Package | Version observed | Docs entry point (prefer this) | Fallback |",
        "|---|---|---|---|",
    ]
    for entry in entries:
        primary = f"[llms.txt]({entry['llms']})" if entry["llms"] else f"[homepage]({entry['homepage']})" if entry["homepage"] else "—"
        fallback = f"[repo]({entry['repository']})" if entry["repository"] else f"[homepage]({entry['homepage']})" if entry["homepage"] else "—"
        value, source = entry["version"]
        value = value.replace("|", "\\|")
        lines.append(f"| `{entry['name']}` | {value} ({source}) | {primary} | {fallback} |")

    lines += [
        "",
        "## Agent guidance",
        "",
        "- Read the `llms.txt` index first, then fetch only documentation pages relevant to the task.",
        "- `llms-full.txt` is optional and often large. Fetch it only when the index cannot answer the question.",
        "- Some sites serve Markdown by appending `.md` to a docs URL. This is a convention, not a guarantee; use the normal page when it fails.",
        "- The installed package in the project virtualenv (`.venv/lib/python*/site-packages/<package>/`: source, type hints, `*.dist-info/METADATA`) describes the version actually used. It wins if it conflicts with online docs.",
        "- Several versions separated by `/` come from platform-specific lockfile entries.",
        "- `manifest range` means no locked or installed version was found. Do not treat it as an installed version.",
        "",
    ]

    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text("\n".join(lines), encoding="utf-8")
    sys.stderr.write(f"Wrote {output} ({len(indexed)}/{len(entries)} with llms.txt)\n")
    if network_errors:
        hosts = ", ".join(sorted(network_errors)[:8])
        sys.stderr.write(f"WARNING: network/TLS errors may undercount coverage. Hosts: {hosts}\n")


if __name__ == "__main__":
    main()
