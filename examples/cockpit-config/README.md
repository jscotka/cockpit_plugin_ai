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

## Prerequisites

The target host must have Cockpit installed, including its JavaScript API
package (`base1`). The user opening the page must be allowed to obtain
Cockpit administrative access. This example requires administrator
authorization to read and write the active configuration file and to reload
`cockpit.service`; saving a change can therefore interrupt the current
Cockpit session.

For development, building the package requires Node.js 22+ and npm 10+.

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

## Install into Cockpit

Cockpit packages are directories containing a `manifest.json`. This example's
manifest registers the **Cockpit configuration** tool and points it at
`cockpit-config.html`; that page loads the adjacent JavaScript and CSS assets.
These instructions install an example package, not an RPM or other
distribution package.

### Developer or current-user install

From the repository root, run these commands as the user who will log in to
Cockpit:

```sh
cd examples/cockpit-config
mkdir -p -- "$HOME/.local/share/cockpit"
ln -s -- "$PWD" "$HOME/.local/share/cockpit/cockpit-config"
```

The symlink keeps Cockpit pointed at the checkout. To install a copy instead,
use the following in place of `ln`:

```sh
mkdir -p -- "$HOME/.local/share/cockpit/cockpit-config"
cp -a -- . "$HOME/.local/share/cockpit/cockpit-config/"
```

This applies to that user's Cockpit session. The package is discovered from
the user's XDG data directory before system package directories.

### System-wide install

To make the example available to all users, an administrator can copy the
complete directory into the host's Cockpit package data directory. The usual
directory is `/usr/share/cockpit`; use the installation's actual data
directory if it differs:

```sh
cd examples/cockpit-config
sudo install -d -m 0755 -- /usr/share/cockpit/cockpit-config
sudo cp -a -- . /usr/share/cockpit/cockpit-config/
```

Review the source and ownership before a system-wide install. Do not use this
as a substitute for a reviewed RPM or distribution package, and do not modify
a system-installed copy while Cockpit is running because system packages may
be cached.

### Verify discovery and open the tool

On the target host, run:

```sh
cockpit-bridge --packages
```

Confirm that the `cockpit-config` package appears for the user whose session
you will use. Reload the Cockpit page if it does not appear immediately; for
a system-wide install, logging out and in again may also be necessary. Then
open **Cockpit configuration** under **Tools**.

The installed directory must contain the generated runtime assets
`cockpit-config.css`, `cockpit-config-theme.js`, and
`cockpit-config.bundle.js`, in addition to `manifest.json` and
`cockpit-config.html`. If they are absent, run `npm run build` from this
directory before installing or copy the rebuilt package. The build emits
these package-local files; `node_modules` does not need to be copied.

### Uninstall or undo

To remove a developer symlink, remove only the link and keep the checkout:

```sh
rm -- "$HOME/.local/share/cockpit/cockpit-config"
```

For a developer copy, remove the copied directory instead:

```sh
rm -r -- "$HOME/.local/share/cockpit/cockpit-config"
```

To undo the system-wide copy, first verify that the dedicated directory is
not owned by a distribution package, then remove it with administrator
privileges:

```sh
sudo rm -r -- /usr/share/cockpit/cockpit-config
```

See the [Cockpit package guide][packages] for package layout, discovery, and
cache behavior.

## Schema and documentation drift

[`schema.json`](schema.json) is the authoritative manifest for the controls
that the page renders. It defines the sections and options, each option's
type, integer range and default where applicable, help text, examples (or
placeholder), and whether it is editable. All schema-defined options in this
package are editable, and the manifest records the rationale for that
decision. The manifest is validated when the bundled
JavaScript is loaded and is included in `cockpit-config.bundle.js`; the
installed page has no runtime YAML dependency.

The page may render the installed `cockpit.conf(5)` man page with
`man -P cat cockpit.conf` using the C locale, but this is only a comparison for
documentation drift warnings. The man page never supplies controls, option
types, defaults, ranges, or editability. A missing, malformed, or mismatching
man page therefore does not change the controls, and a mismatch is
non-blocking. Ambiguous values are not dynamically added from man-page text:
the schema remains authoritative, and newly documented options are not
automatically added to the editor.

### Updating the schema for a Cockpit version

When supporting a newer Cockpit version, compare that version's
`cockpit.conf(5)` documentation with `schema.json`, then update the checked-in
manifest deliberately:

* Add, remove, or revise entries and their help, examples, defaults, and
  security rationale to match the supported version.
* Use `boolean` only for the accepted boolean spellings and `integer` only with
  explicit safe `min` and `max` bounds. Every schema option in this example is
  editable, so add or change an option only together with an explicit validator
  and an updated security rationale.
* Increment `schemaRevision` and update `compatibility` when the manifest
  contract changes. Keep the source description identifying `cockpit.conf(5)`
  as comparison-only.
* Run `npm run test` and `npm run build` in this directory. Install or deploy
  the rebuilt `cockpit-config.bundle.js` together with the other generated
  runtime assets; do not edit the bundle by hand.

The tests validate malformed and unsafe manifests, and the build bundles the
JSON manifest. On a target host, a drift warning after an update is a prompt
to review the manifest; it is not a mechanism for inferring new UI behavior.

The active file starts at `/etc/cockpit/cockpit.conf`. If `XDG_CONFIG_DIRS` is
set, its non-empty colon-separated directories are also checked for
`cockpit/cockpit.conf`; the first existing candidate in that order is selected.
Unreadable or missing candidates are skipped. The selected path is shown on
the page. This package does not check `XDG_CONFIG_HOME`, and does not migrate
or merge multiple configuration files.

## Editing and validation

All 21 options currently defined by [`schema.json`](schema.json) are editable.
The page presents one **Configuration options** view. It renders one card per
schema section in this order: **[WebService]**, **[Session]**, **[Log]**, and
**[OAuth]**; options within each card follow their order in the schema. There
is no **Read-only** tab or read-only grid. The schema is the complete scope of the
editor: directives not listed there are not rendered or changed. This is not a
general-purpose editor for every `cockpit.conf(5)` directive.

Every editable option has an explicit, type-aware validator. Boolean options are
checkboxes and accept `true`,
`false`, `yes`, `no`, `1`, and `0`; integer fields accept whole numbers within
the range shown by the field. Text and structured values are bounded and use
these option-specific validation categories:

* **Origins**: space-separated HTTP(S) origins with a scheme and
  host.
* **Proxy headers**: HTTP header names for `ProtocolHeader` and
  `ForwardedForHeader`.
* **URL and path**: HTTP(S) URLs for OAuth, URL-root paths other than the
  reserved `/cockpit` and `/cockpit++`, relative URL paths, and absolute
  filesystem paths.
* **OAuth**: HTTP(S) provider URLs and parameter names using a strict token
  grammar.
* **Fatal list**: a space-separated list containing only `criticals` and
  `warnings`.
* **MaxStartups**: either a number up to `4294967295`, or
  `start:rate:full`, with `rate` from 1 to 100 and `start` no greater than
  `full`.

The remaining text option (`LoginTitle`) rejects control characters and comment
characters. Values may be empty only where the schema allows unsetting them.
Validation happens before saving, and invalid fields are highlighted instead of
being written. The page displays a general security warning, and option help
text includes a warning where changing a value can affect authentication, trust
boundaries, availability, routing, or information disclosure.

Changing origins, proxy headers, authentication, OAuth, or URL/path settings
can lock you out, redirect authentication, expose trust boundaries, or disrupt
the current session. Other settings can affect availability or disclose a
banner file. Review the option-specific security notes before saving; changes
are applied immediately and there is no additional confirmation dialog.

Saving changes only schema-managed options. Existing comments, unknown directives,
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
