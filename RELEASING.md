# Releasing SpecGov

SpecGov releases are tag-driven. A pushed `vX.Y.Z` tag runs the release
workflow, validates the package, publishes the npm version when it is not
already present, and creates or updates the matching GitHub Release.

## One-time npm setup

The release workflow supports both npm Trusted Publishing and an `NPM_TOKEN`
repository secret. Trusted Publishing is preferred because it uses GitHub OIDC
instead of a long-lived token.

For Trusted Publishing, configure the npm package with:

- Package: `specgov`
- Repository: `paladini/specgov`
- Workflow: `release.yml`
- Environment: leave blank unless the workflow is later changed to use one

Docs: <https://docs.npmjs.com/trusted-publishers/>

If Trusted Publishing is not configured, add an `NPM_TOKEN` secret to the
GitHub repository before pushing a release tag.

## Release a new version

From a clean `main` branch:

```bash
npm version patch
git push origin main --follow-tags
```

Use `npm version minor` or `npm version major` when the change warrants it. The
version commit updates `package.json` and `package-lock.json`, and the tag
triggers `.github/workflows/release.yml`.

## Verify a release

After the workflow completes, check:

```bash
npm view specgov version
gh release view vX.Y.Z --repo paladini/specgov
npx specgov@latest --help
```

The first release can be bootstrapped locally with `npm publish --access public`
when the package has not yet been created on npm. After that, prefer the tag
workflow.
