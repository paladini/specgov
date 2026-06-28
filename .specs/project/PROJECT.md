# SpecGov

**Vision:** SpecGov is a universal governance layer that keeps spec artifacts aligned with code changes in Git repositories without imposing a spec framework.
**For:** Open-source maintainers, platform engineers, AI-assisted development teams, and compliance-minded engineering organizations.
**Solves:** Specs, ADRs, requirements, and implementation plans become stale because Git can merge code changes without requiring explicit spec impact.

## Goals

- Provide a deterministic CLI that validates spec governance in any Git repository.
- Ship a GitHub Action that teams can adopt in advisory mode and later tighten to strict mode.
- Preserve framework neutrality across docs, ADRs, `.specs`, `.kiro`, Spec-Kit, TLC, and custom formats.

## Tech Stack

**Core:**

- Framework: Node.js CLI
- Language: TypeScript
- Database: None

**Key dependencies:** commander, yaml, fast-glob, picomatch, Vitest.

## Scope

**v1 includes:**

- YAML manifest parsing and validation.
- Artifact discovery and lifecycle checks.
- Code-to-spec impact checks for PR diffs.
- Trace index and drift reports.
- GitHub Action wrapper.

**Explicitly out of scope:**

- Required LLM audit.
- Enterprise compliance exports.
- GitLab and Bitbucket packaged integrations.
- Package registry publication.
- A new spec authoring framework.

## Constraints

- Keep the core deterministic and runnable without secrets.
- Favor advisory adoption by default.
- Keep implementation small enough for a reviewer to understand quickly.
