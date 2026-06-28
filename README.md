# SpecGov

[![CI](https://github.com/paladini/specgov/actions/workflows/ci.yml/badge.svg)](https://github.com/paladini/specgov/actions/workflows/ci.yml)
[![MIT License](https://img.shields.io/badge/license-MIT-0f766e.svg)](LICENSE)
[![Docs](https://img.shields.io/badge/docs-GitHub%20Pages-2f6f4e.svg)](https://paladini.github.io/specgov/)

Govern the specs your code is supposed to honor.

SpecGov is a framework-agnostic governance layer for spec-driven development in
Git repositories. It does not invent a new spec format. It lets you declare the
requirements, ADRs, product docs, `.specs` folders, Kiro specs, Spec Kit plans,
or custom artifacts that already define your system, then checks whether code
changes keep those artifacts in the loop.

The core is deterministic by design: no API keys, no hosted service, no model
calls, and no vendor lock-in. You can run it locally, in CI, or as a GitHub
Action.

## Why SpecGov exists

Spec-driven development works until Git quietly merges implementation changes
that bypass the spec layer. Over time, reviewers stop trusting requirements,
ADRs become archaeology, and AI-assisted changes become harder to audit.

SpecGov gives teams a small, explicit contract:

- Which files are governed artifacts?
- Which code paths depend on which artifacts?
- Did this pull request update the right spec, doc, ADR, or plan?
- Which artifacts are stale, orphaned, superseded, or missing ownership?
- Can a human or future AI auditor reconstruct the trace later?

## What SpecGov checks

| Capability         | What it does                                                     |
| ------------------ | ---------------------------------------------------------------- |
| Artifact discovery | Finds governed docs, ADRs, specs, and requirements from globs.   |
| Lifecycle metadata | Reads optional YAML frontmatter such as `status` and `owner`.    |
| PR impact checks   | Flags code changes that do not touch mapped spec artifacts.      |
| Unmapped code      | Finds changed files outside your declared code-to-spec map.      |
| Trace index        | Emits JSON linking artifacts, mappings, and matched files.       |
| Drift report       | Reports stale, empty, orphaned, or superseded artifacts.         |
| GitHub Action      | Runs the same deterministic check inside pull request workflows. |

## Installation

SpecGov is currently pre-release. Until the first npm package and version tag
are published, install it from source:

```bash
git clone https://github.com/paladini/specgov.git
cd specgov
npm ci
npm run build
npm link
```

After `npm link`, the `specgov` command is available on your machine:

```bash
specgov --help
```

You can also run the local build directly:

```bash
node dist/cli.js --help
```

## Quick start

From the repository you want to govern:

```bash
specgov init
specgov scan
specgov check-pr --changed-file src/auth/session.ts
specgov trace --out .specgov.trace.json
specgov drift
```

`specgov init` creates `.specgov.yml`. Start in `advisory` mode so teams can
see findings without blocking merges, then switch selected repositories or
paths to `strict` when the mapping is trusted.

## Manifest

SpecGov uses one YAML manifest:

```yaml
version: 1
mode: advisory

artifacts:
  - path: "docs/**/*.md"
    kind: documentation
    owner: docs
  - path: "adr/**/*.md"
    kind: decision
    owner: architecture
  - path: ".specs/**/*.md"
    kind: specification
    owner: engineering

mappings:
  - code: "src/auth/**"
    specs:
      - "docs/auth/**"
      - "adr/auth/**"
      - ".specs/features/auth/**"
    description: Authentication behavior must stay aligned with its specs.

rules:
  require_spec_impact_for_code_changes: true
  require_lifecycle_status: false
  require_owner_for_active_specs: false
  stale_after_days: 180

ignore:
  - "node_modules/**"
  - "dist/**"
  - ".git/**"
```

### Governed artifacts

Each entry in `artifacts` tells SpecGov which files belong to your spec layer.
Use any folder convention you already have:

- `docs/**/*.md` for product or engineering docs.
- `adr/**/*.md` for architectural decisions.
- `.specs/**/*.md` for TLC Spec Driven or custom specs.
- `.kiro/specs/**/*.md` for Kiro-style spec folders.
- `specs/**/*.md` for Spec Kit or other repository-local plans.

### Code-to-spec mappings

Each entry in `mappings` connects implementation paths to the artifacts that
must move with them. If `src/auth/**` changes and no mapped artifact changes,
SpecGov reports `SPEC_IMPACT_MISSING`.

When `require_spec_impact_for_code_changes` is enabled, SpecGov also reports
`CODE_CHANGE_UNMAPPED` for changed files that are not covered by any mapping,
are not governed artifacts, and are not ignored.

### Lifecycle frontmatter

Governed Markdown files can include optional lifecycle metadata:

```markdown
---
status: active
owner: platform
last_verified: 2026-06-27
---

# Authentication Session Contract
```

Supported statuses are `draft`, `active`, `superseded`, `deprecated`, and
`archived`. Superseded artifacts can declare `superseded_by` so readers know
where the current source of truth moved.

## Commands

| Command            | Purpose                                              | Common use             |
| ------------------ | ---------------------------------------------------- | ---------------------- |
| `specgov init`     | Create a starter `.specgov.yml`.                     | First-time setup.      |
| `specgov scan`     | Discover governed artifacts and lifecycle findings.  | Local audit.           |
| `specgov check-pr` | Compare changed files against code-to-spec mappings. | Pull request checks.   |
| `specgov trace`    | Generate a machine-readable trace index.             | Automation and audits. |
| `specgov drift`    | Report stale, empty, orphaned, or superseded specs.  | Maintenance reviews.   |

All report commands default to Markdown output. Use `--format json` for
automation:

```bash
specgov scan --format json
specgov check-pr --format json --changed-file src/payments/checkout.ts
```

Exit codes:

- `0`: pass, or warning in `advisory` mode.
- `1`: governance failure in `strict` mode.
- `2`: runtime or configuration error.

## GitHub Action

Add SpecGov to pull requests with a workflow like this:

```yaml
name: SpecGov

on:
  pull_request:

jobs:
  specgov:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v5
        with:
          fetch-depth: 0

      - uses: paladini/specgov@main
        with:
          mode: advisory
          base-ref: ${{ github.event.pull_request.base.sha }}
          head-ref: ${{ github.event.pull_request.head.sha }}
```

Use `paladini/specgov@main` only while the project is pre-release. After a
version tag exists, pin the Action to that tag.

Use `mode: strict` when governance findings should block the pull request.

### Action inputs

| Input           | Default        | Description                                              |
| --------------- | -------------- | -------------------------------------------------------- |
| `config`        | `.specgov.yml` | Path to the manifest.                                    |
| `mode`          | `advisory`     | `advisory` reports warnings; `strict` fails on warnings. |
| `base-ref`      | unset          | Base git ref for pull request comparison.                |
| `head-ref`      | unset          | Head git ref for pull request comparison.                |
| `output-format` | `markdown`     | Report format for logs and `report-json`.                |
| `changed-files` | unset          | Newline-delimited file list when you provide the diff.   |

### Action outputs

| Output        | Description                                     |
| ------------- | ----------------------------------------------- |
| `status`      | `pass`, `warn`, `fail`, or `error`.             |
| `report-json` | Serialized `SpecGovReport` for downstream jobs. |

## Adoption recipes

The `examples/` folder includes starter manifests:

| Repository style  | Example                                                                              |
| ----------------- | ------------------------------------------------------------------------------------ |
| Docs-only         | [`examples/docs-only/.specgov.yml`](examples/docs-only/.specgov.yml)                 |
| ADR-heavy         | [`examples/adr-heavy/.specgov.yml`](examples/adr-heavy/.specgov.yml)                 |
| Framework folders | [`examples/framework-folders/.specgov.yml`](examples/framework-folders/.specgov.yml) |

A practical rollout usually looks like this:

1. Run `specgov init`.
2. Add one or two high-value mappings, not the whole repository.
3. Run `specgov scan` and fix obvious empty globs.
4. Add the GitHub Action in `advisory` mode.
5. Review warnings in a few pull requests.
6. Tighten high-confidence areas with `mode: strict`.
7. Schedule `specgov drift` as a periodic maintenance check.

## Report example

```markdown
# SpecGov check-pr report

Status: **warn**
Mode: `advisory`
Findings: 1 (0 errors, 1 warnings, 0 info)

## Changed Files

- `src/auth/session.ts`

## Findings

- **WARNING SPEC_IMPACT_MISSING**: Code changed under src/auth/** without a
  related spec artifact change.
  - Related: `src/auth/session.ts`, `docs/auth/**`, `adr/auth/**`
  - Suggestion: Update a mapped spec artifact or run in advisory mode until
    this mapping is ready to enforce.
```

## How SpecGov differs from SpecTrace

SpecTrace for AI Coding verifies whether a specific AI-assisted change
satisfies explicit requirements and evidence maps. SpecGov operates one layer
higher: it governs living spec artifacts across Git workflows regardless of
author, framework, or whether AI was involved.

They work well together:

- Use SpecGov to keep the repository's source-of-truth artifacts aligned.
- Use SpecTrace to audit the evidence behind a specific implementation change.

## Development

```bash
npm ci
npm test
npm run build
npm run lint
npm run typecheck
npm run format:check
```

SpecGov uses TLC Spec Driven internally. Public behavior changes should update
the relevant files under `.specs/`, tests, and README examples in the same pull
request.

## Security and privacy

SpecGov runs locally or in your CI runner. Version 0.1 does not call external
services, require API keys, or send repository contents to a model. See
[`SECURITY.md`](SECURITY.md) for vulnerability reporting.

## Project links

- Website: <https://paladini.github.io/specgov/>
- Repository: <https://github.com/paladini/specgov>
- Roadmap: [`.specs/project/ROADMAP.md`](.specs/project/ROADMAP.md)
- Contribution guide: [`CONTRIBUTING.md`](CONTRIBUTING.md)
