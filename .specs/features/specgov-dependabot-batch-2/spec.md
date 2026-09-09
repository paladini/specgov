# SpecGov Dependabot Batch 2

**Scope:** Medium | **Status:** Complete

## Problem Statement

Open Dependabot PRs on `paladini/specgov` block repository hygiene: PR #10 has merge conflicts, PR #25 has conflicts, and PRs #28/#30/#31 are blocked pending a green `main` and updated branches.

## Out of Scope

- PR #15 (SpecGov v1 RC3) — feature work with conflicts, deferred.
- Publishing npm releases.

## Assumptions & Open Questions

- User authorized `git push` and PR merges for this maintenance batch.
- CI `quality` job requires `npm audit --omit=dev` clean and committed `dist/action/index.js` after dependency changes.

## User Stories

- As maintainer, when I merge dependency PRs, CI on `main` SHALL pass so branch protection allows merge.

## Requirements

| ID     | Requirement                        | Acceptance Criteria                                                                                      |
| ------ | ---------------------------------- | -------------------------------------------------------------------------------------------------------- |
| SG2-01 | Resolve upload-pages-artifact bump | WHEN `actions/upload-pages-artifact` is v5 in `pages.yml` THEN superseded PR #10 is closed and CI passes |
| SG2-02 | Merge dev-deps group PR #25        | WHEN conflicts are resolved and CI passes THEN PR #25 is merged                                          |
| SG2-03 | Merge remaining Dependabot PRs     | WHEN PRs #28, #30, #31 have CLEAN status and CI success THEN they are merged                             |
| SG2-04 | Main branch CI green               | WHEN batch completes THEN latest `main` CI workflow succeeds                                             |

## Requirement Traceability

| ID     | Verified by                                                              |
| ------ | ------------------------------------------------------------------------ |
| SG2-01 | `pages.yml` line with `upload-pages-artifact@...# v5.0.0`; PR #10 closed |
| SG2-02 | PR #33 merged (supersedes #25); #25 closed                               |
| SG2-03 | PRs #34–#35 merged (supersede #28/#30/#31); originals closed             |
| SG2-04 | `gh run list` CI success on `main`                                       |
