# Redis Cockpit example

This directory contains a zero-build Cockpit package for a small Redis
management page. It is an MVP intended for Fedora-like systems and Cockpit
test images, not a general cross-distribution Redis installer.

## Prerequisites

The target host must provide:

- Cockpit and its JavaScript API package (`base1`)
- PackageKit, with access to a repository containing the `redis` package
- the Fedora-like Redis layout used by this example: `redis.service`,
  `/etc/redis/redis.conf`, and `redis-cli`

The page uses administrator privileges for PackageKit, systemd, and the Redis
configuration file. The logged-in user must be allowed to obtain those
privileges in Cockpit.

## Install into Cockpit

Cockpit packages are directories containing a `manifest.json`. The manifest in
this directory registers the `redis` package's **Redis** tool at
`redis.html`; the HTML loads the adjacent JavaScript and CSS files.

The following installs this example as a package named `redis`; it does not
create or install a distribution package or RPM.

### Developer or current-user install

From the repository root, run the following as the user who will log in to
Cockpit:

```sh
cd examples/redis
mkdir -p -- "$HOME/.local/share/cockpit"
ln -s -- "$PWD" "$HOME/.local/share/cockpit/redis"
```

The symlink keeps Cockpit pointed at the checkout. To copy the example
instead, use the following in place of `ln`:

```sh
mkdir -p -- "$HOME/.local/share/cockpit/redis"
cp -a -- . "$HOME/.local/share/cockpit/redis/"
```

This is a per-user install and applies to that user's Cockpit session. Cockpit
searches the XDG package data directories, with the user's data directory
taking precedence over system data directories. Open Cockpit and select
**Redis** under **Tools** after installing.

### System-wide install

To make the example available to users of a host, an administrator can copy
the complete directory into the system's Cockpit package data directory. The
usual directory is `/usr/share/cockpit`; use the installation's actual
Cockpit data directory if it is different:

```sh
cd examples/redis
sudo install -d -m 0755 -- /usr/share/cockpit/redis
sudo cp -a -- . /usr/share/cockpit/redis/
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

Confirm that the `redis` package appears for the user whose session you will
use. If it does not appear immediately, reload the Cockpit page; for a
system-wide install, log out and in again as well if necessary.

To remove the developer symlink, remove only the link (not the checkout):

```sh
rm -- "$HOME/.local/share/cockpit/redis"
```

For a developer copy, remove the copied directory instead:

```sh
rm -r -- "$HOME/.local/share/cockpit/redis"
```

To undo the system-wide copy, first verify that this dedicated directory is
not owned by a distribution package, then remove it with administrator
privileges:

```sh
sudo rm -r -- /usr/share/cockpit/redis
```

The Fedora-like Redis assumptions in this example still apply after the
Cockpit package is installed: the host must provide the `redis` package,
`redis.service`, `/etc/redis/redis.conf`, and `redis-cli`.

## Load the package

The page checks PackageKit for the exact package name `redis`. If it is not
installed, choose **Install Redis** and confirm the administrator operation.

## What it does

After installation, the page can:

- display and refresh the state of `redis.service`;
- start, stop, and restart the service;
- edit these directives in `/etc/redis/redis.conf`: `port`, `bind`,
  `protected-mode`, and `maxmemory`;
- query `redis-cli INFO` for instantaneous operations per second, connected
  clients, and used memory.

Configuration edits preserve other file content and replace or append only the
four managed directives. Duplicate managed directives are rejected without a
change. Values are validated before saving: ports are 1–65535, protected mode
is `yes` or `no`, bind values must be a valid IPv4/IPv6 address, hostname,
`localhost`, or wildcard address, and maxmemory is a non-negative integer with
an optional `B`, `KB`, `MB`, `GB`, or `TB` suffix.

Saving changes writes the system configuration but does not restart Redis.
Restart the service for the changes to take effect. Installing the package and
saving configuration require confirmation; start/stop/restart operations also
change the host service and require administrator privileges.

Metrics are collected every five seconds while the page is open, with recent
values shown as sparklines. Metrics require a running, reachable Redis
instance. For a wildcard bind, the page queries the local address
`127.0.0.1`.

## Scope and limitations

This example intentionally assumes the Fedora-like Redis naming and paths
listed above. It does not:

- detect distributions or alternate package layouts;
- support systems that package the server under the `valkey` name;
- configure or prompt for Redis authentication/passwords;
- provide broad distribution support, backup/restore, clustering, TLS, or
  advanced Redis configuration.

Do not expose Redis by changing `bind` or protected mode without understanding
the network and security consequences. This page does not add authentication
or firewall rules.

## Troubleshooting

- **Package check or installation fails:** verify that PackageKit is running,
  the user can obtain administrator privileges, and an enabled repository
  provides the exact `redis` package. PackageKit operations time out after 30
  seconds.
- **The service is unavailable:** confirm that `redis.service` exists and
  inspect its systemd status and journal. Metrics remain unavailable until the
  service is running.
- **Configuration will not save:** check `/etc/redis/redis.conf` for duplicate
  `port`, `bind`, `protected-mode`, or `maxmemory` directives and correct the
  file with appropriate administrator access.
- **Metrics fail:** confirm that `redis-cli` is installed and that the
  configured port and bind address reach Redis. Password-protected Redis is
  outside this example's supported scope.

Browser and integration coverage for this page is not defined here. Such
checks depend on the adjacent Cockpit repository's test-image and test
workflow; run them only according to that repository's current instructions.

## References

- [Cockpit packages guide](https://docs.cockpit-project.org/cockpit-guide/latest/guide/packages.html)
