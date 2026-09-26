# Entry Architecture 1.0 — readiness checkpoint

2026-09-26. **BLOCKED — partial implementation, not launch approval.**

The direct CoverageFit entry works in hosted browser testing. The 408 worker could not retrieve its canonical presentation in production, despite the endpoint rendering directly. Its fallback appeared. Home activation was paused and the original Home consumer experience was verified restored. No claim of bot detection, binding failure, or configuration root cause is made. Other route conversions are gated by the requested Home-first certification sequence.

| Required item | Classification | Evidence / limitation |
|---|---|---|
| CoverageFit code | PASS WITH LIMITATION | Runtime e038372d75cdbbb0f24bdc91b4170884215441f2; subsequent documentation-only commit may follow |
| 408FARMERS code | PASS WITH LIMITATION | Recovery 2a6813190c3f7e95f1b0cedbf463266c5eb68d68; safe diagnostic addition follows |
| Routes audited | PASS WITH LIMITATION | Both repository route inventories, current source contracts, worker dispatch and known dependencies; external campaign traffic not fully observable |
| Routes changed | PASS WITH LIMITATION | CF /begin and distribution APIs; 408 candidate /buyer/continue; Home adapter paused after canary failure; original Home retained |
| Contextual 408 | BLOCKED | Thin adapter implemented/local tests pass; hosted upstream presentation fails |
| Signal Continue | PASS WITH LIMITATION | Existing human-warm eligibility/review-first untouched; WEB_DIRECT extension remains unresolved |
| Paid/direct mode | PASS WITH LIMITATION | /begin renders directly with Producer/agency/license, no 408 hop; contact-to-producer hosted receipt not tested |
| No empty click | PASS WITH LIMITATION | Immediate question on hosted direct entry; same implementation ready for contextual route, not activated |
| Acquisition contract | PASS WITH LIMITATION | Normalized bounded metadata, source/campaign/variant/UTM/partner/referral/market/contact/evidence; no guessed consent |
| Source vs intent | PASS | Buyer framing gives no priority increment; audience and QR market remain attribution; local regression |
| ZERO-REPEAT | PASS WITH LIMITATION | Known evidence/Back/resume locally; hosted first answer survives navigation; end-to-end cross-channel not certified |
| Same opportunity | PASS WITH LIMITATION | SQLite retry/contact projection uses one checkpoint/opportunity; independent anonymous channels not guessed/merged |
| First-touch | PASS WITH LIMITATION | Immutable original attribution; resumed event uses it; later Continue current-channel update outstanding |
| Affinity governance | PASS | No profession input from new entry contract and no source-derived scoring; old affinity routes retained |
| QR | PASS WITH LIMITATION | Strict parser/contract tested; no public QR activation |
| Paid framework | PASS WITH LIMITATION | Canonical direct template and Meta attribution; no paid campaigns launched or outcomes claimed |
| Producer source display | PASS WITH LIMITATION | Separate acquisition context panel deployed; authenticated hosted receipt not certified |
| District pilot | PASS | Full local regression suite; no assignment, weights, action-set or population changes |
| SMS ownership | PASS WITH LIMITATION | Existing ownership/CONTROL/STOP regressions pass; no live provider SMS test in this pass |
| Tests | PASS | CoverageFit 283 passed / 0 failed / 0 skipped; 408 29 top-level passed / 0 failed / 0 skipped |
| Mobile/accessibility | PASS WITH LIMITATION | Semantic fieldsets, 46px controls, focus/status; hosted keyboard completion; 320/375/390/430px and screen-reader testing outstanding |
| Performance | PASS WITH LIMITATION | Small shared renderer, SSR question, no producer bundle; no measured mobile performance score; upstream reliability blocks contextual rollout |
| Hosted canaries | PASS WITH LIMITATION | Direct question → save → resume → second answer → early completion; 408 upstream failure and successful Home rollback; no customer data/SMS used |
| Migrations/manual checkpoints | PASS WITH LIMITATION | No migration, data reset, secret or flag change. Runtime log inspection required; project is the Cloudflare Pages project serving 408farmers.com; exact dashboard project name not independently verified |
| Unresolved risks | BLOCKED | Hosted upstream transport, real producer receipt, WEB_DIRECT → Continue exact ownership bridge, mobile certification, source-outcome analytics, external dependency evidence |
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
