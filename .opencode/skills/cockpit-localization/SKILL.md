---
name: cockpit-localization
description: Apply Cockpit gettext conventions and validate localization changes without editing generated files by hand
---

Inspect the target's gettext extraction, source-marking, catalog, and validation workflow before changing strings. Mark every user-visible string using the target's supported APIs; preserve context, plural forms, placeholders, and formatting. Never hand-edit generated artifacts or invent translations. Keep localization edits owned by one specialist and report extraction/catalog checks that could not be run.

Use the adjacent Cockpit guidance at `../doc/i18n.md` and current [locale API docs](https://docs.cockpit-project.org/cockpit-guide/latest/guide/cockpit-locale.html). Follow the target repository where its workflow differs.
