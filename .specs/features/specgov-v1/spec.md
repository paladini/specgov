# SpecGov v1 AI Artifact Governance Specification

## Problem Statement

AI coding workflows create chains of intent, specs, plans, tasks, implementation, and evidence. Git preserves the files but does not ensure that the chain is complete or that changed code still follows its governing artifacts.

## User Stories

### P1: Zero-config artifact governance

As a developer, I want one command to autodetect my workflow and report broken artifact chains.

1. WHEN `specgov check` runs without a manifest THEN the system SHALL discover supported framework artifacts without network access.
2. WHEN multiple frameworks exist THEN the system SHALL normalize them into one deterministic graph and name every detected framework.
3. WHEN a chain is incomplete THEN the system SHALL return actionable evidence and remediation.

### P1: Pull-request enforcement

As a platform engineer, I want explicit domains to ensure code and governing artifacts change together.

1. WHEN governed code changes without a mapped artifact change THEN the system SHALL emit `GOVERNED_CODE_WITHOUT_ARTIFACT_CHANGE`.
2. WHEN only an unrelated spec changes THEN it SHALL not satisfy the mapped domain.
3. WHEN strict mode contains policy warnings THEN the process SHALL exit 1; advisory mode SHALL exit 0.

### P1: Stable automation contract

As a tool author, I want stable graph and finding JSON.

1. WHEN graph or report JSON is emitted THEN collections and IDs SHALL be deterministic.
2. WHEN an invalid or legacy manifest is loaded THEN the system SHALL return exit code 2 and a concrete upgrade message.

### P2: Optional semantic audit

As a team, I want to connect my own auditor without coupling SpecGov to an AI provider.

1. WHEN explicitly enabled THEN SpecGov SHALL execute an argument array without a shell and validate versioned JSON.
2. WHEN the auditor fails THEN deterministic findings SHALL remain intact.

## Requirements

| ID      | Requirement                                                  | Status                            |
| ------- | ------------------------------------------------------------ | --------------------------------- |
| SGV1-01 | Autodetect Spec Kit, OpenSpec, Kiro, and Generic/TLC         | Implemented, locally verified     |
| SGV1-02 | Build stable normalized artifact graph                       | Implemented, locally verified     |
| SGV1-03 | Parse optional namespaced declared metadata                  | Implemented, locally verified     |
| SGV1-04 | Validate optional `specgov/v1` manifest and reject v0.1      | Implemented, locally verified     |
| SGV1-05 | Run state-aware deterministic findings                       | Implemented, locally verified     |
| SGV1-06 | Provide `init`, `check`, `graph` and public API              | Implemented, locally verified     |
| SGV1-07 | Provide safe optional semantic protocol                      | Implemented, locally verified     |
| SGV1-08 | Provide Node 24 GitHub Action contract                       | Implemented; external UAT pending |
| SGV1-09 | Verify fixtures, e2e packaging, and performance              | Partially verified                |
| SGV1-10 | Publish accurate AI-first documentation and release surfaces | Implemented; release pending      |

## Edge Cases

- Mixed frameworks, Windows paths, missing Git refs, malformed frontmatter, relation cycles, external targets, symlinks, archived and superseded changes, malformed or timed-out semantic auditors.

## Success Criteria

- One-command useful result, zero default network calls, deterministic JSON, actionable findings, all quality gates green, and verified package/Action/docs release surfaces.

## Requirement Traceability

| Requirement | Implementation                                                  | Executable evidence                                                     | Public/operational evidence                                         |
| ----------- | --------------------------------------------------------------- | ----------------------------------------------------------------------- | ------------------------------------------------------------------- |
| SGV1-01     | `src/adapters.ts`, `src/analyze.ts`                             | `tests/v1.test.ts`: Spec Kit, OpenSpec, Kiro, Generic/TLC autodetection | `examples/`, README framework guide                                 |
| SGV1-02     | `src/graph.ts`, `src/paths.ts`, `src/types.ts`                  | stable Spec Kit graph and stable report JSON tests                      | `specgov graph`, `docs/` graph documentation                        |
| SGV1-03     | `src/metadata.ts`                                               | namespaced declared metadata test                                       | README metadata reference                                           |
| SGV1-04     | `src/config.ts`, `src/errors.ts`                                | defaults and legacy-manifest rejection tests                            | `docs/upgrade-v1.md`                                                |
| SGV1-05     | `src/policies.ts`, `src/git.ts`, `src/match.ts`                 | unrelated/mapped artifact and advisory/strict tests                     | README domains and policy reference                                 |
| SGV1-06     | `src/cli-app.ts`, `src/cli.ts`, `src/index.ts`, `src/report.ts` | clean CLI, init, and render tests                                       | README quickstart and API reference                                 |
| SGV1-07     | `src/semantic.ts`, `tools/specgov-semantic-auditor.mjs`         | provider-independent semantic protocol test                             | README semantic-auditor contract                                    |
| SGV1-08     | `src/action.ts`, `action.yml`, `dist/action/`                   | local build gate                                                        | external Action journey pending                                     |
| SGV1-09     | `tests/v1.test.ts`, `examples/`                                 | 15 tests, tarball install smoke, deterministic dogfood                  | performance budget and broader edge-case coverage pending           |
| SGV1-10     | `README.md`, `docs/`, `CHANGELOG.md`, `RELEASING.md`            | format/build/package gates                                              | npm RC, GitHub prerelease, external Pages/repository checks pending |
