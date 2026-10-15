# Project guardrails

This repository contains a project-local OpenCode assistant suite for planning and implementing Cockpit plugins. It is tooling and guidance, not a Cockpit plugin implementation.

## Sources of truth

- Use the current official Cockpit guide and API documentation, plus the adjacent Cockpit source repository (`../`), as the sources of truth. Check the current version and in-tree usage rather than relying on memory or this suite alone.
- Treat blog posts, old examples, and generated output as illustrative, not normative. Prefer maintained source and tests when examples disagree with documentation.
- Before proposing code, inspect the target repository's dependencies, existing architecture, naming, UI components, transport patterns, tests, and packaging conventions. Do not introduce dependencies without an explicit need and approval.
- `cockpit.js` is a JavaScript API and transport library; it does not automatically inject Cockpit or PatternFly CSS into a plugin page. Plugin HTML must explicitly load `cockpit.js` and explicitly load or bundle its CSS; never assume shell or global CSS inheritance.
- Keep the CSS class version and generated CSS aligned with the HTML (for example, do not emit PatternFly v5 CSS while using `pf-v6-*` classes). Before declaring a UI complete, inspect generated CSS for representative selectors used by the HTML, including the page, card, button, tabs, and form selectors, and run the target build when one exists.

## Implementation guardrails

- Never modify the parent Cockpit repository (`..`) unless the user explicitly authorizes it. Work only in the requested target repository; keep all generated and temporary files local to it.
- The Valkey UI build requires Node.js 22 or newer and npm 10 or newer. Before claiming UI build validation, verify `node --version` and `npm --version`, then run `npm run build` from `examples/valkey`. Report missing tools separately from failures in the source or build.
- The Valkey example reuses dependencies from the adjacent Cockpit checkout at `../../../node_modules`, including esbuild, esbuild-sass-plugin, and PatternFly. Do not run an example-local `npm install` unless the example is changed to define its own lockfile and dependencies.
- `examples/valkey/valkey.css` is a generated, required runtime artifact. Regenerate it with the Valkey build when `valkey.scss` changes, and follow this repository's policy for generated files rather than editing the CSS by hand.
- Do not construct shell commands by interpolating untrusted values. Prefer APIs and argument arrays (for example, `cockpit.spawn([...])`); validate and quote any unavoidable shell input, and explain the remaining risk.
- Follow Cockpit-native and PatternFly conventions, including keyboard operation, accessible names and focus handling, and clear loading, empty, success, and error states.
- Keep user-visible strings translatable. Follow Cockpit gettext conventions and validate catalogs and extraction rather than hand-editing generated artifacts.
- Add or update focused tests for behavior and regressions. Run the target project's documented checks; distinguish checks run from checks not available in the environment.
- Respect the target project's manifest, build output, development-install, and RPM/package conventions. Do not commit generated build artifacts unless the project requires them.
- Follow current Cockpit in-tree imports and package build conventions, including PatternFly/Cockpit integration, page styles, card extensions, dark theme, and spacing utilities where applicable. Do not guess import paths or link unavailable source files at runtime. Add a focused generation/build regression check when the package has a build.

## Collaboration

- Clarify requirements that affect security, privilege, destructive behavior, data ownership, or architecture before implementation. Record non-critical assumptions.
- Delegate bounded work to the named specialists. Give each writer explicit file ownership, required inputs, and expected outputs; do not have multiple agents edit the same files concurrently.
- Keep plans and decisions grounded in inspected source and link to relevant local files or official docs.
