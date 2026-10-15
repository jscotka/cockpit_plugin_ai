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

## Bundling CSS

Do not depend on a runtime-global Cockpit CSS path: `cockpit.js` provides APIs and transport, not CSS. Explicitly ship CSS and deliberately choose either full bundled Cockpit/PatternFly component CSS or a small scoped local CSS layer using matching PatternFly class names. The local option is appropriate when shell page imports conflict with standalone geometry, but must preserve focus, disabled, error, dark-token, and responsive states and must not use global selectors.

The validated [cockpit-podman](https://github.com/cockpit-project/cockpit-podman) pattern imports `cockpit-dark-theme` and `patternfly/patternfly-6-cockpit.scss` from the JavaScript entry, and its SCSS imports `ct-card.scss`, `page.scss`, and `global-variables`, producing package-local `dist`/CSS artifacts. For plain HTML, keep only a small esbuild/Sass build and generated CSS; do not copy Podman's React/full distribution/Makefile machinery. Sass imports must emit actual selectors because unused namespaces may be tree-shaken. Match PatternFly versions, inspect representative generated selectors, and run the target build.

Cockpit `page.scss` is shell-oriented. Standalone pages need a unique root scope, simple DOM, full-width main and panels, and no shell containers/sidebar grids unless the markup matches. PatternFly classes also require the expected DOM structure for pages, tabs, forms, and titles; verify visible panels, rendered geometry, theme initialization, and narrow layout.

## Feedback and regressions

After testing a plugin, provide the reviewer with the exact symptom, browser console output, service journal, or reproduction steps. It can classify and trace issues such as PatternFly usability problems, JavaScript errors, failed service actions, or data that was written but is not displayed, then implement an explicitly assigned fix and regression coverage.

Example:

```text
Use cockpit-feedback-reviewer for this report: switching tabs throws
"Cannot read properties of null", and writing a key reports success but the
value is not shown after navigation. Inspect the current diff, reproduce it,
fix only the assigned files, and run focused checks.
```

## Valkey UI build

The Valkey example requires Node.js 22+ and npm 10+. On Fedora, install them
with:

```sh
sudo dnf install -y nodejs npm
```

Use the equivalent package manager for other distributions, without assuming
that package names or versions are identical. The build uses the existing
Cockpit checkout dependencies from `../../../node_modules`, including esbuild,
esbuild-sass-plugin, and PatternFly. Do not run `npm install` in the example
directory unless it is later given its own lockfile and dependencies.

From `examples/valkey`, verify the tools and build the UI:

```sh
node --version
npm --version
npm run build
```

Agents must complete all three checks before claiming UI build validation.
Distinguish unavailable or too-old tools from source or build failures. The
build generates `valkey.css`, which is required at runtime; regenerate it when
Sass changes and follow the repository policy for generated files. Keep a local
lockfile/build dependency declaration when the adjacent checkout is stale, but
never commit `node_modules`.

## Improving the agent suite

After a completed task exposes a reusable gap—such as a CSS version mismatch,
shell layout rules shrinking a standalone page, missing dark-theme
initialization, a tab DOM mismatch, or version-sensitive backend metrics—run:

```text
/improve-cockpit-agents Summarize the completed regression, final diff, and validation evidence; update only the agent and skill guidance with reusable lessons.
```

`cockpit-agent-maintainer` may update only this suite's guidance files. It must
not change plugin source, generated output, dependencies, or the parent
Cockpit checkout, and it must reject one-off lessons that do not generalize.

Backend INFO/metrics should tolerate Valkey/Redis version differences and empty
DB sections: a successful command still means reachable, optional fields may
use unknown/zero defaults, warnings are non-fatal, and actual command errors
remain failures.
