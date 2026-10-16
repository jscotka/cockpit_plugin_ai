# From product idea to Cockpit plugin: a local AI-agent suite

Building a Cockpit plugin is not just a matter of producing a page and calling
an API. A useful page has to fit an existing repository, respect privilege and
data ownership, survive version differences, ship its assets correctly, and be
verifiable on the host where it will run. This repository's project-local
OpenCode suite is designed around that reality. It is tooling and guidance—not
a plugin runtime—and adds no dependency to the plugin being built
([README.md](README.md)).

Its purpose is to turn a product request into inspected, bounded work while
keeping the adjacent Cockpit checkout a read-only reference unless a user
explicitly authorizes otherwise. That boundary is important: it protects the
target repository from accidental framework changes, while still making current
Cockpit source and the [official guide](https://docs.cockpit-project.org/cockpit-guide/latest/guide/)
available as sources of truth.

## A workflow built around evidence

The entry point is `/cockpit-plugin`. The request should name the target
repository by absolute path, desired behavior, important states, security or
privilege constraints, supported versions, and acceptance criteria. The command
assigns the primary architect, whose documented sequence is discovery →
requirements and acceptance criteria → parallel specialist decisions → bounded
implementation → localization, documentation, and tests → verification
([.opencode/command/cockpit-plugin.md](.opencode/command/cockpit-plugin.md),
[.opencode/agent/cockpit-plugin-architect.md](.opencode/agent/cockpit-plugin-architect.md)).

Discovery comes first. The architect reads the target's instructions,
dependencies, architecture, UI, transport, tests, and packaging rather than
assuming a starter-kit layout. Critical questions—administrator authorization,
secret handling, persistence, destructive actions, data ownership, or a
significant architectural choice—are clarified before implementation. Less
critical assumptions are recorded. This is a practical safety mechanism, not
ceremony: browser JavaScript is not automatically privileged, and a save or
activation action can change a live host.

The architect then gives bounded specialists the same approved context and
disjoint ownership. The UI designer addresses component structure,
accessibility, responsive and theme states. The backend advisor chooses a
transport and lifecycle, with explicit signatures, validation, cancellation,
privilege, and error mapping. The plugin builder owns implementation,
dependencies, packaging, and build output. Localization, documentation, and
integration-testing specialists work after implementation inputs are ready;
their lanes may run in parallel only when files do not overlap. A feedback
reviewer starts from exact symptoms and loaded package or asset evidence, while
the agent maintainer extracts only reusable lessons into the suite itself.

This cooperation model makes evidence part of the interface between agents.
The local [pattern catalog](.opencode/references/patterns.md) is explicit that
patterns are checklists, not substitutes for source, tests, or current docs.
The result should therefore say which behavior is implemented, which check was
run, which host-dependent check is unavailable, and which recommendation is
still planned. It should never turn an attractive assumption into a claim of
browser or privileged integration coverage.

## What the examples demonstrate

The two examples make the suite's goals concrete rather than hypothetical.

### Valkey: a deliberately scoped management page

[`examples/valkey`](examples/valkey) is an MVP for Fedora 44 and Cockpit test
images, not a universal Valkey installer. Its package manifest exposes a
three-tab page: Overview, Configuration, and Message debugging. The page can
install the exact `valkey` package through PackageKit, manage
`valkey.service`, edit four directives in `/etc/valkey/valkey.conf`, collect
metrics with `INFO`, operate on database 0, and maintain a `messages` list. It
uses fixed argument arrays for writes and separates service status from
internal Valkey status. Empty database sections are handled as zero keys, while
real command failures remain errors ([examples/valkey/README.md](examples/valkey/README.md)).

It also shows how an example documents its limits: no distribution detection,
password support, clustering, TLS, or backup/restore. The build requires
Node.js 22 or newer and npm 10 or newer, and produces the runtime stylesheet
from `valkey.scss`. The stylesheet deliberately bundles the needed PatternFly
v6 components without shell page rules. That choice reflects a key repository
lesson: `cockpit.js` provides APIs and transport; it does not inject Cockpit or
PatternFly CSS.

### Cockpit configuration: schema as an executable contract

[`examples/cockpit-config`](examples/cockpit-config) edits the active
`cockpit.conf` while preserving comments and unmanaged directives. It uses
conflict-aware `cockpit.file().modify()`, requires administrative access, and
reports a successful file write separately from a failed `cockpit.service`
reload. Its checked-in [`schema.json`](examples/cockpit-config/schema.json) is
authoritative for the 21 editable options: sections, types, ranges, defaults,
help, examples, and editability. The installed `cockpit.conf(5)` man page is
only a non-blocking drift comparison; it never invents controls or types.

That design addresses schema drift directly. Validators cover booleans,
bounded integers, origins, proxy headers, URLs and paths, OAuth values, lists,
and other structured settings. Duplicate managed entries and external write
conflicts block a save instead of silently selecting a value. Security notes
warn that authentication, origins, routing, and URL or path changes can lock
users out or alter trust boundaries. The package also retains a complete
generated asset set and documents discovery through `cockpit-bridge --packages`
([examples/cockpit-config/README.md](examples/cockpit-config/README.md)).

## Problems the workflow expects to catch

Several recurring issues are encoded in [AGENTS.md](AGENTS.md) and the skills.
First, CSS is not a runtime global. A plain HTML page must bundle matching
PatternFly component CSS or provide a small scoped layer. Shell-oriented
`page.scss` and Page CSS can impose a sidebar or grid geometry on a page that
does not have the complete Page DOM. The recommended iteration is to choose a
unique root and full-width main and panels, preserve focus, disabled, error,
dark, responsive, and narrow states, then inspect emitted selectors and—when
available—perform actual rendered geometry checks. Static class names are not
enough.

Second, HTML, JavaScript, CSS, and theme files are one deployable revision. A
stale browser cache or a package copied without its regenerated CSS can look
like a source defect. The suite recommends revision markers, asset-contract
checks, atomic installation, reload guidance, and evidence about the loaded
package before changing code. The configuration example's complete generated
asset set and DOM-contract checks make this principle concrete.

Third, APIs and hosts vary. Valkey's optional INFO fields and empty DB sections
must not turn a reachable service into a failure. Cockpit configuration's
schema, parser, and service-reload behavior must be verified rather than
guessed. Privilege requests and secrets need an explicit policy. The backend
skill points to the current
[D-Bus](https://docs.cockpit-project.org/cockpit-guide/latest/guide/cockpit-dbus.html),
[spawn](https://docs.cockpit-project.org/cockpit-guide/latest/guide/cockpit-spawn.html),
and [channels](https://docs.cockpit-project.org/cockpit-guide/latest/guide/cockpit-channels.html)
documentation for those decisions.

Finally, asynchronous UI failures are not interchangeable. Save must stay
disabled until a successful load; required DOM nodes should fail early, while
optional status nodes need defensive fallbacks. A successful write followed by
a failed refresh or render must remain a reported write success. Generated
asset mismatch, missing initialization elements, schema drift, and duplicate
configuration entries should be diagnosable instead of masked by a secondary
null-node exception.

## Lessons learned and next iterations

The strongest lesson is that an AI team is most useful when its autonomy is
constrained by repository evidence. Disjoint ownership reduces accidental
overwrites; acceptance criteria make specialist advice comparable; and explicit
limits prevent a unit test from being described as a browser proof. A second
lesson is that packaging and documentation are part of the feature. The
examples document Node/npm prerequisites, development and system installation,
package discovery, complete generated assets, reload or cache behavior, and
removal—distinguishing an example package from an RPM or distribution package.

The next iterations should deepen, not broaden, this discipline: add focused
asset and DOM-contract checks where a package has a build; verify generated CSS
selectors and narrow geometry; expand host-matrix checks for supported API
versions; and capture exact loaded asset IDs in regression reports. Browser and
privileged integration remains environment-dependent, so those checks should
be run on disposable, suitable hosts and reported separately. The
`/improve-cockpit-agents` command is the intended feedback loop: after a
meaningful task, feed it the final diff and validation evidence so maintainers
can generalize a proven lesson without changing plugin source.

## Conclusion

This suite does not promise that AI removes the hard parts of Cockpit work. It
offers a repeatable way to expose those hard parts early: inspect first, ask
about risk, assign narrow responsibilities, implement against current APIs,
ship a coherent package, and verify what the evidence actually supports. The
Valkey and Cockpit configuration examples show two useful forms of that
discipline—scoped operations and an authoritative configuration contract. Used
with honest limits and continued maintainer feedback, the suite can make plugin
development faster without making it less careful.
