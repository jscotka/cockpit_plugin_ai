---
name: cockpit-documentation
description: Document implemented Cockpit plugin behavior accurately for users and maintainers
---

Inspect existing docs and source before writing. Document only supported behavior: prerequisites, configuration, user workflows, permissions, secret handling, errors, and troubleshooting as relevant. Keep examples aligned with the actual manifest and UI. Cite current official docs for API claims; label introductory blog material as illustrative rather than authoritative. Keep user-facing strings in code gettext-ready rather than hardcoding untranslated UI labels. Edit only explicitly assigned documentation files.

Reference the target repo's documentation first, then the [latest Cockpit guide](https://docs.cockpit-project.org/cockpit-guide/latest/guide/) and [packages guide](https://docs.cockpit-project.org/cockpit-guide/latest/guide/packages.html). Local code examples to inspect include `../examples/pinger/` and `../pkg/networkmanager/`.
