# SpecGov Core Tasks

**Design**: `.specs/features/specgov-core/design.md`
**Status**: Done

## Execution Plan

Phase 1:

```text
T1 -> T2 -> T3
```

Phase 2:

```text
T3 -> T4
T3 -> T5
T3 -> T6
```

Phase 3:

```text
T4 + T5 + T6 -> T7 -> T8
```

## Task Breakdown

### T1: Scaffold TypeScript Project

**What**: Create package scripts, TypeScript, Vitest, ESLint, Prettier, license, README skeleton, and Action metadata.
**Where**: project root
**Depends on**: None
**Requirement**: SGOV-05
**Tests**: build
**Gate**: `npm run typecheck`
**Status**: Done

### T2: Add TLC Project Artifacts

**What**: Create project, roadmap, state, spec, design, and tasks documents for SpecGov.
**Where**: `.specs/**`
**Depends on**: T1
**Requirement**: SGOV-05
**Tests**: none
**Gate**: `npm run typecheck`
**Status**: Done

### T3: Implement Manifest, Discovery, and Reporting Core

**What**: Add config parsing, glob matching, lifecycle metadata, report rendering, and tests.
**Where**: `src/**`, `tests/**`
**Depends on**: T2
**Requirement**: SGOV-01
**Tests**: unit
**Gate**: `npm test`
**Status**: Done

### T4: Implement PR Impact Checks

**What**: Add changed-file detection, code-to-spec impact rules, advisory/strict status behavior, and tests.
**Where**: `src/checks.ts`, `src/git.ts`, `tests/**`
**Depends on**: T3
**Requirement**: SGOV-02
**Tests**: unit
**Gate**: `npm test`
**Status**: Done

### T5: Implement Trace and Drift Commands

**What**: Add trace index and drift findings for lifecycle, empty globs, stale specs, and orphan artifacts.
**Where**: `src/checks.ts`, `tests/**`
**Depends on**: T3
**Requirement**: SGOV-03
**Tests**: unit
**Gate**: `npm test`
**Status**: Done

### T6: Implement CLI Commands

**What**: Add `init`, `scan`, `check-pr`, `trace`, and `drift` command handlers.
**Where**: `src/cli.ts`, `src/cli-app.ts`, `tests/**`
**Depends on**: T3
**Requirement**: SGOV-01, SGOV-02, SGOV-03
**Tests**: unit
**Gate**: `npm test`
**Status**: Done

### T7: Implement GitHub Action Wrapper

**What**: Add Action entrypoint that runs `check-pr`, writes summary, sets outputs, and fails only on strict failures or runtime errors.
**Where**: `src/action.ts`, `action.yml`
**Depends on**: T4, T6
**Requirement**: SGOV-04
**Tests**: build
**Gate**: `npm run build`
**Status**: Done

### T8: Validate and Publish

**What**: Run release checks, commit atomically, create public GitHub repo, push, and verify remote.
**Where**: repository
**Depends on**: T7
**Requirement**: SGOV-05
**Tests**: full
**Gate**: `npm test`, `npm run build`, `npm run lint`, `npm run typecheck`
**Status**: In Progress
