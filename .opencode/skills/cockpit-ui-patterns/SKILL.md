---
name: cockpit-ui-patterns
description: Select Cockpit-native and PatternFly UI patterns with accessible interaction and complete states
---

Inspect target dependencies and maintained in-tree examples before proposing UI. Match the visual language of existing Cockpit pages, especially `/users` and `../pkg/users/`, rather than creating an approximate standalone web design. Reuse installed Cockpit/PatternFly primitives, layout wrappers, spacing, typography, CSS variables, button variants, form groups, alerts, listings, and responsive patterns; do not add a design system or claim a pattern is supported without checking the checked-out version. Raw HTML controls and custom CSS are acceptable only when the target package lacks an equivalent and the visual/accessibility tradeoff is documented. Cover applicable charts, forms/text fields, modal dialogs, tabs, and dependent multi-step actions. Define keyboard/focus behavior, accessible names and descriptions, validation, loading, empty, success, and error states, including dark mode, narrow widths, disabled states, and translated text expansion. Return recommendations and local references only; feature implementation belongs to the assigned builder.

Local patterns: `../pkg/users/`, `../pkg/users/users.js`, `../pkg/networkmanager/`, `../pkg/networkmanager/plots.js`, `../pkg/systemd/timer-dialog.jsx`, `../pkg/systemd/service-tabs.tsx`, `../pkg/lib/cockpit-components-listing-panel.tsx`, `../pkg/lib/cockpit-components-plot.jsx`, `../pkg/systemd/overview-cards/usageCard.jsx`, and `../pkg/systemd/terminal.jsx`. Treat the Valkey example's raw `valkey.css` as a functional prototype, not a Cockpit visual reference.

See [reference notes](references/ui-checklist.md). Official docs: [latest guide](https://docs.cockpit-project.org/cockpit-guide/latest/guide/) and [packages](https://docs.cockpit-project.org/cockpit-guide/latest/guide/packages.html).
