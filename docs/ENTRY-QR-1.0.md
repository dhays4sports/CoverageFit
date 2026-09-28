# Entry QR increment — 2026-09-28

## Contract and scope

Only `/{home,condo}/qr/{five-digit-market}/{rate,review,fit}` is activated. 408FARMERS keeps its presentation; CoverageFit supplies the first useful question, evidence/session state and producer handoff. Unknown historical paths retain existing compatibility behavior. No Start gate or brand redirect is added. Engineers remains inactive; Healthcare hosted certification was waived by the operator.

Canonical attribution retains source family `qr`, original route, market context, generated or supplied campaign and variant. Market is attribution only, not evidence or scoring. The transport allowlist excludes PII query parameters. First answer persists in the existing session and reload resumes it.

## Storage correction

The new full producer-receipt test exposed the existing SQL source-family CHECK rejecting `qr`. The opportunity-attribution compatibility index now uses its supported `other` bucket, while immutable first-touch and latest-touch JSON retain `qr`. Canonical Analytics projects from first-touch JSON and reports QR correctly. Direct consumers of the legacy SQL index see `other`; QR campaign/spend/exposure creation is not certified by this change. No new table, migration or data reset.

## Evidence

CoverageFit full suite: 312 pass, 0 fail, 0 skip. 408FARMERS full suite: 39 pass, 0 fail, 0 skip. Regression covers first question, answer/resume, source/campaign/market preservation through a single WEB_DIRECT producer receipt, reporting QR despite the old SQL constraint, no PII forwarding and Engineers remaining inactive.

## Hosted gate (pending)

Open `/home/qr/95118/rate`: 408 branding, Insurance Producer/agency trust and immediate home question. Answer once; reload must retain answer and continue. Compare canonical producer source/route/campaign/market after an internal contact submission only if required; do not use a real customer solely for testing. Verify `/condo/qr/95014/review` preserves condo context. No autonomous SMS or duplicate lead should be created. Local test is not hosted receipt certification.

## Rollback

Remove Home/Condo from ACTIVE_QR_PRODUCTS to restore previous QR handling, keeping existing sessions and records. Preserve canonical APIs and attribution fix. No Cloudflare variables/bindings or migration are needed. Deploy CoverageFit attribution fix before activating 408 QR routes.
