---
name: cockpit-plugin-workflow
description: Discover, scope, implement, and verify Cockpit plugin changes using the target repository's current conventions
---

Start with the target repository's AGENTS.md, package manifest, dependencies, source, tests, and packaging. Confirm that the task is a plugin change and do not assume this suite implements one. Use current official Cockpit docs and maintained source in `../` as sources of truth. Ask about critical privilege, security, destructive-action, data, or architecture unknowns before implementation; record other assumptions.

Sequence work as discovery → requirements and acceptance criteria → parallel UI/backend decisions where relevant → bounded implementation → gettext/docs/tests → verification. Assign distinct file ownership to each writer. Never edit `../` unless explicitly authorized. Use the specific workflow skills for UI, backend transport, build/package, docs, localization, and integration checks.

Useful local examples and source: `../examples/pinger/`, `../pkg/networkmanager/`, `../pkg/networkmanager/plots.js`, `../pkg/systemd/timer-dialog.jsx`, `../pkg/systemd/service-tabs.tsx`, `../pkg/lib/cockpit-components-listing-panel.tsx`, `../pkg/lib/cockpit-components-plot.jsx`, `../pkg/systemd/overview-cards/usageCard.jsx`, `../pkg/users/users.js`, and `../pkg/systemd/terminal.jsx`. Inspect their current revision before relying on details.

Official starting points: [latest guide](https://docs.cockpit-project.org/cockpit-guide/latest/guide/), [packages](https://docs.cockpit-project.org/cockpit-guide/latest/guide/packages.html), [starter-kit](https://github.com/cockpit-project/starter-kit). [Creating plugins for the Cockpit user interface](https://cockpit-project.org/blog/creating-plugins-for-the-cockpit-user-interface.html) is introductory and illustrative, not normative.
