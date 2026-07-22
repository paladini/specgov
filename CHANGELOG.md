# Changelog

## 1.0.0-rc.2

- Added a portable repository harness and automated contract-drift gate.
- Expanded release verification from 15 to 41 tests across all supported Node.js versions and operating systems.
- Fixed configured Generic adapter detection and Windows junction filtering.
- Added community templates, Dependabot, CodeQL, Dependency Review, OpenSSF Scorecard, and protected-branch gates.
- Hardened npm trusted publishing and pinned privileged GitHub Actions dependencies.

## 1.0.0-rc.1

- Rebuilt SpecGov as AI-assisted development artifact governance.
- Added Spec Kit, OpenSpec, Kiro, and Generic/TLC autodetection.
- Added normalized graph, deterministic policies, declared metadata, and optional semantic protocol.
- Replaced the v0.1 CLI with `init`, `check`, and `graph`.
- Expanded GitHub Action outputs and moved to the clean `specgov/v1` manifest.
- Publication failed before the package or GitHub prerelease was created; this tag remains immutable and is superseded by `1.0.0-rc.2`.

## 0.1.0

- Initial generic Git spec-governance release.
