# Local Cockpit source map

Paths are relative to the adjacent Cockpit checkout (`..`). Treat all examples as patterns to inspect, not copy-paste specifications; verify current APIs and dependencies in the target repository.

- Plugin/package shape: `examples/pinger/`
- Network and system controls: `pkg/networkmanager/`, `pkg/users/users.js`
- Charts and usage patterns: `pkg/networkmanager/plots.js`, `pkg/lib/cockpit-components-plot.jsx`, `pkg/systemd/overview-cards/usageCard.jsx`
- Forms/dialogs/tabs: `pkg/systemd/timer-dialog.jsx`, `pkg/systemd/service-tabs.tsx`
- Listing panel and terminal interactions: `pkg/lib/cockpit-components-listing-panel.tsx`, `pkg/systemd/terminal.jsx`
- Localization: `doc/i18n.md`
- Tests: `test/README.md`, `test/verify`
