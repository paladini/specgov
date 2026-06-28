# SpecGov State

## Decisions

- Use TypeScript for the CLI and GitHub Action.
- Use YAML for the manifest.
- Default to advisory mode with strict mode opt-in.
- Keep the v1 core deterministic and framework-agnostic.
- Use TLC Spec Driven only as this repository's internal implementation process.

## Blockers

- None.

## Lessons Learned

- SpecGov must stay distinct from SpecTrace for AI Coding: SpecTrace checks evidence for a specific implementation change; SpecGov governs living spec artifacts across Git workflows.
- The v1 smoke test should include both advisory warnings and strict failures so users can trust the opt-in enforcement mode before adopting it.

## Deferred Ideas

- Optional LLM semantic drift auditor.
- SARIF output.
- ReqIF or OSLC export.
- GitLab and Bitbucket packaged integrations.
