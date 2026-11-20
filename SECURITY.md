# Security Policy

## Supported versions

Only the latest release receives security fixes.

## Reporting a vulnerability

Do not open a public issue for a security problem.

Report it privately through [GitHub private vulnerability reporting](https://github.com/louisbrillet/cor-skills/security/advisories/new). Include:

- the affected skill, script or file
- steps to reproduce, or a proof of concept
- the impact you expect

This project is maintained by one person in their spare time. Reports are handled on a best-effort basis, with no guaranteed response time. You will be credited in the advisory unless you ask otherwise.

## Scope

In scope:

- scripts shipped with the skills, and the files `cor-setup` installs into a project
- skill instructions that lead an agent to run unsafe commands, leak secrets or exfiltrate data
- the optional Copilot canvas extension

Out of scope: vulnerabilities in the AI agents themselves (Claude Code, GitHub Copilot, Codex) or in third-party tools. Report those to their vendors.
