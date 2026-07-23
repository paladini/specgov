# SpecGov

<img alt="Harness Score L1" src="https://paladini.github.io/harness-score/maturity/badge-l1.svg" height="20">
**The Git-native governance layer for artifacts created and consumed during AI-assisted software development.**

AI coding agents work from durable artifactsÔÇöintent, requirements, specs, plans, designs, tasks, and evidenceÔÇöbut Git does not ensure those artifacts still describe the code. SpecGov autodetects common spec workflows, builds a normalized artifact graph, and reports incomplete chains or code changes that bypass their governing artifacts.

- AI-first, agent-agnostic, and framework-agnostic.
- Local and deterministic by default; no account, API key, upload, or network call.
- Zero-config discovery for GitHub Spec Kit, OpenSpec, Kiro, and Generic/TLC workflows.
- Explicit domain mappings for trustworthy pull-request enforcement.
- Optional provider-independent semantic auditing through a safe executable JSON protocol.

## Quick start

```bash
npx specgov check
npx specgov graph --format markdown
npx specgov init --dry-run
```

`check` reports detected frameworks, change sets, artifact roles, findings, evidence, and exact remediation. Advisory mode never blocks on policy findings; strict mode returns exit code 1. Configuration/runtime errors return 2.

## Configuration

Configuration is optional. Add `.specgov.yml` when code must be mapped to its governing artifacts:

```yaml
schema: specgov/v1
mode: advisory
frameworks: auto

domains:
  - id: authentication
    code:
      - "src/auth/**"
    artifacts:
      - "specs/auth/**"
      - ".kiro/specs/auth/**"

policies:
  require_complete_chain: true
  require_change_artifact_for_code: true
  require_verification_evidence: false
  stale_after_days: 90
```

An unrelated changed spec never satisfies an explicit domain. Old v0.1 manifests are intentionally unsupported; see [the upgrade notice](docs/upgrade-v1.md).

## Supported workflows

| Framework       | Core artifacts                                                                  |
| --------------- | ------------------------------------------------------------------------------- |
| GitHub Spec Kit | constitution, spec, plan, tasks, optional checklists                            |
| OpenSpec        | proposal, delta/canonical specs, optional design, tasks, active/archive changes |
| Kiro            | requirements or bugfix, design, tasks, steering                                 |
| Generic/TLC     | configurable roots and role filenames, including `.specs/features/*`            |

SpecGov is not another spec-authoring framework. It governs the files those frameworks and agents already create.

## Declared metadata

Optional namespaced frontmatter can declare lifecycle, scope, ownership, relations, and producer context. Producer fields are declarationsÔÇönot verified provenanceÔÇöand SpecGov never infers AI authorship.

```yaml
specgov:
  role: spec
  state: active
  scope: ["src/auth/**"]
  owner: platform
  producer:
    tool: codex
    model: gpt-5
```

## GitHub Action

```yaml
- uses: actions/checkout@v5
  with:
    fetch-depth: 0
- uses: paladini/specgov@v1
  with:
    mode: strict
    base-ref: ${{ github.event.pull_request.base.sha }}
    head-ref: ${{ github.event.pull_request.head.sha }}
```

The Action writes a Markdown summary and exposes status, report JSON, graph JSON, detected frameworks, and finding count.

## Programmatic API

```ts
import {
  analyzeRepository,
  discoverArtifactGraph,
  loadSpecGovConfig,
  renderReport,
} from "specgov";
```

## What deterministic governance proves

SpecGov can prove that files, relationships, declared states, and explicit path mappings satisfy configured structural policy. It cannot prove semantic correctness, authorship, or that a declared producer is truthful. Optional semantic auditors can add review signals without changing those boundaries.

## Related projects

- **harness-score** measures the quality of an agent harness; SpecGov governs durable development artifacts.
- **SpecTrace for AI Coding** evaluates evidence for a specific AI-assisted change; SpecGov governs the repository-wide artifact lifecycle.

## Development

```bash
npm ci
npm test
npm run build
npm run lint
npm run typecheck
npm run format:check
npm audit --omit=dev
npm pack --dry-run
```

MIT ┬® Fernando Paladini. See [Security](SECURITY.md), [Contributing](CONTRIBUTING.md), and [Releasing](RELEASING.md).
