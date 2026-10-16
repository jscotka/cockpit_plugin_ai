# From product idea to Cockpit plugin: a local AI-agent suite

Have a Cockpit plugin idea but not a ready-made plan? Bring the idea here. This
repository is a reusable, project-local AI-agent suite that helps developers
turn their own requirements into a plugin in their own target repository. Tell
it what you want to build, where the code lives, which constraints matter, and
what a successful result should look like. The suite coordinates repository
inspection, focused design decisions, implementation, documentation, and
verification around that request.

The goal is not to have one agent improvise an entire application. It is to give
your plugin idea a disciplined development team: agents inspect the code that
already exists, ask about decisions that could affect a real host, and divide
the work into contributions that can be checked.

The result is a project-local OpenCode suite: **tooling and guidance, not a
plugin runtime**. It adds no dependency to the plugin being built
([README.md](README.md)). The adjacent Cockpit checkout supplies current source
and examples as a read-only reference, alongside the
[official Cockpit guide](https://docs.cockpit-project.org/cockpit-guide/latest/guide/).

## Bring your plugin idea

The entry point is `/cockpit-plugin`. A useful request identifies:

- the **target repository** and the page, component, or service involved;
- the desired outcome, including loading, empty, success, and error states;
- supported versions, dependencies, UI, packaging, or other constraints;
- privilege, persistence, secret-handling, destructive-action, and ownership
  expectations; and
- the checks and acceptance criteria that define “done”.

For example, a request might ask for a service-status page in
`/path/to/my-plugin`, require compatibility with an existing UI, prohibit new
privileges, and ask for focused tests. The important thing is not a magic
prompt format. It is giving the agents enough context to work on **your**
plugin rather than silently inventing a neighboring one.

The command then follows a simple sequence:

1. inspect the repository and its existing patterns;
2. clarify important product, privilege, and security questions;
3. ask specialists for focused decisions;
4. implement in the target repository;
5. document, test, and verify the result.

The workflow is described in the [command definition](.opencode/command/cockpit-plugin.md)
and the [architect guide](.opencode/agent/cockpit-plugin-architect.md). Discovery
matters because Cockpit plugins are part of a larger system. Dependencies,
transport, packaging, UI conventions, and tests in your repository are usually
more informative than a generic starter layout. The adjacent Cockpit checkout
and the [official Cockpit guide](https://docs.cockpit-project.org/cockpit-guide/latest/guide/)
provide maintained references, while implementation stays in the target
repository.

That is not bureaucracy for its own sake. **A browser page is not automatically
privileged**, and a save button can have consequences on a real host. Asking one
good question early is often faster than repairing a confident assumption later.

## Agent cooperation

The architect shares the approved context with specialists who have clear,
non-overlapping responsibilities. The suite currently separates work such as:

- UI structure, accessibility, responsive behavior, and themes;
- backend transport, lifecycle, privilege, validation, and errors;
- implementation, dependencies, packaging, and build output;
- localization, documentation, and integration checks; and
- feedback review based on an exact symptom and the assets actually loaded.

This arrangement lets agents work in parallel without turning the repository
into a merge-conflict science experiment. More importantly, it gives each
recommendation a natural owner. Patterns in the local
[catalog](.opencode/references/patterns.md) help teams start consistently, but
current source, tests, and official documentation remain the authority.

The handoff between agents is therefore part of the design. A useful result
says what was implemented, what was checked, and what still depends on a
particular host or browser. That distinction keeps a unit test from being
mistaken for proof of privileged or end-to-end integration.

## What the suite can produce

The suite is designed for many plugin ideas, not for reproducing the examples
checked into this repository. Those examples are useful illustrations of the
range of work it can coordinate: a focused service-management page and a
privileged configuration editor.

### Valkey: a deliberately scoped management page

[`examples/valkey`](examples/valkey) is an MVP for Fedora 44 and Cockpit test
images, not a universal Valkey installer. Its manifest exposes Overview,
Configuration, and Message debugging tabs. The page can install the exact
`valkey` package through PackageKit, manage `valkey.service`, edit four
directives in `/etc/valkey/valkey.conf`, collect `INFO` metrics, operate on
database 0, and maintain a local `messages` list. It distinguishes service
status from internal Valkey status and treats an empty database as zero keys
without hiding real command failures ([example README](examples/valkey/README.md)).

The example is equally clear about its limits: it does not provide distribution
detection, password support, clustering, TLS, or backup and restore. Its UI
build requires Node.js 22+ and npm 10+. The generated stylesheet bundles the
PatternFly v6 components it uses rather than assuming that `cockpit.js` injects
CSS; **the API and transport library does not provide a runtime global stylesheet**.

### Cockpit configuration: schema as an executable contract

[`examples/cockpit-config`](examples/cockpit-config) edits the active
`cockpit.conf` while preserving comments and unmanaged directives. It uses
conflict-aware `cockpit.file().modify()`, requires administrative access, and
reports a successful file write separately from a failed `cockpit.service`
reload. Its checked-in [`schema.json`](examples/cockpit-config/schema.json) is
the source of truth for the editable options: types, ranges, defaults, help,
examples, and editability. The installed `cockpit.conf(5)` page is only a
non-blocking comparison for documentation drift; it does not invent controls.

This makes a difficult configuration problem easier to reason about. Validators
cover booleans, bounded integers, URLs, paths, origins, headers, OAuth values,
lists, and other structured settings. Duplicate entries and concurrent changes
block an unsafe save. The package also documents generated assets and discovery
with `cockpit-bridge --packages` ([example README](examples/cockpit-config/README.md)).

## Lessons that travel with the workflow

The examples and the suite's guidance surface lessons worth carrying into your
own plugin work:

- **Assets are part of the feature.** HTML, JavaScript, CSS, and theme files
  must be built and deployed as one revision. A stale browser cache or missing
  generated stylesheet can resemble a source bug.
- **Host APIs vary.** Optional Valkey fields and empty database sections should
  not turn a reachable service into an error. Configuration parsing, schema
  behavior, and reload results need explicit handling.
- **UI failures need useful boundaries.** A successful write followed by a
  failed refresh should still be reported as a successful write. Missing
  required elements, asset mismatches, and schema drift should remain visible.
- **Packaging and documentation count as implementation.** A finished plugin
  should explain prerequisites, development and system installation, package
  discovery, and removal, while distinguishing an example copy from an RPM or
  distribution package.

For API decisions, the suite points agents to current Cockpit documentation for
[D-Bus](https://docs.cockpit-project.org/cockpit-guide/latest/guide/cockpit-dbus.html),
[spawn](https://docs.cockpit-project.org/cockpit-guide/latest/guide/cockpit-spawn.html),
and [channels](https://docs.cockpit-project.org/cockpit-guide/latest/guide/cockpit-channels.html).

## From first plan to useful handoff

After the first request, the suite can continue with feedback: an exact browser
error, service output, reproduction steps, or a changed acceptance criterion.
Agents can then inspect the current diff and the assets actually loaded instead
of guessing from a symptom. Browser and privileged integration remain
environment-dependent, so those results are reported separately and honestly.

The next improvements should deepen this evidence-based workflow rather than
broaden it: add focused asset and DOM checks where a package has a build,
inspect generated selectors, test narrow layouts, and expand checks across
supported API versions.

The `/improve-cockpit-agents` command provides a feedback loop. After a
meaningful task, maintainers can provide the final diff and validation evidence
so a proven lesson becomes a better suite rule without changing plugin source.

## Conclusion

AI does not remove the hard parts of Cockpit development. It can, however, make
those parts easier to see and divide among people and agents. Bring a plugin
idea, its target repository, its constraints, and the outcome you want; the
suite turns that input into a sequence of inspected decisions, focused
contributions, a coherent package, and evidence about what really works.

The Valkey and Cockpit configuration examples demonstrate that approach: one
stays deliberately scoped, while the other treats configuration metadata as an
executable contract. They are starting points and evidence, not the suite's
boundaries. With clear limits and continued maintainer feedback, cooperating
agents can make your plugin development faster **without making it less
careful**.
