# Valkey Cockpit example

This directory contains a Cockpit package for a small Valkey
management page. It is an MVP intended for Fedora 44 and Cockpit test images,
not a general cross-distribution Valkey installer.

## Build the UI

The UI build requires Node.js 22+ and npm 10+. On Fedora, install them with:

```sh
sudo dnf install -y nodejs npm
```

Other distributions can use their equivalent package manager; package names
and available versions may differ. From this directory, verify the tools and
build the UI:

```sh
node --version
npm --version
npm run build
```

The example has a small local dependency set because the adjacent Cockpit
checkout may have stale dependencies. For a clean checkout, install it from
this directory with:

```sh
npm ci
```

The build uses the local pinned esbuild, esbuild-sass-plugin, Sass, and
PatternFly packages.
The stylesheet is standalone: it bundles the PatternFly v6 base and components
used by the page, but does not load Cockpit shell layout rules, shared
`page.scss`, or `ct-card`.
Do not run an example-local install in the parent Cockpit repository.

The build generates `valkey.css` from `valkey.scss`. `valkey.css` is required
at runtime, so regenerate it whenever the SCSS changes and follow the
repository policy for generated files. A missing Node.js/npm executable or an
unsupported version is a tooling problem; errors after the build starts are
source or build failures and should be reported separately.

## Prerequisites

The target host must provide:

- Cockpit and its JavaScript API package (`base1`)
- PackageKit, with access to a repository containing the `valkey` package
- the Fedora 44 Valkey layout used by this example: `valkey.service`,
  `/etc/valkey/valkey.conf`, and `valkey-cli`

The page uses administrator privileges for PackageKit, systemd, and the Valkey
configuration file. The logged-in user must be allowed to obtain those
privileges in Cockpit.

## Install into Cockpit

Cockpit packages are directories containing a `manifest.json`. The manifest in
this directory registers the `valkey` package's **Valkey** tool at
`valkey.html`; the HTML loads the adjacent JavaScript and CSS files.

The following installs this example as a package named `valkey`; it does not
create or install a distribution package or RPM.

### Developer or current-user install

From the repository root, run the following as the user who will log in to
Cockpit:

```sh
cd examples/valkey
mkdir -p -- "$HOME/.local/share/cockpit"
ln -s -- "$PWD" "$HOME/.local/share/cockpit/valkey"
```

The symlink keeps Cockpit pointed at the checkout. To copy the example
instead, use the following in place of `ln`:

```sh
mkdir -p -- "$HOME/.local/share/cockpit/valkey"
cp -a -- . "$HOME/.local/share/cockpit/valkey/"
```

This is a per-user install and applies to that user's Cockpit session. Cockpit
searches the XDG package data directories, with the user's data directory
taking precedence over system data directories. Open Cockpit and select
**Valkey** under **Tools** after installing.

### System-wide install

To make the example available to users of a host, an administrator can copy
the complete directory into the system's Cockpit package data directory. The
usual directory is `/usr/share/cockpit`; use the installation's actual
Cockpit data directory if it is different:

```sh
cd examples/valkey
sudo install -d -m 0755 -- /usr/share/cockpit/valkey
sudo cp -a -- . /usr/share/cockpit/valkey/
```

This preserves `manifest.json` and the adjacent HTML, JavaScript, and CSS
assets. Installing arbitrary source into `/usr/share/cockpit` is an
administrator action: review the source and ownership before doing it, and do
not treat this as a substitute for a reviewed distribution package. System
packages can be cached by Cockpit, so avoid changing a system-installed copy
while Cockpit is running.

### Verify and undo the install

On the target host, run:

```sh
cockpit-bridge --packages
```

Confirm that the `valkey` package appears for the user whose session you will
use. If it does not appear immediately, reload the Cockpit page; for a
system-wide install, log out and in again as well if necessary.

To remove the developer symlink, remove only the link (not the checkout):

```sh
rm -- "$HOME/.local/share/cockpit/valkey"
```

For a developer copy, remove the copied directory instead:

```sh
rm -r -- "$HOME/.local/share/cockpit/valkey"
```

To undo the system-wide copy, first verify that this dedicated directory is
not owned by a distribution package, then remove it with administrator
privileges:

```sh
sudo rm -r -- /usr/share/cockpit/valkey
```

The Fedora 44 Valkey assumptions in this example still apply after the
Cockpit package is installed: the host must provide the `valkey` package,
`valkey.service`, `/etc/valkey/valkey.conf`, and `valkey-cli`.

## Load the package

The page checks PackageKit for the exact package name `valkey`. If it is not
installed, choose **Install Valkey** and confirm the administrator operation.

The page is organized into three keyboard-accessible tabs:

1. **Overview** contains installation, service status and actions, internal
   Valkey status, live metric graphs, and **Refresh all**.
2. **Configuration** contains the values read from
   `/etc/valkey/valkey.conf`, plus configuration refresh and save.
3. **Message debugging** contains database 0 key operations and the `messages`
   list, including its filter, refresh, and Store message form.

Use Tab to focus the tab list, Arrow Left/Right or Home/End to move between
tabs, and Enter or Space to activate one. Changing tabs does not contact the
backend, and form contents (including unsaved configuration) remain in place.

## What it does

After installation, the page can:

- explain that Valkey is an in-memory key-value database and that this page
  manages the Fedora service, its configuration, database 0 keys, and the
  local messages list across the three tabs;
- display and refresh the state of `valkey.service`;
- start, stop, and restart the service;
- edit these directives in `/etc/valkey/valkey.conf`: `port`, `bind`,
  `protected-mode`, and `maxmemory`;
- query `valkey-cli INFO` for instantaneous operations per second, connected
  clients, used memory, uptime, the database 0 key count, and (when reported)
  peak memory and memory fragmentation. If `INFO` omits the database 0 keyspace
  line because it is empty, the internal status reports 0 keys. This internal
  status is separate from the systemd service status.

### Database 0 key operations

The key form operates only on database 0. It accepts a non-empty key (maximum
256 UTF-8 bytes, with no NUL) and a free-form text value (maximum 1 MiB, with
no NUL). JSON is plain text and is not parsed or reformatted. Read uses
`valkey-cli --raw -n 0 GET`; an additional `EXISTS` request distinguishes a
missing key from an existing empty value. Write and delete use fixed argument
arrays for `SET` and `DEL` and require Cockpit administrator authorization.
Delete confirms the action and reports whether Valkey deleted a key. Reads do
not require administrator authorization.

### Messages

The page treats the local Valkey database 0 list key named `messages` as its
message source. Enter a message in the **Message** field and choose **Store
message** to prepend it with
`valkey-cli --raw -n 0 LPUSH messages <message>`. The input must be non-empty,
contain no NUL character, and be no larger than 1 MiB. The page then refreshes
the last 10 entries and the internal key count. It runs
`valkey-cli --raw -n 0 LRANGE messages -10 -1` and displays those last 10 list
entries. A case-insensitive substring filter is applied in the browser to the
already-loaded entries; it does not run another command. The section has its
own refresh button, and the page refresh also refreshes it. It does not use
pub/sub or enumerate keys.

The `messages` key must already be a Valkey list. If it exists as another type,
the page reports the problem and does not overwrite it; change or delete that
key using an appropriate Valkey operation before storing messages.

### Refresh and states

**Refresh all** reloads service status, internal Valkey status, configuration,
metrics, and messages. Loading, empty, and error states are shown for the
corresponding sections. Configuration values are loaded from the current
`/etc/valkey/valkey.conf`; if any configuration field has been edited locally,
**Refresh configuration** reports a warning instead of replacing local edits.
Saving uses the
existing concurrency-safe `cockpit.file().modify()` operation and does not
restart the service. The separate messages refresh does not alter the key form
or configuration form.

Configuration edits preserve other file content and replace or append only the
four managed directives. Duplicate managed directives are rejected without a
change. Values are validated before saving: ports are 1–65535, protected mode
is `yes` or `no`, bind values must be a valid IPv4/IPv6 address, hostname,
`localhost`, or wildcard address, and maxmemory is a non-negative integer with
an optional `B`, `KB`, `MB`, `GB`, or `TB` suffix.

Saving changes writes the system configuration but does not restart Valkey.
Restart the service for the changes to take effect. Installing the package and
saving configuration require confirmation; start/stop/restart operations also
change the host service and require administrator privileges.

Metrics are collected every five seconds while the page is open, with recent
values shown as sparklines. Metrics require a running, reachable Valkey
instance. For a wildcard bind, the page queries the local address
`127.0.0.1`.

## Scope and limitations

This example intentionally assumes the Fedora 44 Valkey naming and paths
listed above. It does not:

- detect distributions or alternate package layouts;
- configure or prompt for Valkey authentication/passwords;
- guarantee an atomic missing-versus-empty result for reads: the empty `GET`
  case uses a separate `EXISTS` request, so a concurrent change can still race;
- provide broad distribution support, backup/restore, clustering, TLS, or
  advanced Valkey configuration.

Do not expose Valkey by changing `bind` or protected mode without understanding
the network and security consequences. This page does not add authentication
or firewall rules.

## Troubleshooting

- **Package check or installation fails:** verify that PackageKit is running,
  the user can obtain administrator privileges, and an enabled repository
  provides the exact `valkey` package. PackageKit operations time out after 30
  seconds.
- **The service is unavailable:** confirm that `valkey.service` exists and
  inspect its systemd status and journal. Metrics remain unavailable until the
  service is running.
- **Configuration will not save:** check `/etc/valkey/valkey.conf` for duplicate
  `port`, `bind`, `protected-mode`, or `maxmemory` directives and correct the
  file with appropriate administrator access.
- **Metrics fail:** confirm that `valkey-cli` is installed and that the
  configured port and bind address reach Valkey. Password-protected Valkey is
  outside this example's supported scope.

Browser and integration coverage for this page is not defined here. Such
checks depend on the adjacent Cockpit repository's test-image and test
workflow; run them only according to that repository's current instructions.

## References

- [Cockpit packages guide](https://docs.cockpit-project.org/cockpit-guide/latest/guide/packages.html)
