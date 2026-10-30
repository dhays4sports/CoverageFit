# CF-PRODUCER-RETRIEVAL-CLOSURE-1.0

Outcome: BLOCKED for fresh hosted closure. Production remains NO-GO.

Base: CoverageFit draft PR #37, fix/restaurant-intake-1-0 at 709db6908cd8edb9cce349569e7ce699c65b3569, stacked on #36. This correction is prepared locally on that branch. No remote update or deployment has been performed. Publishing the branch can trigger Pages; this packet is prepared for review first. Existing portability local commit 83787ae was reported in another workspace but is not present in this clone; it has not been overwritten or recreated.

## Identity evidence and limits

Request: 408d_pvxj_3449352375374a89841a937b9c91c441
Journey: pvxj_3449352375374a89841a937b9c91c441
Workspace: distribution-engine:synthetic-test
Lead key: lead-ops/lead/4055026c0c367c4c9626950fff2292af27228a484a90548d398f08bb9da2280d
Opportunity: opp_src_ae960d98c5e3f0b296d2edbedd9dd91e
TEST DB: coveragefit-distribution-test / f5ac694d-1028-4a30-9fbd-c264b2e5995e

The code deterministically derives the displayed opportunity ID from SHA-256(workspace + '|lead|' + requestId), first 32 hex characters, prefixed opp_src_. This matches exactly. It is independent of name/contact/timestamp, but a derivation is not a fresh database relationship query. The preceding Feature Integrity & Portability report records one exact source link and this opportunity, plus portability_alpha first touch and portability_beta subsequent touch. That is historical hosted evidence, not newly executed SQL.

Current Solo Desk visibly loads the opportunity as open with restaurant source, /restaurant/ route, business product and requested-call context. The source search implementation does not search source_id or journeyId; its no-match result does not show a missing record.

Fresh D1 queries were blocked: the existing Cloudflare tab is claimed by another browser session. No alternate session was used to bypass that ownership. verify-test-identity.sql is prepared, NOT EXECUTED against hosted D1. No fresh hosted row counts are claimed.

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

1. Release the Cloudflare tab from the other browser session, then execute only the prepared SELECTs in the verified TEST database. Require exactly one journey, checkpoint, source and linked opportunity.
2. Compare authenticated producer-detail source_id and stored source facts against those query results through an available authorized response-inspection surface. Never copy a producer key into reports or URLs.
3. Review/apply this local correction in the existing #37 stack and perform bounded Preview UI acceptance after an authorized changed-code deployment. Do not redeploy unchanged code or broaden the allowlist.
4. Preserve the open opportunity. Use the above relationship as a candidate export-integrity fixture; promote it to VERIFIED only after fresh hosted comparison. Export must retain source/lead/opportunity identities, consent scope, restaurant facts, first/additional touches and current action context. No exporter activation or production approval follows from local test success.
