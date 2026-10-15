# Project guardrails

This repository contains a project-local OpenCode assistant suite for planning and implementing Cockpit plugins. It is tooling and guidance, not a Cockpit plugin implementation.

## Sources of truth

- Use the current official Cockpit guide and API documentation, plus the adjacent Cockpit source repository (`../`), as the sources of truth. Check the current version and in-tree usage rather than relying on memory or this suite alone.
- Treat blog posts, old examples, and generated output as illustrative, not normative. Prefer maintained source and tests when examples disagree with documentation.
- Before proposing code, inspect the target repository's dependencies, existing architecture, naming, UI components, transport patterns, tests, and packaging conventions. Do not introduce dependencies without an explicit need and approval.

## Implementation guardrails

- Never modify the parent Cockpit repository (`..`) unless the user explicitly authorizes that scope. Work only in the requested target repository; keep all generated and temporary files local to it.
- Do not construct shell commands by interpolating untrusted values. Prefer APIs and argument arrays (for example, `cockpit.spawn([...])`); validate and quote any unavoidable shell input, and explain the remaining risk.
- Follow Cockpit-native and PatternFly conventions, including keyboard operation, accessible names and focus handling, and clear loading, empty, success, and error states.
- Keep user-visible strings translatable. Follow Cockpit gettext conventions and validate catalogs and extraction rather than hand-editing generated artifacts.
- Add or update focused tests for behavior and regressions. Run the target project's documented checks; distinguish checks run from checks not available in the environment.
- Respect the target project's manifest, build output, development-install, and RPM/package conventions. Do not commit generated build artifacts unless the project requires them.

## Collaboration

- Clarify requirements that affect security, privilege, destructive behavior, data ownership, or architecture before implementation. Record non-critical assumptions.
- Delegate bounded work to the named specialists. Give each writer explicit file ownership, required inputs, and expected outputs; do not have multiple agents edit the same files concurrently.
- Keep plans and decisions grounded in inspected source and link to relevant local files or official docs.
