---
description: Plan and implement a Cockpit plugin request with Cockpit specialists
agent: cockpit-plugin-architect
---

Handle this Cockpit plugin request:

$ARGUMENTS

Use the primary architect workflow and the target repository's own AGENTS.md. Discover the repository and inspect current dependencies, patterns, docs, and tests before deciding implementation details. Ask the user about critical unknowns (especially privilege, security, data ownership, secrets, destructive behavior, and architecture) before implementation; state and validate non-critical assumptions. Produce an actionable plan with acceptance criteria, and delegate UI/backend decisions in parallel where independent. Implement only after critical requirements are clear. After implementation, delegate applicable localization, documentation, and test work; keep writers' file ownership disjoint. Verify using the target project's documented checks and report actual results, skips, assumptions, and changed files. Do not modify this suite's parent Cockpit repository unless explicitly authorized.
