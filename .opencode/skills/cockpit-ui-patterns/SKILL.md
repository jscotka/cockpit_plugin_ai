---
name: cockpit-ui-patterns
description: Select Cockpit-native and PatternFly UI patterns with accessible interaction and complete states
---

Inspect target dependencies and maintained in-tree examples before proposing UI. Reuse installed Cockpit/PatternFly primitives; do not add a design system or claim a pattern is supported without checking the checked-out version. Cover applicable charts, forms/text fields, modal dialogs, tabs, and dependent multi-step actions. Define keyboard/focus behavior, accessible names and descriptions, validation, loading, empty, success, and error states. Keep visible strings gettext-ready. Return recommendations and local references only; feature implementation belongs to the assigned builder.

Local patterns: `../pkg/networkmanager/`, `../pkg/networkmanager/plots.js`, `../pkg/systemd/timer-dialog.jsx`, `../pkg/systemd/service-tabs.tsx`, `../pkg/lib/cockpit-components-listing-panel.tsx`, `../pkg/lib/cockpit-components-plot.jsx`, `../pkg/systemd/overview-cards/usageCard.jsx`, `../pkg/users/users.js`, and `../pkg/systemd/terminal.jsx`.

See [reference notes](references/ui-checklist.md). Official docs: [latest guide](https://docs.cockpit-project.org/cockpit-guide/latest/guide/) and [packages](https://docs.cockpit-project.org/cockpit-guide/latest/guide/packages.html).
