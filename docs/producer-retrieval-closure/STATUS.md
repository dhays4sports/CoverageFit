# CF-PRODUCER-RETRIEVAL-CLOSURE-1.0

Outcome: PARTIAL. Exact hosted identity is verified; the interface and post-submission touch projection gaps remain. Production remains NO-GO.

Base: CoverageFit draft PR #37, fix/restaurant-intake-1-0 at 709db6908cd8edb9cce349569e7ce699c65b3569, stacked on #36. This correction is prepared locally on that branch. No remote update or deployment has been performed. Publishing the branch can trigger Pages; this packet is prepared for review first. Existing portability local commit 83787ae was reported in another workspace but is not present in this clone; it has not been overwritten or recreated.

## Identity evidence and limits

Request: 408d_pvxj_3449352375374a89841a937b9c91c441
Journey: pvxj_3449352375374a89841a937b9c91c441
Workspace: distribution-engine:synthetic-test
Lead key: lead-ops/lead/4055026c0c367c4c9626950fff2292af27228a484a90548d398f08bb9da2280d
Opportunity: opp_src_ae960d98c5e3f0b296d2edbedd9dd91e
TEST DB: coveragefit-distribution-test / f5ac694d-1028-4a30-9fbd-c264b2e5995e

Fresh hosted SELECTs executed through Cloudflare D1 Console after the session lock was cleared. Database marker returned f5ac694d-1028-4a30-9fbd-c264b2e5995e / TEST. Counts: journey=1, checkpoint=1, lead source=1, linked opportunity=1. The exact source_id and checkpointId equal the requested ID, and the joined journey derives that ID. The opportunity is opp_src_ae960d98c5e3f0b296d2edbedd9dd91e, status open. This proves the visible Synthetic Portability Alpha relationship by identifiers, not name/contact/time.

Consent: granted=1; version distribution-contact-v1; captured 2026-10-30T01:43:54.995Z; scope requested_review_call; source basis explicit_agency_contact_consent; call permitted=1; personal text permitted=0; contact requested=1. TEST traffic, web_408_restaurant, /restaurant/ requested-call context, alcohol below_33, INITIAL_SCREEN_ONLY, detailed-underwriting gate=1. This is an initial screen, not carrier acceptance.

Restaurant objects match between journey and lead. The complete distribution object matches between lead and source. First touch matches the journey and retains portability_alpha. The original subsequent touch portability_beta / subsequent_touch at 2026-10-30T01:43:15.784Z is present in both.

A material divergence remains: journey additionalTouches count=2, lead/source additionalTouches count=1. The extra journey touch is an untagged /restaurant/ visit at 2026-10-30T01:47:39.708Z, after consent/submission. This confirms the previously documented limitation: post-completion touches are saved to the journey but not automatically projected into the lead/source. No repair, source sync or backfill was attempted. Export must reconcile the authoritative journey or disclose this incompleteness.

The first multiline detail query failed because the console removed newline separators; the equivalent single-line SELECT succeeded. No write SQL was used. The earlier no-match Work search is explained by its implementation: it does not search source_id or journeyId.

The authenticated Solo Desk was visible in the preceding run, but no fa3adc1d tab remains open after the browser recovery. Current authenticated API payload comparison could not resume without reopening the producer workspace and restoring its private connection if required. No credential was extracted or exposed.

## Full record failure

Observed browser GET:
https://fa3adc1d.coveragefit.pages.dev/api/solo-desk/record?id=opp_src_ae960d98c5e3f0b296d2edbedd9dd91e

Rendered response: {"ok":false,"message":"This operation is disabled in the synthetic preview."}

Deployed source preview-firewall.mjs returns HTTP 403 for that response before authentication/database/application execution. Actual wire status was not independently exposed by the available Browser interface. There is no structured application error code in the deployed response; do not invent one. Local correction classifies only this exact 403/message pair as preview_operation_disabled. POST /api/solo-desk/sync is also denied in deployed source and local tests; no sync POST was deliberately invoked in this run.

GET /api/solo-desk/producer-detail?id=<opportunity> remains allowlisted and the existing UI uses it successfully for displayed details. The tool cannot inspect raw authenticated network response bodies, and credentials were not extracted. Full source payload and database comparison remain unverified in this run. The deny explains the full-record failure; no independent DB defect is established or ruled out for untested data.

Existing GET detail can persist derived classification/profile/FIV/priority state. It is not a strictly read-only implementation. No broad synchronization, backfill, provider invocation, source/identity edit or new hosted submission was initiated.

## Focused correction

- Add explicit saved source request/journey IDs, selected-channel permission, restaurant facts, first touch and subsequent touches to Work using the existing producer-detail payload.
- Replace Preview full-record action with an explanatory note, suppress Preview legacy tool links/redirects, and skip/disable automatic and manual source-sync calls in this workspace.
- Preserve production legacy links and sync behavior. No firewall, allowlist, binding, credential, mutation API or production settings changed.
- Classify known firewall denial distinctly from authentication and storage failures; unknown error states do not masquerade as Preview restrictions.

The correction is not deployed or visually accepted on fa3adc1d. Direct visits to legacy.html remain protected by the unchanged firewall; this patch prevents the main Work UI from misleadingly offering that path.

## Local regression evidence

24/24 targeted Node tests pass: producer-retrieval (4), preview-firewall (2), restaurant-intake (3), producer-workspace (13), work-web-evidence (2). Tests run against local ephemeral SQLite, with synthetic fixtures and disabled/injected provider boundaries. They do not create hosted submissions.

Coverage: exact journey/checkpoint/source/opportunity chain; repeated reads preserve one opportunity and one lead source; stored source/journey evidence unchanged; missing/wrong producer credentials; workspace mismatch; source/restaurant/first-touch/subsequent-touch equivalence; forbidden record and sync never reach application; allowed detail still requires auth; safe Preview fallback, error classification, HTML escaping and retained production full-record link. Syntax and git diff checks passed.

## Remaining closure and Data Portability handoff

1. COMPLETE: Cloudflare access restored; exact TEST identity and one-to-one row linkage freshly verified.
2. Reopen the fa3adc1d producer workspace and restore the private connection if required. Compare authenticated producer-detail source_id and stored source facts against the fresh D1 results. Never copy a producer key into reports or URLs.
3. Review/apply this local correction in the existing #37 stack and perform bounded Preview UI acceptance after an authorized changed-code deployment. Do not redeploy unchanged code or broaden the allowlist.
4. Preserve the open opportunity. Use the above relationship as a VERIFIED identity fixture, with producer payload/UI acceptance still PARTIAL and post-completion touch coverage explicitly INCOMPLETE. Export must retain source/lead/opportunity identities, consent scope, restaurant facts, first/additional touches and current action context. No exporter activation or production approval follows from local test success.
