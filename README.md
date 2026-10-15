# Cockpit plugin OpenCode suite

This repository is a project-local set of OpenCode agents, commands, and skills for helping plan and implement Cockpit plugins in a separate target repository. It is not itself a Cockpit plugin and does not add plugin code or runtime dependencies.

## Quick start

1. Install OpenCode using its normal installation instructions.
2. Open this directory in OpenCode, then restart the OpenCode session after adding or changing project configuration, agents, commands, or skills.
3. Run `/cockpit-plugin <request>`, including the target plugin repository path in your request. Example:

   ```text
   /cockpit-plugin In /path/to/plugin-repository, add a Redis configuration page to the existing Cockpit plugin. Let an administrator choose a host and port, enable TLS, set an optional username and password, test the connection, and save or cancel. Reuse existing dependencies and patterns; explain privilege and secret-storage assumptions before implementation.
   ```

The command selects `cockpit-plugin-architect`. Give it the target repository and any constraints that are not evident from the code. It should ask before proceeding when critical security, privilege, destructive-action, or architectural details are unknown.

## Agent workflow

The primary architect discovers the target repository and its maintained conventions, turns the request into requirements and acceptance criteria, and asks for clarification where needed. UI and backend specialists can advise in parallel once they have the same requirements and repository context. The architect records decisions, assigns non-overlapping file ownership, and delegates implementation to the builder. After implementation, it delegates applicable documentation, localization, and integration-test work, then coordinates verification against the target project's own instructions and reports assumptions, changed files, and checks accurately.

Advisory agents do not edit files. Writer agents have narrowly stated ownership and must not overlap; the primary agent coordinates rather than duplicating their edits. Never allow work to spill into the parent Cockpit repository unless the user explicitly authorizes it.

## Files

- `opencode.json` — project configuration, default agent, project instructions, and named local `cockpit` reference to `..`.
- `AGENTS.md` — shared project guardrails and source-of-truth rules.
- `.opencode/command/cockpit-plugin.md` — `/cockpit-plugin` entry point.
- `.opencode/agent/` — primary orchestrator, focused specialists, and `cockpit-feedback-reviewer` for regressions and user feedback.
- `.opencode/skills/` — reusable Cockpit workflow and API guidance, with deeper reference notes where useful.

## Authoritative references

- [Cockpit Guide (latest)](https://docs.cockpit-project.org/cockpit-guide/latest/guide/)
- [Packages](https://docs.cockpit-project.org/cockpit-guide/latest/guide/packages.html)
- [DBus](https://docs.cockpit-project.org/cockpit-guide/latest/guide/cockpit-dbus.html)
- [Spawn](https://docs.cockpit-project.org/cockpit-guide/latest/guide/cockpit-spawn.html)
- [Channels](https://docs.cockpit-project.org/cockpit-guide/latest/guide/cockpit-channels.html)
- [Locale](https://docs.cockpit-project.org/cockpit-guide/latest/guide/cockpit-locale.html)
- [Cockpit starter-kit](https://github.com/cockpit-project/starter-kit)
- [Creating plugins for the Cockpit user interface](https://cockpit-project.org/blog/creating-plugins-for-the-cockpit-user-interface.html) — introductory and illustrative only; use the current guide and maintained source as normative references.

The adjacent `../` Cockpit repository is also a key local reference. Its maintained examples, source, tests, and packaging files may be more specific to the checked-out version than general guidance.

## Feedback and regressions

After testing a plugin, provide the reviewer with the exact symptom, browser console output, service journal, or reproduction steps. It can classify and trace issues such as PatternFly usability problems, JavaScript errors, failed service actions, or data that was written but is not displayed, then implement an explicitly assigned fix and regression coverage.

Example:

```text
Use cockpit-feedback-reviewer for this report: switching tabs throws
"Cannot read properties of null", and writing a key reports success but the
value is not shown after navigation. Inspect the current diff, reproduce it,
fix only the assigned files, and run focused checks.
```
