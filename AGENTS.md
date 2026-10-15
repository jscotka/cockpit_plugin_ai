# Project guardrails

This repository contains a project-local OpenCode assistant suite for planning and implementing Cockpit plugins. It is tooling and guidance, not a Cockpit plugin implementation.

## Sources of truth

- Use the current official Cockpit guide and API documentation, plus the adjacent Cockpit source repository (`../`), as the sources of truth. Check the current version and in-tree usage rather than relying on memory or this suite alone.
- Treat blog posts, old examples, and generated output as illustrative, not normative. Prefer maintained source and tests when examples disagree with documentation.
- Before proposing code, inspect the target repository's dependencies, existing architecture, naming, UI components, transport patterns, tests, and packaging conventions. Do not introduce dependencies without an explicit need and approval.
- `cockpit.js` is a JavaScript API and transport library; it does not automatically inject Cockpit or PatternFly CSS into a plugin page. Plugin HTML must explicitly ship CSS. For plain HTML, deliberately choose either the full bundled Cockpit/PatternFly component CSS or a small local CSS layer using matching PatternFly class names. A local layer is valid when shell page imports cause geometry conflicts, but it must retain focus, disabled, and error states, dark semantic tokens, responsiveness, and no global selectors.
- Keep the CSS class version and generated CSS aligned with the HTML (for example, do not emit PatternFly v5 CSS while using `pf-v6-*` classes). Sass imports must emit selectors; unused namespaces can be tree-shaken. Before declaring a UI complete, inspect generated CSS for representative page, card, button, tabs, and form selectors and run the target build when one exists.
- ## Validated bundling pattern
- Do not look for or rely on a runtime-global Cockpit CSS path. A plugin explicitly imports `cockpit.js` and bundles its CSS during the build. The current [cockpit-podman](https://github.com/cockpit-project/cockpit-podman) pattern imports `cockpit-dark-theme` and `patternfly/patternfly-6-cockpit.scss` from the JavaScript entry point, with SCSS importing `ct-card.scss`, `page.scss`, and `global-variables`; its build emits package-local `dist` and CSS artifacts.
- For a simple plain-HTML plugin, retain only the small esbuild/Sass build and generated CSS needed by the package. Do not copy Podman's React, full distribution, or Makefile machinery without an explicit requirement. Match PatternFly versions, inspect generated selectors, and verify the target build.

## Implementation guardrails

- Never modify the parent Cockpit repository (`..`) unless the user explicitly authorizes it. Work only in the requested target repository; keep all generated and temporary files local to it.
- The Valkey UI build requires Node.js 22 or newer and npm 10 or newer. Before claiming UI build validation, verify `node --version` and `npm --version`, then run `npm run build` from `examples/valkey`. Report missing tools separately from failures in the source or build.
- The Valkey example reuses dependencies from the adjacent Cockpit checkout at `../../../node_modules`, including esbuild, esbuild-sass-plugin, and PatternFly. Do not run an example-local `npm install` unless the example is changed to define its own lockfile and dependencies.
- Generated CSS is a required runtime artifact when the package uses it; rebuild it after Sass changes rather than editing it by hand. Keep a local lockfile/build dependency declaration when the adjacent checkout is stale, but never commit `node_modules`.
- Do not construct shell commands by interpolating untrusted values. Prefer APIs and argument arrays (for example, `cockpit.spawn([...])`); validate and quote any unavoidable shell input, and explain the remaining risk.
- Follow Cockpit-native and PatternFly conventions, including keyboard operation, accessible names and focus handling, and clear loading, empty, success, and error states.
- Keep user-visible strings translatable. Follow Cockpit gettext conventions and validate catalogs and extraction rather than hand-editing generated artifacts.
- Add or update focused tests for behavior and regressions. Run the target project's documented checks; distinguish checks run from checks not available in the environment.
- Respect the target project's manifest, build output, development-install, and RPM/package conventions. Do not commit generated build artifacts unless the project requires them.
- Follow current Cockpit in-tree imports and package build conventions, including PatternFly/Cockpit integration, page styles, card extensions, dark theme, and spacing utilities where applicable. Do not guess import paths or link unavailable source files at runtime. Add a focused generation/build regression check when the package has a build.
- Cockpit `page.scss` contains shell-oriented layout rules. For standalone plain-HTML pages, scope page-specific layout rules under a unique root class, keep the DOM simple, make the main content and panels full-width, and avoid shell containers/sidebar grids unless the markup matches. PatternFly classes require their matching DOM structure for pages, tabs, forms, and titles; verify visible panels, rendered geometry, theme initialization, and narrow layout in addition to generated selectors.
- Backend INFO/metrics code must tolerate Valkey/Redis version differences and empty DB sections: a successful command means the service was reachable, optional fields may use unknown/zero defaults, and warnings are non-fatal. Actual command errors remain failures.

## Collaboration

- Clarify requirements that affect security, privilege, destructive behavior, data ownership, or architecture before implementation. Record non-critical assumptions.
- Delegate bounded work to the named specialists. Give each writer explicit file ownership, required inputs, and expected outputs; do not have multiple agents edit the same files concurrently.
- Keep plans and decisions grounded in inspected source and link to relevant local files or official docs.
- After meaningful completed work, use `/improve-cockpit-agents` to extract reusable lessons without changing plugin source.
