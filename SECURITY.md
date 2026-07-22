# Security Policy

SpecGov's deterministic core runs locally or in CI without accounts, API keys, repository uploads, telemetry, or network calls.

Optional semantic auditing executes only an explicitly configured argument array without a shell. It uses bounded, versioned JSON over stdin/stdout, a timeout, an output limit, and a reduced environment. Teams control the executable and must treat it as trusted local code. SpecGov never prints inherited secrets or stores prompts and conversations by default.

Symlinks are ignored by default and declared relationship targets outside the repository are rejected. Producer metadata is unverified declaration, not proof of provenance.

## Reporting

Report vulnerabilities privately to the repository maintainer. Do not open a public issue for repository-data exposure, CI compromise, command execution, or dependency vulnerabilities.

## Supported Versions

The latest stable major version and the active release candidate are supported.
