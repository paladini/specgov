# SpecGov

**Vision:** SpecGov is the Git-native governance layer for artifacts created and consumed during AI-assisted software development.
**For:** Developers, AI-assisted engineering teams, platform engineers, and OSS maintainers.
**Solves:** Intent, specifications, plans, tasks, implementation, and verification evidence drift apart after coding agents act on them.

## Goals

- Produce a useful, deterministic artifact-governance result with `npx specgov check` and no configuration.
- Autodetect Spec Kit, OpenSpec, Kiro, and Generic/TLC workflows and expose one stable graph.
- Enforce explicit code-to-artifact governance in local development and pull requests.
- Keep all deterministic analysis local and network-free.

## Tech Stack

- Node.js 20+, TypeScript ESM, Commander, YAML, Zod, fast-glob, picomatch.
- Vitest, ESLint, Prettier, GitHub Actions, and a Node 24 ncc Action bundle.
- No database or hosted service.

## Scope

**v1 includes:** framework adapters, normalized artifact graph, deterministic policies, optional executable semantic auditor, CLI, library API, GitHub Action, examples, docs, and public release assets.

**Explicitly out of scope:** spec authoring, code generation, inferred authorship, mandatory LLM calls, hosted storage, automatic v0.1 migration, and cryptographic provenance.

## Constraints

- Preserve repository, npm package, URLs, license, author, Git history, and unrelated user changes.
- Treat producer metadata as declarations only.
- Reject paths outside the repository and ignore symlinks by default.
- Release only after package, Action, docs, and external smoke tests pass.
