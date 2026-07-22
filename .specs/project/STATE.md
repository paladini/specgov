# SpecGov State

## Decisions

- v1 is an intentional clean break from the generic v0.1 manifest, commands, API, and report format.
- The product governs AI-assisted development artifacts without inferring whether AI created them.
- Built-in adapters are isolated from the graph and policy engine.
- Explicit domains are required for strict code-to-artifact governance.
- Deterministic analysis is the product core; semantic analysis is an opt-in executable JSON protocol.
- Producer metadata is declared, never verified or inferred.
- The public CLI has only `init`, `check`, and `graph` commands.

## Blockers

- npm `1.0.0-rc.1` publication requires a correctly configured npm Trusted Publisher (preferred) or an explicitly authorized granular publishing token.
- Stable public release and article publication remain blocked until the existing RC tag publishes successfully and the six journeys in `validation.md` pass against external distribution surfaces.

## Lessons Learned

- Generic documentation governance obscured the product's strongest use case: durable governance after agent conversations disappear.
- A changed but unrelated spec cannot satisfy governance for an explicitly mapped code domain.
- Framework conventions must remain adapter-specific and sourced from official documentation.
- Implementation, local verification, external verification, and publication are distinct states and must not be collapsed into a single "done" claim.

## Current Status

- PR #5 merged the v1 implementation into `main`; local tests, build, typecheck, lint, format, production audit, tarball install smoke, and dogfood checks passed on 2026-07-22.
- The portable repository harness is rooted at `AGENTS.md`; Claude and Copilot surfaces point to it to prevent policy drift.
- The v0.1 `specgov-core` feature is archived historical context, not an active source of requirements.
- External npm RC, GitHub prerelease, external Action, complete performance/edge-case coverage, and stable release evidence remain pending.

## Deferred Ideas

- Cryptographic provenance, hosted services, SARIF, and provider-specific semantic integrations.
