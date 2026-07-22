# SpecGov v1 Design

## Architecture

`adapters -> normalized graph -> policy engine -> library/CLI/Action`

- `src/adapters/*`: isolated detection/discovery conventions.
- `src/metadata.ts`: namespaced frontmatter declarations.
- `src/config.ts`: optional Zod-validated `specgov/v1` manifest.
- `src/graph.ts`: repository-safe normalization, stable IDs, relations, and sorting.
- `src/policies.ts`: pure state-aware deterministic checks.
- `src/semantic.ts`: bounded `execFile` JSON protocol without a shell.
- `src/analyze.ts`: orchestration used by every interface.
- `src/report.ts`, `src/cli-app.ts`, `src/action.ts`: delivery adapters.

## Key Decisions

- Stable IDs use a SHA-256 prefix over adapter ID and normalized repository-relative path.
- Adapter-detected edges encode conventional chains; namespaced metadata may add declared edges.
- Generic/TLC detection is conservative and limited to recognized workflow filenames or configured roots.
- Strict implementation governance only uses explicit domains; repository-level correlation remains low-confidence advisory evidence.
- Generation time is outside the deterministic graph payload.
- Semantic subprocesses receive only an explicit environment allowlist and bounded stdin/stdout.

## Requirement Mapping

| Requirement      | Components                                |
| ---------------- | ----------------------------------------- |
| SGV1-01          | adapters, fixtures                        |
| SGV1-02, SGV1-03 | graph, metadata, types                    |
| SGV1-04          | config                                    |
| SGV1-05          | policies                                  |
| SGV1-06          | analyze, CLI, report, index               |
| SGV1-07          | semantic                                  |
| SGV1-08          | action, action.yml                        |
| SGV1-09          | unit/integration/e2e/performance tests    |
| SGV1-10          | README, docs, examples, release workflows |
