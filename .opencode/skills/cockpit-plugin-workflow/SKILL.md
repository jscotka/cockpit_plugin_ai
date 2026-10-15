---
name: cockpit-plugin-workflow
description: Discover, scope, implement, and verify Cockpit plugin changes using the target repository's current conventions
---

Start with the target repository's AGENTS.md, package manifest, dependencies, source, tests, and packaging. Confirm that the task is a plugin change and do not assume this suite implements one. Use current official Cockpit docs and maintained source in `../` as sources of truth. Ask about critical privilege, security, destructive-action, data, or architecture unknowns before implementation; record other assumptions.

Sequence work as discovery → requirements and acceptance criteria → parallel UI/backend decisions where relevant → bounded implementation → gettext/docs/tests → verification. During discovery, verify that each plugin HTML explicitly loads `cockpit.js` and explicitly loads or bundles CSS; `cockpit.js` is an API/transport library and does not inject Cockpit or PatternFly CSS. Check that the PatternFly class version matches generated CSS, and follow current in-tree imports and package conventions for PatternFly/Cockpit integration, page styles, card extensions, dark theme, and spacing utilities where applicable. Assign distinct file ownership to each writer. Never edit `../` unless explicitly authorized. Use the specific workflow skills for UI, backend transport, build/package, docs, localization, and integration checks.

For UI verification, inspect generated CSS for representative selectors used by the HTML (`pf-v6-c-page`, card, button, tabs, and form) and run the target build. Distinguish missing npm/tools from source or build failures, and add a focused generation/build regression check when the package has a build. Do not guess import paths or link unavailable source files at runtime.

Useful local examples and source: `../examples/pinger/`, `../pkg/networkmanager/`, `../pkg/networkmanager/plots.js`, `../pkg/systemd/timer-dialog.jsx`, `../pkg/systemd/service-tabs.tsx`, `../pkg/lib/cockpit-components-listing-panel.tsx`, `../pkg/lib/cockpit-components-plot.jsx`, `../pkg/systemd/overview-cards/usageCard.jsx`, `../pkg/users/users.js`, and `../pkg/systemd/terminal.jsx`. Inspect their current revision before relying on details.

Official starting points: [latest guide](https://docs.cockpit-project.org/cockpit-guide/latest/guide/), [packages](https://docs.cockpit-project.org/cockpit-guide/latest/guide/packages.html), [starter-kit](https://github.com/cockpit-project/starter-kit). [Creating plugins for the Cockpit user interface](https://cockpit-project.org/blog/creating-plugins-for-the-cockpit-user-interface.html) is introductory and illustrative, not normative.
