---
name: cockpit-integration-testing
description: Choose scoped tests and Cockpit verification based on the target repository's documented workflow
---

Read the target's test instructions and existing fixtures before selecting checks. Derive focused tests from acceptance criteria, include behavior/error/accessibility-relevant regressions where testable, and use the project's established framework. For plain-HTML pages, add focused DOM- and asset-contract checks for required initialization/interaction elements and matching HTML/bundle revisions when stale markup can otherwise produce null DOM errors; keep these complementary to emitted-selector and rendered/integration checks. Test save flows so a successful write remains success when post-save refresh/render or service reload fails, while actual write failures remain failures. Begin with `../test/README.md` and `../test/verify` only as local examples; inspect the target's own scripts and dependencies. Do not run destructive, privileged, network-dependent, or broad checks without approval. Report exact commands, actual outcomes, blocked checks, and untested criteria; do not modify tests unless explicitly assigned.

Official context: [latest Cockpit guide](https://docs.cockpit-project.org/cockpit-guide/latest/guide/). Local testing references: `../test/README.md`, `../test/verify`.
