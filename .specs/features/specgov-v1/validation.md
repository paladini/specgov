# SpecGov v1 Validation

**Date:** 2026-07-22

## Automated results

- 15 Vitest tests passed; 0 failed or skipped.
- TypeScript strict typecheck, ESLint, Prettier, and ncc build passed.
- `npm audit --omit=dev` reported 0 production vulnerabilities.
- `npm pack --dry-run` produced `specgov-1.0.0-rc.1.tgz`.
- The exact RC tarball installed into a clean temporary repository; `check` autodetected Kiro and `graph` emitted valid JSON.
- Dogfood `specgov check` detected Generic/TLC and returned pass.
- Dogfood `specgov graph` emitted deterministic JSON.

## Remaining release UAT

- Execute the bundled Action from an external sample repository.
- Verify the RC through GitHub Actions/npm `next`, then complete all six user journeys.
- Verify Pages, canonical redirect/HTTPS, repository metadata, and public launch surfaces before stable publication.

**Overall:** local RC implementation ready for review; not yet a verified stable release.
