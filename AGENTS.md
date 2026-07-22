# SpecGov Contributor and Agent Contract

This file is the canonical operating contract for humans and coding agents working in this repository. `CLAUDE.md` and `.github/copilot-instructions.md` point here; if they disagree, this file wins.

## Product boundaries

- SpecGov governs artifacts used in AI-assisted development. It never infers whether AI authored code or an artifact.
- SpecGov is a Git-native, framework-agnostic governance layer above Spec Kit, OpenSpec, Kiro, TLC, and generic workflows. It is not a spec-authoring framework.
- Deterministic analysis is the product core and must work offline, with no mandatory model or network call.
- Strict code-to-artifact enforcement requires an explicitly configured domain. A changed artifact outside that domain cannot satisfy it.
- The semantic auditor is opt-in, provider-independent, invoked as an argument array without a shell, and exchanges bounded, versioned JSON.
- Producer metadata is a declaration, not verified provenance.
- v1 is an intentional clean break from v0.1. Do not silently accept or translate the legacy manifest, commands, API, or report format.
- The public CLI exposes only `init`, `check`, and `graph`.
- Never commit prompts, conversations, credentials, tokens, inferred authorship, or private model context.

## Source of truth

Read these before changing behavior:

1. `.specs/project/PROJECT.md` and `.specs/project/STATE.md`
2. `.specs/features/specgov-v1/spec.md`
3. `.specs/features/specgov-v1/design.md`
4. `.specs/features/specgov-v1/tasks.md` and `validation.md`
5. `CONTRIBUTING.md`, `SECURITY.md`, and `RELEASING.md` when the change affects their domains

The v1 spec defines behavior. Tests provide executable evidence. Validation records distinguish local verification from external publication. The archived `specgov-core` documents describe v0.1 only and are not current requirements.

## Change contract

- Keep adapters isolated from graph and policy logic. A new framework convention needs an official primary source, verification date, and canonical fixture.
- Keep normalized graph IDs, ordering, JSON, and findings deterministic across platforms and repeated runs.
- Treat repository paths as untrusted: normalize repository-relative paths, reject escapes and external targets, and ignore symlinks by default.
- Run semantic commands without a shell; bound time, input, output, and inherited environment.
- A behavior change must update its requirement, implementation, tests, examples, and public documentation in the same pull request.
- Changes to public CLI, API, JSON, Action inputs/outputs, manifest schema, or findings require explicit compatibility and migration notes.
- Do not mark a requirement or release complete from implementation alone. Record the gate evidence in `validation.md`; external claims require external evidence.
- Do not hand-edit generated Action output. Change its source, rebuild it, and include the exact generated bundle when required.

## Required gates

Run the smallest relevant checks while iterating, then the complete gate before handoff:

```bash
npm ci
npm test
npm run build
npm run harness:check
npm run lint
npm run typecheck
npm run format:check
npm audit --omit=dev
npm pack --dry-run
```

Also install the produced tarball into a clean temporary repository for packaging changes. Action or release changes require an external consumer test at an immutable tag or SHA. Never publish, move a stable tag, or claim an external check passed without verifying the public result.

## Pull-request handoff

Summarize the requirement IDs affected, files changed, gates and test counts, security/compatibility impact, documentation updates, and any `SPEC_DEVIATION`. Preserve unrelated working-tree changes. Do not weaken, skip, or delete tests to obtain a green gate.
