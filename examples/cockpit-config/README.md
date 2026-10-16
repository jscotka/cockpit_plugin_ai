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
