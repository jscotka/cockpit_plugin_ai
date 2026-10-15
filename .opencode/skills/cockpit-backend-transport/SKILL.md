---
name: cockpit-backend-transport
description: Choose and safely implement a Cockpit backend transport with explicit privilege and lifecycle behavior
---

Inspect the target's current service architecture and Cockpit API version. Record why the suitable transport is DBus, direct `cockpit.spawn()` with an argument array, `cockpit.script()`, or a low-level channel/bridge; do not use shell strings as a shortcut. Address privilege/authentication, validation and secrets, cancellation/disposal, error mapping, and progress/timeouts for long operations. Keep authorization in the trusted boundary and do not assume browser code is privileged.

Use current docs: [DBus](https://docs.cockpit-project.org/cockpit-guide/latest/guide/cockpit-dbus.html), [spawn](https://docs.cockpit-project.org/cockpit-guide/latest/guide/cockpit-spawn.html), [channels](https://docs.cockpit-project.org/cockpit-guide/latest/guide/cockpit-channels.html), and [packages](https://docs.cockpit-project.org/cockpit-guide/latest/guide/packages.html). The local `../examples/pinger/` and `../pkg/systemd/terminal.jsx` are references to inspect, not prescriptions.
