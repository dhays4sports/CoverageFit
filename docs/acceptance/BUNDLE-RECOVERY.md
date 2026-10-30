# Exact-history transport — CoverageFit

The original `coveragefit-continuation-04d62e9.bundle` is unchanged.

- SHA-256: `05e6f482506b215a0d0bae2c4b3d0a0680f0124e0cf62af92533e1624279a68a`
- Branch: `refs/heads/fix/restaurant-intake-1-0`
- Tip: `04d62e96e100828a565aab8e54c867f536295241`
- Required history: `709db6908cd8edb9cce349569e7ce699c65b3569` and its ancestors.
- Preserved ancestry: `50f0c87dd4c3e831a37742877f684f4918d98bf7` → `c7b1e991b3b2d3112dd759dc5c86dff765875161` → `04d62e96e100828a565aab8e54c867f536295241`.

An isolated bare repository was seeded only with prerequisite history, then fetched this bundle. The exact tip matched and full Git object integrity passed. This is an incremental bundle, not a standalone clone. Original author/committer metadata and object IDs are preserved.

## Import in an already-authenticated clone

Confirm `origin` is exactly the intended `dhays4sports/CoverageFit` repository. Do not put credentials in its URL. These commands do not check out or alter the current working tree:

```sh
sha256sum coveragefit-continuation-04d62e9.bundle
git fetch origin refs/heads/fix/restaurant-intake-1-0:refs/remotes/origin/fix/restaurant-intake-1-0
git rev-parse refs/remotes/origin/fix/restaurant-intake-1-0
git bundle verify coveragefit-continuation-04d62e9.bundle
git fetch coveragefit-continuation-04d62e9.bundle refs/heads/fix/restaurant-intake-1-0
git rev-parse FETCH_HEAD
git merge-base --is-ancestor refs/remotes/origin/fix/restaurant-intake-1-0 FETCH_HEAD
```

Expected remote tip is `709db6908cd8edb9cce349569e7ce699c65b3569`; expected imported tip is `04d62e96e100828a565aab8e54c867f536295241`. If either differs, stop for ancestry review. No force, reset, amend, rebase, squash or file-API reconstruction.

## Deployment gate before publication

A push triggers a Cloudflare Preview build. Reconfirm the selected project's non-production branch settings, protected Preview Access, TEST D1 `coveragefit-distribution-test` / `f5ac694d-1028-4a30-9fbd-c264b2e5995e`, workspace `distribution-engine:synthetic-test`, isolation and provider-disabled configuration. Preserve production main and the existing `fa3adc1d` Preview as rollback. Do not transfer its exact-host distribution Service Auth authorization to a new hostname, repoint frontend origins or change credentials/Access. If these conditions cannot be verified, stop before push.

Only after those checks:

```sh
git push origin 04d62e96e100828a565aab8e54c867f536295241:refs/heads/fix/restaurant-intake-1-0
git ls-remote origin refs/heads/fix/restaurant-intake-1-0
```

This explicitly advances existing PR #37; it creates no replacement PR. Verify remote SHA, stacked base, CI and actual deployment SHA before acceptance.

## Subsequent independent engineering

Commit `145cda3c51b53fb1dc840165b9e698202fde1655` is a direct descendant of the original bundle tip. A separately named newer bundle includes this code and its ledger update. Preserve the original bundle. To publish the newer bundle, use its separately reported SHA-256 and exact tip in the same verification flow; first prove the original `04d62e9` tip is an ancestor. Do not accidentally publish only the older checkpoint while claiming the newer fixes are hosted.

Export HTTP remains blocked. Transport approval does not activate export or resolve legacy source-rights, inventory, suppression, capacity or hosted security gates. Consumer and patched producer acceptance remain separate from local tests. Production NO-GO.
