# Upgrading from SpecGov v0.1

SpecGov v1 is an intentional clean break. The v0.1 `version`, `artifacts`, `mappings`, and `rules` contract and the `scan`, `check-pr`, `trace`, and `drift` commands are not supported.

1. Run `specgov init --dry-run` to inspect autodetection.
2. Replace the manifest with `schema: specgov/v1`.
3. Convert trusted `mappings` into explicit `domains`.
4. Replace PR checks with `specgov check --base-ref ... --head-ref ...`.
5. Consume `specgov graph --format json` instead of the old trace index.

There is no automatic migration because v1's artifact graph and policy semantics cannot safely infer strict domain mappings from v0.1 globs.
