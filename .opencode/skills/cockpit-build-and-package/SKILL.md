---
name: cockpit-build-and-package
description: Follow the target project's Cockpit package, build, development-install, and distribution conventions
---

Inspect the target repository and installed toolchain first. Use a starter-kit-like structure only when it matches the target. Verify the package manifest and entry points, build scripts and output directory, development installation instructions, and any RPM/package metadata or generated-file rules. Do not assume `dist` is committed, add dependencies without approval, or call a generic build equivalent to RPM readiness. Run only documented, scoped checks and report unavailable packaging tools honestly.

References: adjacent `../examples/pinger/`; official [packages guide](https://docs.cockpit-project.org/cockpit-guide/latest/guide/packages.html) and [starter-kit](https://github.com/cockpit-project/starter-kit). The starter-kit is a starting example; the target repository's conventions take precedence.
