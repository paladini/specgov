# SpecGov v1 Tasks

- [x] T1: Record v1 project, requirements, architecture, clean-break decisions, and gates.
- [x] T2: Replace public types and manifest with the v1 contract. Gate passed.
- [x] T3: Implement metadata, adapters, normalized graph, and canonical fixtures. Gate passed.
- [x] T4: Implement policy engine and Git change analysis. Gate passed.
- [x] T5: Implement semantic protocol, analyzer, CLI, reports, and public API. Gate passed.
- [x] T6: Implement Action inputs/outputs and bundle. Build gate passed; external Action validation remains in T8.
- [x] T7: Rewrite examples, README, Pages, security, contribution, release, changelog, and metadata. Local gate passed.
- [x] T8: Run package e2e, performance, audit, complete validation, and release-candidate readiness. The real tarball, public API, CLI, deterministic 500-change-set performance budget, and production audit pass locally.
- [x] T9: Reconcile the v1 source of truth and install a portable repository harness. Added canonical agent instructions, tool-specific pointers, real requirement traceability, six release UAT journeys, and an explicit v0.1 archive boundary. Documentation format gate passed.
- [x] T10: Harden repository path boundaries and semantic-auditor execution, remove superseded v0.1 active-tree artifacts, and update maintained dependencies. Local gates passed.
- [ ] T11: Publish RC3 through npm Trusted Publishing, create the GitHub prerelease, and complete external package, Action, and Pages UAT before stable v1.

Each task must preserve the cover image, keep tests with implementation, and update requirement status only after its gate passes.
