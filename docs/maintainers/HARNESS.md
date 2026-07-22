# Repository Harness

`AGENTS.md` is the canonical contributor and agent contract. `CLAUDE.md` and `.github/copilot-instructions.md` are intentionally thin entry points so their rules cannot drift independently.

## Maintenance rule

When repository policy changes:

1. update `AGENTS.md` and the relevant `.specs` source of truth;
2. keep the two tool-specific files as pointers, adding tool-specific text only when technically required;
3. update behavior, tests, examples, documentation, and validation evidence together;
4. run the complete gate in `AGENTS.md` and record external release evidence separately from local evidence.

Reviewers should reject duplicated product contracts, machine-specific absolute paths, required personal tooling, or claims that are not backed by the referenced test or validation evidence.
