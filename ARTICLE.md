# From a system need to a Cockpit plugin: a local AI delivery team

Cockpit plugins are most useful when they put a real host interface within
reach: a service that needs managing, configuration that needs editing, metrics
that need explaining, a system API or D-Bus object that needs a careful UI, or
a file and controlled administrative action that should not be hidden behind a
terminal. This repository is a project-local AI-agent suite for helping
developers build that kind of plugin in an **existing target repository**. It
starts from the code, dependencies, packaging, and host interfaces already
there—not from a generic demo application.

The suite is **tooling and guidance, not a plugin runtime**. It adds no
dependency to the plugin being built ([README.md](README.md)). The adjacent
Cockpit checkout is a read-only reference, alongside the
[official Cockpit guide](https://docs.cockpit-project.org/cockpit-guide/latest/guide/).
The implementation belongs in the target repository, where its real
constraints and conventions can be respected.

## Start with a concrete request

The entry point is `/cockpit-plugin`. Give it the target repository and the
system-facing outcome you want. A useful request identifies:

- the **target repository** and the page, component, service, or host interface;
- the desired behavior, including loading, empty, success, and error states;
- supported versions, dependencies, UI, packaging, and other constraints;
- privilege, persistence, secret-handling, destructive-action, and ownership
  expectations; and
- the checks and acceptance criteria that define “done”.

For example, ask for a service-status page in `/path/to/my-plugin`, a metrics
view backed by an existing command, or a configuration editor that must
preserve unmanaged file content. Say whether administrative access is allowed,
which versions matter, and what must remain unchanged. That context keeps the
agents focused on **your** repository and its host instead of silently
inventing a neighboring product.

The workflow is deliberately practical:

1. inspect the target repository and its existing patterns;
2. clarify decisions that could affect security, privilege, persistence, or
   data ownership;
3. make a plan with acceptance criteria and distinct file ownership;
4. implement the approved work in the target repository; and
5. document the result and report the evidence available.

The sequence is described in the [command definition](.opencode/command/cockpit-plugin.md)
and the [architect guide](.opencode/agent/cockpit-plugin-architect.md). Discovery
matters: local dependencies, transport choices, packaging, UI conventions, and
tests are usually more informative than a generic starter layout. For API
decisions, the suite points agents to maintained Cockpit documentation for
[D-Bus](https://docs.cockpit-project.org/cockpit-guide/latest/guide/cockpit-dbus.html),
[spawn](https://docs.cockpit-project.org/cockpit-guide/latest/guide/cockpit-spawn.html),
and [channels](https://docs.cockpit-project.org/cockpit-guide/latest/guide/cockpit-channels.html).

That is not bureaucracy for its own sake. **A browser page is not automatically
privileged**, and a save button can have consequences on a real host. Asking one
good question early is often faster than repairing a confident assumption
later.

## A small team, not a single improviser

The architect is the coordinator. First, it reads the repository and turns the
request into requirements, risks, open questions, and acceptance criteria. Once
the important decisions are clear, it gives the same approved context to a
small set of specialists. Their work is deliberately complementary:

- **UI designer:** turns host state into accessible, responsive PatternFly
  structure with clear loading, empty, error, and theme states.
- **Backend advisor:** checks transport, lifecycle, privilege boundaries,
  validation, input safety, and failure behavior for commands, files, or APIs.
- **Plugin builder:** fits the implementation, dependencies, build output, and
  packaging into the target project's architecture.
- **Documentation and localization writers:** make the shipped behavior,
  installation, and user-facing text match the implementation and Cockpit
  conventions.
- **Integration tester and feedback reviewer:** examine the focused checks and
  the exact browser, service, or host evidence instead of guessing from a
  symptom.

The interesting part is the handoff. The backend advisor can say, “this action
requires administrative access, accepts only these inputs, and must distinguish
a failed command from an empty result.” The UI designer can turn that boundary
into a safe form and an honest status. The builder then connects both decisions
to the repository's actual transport and package layout. Documentation records
what really shipped, while the reviewer follows the loaded assets or reported
host behavior when something goes wrong.

The architect reconciles those contributions, keeps ownership disjoint, and
returns a coherent change rather than a pile of disconnected suggestions. This
arrangement lets agents work in parallel without turning the repository into a
merge-conflict science experiment. Patterns in the local
[catalog](.opencode/references/patterns.md) help teams start consistently, but
current source, tests, and official documentation remain the authority.

## Concrete outcomes, deliberately scoped

The examples show the range of system-facing work without pretending that one
example defines the suite.

### Valkey: service, metrics, and controlled operations

[`examples/valkey`](examples/valkey) is an MVP for Fedora 44 and Cockpit test
images, not a universal Valkey installer. Its manifest exposes Overview,
Configuration, and Message debugging tabs. The page can install the exact
`valkey` package through PackageKit, manage `valkey.service`, edit four
directives in `/etc/valkey/valkey.conf`, collect `INFO` metrics, operate on
database 0, and maintain a local `messages` list. It distinguishes service
status from internal Valkey status and treats an empty database as zero keys
without hiding real command failures
([example README](examples/valkey/README.md)).

Its limits are part of the result: it does not provide distribution detection,
password support, clustering, TLS, or backup and restore. The UI build requires
Node.js 22+ and npm 10+, and its generated stylesheet bundles the PatternFly v6
components it uses rather than assuming that `cockpit.js` injects CSS; **the API
and transport library does not provide a runtime global stylesheet**.

### Cockpit configuration: schema as a contract

[`examples/cockpit-config`](examples/cockpit-config) edits the active
`cockpit.conf` while preserving comments and unmanaged directives. It requires
Cockpit administrative access, uses conflict-aware `cockpit.file().modify()`,
and reports a successful file write separately from a failed
`cockpit.service` reload. Its checked-in
[`schema.json`](examples/cockpit-config/schema.json) defines editable options,
types, ranges, defaults, help, examples, and editability. The installed
`cockpit.conf(5)` page is only a non-blocking comparison for documentation drift;
it does not invent controls.

Together, these examples point to a method: expose a real interface, make
privilege and failure boundaries visible, and keep the scope honest. The same
method can guide a plugin for another service, a system API, D-Bus, a managed
file, or a carefully bounded administrative operation when the target
repository and host behavior support it.

## Evidence, then the next handoff

Verification is intentionally concise: the suite follows the target project's
documented checks and reports what actually ran, what was skipped, and what
remains environment-dependent. Tests can support a claim, but they do not by
themselves prove privileged or browser end-to-end integration. A later feedback
request should include the exact error, reproduction steps, service output, or
loaded asset evidence so agents can inspect the current diff instead of
guessing. The `/improve-cockpit-agents` command can turn a proven lesson into a
better suite rule without changing plugin source.

## Conclusion

AI does not remove the hard parts of Cockpit development. It can make those
parts easier to see, assign, and hand across a focused team. Bring a concrete
system need, its target repository, its host constraints, and the outcome you
want. The architect and specialists can then turn that input into inspected
decisions, bounded implementation, a coherent package, and an honest account of
what works.

Valkey and Cockpit configuration are illustrative outcomes, not the suite's
boundaries. With clear limits and continued maintainer feedback, cooperating
agents can make plugin development faster **without making it less careful**.
