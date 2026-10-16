---
title: Cockpit plugin pattern catalog
description: Reusable, evidence-backed patterns for Cockpit plugin architecture, UI, packaging, testing, and documentation
---

# Cockpit plugin pattern catalog

Use this catalog as a decision checklist, not as a substitute for the target
repository's manifest, tests, or current Cockpit documentation. The examples
below are local evidence from the checked-out repository and adjacent Cockpit
source; verify their current revision before applying them.

## 1. Standalone plain-HTML PatternFly page

**Use when:** a plugin owns a plain HTML entry point and needs PatternFly
components without relying on Cockpit shell markup or global CSS.

**Avoid when:** the page does not implement the complete Page DOM required by
`pf-v*-c-page`/`page.scss` (including the matching main/sidebar structure).
Do not use a Page root to obtain styling for an otherwise standalone page.

**Pattern:** bundle the actual component CSS used by the HTML, with matching
PatternFly class versions. Prefer a unique root scope, a plain full-width
`main`, and panels without shell sidebar/grid constraints. Initialize the dark
theme. If a local CSS layer is necessary, keep focus, disabled, error, dark,
responsive, and narrow-width states; never use global selectors.

**Required checks:** inspect emitted selectors for representative page/card,
button, tabs, and form components; verify valid component DOM and visible
panels; render-check desktop geometry, full-width content, dark theme, focus,
disabled/error states, and narrow layout. A static class-name match is not
enough.

**Local references:** `../../AGENTS.md` (CSS and Page guardrails),
`../skills/cockpit-ui-patterns/SKILL.md`,
`../skills/cockpit-build-and-package/SKILL.md`, and adjacent
`../../../pkg/users/` plus `../../../pkg/systemd/service-tabs.tsx`.

## 2. Schema-driven configuration editor

**Use when:** UI rendering, validation, and writes must stay synchronized with
a documented configuration contract.

**Avoid when:** a prose man page is being used as the runtime schema, or when
the editor would infer unsafe types/editability from installed documentation.

**Pattern:** keep a checked-in, validated JSON manifest authoritative for
optional categories/sections, option metadata, types, ranges, defaults,
editability, help, examples, and localized text. Bundle it at build time. Treat installed
man pages as a non-blocking drift comparison only. Type-specific validation
must cover structured/list, URL/path/origin/header/OAuth values; distinguish an
absent default from `false`; support true unset/removal; warn about security
risks; and preserve duplicate/conflicting entries rather than silently
normalizing them away.

**Required checks:** validate the manifest; test rendering, validation, and
writes from that manifest; test every typed validator, absent-vs-false and
unset behavior, security warnings, duplicate/conflict preservation, localized
help, and non-fatal man-page drift. Use conflict-aware file modification and
keep obsolete read-only UI contracts removed.

**Local references:** `../../examples/cockpit-config/schema.json`,
`../../examples/cockpit-config/parser.js`,
`../../examples/cockpit-config/parser.test.mjs`, and the schema guidance in
`../skills/cockpit-plugin-workflow/SKILL.md`.

## 3. Atomic Cockpit assets/package deployment

**Use when:** HTML, bundled JavaScript, CSS, and theme assets are produced or
installed separately and stale mixtures can cause runtime failures.

**Avoid when:** declaring a source fix complete after rebuilding only one
artifact, or diagnosing a cache/package issue without checking loaded assets.

**Pattern:** treat HTML/JS/CSS/theme as one deployable revision. Add explicit
revision markers or IDs, rebuild all required generated assets, and install a
complete package. Keep package precedence, browser/Cockpit cache, reload, and
rollback behavior documented.

**Required checks:** run DOM-contract and asset-contract tests for required
initialization elements and matching loaded revisions; fail early on stale
HTML/bundle pairs; inspect generated CSS selectors; verify development/system
installation and discovery. When behavior disagrees with source, record loaded
package/asset evidence before changing code.

**Local references:** `../../examples/cockpit-config/dom-contract.test.mjs`,
`../../examples/cockpit-config/css.test.mjs`,
`../skills/cockpit-build-and-package/SKILL.md`, and
`../skills/cockpit-integration-testing/SKILL.md`.

## 4. Defensive asynchronous UI

**Use when:** load, save, refresh, and render operations can complete or fail
independently, or deployed markup can be stale.

**Avoid when:** a catch block assumes every status/error node exists, or a
successful write is reported as a failed write because refresh/render failed.

**Pattern:** disable Save until a successful load. Make essential DOM nodes
explicit and fail early when they are absent; make optional status/empty/error
nodes safe to omit. Provide a defensive status fallback and preserve the
original error instead of masking it with a null-node exception. Report file
write success separately from post-save refresh/render failure.

**Required checks:** test missing optional and essential nodes, pre-load Save
gating, write failure, write success followed by refresh/render failure, and
stale asset/DOM revisions. Keep status and empty-state nodes outside CSS grids;
use `align-items: start` for variable-height cards.

**Local references:** `../../examples/cockpit-config/dom-contract.test.mjs`,
`../../examples/cockpit-config/render.js`, and the defensive UI guidance in
`../skills/cockpit-plugin-workflow/SKILL.md`.

## 5. Configuration form grouping

**Use when:** a configuration editor benefits from meaningful section cards that
make groups of fields scannable and accessible.

**Avoid when:** categories are inferred from option order, categories add no
meaning beyond the schema order, helper/status nodes are made grid children
accidentally, or visual grouping replaces labels and semantic relationships.

**Pattern:** make category grouping optional. When categories add meaning, put
explicit category metadata in the authoritative schema and render meaningful
section cards from it; otherwise render fields directly in schema order. In
both cases, retain schema type metadata and use label-text emphasis for the
option name, associate helper and error text through `aria-describedby`, and
keep status/empty-state content outside field CSS grids. Align variable-height
cards with `align-items: start`.

**Required checks:** when grouping is used, validate category metadata and
ordering; otherwise validate direct schema ordering. In either layout, verify
label, helper, error, focus, disabled, and localized text relationships; test
long localized strings, narrow layout, dark theme, and empty/error states;
inspect that status content cannot create an unintended leading grid cell.

**Local references:** `../../examples/cockpit-config/schema.json`,
`../../examples/cockpit-config/render.js`,
`../../examples/cockpit-config/dom-contract.test.mjs`, and
`../skills/cockpit-ui-patterns/SKILL.md`.

## 6. Documentation/install pattern for examples

**Use when:** an example has a build, generated assets, or more than one
development/system installation path.

**Avoid when:** documentation says only “run the build” or treats a source
checkout, installed package, and cached browser assets as interchangeable.

**Pattern:** document prerequisites and exact versions, build commands,
development and system install paths, package discovery verification, complete
asset deployment, cache/reload behavior, and rollback. State which checks are
browser- or privilege-dependent and how to separate stale installed package
problems from source/build failures.

**Required checks:** follow the documented commands from a clean or known
state; verify discovery and loaded asset revisions after installation; confirm
all generated assets are rebuilt; record rollback and cache-clearing steps;
report unavailable tools separately from failed source checks.

**Local references:** `../../examples/cockpit-config/README.md`,
`../../examples/valkey/README.md`, `../skills/cockpit-documentation/SKILL.md`,
and `../skills/cockpit-build-and-package/SKILL.md`.
