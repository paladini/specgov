# Releasing SpecGov

## Release candidate

1. Complete the feature branch and open a PR.
2. Pass tests, build, lint, typecheck, format, production audit, and pack checks locally and in CI.
3. Set the next unused `1.0.0-rc.N` version, commit the Action bundle, and create the matching immutable tag only after review.
4. The release workflow publishes prereleases to npm `next` and creates a GitHub prerelease.
5. Install the exact tarball in a clean external sample repository and verify every CLI command plus the Action at the immutable tag/SHA.
6. Complete the six documented user journeys and fix release blockers.

## Stable v1.0.0

1. Merge the reviewed PR and repeat all gates on `main`.
2. Set `1.0.0`, build and commit the exact bundle, then tag `v1.0.0`.
3. The workflow publishes npm `latest`, creates an immutable GitHub Release, and moves Action tag `v1`.
4. Verify npm metadata/install/help, external Action behavior, Pages/canonical HTTP status, release assets, topics, and repository description.

Never reuse a stable tag or mutate an existing release. Authentication uses GitHub OIDC/trusted publishing; do not store or print npm credentials.
