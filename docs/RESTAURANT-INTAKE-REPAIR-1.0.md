# Restaurant Distribution Intake Repair 1.0

Disposition: IMPLEMENTED LOCALLY; NOT PRODUCTION READY. No customer messages, production test leads, CRM writes, advertising publication, merge or paid provisioning.

## Reconciliation

Reuse CoverageFit draft #36 (e52581a) and 408finneas draft #9 (c4c5943), both unmerged. Separate restaurant branches are stacked on those existing branches; do not duplicate or cherry-pick their prerequisite fixes. Existing docs/DISTRIBUTION-ENGINE-1.2.md records prior preview build IDs, which remain historical build evidence only. GitHub combined-status endpoint returned no statuses; it does not establish current deployments. Cloudflare dashboard reaches /login; current production branch, deployment revision, preview storage bindings and provider isolation could not be inspected.

Fresh GET of live 408farmers.com/shared/contact-choice.js has no partner/placement reference support. Live contact-routing remains behind the candidate. No production write was used to test it.

## Changes

- /restaurant uses existing Worker proxy, distribution route, audience-scoped cookie, PVX storage, lead upsert and Solo Desk projection. No new queue or lead infrastructure.
- One reason question followed by name/phone, restaurant name, California city, preferred personal call/text and affirmative contact permission. No full questionnaire. Email handoff remains available through the shared contact page; email-only form submission is not implemented.
- Alcohol answer: below 33%, 33% or more, unknown. Only below 33% enables the recorded detailed-underwriting gate. This is an initial screen, not final carrier acceptance. Ineligible/unknown inquiries remain available to the producer with explicit status. City is self-attested California, not geocoded verification.
- Shared restaurant contact intent preserves readable partner/placement source in SMS/email and routes callback to /restaurant. Ordinary calls are explicitly not automatically attributed. Existing business fixes reused.
- First-touch stays immutable; same-audience landing events add a deduplicated, bounded 20-touch record. Additional touches are copied into the lead on handoff. A touch after completed delivery is retained in the journey but is not automatically reprojected into the existing producer source: remaining limitation. Clearing cookies or changing devices also prevents deterministic linkage.
- Downstream handoff exceptions after durable save return request ID and deliveryPending instead of hiding the saved reference. Existing retry/reconciliation remains in use; no autonomous provider sender added.
- Isolated staging handoffs carry TEST traffic classification in producer context, controlled by staging environment rather than user input. Tests use temporary synthetic SQLite, fake 202-555 numbers, and disabled/injected external adapters. Never set isolation flags on shared production storage.
- Restaurant branding uses the existing authorized SVG, agency identity and licenses. Final rendering and agency approval remain gates.

## Evidence matrix

| Item | Result | Evidence / limit |
|---|---|---|
| Consumer regression suite | PASS LOCAL | CoverageFit 386/386; frontend 74/74 |
| Restaurant acceptance | PASS LOCAL | tests/restaurant-intake.test.mjs: three alcohol cases, missing-city rejection, second placement, injected downstream throw, stable request ID, retry, one lead/source, reopen SQLite, authenticated producer API |
| Source and restaurant facts in producer context | PASS LOCAL | Explicit assertions for original partner/placement, business track, restaurant name, TEST flag and additional touch in durable lead |
| Contact link routing | PASS LOCAL | frontend tests/restaurant-intake.test.cjs plus inherited contact regressions |
| Real durable storage | PASS LOCAL ONLY | On-disk SQLite close/reopen; not hosted D1 certification |
| Desktop browser | BLOCKED | Cloud browser terminal.local:4173 returns ERR_CONNECTION_REFUSED; no visual pass |
| Mobile Safari / in-app | BLOCKED | No real-device tests; viewport emulation would not certify Safari |
| Preview deployment and isolation | BLOCKED | Cloudflare sign-in; actual D1/provider bindings unknown |
| Actual producer inbox/CRM receipt | BLOCKED | Authenticated local Solo Desk API is not proof Dylan can see a hosted request |
| Public launch | BLOCKED | Technical acceptance, exact production mapping and agency/Farmers approval outstanding |

## AgencyZoom / notification diagnosis

The distribution deliver function calls upsertLeadJourney then projectSoloDeskEvent; it does not send an email or invoke AgencyZoom delivery. Therefore a projected Solo Desk row must not be described as email or AgencyZoom receipt. Provider configuration and route mapping remain uninspected behind account access. The source catalog currently maps business sources into a `personal` pipeline; do not enable commercial CRM delivery before confirming the intended agency pipeline and mapping. No provider configuration was changed.

The inherited failing agencyzoom-raw test expected '48 hours', while the existing importer returns 'outside 7 days' and another test already asserts that seven-day behavior. Only the stale test expectation was corrected; importer cadence/enrollment policy is unchanged. This was not a live integration failure diagnosis or fix.

## Remaining acceptance and release

1. Sign in to Cloudflare; inspect both project production revisions and existing preview bindings read-only. Reuse an isolated preview if it has genuinely separate synthetic D1 storage and no live provider credentials. Do not provision paid resources.
2. Deploy candidates only into verified isolated staging; pair frontend upstream using existing COVERAGEFIT_PREVIEW_ORIGIN and BUYER_STAGING_ISOLATED controls. Run tagged restaurant path, navigation, second touch, back/refresh, offline/retry and authenticated producer UI readback. Confirm UI displays restaurant and source facts, not merely an API response.
3. Verify on desktop, actual iOS Safari and relevant Instagram/Facebook in-app browsers. Validate authorized logo, disclosures, keyboard/labels, consent, SMS URL behavior and short form. Do not claim phone attribution without caller source evidence.
4. Resolve post-completion touch projection and confirm recovery ownership/visibility. Choose actual producer destination and verify access; no synthetic production lead is authorized. If production canary becomes necessary, request separately scoped authorization.
5. Obtain agency/Farmers review of copy, eligibility wording, identity and destination; then request coordinated production release approval.
6. Existing release order applies: frontend scoped-cookie bridge e52b3f9 first, backend #36 + restaurant candidate second, frontend #9 + restaurant candidate last. Do not merge stacks independently. Retain compatible cookie handling and stored requests on rollback; disable restaurant links first if necessary.

The six restaurant distribution inquiries and their automation are unchanged. Permission inquiries may proceed, but no partner advertising should link to /restaurant before release acceptance.
