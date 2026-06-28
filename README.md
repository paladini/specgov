# SpecGov

SpecGov is a framework-agnostic governance layer for spec-driven development in
Git repositories. It does not create a new spec format. Instead, it helps teams
keep existing requirements, ADRs, product docs, tasks, and framework-specific
spec folders aligned with code changes.

Version 0.1 is deterministic by design: no API keys, no LLM dependency, and no
vendor-specific workflow required.

## What It Does

- Discovers governed artifacts from a `.specgov.yml` manifest.
- Validates lifecycle metadata such as `active`, `superseded`, and `archived`.
- Checks whether code changes touched the related spec artifacts.
- Generates a trace index for humans, CI, and future AI auditors.
- Runs as a TypeScript CLI or GitHub Action.
- Defaults to advisory mode so projects can adopt it gradually.

## Quick Start

Install dependencies and build from source:

```bash
npm install
npm run build
```

Create a manifest:

```bash
npx specgov init
```

Scan governed artifacts:

```bash
npx specgov scan
```

Check a pull request diff:

```bash
npx specgov check-pr --base-ref origin/main --head-ref HEAD
```

Generate a trace index:

```bash
npx specgov trace --out .specgov.trace.json
```

## Manifest

SpecGov uses a small YAML manifest:

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
  - code: "src/payments/**"
    specs: "docs/payments/**"

rules:
  require_spec_impact_for_code_changes: true
  require_lifecycle_status: false
  require_owner_for_active_specs: false
  stale_after_days: 180
```

Each governed artifact can optionally include YAML frontmatter:

```markdown
---
status: active
owner: engineering
last_verified: 2026-06-27
---

# Checkout Flow
```

## GitHub Action

```yaml
name: SpecGov

on:
  pull_request:

jobs:
  specgov:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      - uses: paladini/specgov@v0.1.0
        with:
          mode: advisory
          base-ref: ${{ github.event.pull_request.base.sha }}
          head-ref: ${{ github.event.pull_request.head.sha }}
```

Use `mode: strict` when you want governance findings to fail the check.

## How This Differs From SpecTrace

SpecTrace for AI Coding verifies whether a specific AI-assisted code change
satisfies explicit requirements and evidence maps. SpecGov operates one layer
higher: it governs spec artifacts across Git workflows regardless of author,
framework, or whether AI was involved.

## Development

```bash
npm test
npm run build
npm run lint
npm run typecheck
```

## Status

SpecGov is early OSS. The v1 core is intentionally small: deterministic checks
first, AI audit later as an optional plugin.
