# Cockpit plugin AI suite

Plan and build Cockpit plugins with a project-local OpenCode team. The suite
turns a product idea into an inspected plan, delegates focused decisions, and
implements only in the target repository. It is tooling—not a Cockpit plugin—
and adds no runtime dependency to your plugin.

> **Scope:** Work stays in the target repository. The adjacent Cockpit checkout
> is a read-only reference unless you explicitly authorize changes.

## Quick start

1. Open this directory in OpenCode, or restart OpenCode after changing its
   configuration, commands, agents, or skills.
2. Identify the target plugin repository and include its absolute path.
3. Run `/cockpit-plugin` with the request and constraints.

```text
/cockpit-plugin In /home/me/my-plugin, add a page that shows service status.
Inspect the existing patterns first, ask about privilege or persistence risks,
then implement the page and focused checks.
```

## Prompt examples

Copy, adapt, and include the target path:

```text
/cockpit-plugin In /path/to/repo, create a new Cockpit plugin page for managing
the example service. Reuse existing dependencies and patterns; define loading,
empty, error, and success states, then add focused tests.
```

```text
/cockpit-plugin In /path/to/repo, add Redis/Valkey configuration for host,
port, TLS, username, and password. Explain privilege, validation, persistence,
and secret-storage assumptions before implementation. Support the existing
project's versions and package conventions.
```

```text
/cockpit-plugin In /path/to/repo, redesign only the UI of the existing page.
Keep behavior, transport, APIs, and persistence unchanged. Use the project's
PatternFly version, preserve keyboard access and dark/responsive states, and
verify the rendered layout.
```

```text
/cockpit-plugin In /path/to/repo, compare cockpit.spawn, DBus, and channels for
this backend operation. Inspect current code and recommend a transport with
explicit lifecycle, privilege, error, and input-handling trade-offs; do not
implement until the decision is approved.
```

```text
/cockpit-plugin In /path/to/repo, debug this browser error: "Cannot read
properties of null" when switching tabs. Reproduce it, inspect the current
diff and console evidence, fix only the target repository, and add regression
coverage.
```

```text
/improve-cockpit-agents Summarize this completed task's reusable gap, final
diff, and validation evidence. Update only suite guidance; reject lessons that
are specific to one plugin.
```

## Who does what

The **architect** inspects the repository, clarifies risky decisions, records
acceptance criteria, assigns disjoint ownership, and coordinates verification.
Specialists provide focused work:

- **UI designer** — PatternFly structure, accessibility, responsive and theme states.
- **Backend advisor** — transport, lifecycle, privilege, input safety, and errors.
- **Plugin builder** — implementation, dependencies, packaging, and build output.
- **Documentation writer** — user and maintainer docs grounded in implementation.
- **Localization specialist** — gettext conventions and catalog checks.
- **Integration tester** — focused tests and the project's documented checks.
- **Feedback reviewer** — traces browser, service, and regression evidence.
- **Agent maintainer** — generalizes proven lessons into this suite only.

## A good prompt includes

- target repository path and the relevant page or component;
- desired behavior, including loading, empty, success, and error states;
- privilege, security, destructive-action, and input-handling expectations;
- persistence, ownership, and secret-storage requirements;
- supported versions, dependencies, UI, packaging, or other constraints;
- tests or verification you expect; and
- acceptance criteria for “done”.

## Important rules

- Current official Cockpit documentation and maintained local source are the
  sources of truth; do not rely on old examples or memory.
- Include the target repository, constraints, and acceptance criteria in your
  prompt so the specialists can make grounded decisions.
- Expect the architect to ask before making security, privilege, persistence,
  secret-storage, or destructive-action assumptions.
- Do not modify this suite's parent Cockpit repository, generated output, or
  unrelated files without explicit authorization.

Implementation and packaging conventions are maintained for agents in
`AGENTS.md` and the focused skills; users normally do not need to manage them
manually.

## References

- [Cockpit Guide](https://docs.cockpit-project.org/cockpit-guide/latest/guide/)
  · [Packages](https://docs.cockpit-project.org/cockpit-guide/latest/guide/packages.html)
  · [DBus](https://docs.cockpit-project.org/cockpit-guide/latest/guide/cockpit-dbus.html)
- [Spawn](https://docs.cockpit-project.org/cockpit-guide/latest/guide/cockpit-spawn.html)
  · [Channels](https://docs.cockpit-project.org/cockpit-guide/latest/guide/cockpit-channels.html)
  · [Locale](https://docs.cockpit-project.org/cockpit-guide/latest/guide/cockpit-locale.html)
- [Cockpit starter-kit](https://github.com/cockpit-project/starter-kit)
  · [cockpit-podman](https://github.com/cockpit-project/cockpit-podman)
- [Creating plugins for the Cockpit user interface](https://cockpit-project.org/blog/creating-plugins-for-the-cockpit-user-interface.html)
  — introductory and illustrative; prefer the current Guide and maintained source.
