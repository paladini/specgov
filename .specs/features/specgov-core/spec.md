# SpecGov Core Specification

## Problem Statement

Spec-driven development creates useful artifacts, but those artifacts drift when Git merges code changes without validating spec impact. Teams need a framework-neutral way to inventory spec artifacts, map them to code, and flag drift before it becomes institutional confusion.

## Goals

- [ ] Govern existing spec artifacts without imposing a new authoring framework.
- [ ] Provide deterministic CI-friendly checks with advisory default behavior.
- [ ] Generate traceability data that humans and future AI tools can consume.

## Out of Scope

| Feature                        | Reason                                    |
| ------------------------------ | ----------------------------------------- |
| Required LLM audit             | v1 must be deterministic and free to run. |
| Multi-CI packaged integrations | GitHub-first is the MVP.                  |
| Enterprise exports             | Useful later, too large for v1.           |

## User Stories

### P1: Configure Governed Artifacts

**User Story**: As a maintainer, I want to declare which files are specs, docs, ADRs, or requirements so that SpecGov can govern my existing process.

**Why P1**: Framework neutrality depends on a manifest rather than a forced folder structure.

**Acceptance Criteria**:

1. WHEN a repository has `.specgov.yml` THEN SpecGov SHALL parse artifacts, mappings, rules, and mode.
2. WHEN the manifest is invalid THEN SpecGov SHALL return a config/runtime error.
3. WHEN `specgov init` runs in a repository without a manifest THEN SpecGov SHALL create a usable template.

**Independent Test**: Run `specgov init`, edit the manifest, and run `specgov scan`.

### P1: Check PR Spec Impact

**User Story**: As a reviewer, I want code changes to be checked against related spec artifacts so that drift is visible before merge.

**Why P1**: This is the core governance behavior.

**Acceptance Criteria**:

1. WHEN a changed code file matches a mapping and no related spec file changed THEN SpecGov SHALL report a missing spec impact finding.
2. WHEN a related spec file changed THEN SpecGov SHALL not report missing impact for that mapping.
3. WHEN mode is advisory THEN warnings SHALL exit successfully.
4. WHEN mode is strict THEN governance warnings SHALL fail the check.

**Independent Test**: Run `specgov check-pr --changed-file src/auth/session.ts` against a mapping that requires `docs/auth/**`.

### P1: Generate Trace and Drift Reports

**User Story**: As a maintainer or AI tool, I want a machine-readable trace index and drift report so that spec state can be inspected over time.

**Why P1**: Traceability is the durable asset produced by governance.

**Acceptance Criteria**:

1. WHEN `specgov trace` runs THEN SpecGov SHALL output JSON linking artifacts and mappings.
2. WHEN `specgov drift` runs THEN SpecGov SHALL report stale, superseded, archived, orphaned, or empty artifact conditions.
3. WHEN lifecycle metadata is present THEN SpecGov SHALL include it in the trace index.

**Independent Test**: Run `specgov trace --out .specgov.trace.json` and inspect the generated JSON.

## Edge Cases

- WHEN no artifacts match a configured glob THEN SpecGov SHALL report an empty artifact glob finding.
- WHEN a governed artifact has invalid lifecycle status THEN SpecGov SHALL report a lifecycle finding.
- WHEN a superseded artifact has no `superseded_by` metadata THEN SpecGov SHALL report a lifecycle finding.
- WHEN Git refs are not provided THEN SpecGov SHALL fall back to local changed file discovery.

## Requirement Traceability

| Requirement ID | Story                            | Phase   | Status   |
| -------------- | -------------------------------- | ------- | -------- |
| SGOV-01        | Configure Governed Artifacts     | Execute | Verified |
| SGOV-02        | Check PR Spec Impact             | Execute | Verified |
| SGOV-03        | Generate Trace and Drift Reports | Execute | Verified |
| SGOV-04        | GitHub Action Wrapper            | Execute | Verified |
| SGOV-05        | OSS Documentation                | Execute | Verified |

## Success Criteria

- [x] `npm test` passes.
- [x] `npm run build` passes.
- [x] `npm run lint` passes.
- [x] `npm run typecheck` passes.
- [x] README quickstart commands are locally verified.
