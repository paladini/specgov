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

| ID      | Requirement                                                  | Status    |
| ------- | ------------------------------------------------------------ | --------- |
| SGV1-01 | Autodetect Spec Kit, OpenSpec, Kiro, and Generic/TLC         | In Design |
| SGV1-02 | Build stable normalized artifact graph                       | In Design |
| SGV1-03 | Parse optional namespaced declared metadata                  | In Design |
| SGV1-04 | Validate optional `specgov/v1` manifest and reject v0.1      | In Design |
| SGV1-05 | Run state-aware deterministic findings                       | In Design |
| SGV1-06 | Provide `init`, `check`, `graph` and public API              | In Design |
| SGV1-07 | Provide safe optional semantic protocol                      | In Design |
| SGV1-08 | Provide Node 24 GitHub Action contract                       | In Design |
| SGV1-09 | Verify fixtures, e2e packaging, and performance              | In Design |
| SGV1-10 | Publish accurate AI-first documentation and release surfaces | In Design |

## Edge Cases

- Mixed frameworks, Windows paths, missing Git refs, malformed frontmatter, relation cycles, external targets, symlinks, archived and superseded changes, malformed or timed-out semantic auditors.

## Success Criteria

- One-command useful result, zero default network calls, deterministic JSON, actionable findings, all quality gates green, and verified package/Action/docs release surfaces.
