# Cockpit configuration editor

This example package adds a **Cockpit configuration** tool for administrators.
It reads and edits the active `cockpit.conf`, preserving comments and
directives it does not manage, and reloads `cockpit.service` after a successful
save. A failed reload is reported separately from a failed save. If the file
does not exist, the first save creates it. Concurrent changes are handled by
Cockpit's conflict-aware `file.modify()` operation.

The page is exposed as **Cockpit configuration** in Cockpit's Tools menu. It
requires Cockpit administrative access: both the configuration file access and
the systemd D-Bus call request `superuser: "require"`.

## Build and test

The package requires Node.js 22+ and npm 10+. From this directory:

```sh
node --version
npm --version
npm run test
npm run build
```

The build uses the adjacent Cockpit checkout's compatible dependencies when
available (`../../../node_modules`); it does not require `node_modules` to be
copied into this package. It emits the package-local `cockpit-config.css`,
`cockpit-config-theme.js`, and `cockpit-config.bundle.js` runtime artifacts.

Install for a development session by linking this directory below
`$HOME/.local/share/cockpit/cockpit-config`, or copy it to the host's
`/usr/share/cockpit/cockpit-config`. The package manifest exposes the tool in
Cockpit's Tools menu. See the [Cockpit package guide][packages] for package
layout and discovery rules.

## Configuration discovery

On load, the page discovers the schema from the installed `cockpit.conf(5)` man
page by running `man -P cat cockpit.conf` with the C locale. Options found in
the rendered man page but not already in the built-in schema are added as
read-only options. If the command is unavailable or cannot be rendered, the
page reports the discovery failure while loading and uses the conservative
built-in schema instead; it never guesses an option type or edit safety from
failed discovery.

The active file starts at `/etc/cockpit/cockpit.conf`. If `XDG_CONFIG_DIRS` is
set, its non-empty colon-separated directories are also checked for
`cockpit/cockpit.conf`; the first existing candidate in that order is selected.
Unreadable or missing candidates are skipped. The selected path is shown on
the page. This package does not check `XDG_CONFIG_HOME`, and does not migrate
or merge multiple configuration files.

## Editing and validation

Only options with a known safe type are editable. The built-in editable set is
boolean options and bounded integer options. Boolean values accept `true`,
`false`, `yes`, `no`, `1`, and `0`. Integer fields accept whole numbers within
the range shown by the field. The page supplies option-specific help, security
notes where applicable, and examples such as `15` or
`https://example.com` as placeholders.

Free-form, security-sensitive, or otherwise ambiguous options are displayed in
the **Read-only** tab rather than being made editable. Dynamically discovered
options are also read-only because their type and safety are not established.
This is intentional: the tool is not a general-purpose editor for every
`cockpit.conf(5)` directive.

Saving changes only managed options. Existing comments, unknown directives,
line endings, and inline comments are preserved; absent managed sections or
keys are added, and a missing file is created. A duplicate managed section or
directive blocks the save rather than choosing which value to overwrite.
`file.modify()` also protects against an external change between reading and
writing; a conflict is reported as a failed save and the file is not silently
overwritten. A failed save leaves the configuration unchanged.

## Reload and limitations

After a successful file write, the page calls systemd's `ReloadUnit` for
`cockpit.service` with the `replace` mode. If the write succeeds but reload
fails (for example, because an appropriate `ExecReload` is unavailable), the
page reports **saved, but reload failed**; the saved file is not rolled back.
Reloading Cockpit can interrupt the current session, including the page being
used. This action is intentional and has no additional confirmation dialog.

This is an example package, not an RPM or distribution integration. It edits
only the active path selected by the rules above; it does not edit alternate
XDG configuration locations not selected, combine files, or provide a
general-purpose editor for unknown directives. Browser/integration testing
against a real privileged Cockpit host is not included.

For API background, see Cockpit's [`cockpit.file` documentation][file-api],
including its atomic `modify()` behavior. The package's implementation is the
authority for the project-specific behavior described above.

[file-api]: https://docs.cockpit-project.org/cockpit-guide/latest/guide/cockpit-file.html
[packages]: https://docs.cockpit-project.org/cockpit-guide/latest/guide/packages.html
