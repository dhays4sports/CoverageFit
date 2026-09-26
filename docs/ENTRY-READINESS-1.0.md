# Current entry readiness — 2026-09-26

**PASS WITH LIMITATION for implemented transport/resume; full mandate remains incomplete.**

- Cloudflare transport resolved using manual redirect rejection; user and hosted browser confirmed working candidate.
- Home is live. Hosted existing session: next answer saved, early researching completion, reload retained completion.
- Home compatibility appointment page now opens and advances to step 2. Prior asset normalization defect resolved.
- Fresh visitor Home first-answer hosted certification remains pending: available browser has an existing secure review cookie and no supported isolated-context capability. Do not treat resume as fresh-entry evidence.
- Buyer compatibility copy and canonical link prepared; Buyer public activation remains off pending Home gate.
- CoverageFit 296 tests pass; 408FARMERS 34 tests pass; zero fail/skip.
- Local fresh Home session/attribution and buyer-to-Continue tests pass. Hosted producer receipt, provider send, cross-channel identity, mobile widths and fresh-entry checks remain unverified.
- No configuration, schema, cohort, scoring, CRM or autonomous SMS change.

Next exact check: open https://408farmers.com/home/ in a private browser, verify an immediate Home shopping-reason question, choose an answer, then reload and verify the next question remains. No contact details or SMS needed. This addresses fresh-session certification only; producer receipt remains separate.

## Historical checkpoint (superseded by the current status above)

# Entry Architecture 1.0 — readiness checkpoint

2026-09-26. **BLOCKED — partial implementation, not launch approval.**

The direct CoverageFit entry works in hosted browser testing. The 408 worker could not retrieve its canonical presentation in production, despite the endpoint rendering directly. Its fallback appeared. Home activation was paused and the original Home consumer experience was verified restored. No claim of bot detection, binding failure, or configuration root cause is made. Other route conversions are gated by the requested Home-first certification sequence.

| Required item | Classification | Evidence / limitation |
|---|---|---|
| CoverageFit code | PASS WITH LIMITATION | Base checkpoint 61845a4c93c315f66de0bfd2ad0d38f665debdf5; cross-channel continuation update follows (latest commit reported in delivery) |
| 408FARMERS code | PASS WITH LIMITATION | 36242f57a29e4796eb88159f45f0162616df2661; safe diagnostic installed; public activation paused |
| Routes audited | PASS WITH LIMITATION | Both repository route inventories, current source contracts, worker dispatch and known dependencies; external campaign traffic not fully observable |
| Routes changed | PASS WITH LIMITATION | CF /begin and distribution APIs; 408 candidate /buyer/continue; Home adapter paused after canary failure; original Home retained |
| Contextual 408 | BLOCKED | Thin adapter implemented/local tests pass; hosted upstream presentation fails |
| Signal Continue | PASS WITH LIMITATION | Existing eligibility/review-first preserved; exact canonical WEB_DIRECT relationship now supported and locally tested; hosted provider canary pending |
| Paid/direct mode | PASS WITH LIMITATION | /begin renders directly with Producer/agency/license, no 408 hop; contact-to-producer hosted receipt not tested |
| No empty click | PASS WITH LIMITATION | Immediate question on hosted direct entry; same implementation ready for contextual route, not activated |
| Acquisition contract | PASS WITH LIMITATION | Normalized bounded metadata, source/campaign/variant/UTM/partner/referral/market/contact/evidence; no guessed consent |
| Source vs intent | PASS | Buyer framing gives no priority increment; audience and QR market remain attribution; local regression |
| ZERO-REPEAT | PASS WITH LIMITATION | Known evidence/Back/resume locally; hosted first answer survives navigation; local end-to-end web → Continue certified; hosted cross-channel not certified |
| Same opportunity | PASS WITH LIMITATION | SQLite retry/contact projection uses one checkpoint/opportunity; independent anonymous channels not guessed/merged |
| First-touch | PASS WITH LIMITATION | Immutable original attribution; resumed event uses it; Continue current channel recorded after approved send; original source unchanged |
| Affinity governance | PASS | No profession input from new entry contract and no source-derived scoring; old affinity routes retained |
| QR | PASS WITH LIMITATION | Strict parser/contract tested; no public QR activation |
| Paid framework | PASS WITH LIMITATION | Canonical direct template and Meta attribution; no paid campaigns launched or outcomes claimed |
| Producer source display | PASS WITH LIMITATION | Separate acquisition context panel deployed; authenticated hosted receipt not certified |
| District pilot | PASS | Full local regression suite; no assignment, weights, action-set or population changes |
| SMS ownership | PASS WITH LIMITATION | Existing ownership/CONTROL/STOP regressions pass; no live provider SMS test in this pass |
| Tests | PASS | CoverageFit 295 passed / 0 failed / 0 skipped; 408 29 top-level passed / 0 failed / 0 skipped |
| Mobile/accessibility | PASS WITH LIMITATION | Semantic fieldsets, 46px controls, focus/status; hosted keyboard completion; 320/375/390/430px and screen-reader testing outstanding |
| Performance | PASS WITH LIMITATION | Small shared renderer, SSR question, no producer bundle; no measured mobile performance score; upstream reliability blocks contextual rollout |
| Hosted canaries | PASS WITH LIMITATION | Direct question → save → resume → second answer → early completion; 408 upstream failure and successful Home rollback; no customer data/SMS used |
| Migrations/manual checkpoints | PASS WITH LIMITATION | No migration, data reset, secret or flag change. Runtime log inspection required; project is the Cloudflare Pages project serving 408farmers.com; exact dashboard project name not independently verified |
| Unresolved risks | BLOCKED | Hosted upstream transport, real producer receipt, hosted WEB_DIRECT → Continue provider certification, mobile certification, source-outcome analytics, external dependency evidence |
| Next phase | BLOCKED | Diagnose upstream with runtime evidence; certify Home end-to-end; then Buyer → Condo → Tech → other affinity → QR → direct paid validation |

## Exact operator checkpoint

Open the Cloudflare Pages project serving **408farmers.com**, enable its live function log view, and load the unlinked `/buyer/continue.html` candidate once. Capture only the `entry_presentation_upstream_failure` line (HTTP status and error type). Do not share tokens, cookies, request bodies or environment secrets. This diagnostic does not send SMS or create a lead. No variable or binding change is requested; there is no configuration rollback value because none was changed.

The current tools do not expose this external Cloudflare project's runtime logs. The entry adapter deliberately shows a safe consumer fallback instead of upstream details. Runtime evidence is needed before changing deployment configuration or the transport contract.

## Rollback

Both repositories retain `pre-entry-20260926`: CoverageFit 884476d01837d34facd6f1a35114bcddff9a8251; 408finneas 841977a5350312f2851318673642056dc78155ff. The Home activation has already been reverted through a forward commit. Further rollback should use normal revert commits, preserve records and old links, and stop adapter use before removing its canonical endpoints.

## Files / deliverables

CoverageFit: server/{distribution-contract,distribution-journey,entry-presentation,signal-decision-core,acquisition-measurement}.mjs; functions/api/distribution/{events,interact,presentation}.js; functions/begin.js; _routes.json; assets/js/{entry-client.js,producer-workspace.mjs}; assets/css/distribution-check-in.css; agent/workspace/index.html; tests/distribution-journey.test.mjs; docs/ENTRY-ARCHITECTURE-1.0.md; docs/ENTRY-ROUTE-MATRIX-1.0.md; docs/ENTRY-READINESS-1.0.md; historical distribution documentation annotations.

408finneas: _worker.js; _routes.json; server/entry-presentation-proxy.mjs; home/legacy.html; tests/entry-presentation.test.mjs; docs/ENTRY-ARCHITECTURE-1.0.md.

The architecture document includes acquisition/presentation contracts, no-empty-click and source-vs-intent doctrines, QR/direct specifications, ZERO-REPEAT boundaries, measurement limitations, migration/rollback and production QA. Route matrix covers classification/dependency/deprecation decisions. No routes or repositories deleted.

## Resume increment

See ENTRY-CONTINUITY-1.0.md for the new exact-relationship web continuation adapter, source hydration, first-touch preservation and 12 added regressions. The hosted 408 candidate still renders its safe upstream-failure fallback; no route was newly activated in this increment. Cloudflare runtime evidence remains the next transport checkpoint.

## Latest staged rollout update
Dylan confirmed fresh private-browser Home answer/reload. Buyer public activation
78cd720 is live; hosted Back, answer save and result reload verified, with original
Buyer form reachable. Condo conversion follows: same canonical question engine,
condo acquisition context retained without intent boost, original form preserved.
297 CoverageFit / 35 408 tests pass. Condo hosted verification pending deployment;
Tech and all subsequent routes remain inactive. Hosted producer receipt and
mobile-width certification remain outstanding; this is not full mandate PASS.

## Tech preparation — not activated
Condo hosted branding and existing-session resume render correctly; original
Condo form remains reachable. Fresh Condo entry and hosted producer receipt are
not certified. Tech replacement reuses canonical product-first question and
rejects professionalProgram input; existing Tech page remains active while its
compatibility copy is prepared. 298 CoverageFit and 36 408 tests pass. This
preparation is saved on entry-architecture-1.0, not published to main.
Next manual evidence: private-browser Condo answer/reload plus a designated
internal/user-controlled identity for a hosted producer-record canary. Do not use
customer details or infer live identity authorization from old test memories.
