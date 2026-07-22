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

- Stable public release and article publication depend on authenticated external services and successful RC validation.

## Lessons Learned

- Generic documentation governance obscured the product's strongest use case: durable governance after agent conversations disappear.
- A changed but unrelated spec cannot satisfy governance for an explicitly mapped code domain.
- Framework conventions must remain adapter-specific and sourced from official documentation.

## Deferred Ideas

- Cryptographic provenance, hosted services, SARIF, and provider-specific semantic integrations.
