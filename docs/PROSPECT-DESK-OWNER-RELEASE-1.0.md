# Prospect Desk owner release

The coordinated branch contains PR #40 at 1a6e4f1f8e6c125a38e2dc3b85de509bfb2f9ae4 and PR #41 at bbe7cbc26def261cfddf20c33eb18796e1486b92. Release base and prior production commit at inspection were 29b5839ab23eabfd663975d0fa1014655b5ef88c (deployment 927cf6ee-3439-4d1d-b19c-f5160a3133ad). Merges to main trigger Cloudflare Pages production deployment. Refresh these references immediately before changes.

Dylan reported passing preview sign-in, screenshot discussion through approved evidence and task, and Windows capture and restart persistence with 0.3.0. Repeat production connection and affected receipt checks for 0.4.0.

## Deploy and activate

1. Confirm PR checks, compare main, and confirm bindings: production D1 930e2072-752a-42f7-8ae0-e2e280ca3a46; preview D1 f5ac694d-1028-4a30-9fbd-c264b2e5995e. The owner workspace is virginia-tam:dylan-haysbert.
2. Record a current D1 Time Travel bookmark privately. Apply additive 0020 and 0021; confirm the new access table is empty. Check the previous acquisition and producer paths with synthetic fixtures before publishing.
3. Publish the combined candidate. Primary Work uses existing producer authentication at /agent/workspace/. Shared desktop routes at https://coveragefit.com stay disabled until D1 activation. Verify the disabled response and public acquisition routes.
4. On the owner's laptop, extract 0.4.0, open Settings and copy the production setup fingerprint. The credential is created and encrypted locally. Register only its SHA-256 fingerprint in cf_prospect_desk_owner_access for the exact production workspace. Enable the row when the release gates pass. Never use the fingerprint as the bearer token.
5. The owner clicks Connect to production after activation. The app confirms origin and workspace before switching and retains the separate preview credential. Use a new thread for the explicitly selected customer and opportunity. Resolve old pending preview receipts against the original preview connection.
6. Start with three existing owner-selected prospects and log the first ten reviewed work items. Record timing on comparable pre-pilot cases, evidence/accuracy, follow-up quality, repeats and actual provider usage. No sending, import, bulk upload or production AI flag changes are part of this release. The desktop conservatively reserves against $5 before production model calls on the enrolled device, pins GPT-4.1 mini and retains reservations for calls with unknown costs. Retain any stricter existing project limits.

## Rollback

Disable the production activation row first. All release deployments using this D1 table recheck the row. Newly approved writes also check it at commit. To revoke a laptop and enroll a new one, replace the fingerprint while disabled, then re-enable. Revert the release through main or roll back Pages to the recorded prior deployment as needed, leaving additive tables and approved work in place. Preserve pending receipt envelopes and make an owner-private workspace backup before downgrading. Avoid point-in-time restore as normal rollback because it can undo other work since the bookmark. Reserve Time Travel for recovery after investigating intervening writes.

Preview uses different bindings and credentials. Disabling or deleting the isolated preview needs a separate scoped operation and does not affect production. Deployment snapshots can retain their previous preview flags.
