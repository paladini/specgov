# SpecGov v1 Validation

**Date:** 2026-07-22

## Automated results

- 54 Vitest tests passed locally; the CI matrix will repeat them across Linux, Windows, and macOS on Node.js 20, 22, and 24.
- TypeScript strict typecheck, ESLint, Prettier, and ncc build passed.
- Full `npm audit` reported 0 vulnerabilities.
- The test suite packs the exact `specgov-1.0.0-rc.3.tgz`, installs it offline into a clean temporary path containing spaces, imports the public API, and executes `init`, `check`, and `graph`.
- A deterministic corpus of 500 change sets and 1,500 artifacts completes within the 15-second local budget and produces byte-identical graphs across runs.
- PR #6 passed the complete CI matrix, Dependency Review, and CodeQL before merge; `main` is now protected by those gates.
- Dogfood `specgov check` detected Generic/TLC and returned pass.
- Dogfood `specgov graph` emitted deterministic JSON.

## Remaining release UAT

The following six journeys are release gates. Record date, environment, exact package/tag/SHA, command, exit code, and artifact or URL evidence for each journey. A local tarball result does not satisfy a registry or external Action step.

1. **Zero-config discovery:** in a clean consumer repository containing one supported framework and no manifest, install `specgov@next`, run `specgov check` and `specgov graph --format json`, and verify offline discovery, named framework, stable IDs/order, and actionable findings.
2. **Mixed-framework graph:** in a repository containing Spec Kit, OpenSpec, Kiro, and Generic/TLC fixtures, run the graph command twice and verify all detected frameworks plus byte-identical deterministic JSON.
3. **Explicit-domain enforcement:** configure an auth domain, change governed code plus an unrelated artifact, and verify `GOVERNED_CODE_WITHOUT_ARTIFACT_CHANGE`; then change the mapped artifact and verify that finding clears. Confirm advisory exits 0 and strict exits 1 for the warning case.
4. **Clean-break and CLI contract:** run the installed RC against a v0.1 manifest and verify exit 2 with an upgrade message; verify help exposes only `init`, `check`, and `graph`, and that `init --dry-run` does not write.
5. **Optional semantic auditor:** verify the deterministic result with semantics disabled; enable a provider-independent argument-array auditor and verify valid versioned JSON is merged. Repeat with timeout or malformed output and verify deterministic findings remain intact and the configured failure policy applies.
6. **External distribution surfaces:** from a separate repository, install the exact npm `next` version and execute the bundled Action at the immutable RC tag and commit SHA. Verify outputs/summary/exit behavior, GitHub prerelease assets and provenance, Pages HTTPS/canonical URL, and repository metadata. Repeat the distribution checks for npm `latest`, stable release, and Action `v1` before marking stable complete.

Current status: local evidence exists for journeys 1 through 5. RC1 and RC2 publication attempts did not create npm or GitHub release artifacts; their tags remain immutable. RC3 is the next publication candidate. Journey 6 and registry-installed repetitions of the other journeys remain pending.

**Overall:** local RC3 implementation ready for review; not yet a verified stable release.
