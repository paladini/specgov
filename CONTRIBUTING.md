# Contributing

SpecGov welcomes focused issues and pull requests for AI-development artifact governance.

## Development gate

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

Behavior changes must update tests, the relevant `.specs/features/` artifacts, public types, examples, and documentation together. New framework conventions require an official primary source, a verification date, and canonical fixtures. Policies must consume the normalized graph rather than framework-specific paths.

Pull requests should explain public CLI, JSON schema, Action, security, and migration impact. Never include prompts, conversations, API keys, tokens, or inferred producer metadata.
