# Contributing

Thanks for considering a contribution to SpecGov.

## Development

```bash
npm install
npm test
npm run build
npm run lint
npm run typecheck
npm run format:check
```

## Releases

Releases are tag-driven. Follow [`RELEASING.md`](RELEASING.md) when publishing
a new npm version or GitHub Release.

## Spec Governance

SpecGov uses TLC Spec Driven internally, but the product itself is framework
agnostic. Changes that affect behavior should update the relevant files under
`.specs/` and keep the README examples in sync.

## Pull Requests

- Keep changes focused.
- Include tests with behavior changes.
- Run the full local gate before opening a PR.
- Mention whether the PR changes public CLI behavior, report shape, or Action inputs.
