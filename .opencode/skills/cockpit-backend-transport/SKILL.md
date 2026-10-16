---
name: cockpit-backend-transport
description: Choose and safely implement a Cockpit backend transport with explicit privilege and lifecycle behavior
---

Inspect the target's current service architecture and Cockpit API version. Record why the suitable transport is DBus, direct `cockpit.spawn()` with an argument array, `cockpit.script()`, or a low-level channel/bridge; do not use shell strings as a shortcut. Address privilege/authentication, validation and secrets, cancellation/disposal, error mapping, and progress/timeouts for long operations. Keep authorization in the trusted boundary and do not assume browser code is privileged.

Use current docs: [DBus](https://docs.cockpit-project.org/cockpit-guide/latest/guide/cockpit-dbus.html), [spawn](https://docs.cockpit-project.org/cockpit-guide/latest/guide/cockpit-spawn.html), [channels](https://docs.cockpit-project.org/cockpit-guide/latest/guide/cockpit-channels.html), and [packages](https://docs.cockpit-project.org/cockpit-guide/latest/guide/packages.html). The local `../examples/pinger/` and `../pkg/systemd/terminal.jsx` are references to inspect, not prescriptions.

For configuration editors, prefer `cockpit.file`'s conflict-aware `modify()` when preserving an existing file, and map duplicate/modify conflicts to a failed save rather than silently overwriting. If a successful write is followed by a service reload (for example, `ReloadUnit`), report reload failure separately; never imply that the saved file was rolled back. When runtime discovery is unavailable or version-dependent, use a conservative known schema or optional defaults, keep warnings non-fatal, and do not guess editability or hide real command failures.
