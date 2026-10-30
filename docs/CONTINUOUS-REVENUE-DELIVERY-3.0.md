# Continuous revenue delivery — canonical engineering ledger

Mandate: CF-CONTINUOUS-REVENUE-DELIVERY-3.0. Updated 2026-10-30 UTC.
Current checkpoint: Phase 0 locally corrected, hosted acceptance PARTIAL; independent Phase 1 draft corrections tested; Phase 2 source inventory reconciliation started. No later phase is accepted. Production remains NO-GO.

This is the continuation ledger. Earlier retrieval and portability documents are supporting historical evidence; their original test totals and hosted observations are not new acceptance.

## Source and environment identities

| Resource | Exact identity | Status |
|---|---|---|
| Backend existing #36 | e52581aed14980a1aa48ca8bcd7b1e66d6908442 | Existing stack base |
| Backend existing #37 | fix/restaurant-intake-1-0; remote baseline 709db6908cd8edb9cce349569e7ce699c65b3569 | Existing stack retained |
| Frontend existing #9/#10 | #10 49d8f6f8ba773bf551ebc559f6128571f7bdd73f | No frontend edits this checkpoint |
| Backend immutable Preview | https://fa3adc1d.coveragefit.pages.dev | Existing deployment; new local code NOT deployed |
| Isolated D1 | coveragefit-distribution-test; f5ac694d-1028-4a30-9fbd-c264b2e5995e | TEST marker verified by SELECT |
| Producer workspace | distribution-engine:synthetic-test | Connected; exact opportunity opened during resumed Chrome verification |
| Recovered portability draft | 83787ae, from prior local draft/feature-integrity-portability | Reused by cherry-pick, no replacement stack |

Local changes on the existing #37 branch, not pushed:

- 6de2610cfac35c06979ee7a063ae27739a723ed3: Preview retrieval UI, explicit source evidence, safe error classification and production legacy compatibility.
- 3575cf5: fresh hosted identity/touch-divergence evidence.
- 54b6270: post-submission later-touch propagation to exact existing checkpoint and lead source.
- 275c01f: recovered original export draft; resolved its single import conflict by retaining both feature imports.
- 1e66a36: attribution/request-context CSV fields, nested web suppression linkage, retained-source identity, imported alias deduplication and expired-alias exclusion.

## Phase 0 evidence and remaining acceptance

Canonical request: `408d_pvxj_3449352375374a89841a937b9c91c441`.
Journey: `pvxj_3449352375374a89841a937b9c91c441`.
Checkpoint: `lead-ops/lead/4055026c0c367c4c9626950fff2292af27228a484a90548d398f08bb9da2280d`.
Opportunity: `opp_src_ae960d98c5e3f0b296d2edbedd9dd91e`.

Fresh hosted read-only joins establish one journey, one checkpoint, one exact kind=lead source and one associated open opportunity. This identifies Synthetic Portability Alpha by relationship, not name. Consent is requested_review_call, distribution-contact-v1, explicit_agency_contact_consent, call allowed, personal text not allowed. Restaurant/TEST context and immutable portability_alpha first touch match. No contact data or credentials are recorded here.

Hosted defect: journey has two subsequent touches; checkpoint/source have one. No hosted repair/backfill occurred. Local correction copies only additionalTouches from the authoritative stored journey to the exact linked existing rows in one batch. It does not invoke source synchronization, create work, refresh profiles, alter consent/first touch/timestamps/status or send anything. Repeated events can repair a failed prior projection; stale loaded state cannot overwrite newer stored touches.

Full-record observation: `/api/solo-desk/record?id=opp_src_ae960d98c5e3f0b296d2edbedd9dd91e` rendered the Preview-disabled JSON message. Source returns HTTP 403 before application/database access; actual wire status was not exposed by the browser tool. No server application error code exists in that response. Local `preview_operation_disabled` classification requires exactly that status/message. The standard record and sync routes remain denied. Producer-detail remains allowlisted. No independent database defect has been established for untested retrieval data.

Local UI removes misleading Preview legacy/full-record actions and sync, renders saved source evidence, and preserves production legacy behavior. Hosted UI has not received the patch. Producer-detail can write derived profile/classification/priority state; do not describe it as a pure database read.

Acceptance still required: complete the detailed source/consent/touch comparison not rendered by the deployed UI; verify new UI and two-touch propagation after a changed-code deployment within independently verified authorized isolation/security scope. Do not replace expired credentials or broaden access under this mandate.

## Phase 1 portability checkpoint

Native Analytics download client and authenticated CSV route are prepared but HTTP success is deliberately hard-blocked. Existing Preview firewall also blocks the new export route. No flag is an accepted bypass. Local reader is one SQL snapshot with reconciled per-store returned counts, deterministic IDs/order, UTF-8/CRLF, JSON evidence cells, formula escaping and an explicit 16 MiB capacity error. It performs no source sync or outbound calls. It is not certified for populations exceeding that capacity.

Implemented adapters: all scoped opportunities/statuses and retained sources, authoritative lead-ops checkpoints, pending contact-bearing distribution journeys, legacy consultations and owner-scoped recommendations; linked task/activity identifiers, acquisition measurements/attribution and exact linked live SMS suppression. Stable IDs are source records, not asserted unique people. Contact permission is never inferred from export or attribution.

Remaining high-severity completeness/authorization blockers:

1. Legacy JSON stores lack workspace columns; reviewed ownership/source-rights mapping is required. No hosted policy has been installed.
2. Identified `pvx/checkpoint/` and older web/SMS session contracts need explicit adapters/alias reconciliation. The older web-journey schema is distinct from restaurant distribution journeys; do not infer an absent contact object means anonymous without adapter classification.
3. Suppression across legacy SMS namespaces, provider state and all exact relationship paths remains incomplete. Unknown is never contact permission.
4. Direct recommendation revisions/close events and UCP relationships/evidence require linked-data hydration; cached acquisition outcomes alone are insufficient.
5. Candidate/alias/exclusion reconciliation, source retention and source rights for every attached record require acceptance. Row-count equality per queried store is not proof of complete inventory.
6. Hosted auth/isolation/download and D1 capacity acceptance remain pending. New Preview API allowlisting requires separate security review and approval.

## Authoritative store and feature audit

Reused COVERAGEFIT_NORTH_STAR.md, docs/SIGNAL-NORTH-STAR-1.0.md, docs/CONSUMER-ROUTE-INVENTORY-2.0.md and docs/PRODUCER-SURFACE-INVENTORY-2.0.md. Historical inventory classifications are source decisions, not current production verification. No routes are removed. No capability receives new production certification from this run.

| Domain | Existing source/storage | Current classification and next check |
|---|---|---|
| Consumer reviews/snapshots | pvx/checkpoint/, older web journeys, distribution journey, lead-ops, consultation_records | Distribution locally tested; identified historical adapter gap; hosted end-to-end blocked |
| Reports/persistent profiles | prospect_reports, cf_ucp_*; pvx-unified-producer-record-core | Existing implementation; linked export audit incomplete; source listings have limits and cannot serve All Leads |
| Policy.box/evidence | cf_policybox_analyses, policy intake, policy files, recommendation documents | Existing implementation; export metadata requires exact authorized parent links; no raw document export assumed |
| SmartDevices/protection | cf_device_*, cf_protection_* | Existing implementation; classify contact-bearing sessions vs linked evidence before completeness claim |
| Referrals | referral_links/referral_events | Existing capability/event stores; do not turn an anonymous referral event into a lead |
| Producer Work/recommendations/closing | cf_solo_*, cf_recommendations/revisions/events, cf_close_events | Work locally tested; Preview detail blocked on connection; revision/close export adapter outstanding |
| Single/bulk import | agencyzoom-raw.mjs, agencyzoom-import.mjs, existing Import UI | Existing synthetic tests pass; review-gated import; broader neutral ingestion not yet accepted |
| SIGNAL/SMS | sms_conversations, sms_handoffs, sms-signal-core/service, ownership guards | Local safety tests pass; no new hosted provider acceptance or SHADOW strategy certification |
| Identity/privacy/retention | exact source links, checkpoint TTL, pvx-privacy-retention, producer auth | Local scoped tests pass; legacy export ownership/retention reconciliation blocks release |
| Administration | producer connection, source sync, provider tools, agent capability nonce tables | Existing controls preserved; no mutations or security settings changed |
| Revenue/effort | cf_acq_*, cf_opportunity_effort, recommendations/close | Measurement tests pass locally; actual outcomes/spend/effort and causal uplift unmeasured here |

Store exclusions must be explicit in the final export contract: nonce/rate-limit/idempotency infrastructure is not customer lead data; anonymous acquisition events are not identified leads; external-only CRM/provider records are unavailable rather than a stored zero population. Reports, UCP, policy, device and protection sessions are not declared universally non-contact-bearing without their remaining adapter audit.

Phase 3 finding: existing RAW importer already previews 1–20 files/at most 100 leads/1 MiB, fingerprints confirmations, preserves source IDs, detects identity/phone conflicts, and commits local records transactionally. It can assign eligible inventory to a district pilot and create SMS relationship links, even though it reports sms_sent=0. Do not expose it as a generic neutral importer or perform real imports under this mandate without separating and reviewing those effects. Preserve original timestamps, unknown permission and governance metadata. No promotion/import was run.

Phases 4–7 remain gated: reuse existing evidence/readiness/UCP/priority, Work, SIGNAL and acquisition measurement contracts. Audit provenance, expiry, conflicts, commitments, LOW_AND_SLOW vs REAL_TIME SHADOW decisions and verified outcome distinctions before implementing gaps. No new CRM, send engine, calibrated bind probability or revenue uplift claim.

## Validation and release dependencies

- Phase 0 targeted: 46/46 passing across producer-retrieval, distribution-journey, restaurant-intake, distribution-isolation and preview-firewall.
- Export targeted: 19/19 passing, including 1,201-row volume, authorization/scope failure, malformed/incomplete snapshot failure, formula safety, rights/CONTROL restrictions, exact suppression, repeated export and expiry aliases.
- Combined: `node --test tests/*.test.mjs` — 415/415 passed; zero failures, skips or cancellations. This command covers the current branch's .test.mjs suite, not every historical script/other PR lineage.
- Local synthetic SQLite only; no hosted submission, database write SQL, provider call, source sync, migration, deployment, production merge or security expansion.
- Local logs: /tmp/continuous-phase0-tests.log, /tmp/continuous-portability-tests.log, /tmp/continuous-regression.log. These are reproducible scratch evidence; test sources and this ledger are canonical.

No measured producer-time, conversation, quote, bind, written-premium or incremental-revenue result was obtained. Preserve unknown values.

Rollback: revert these additive code changes on the draft stack; no schema rollback needed. Existing hosted data is unchanged. After any separately accepted deployment, rolling back code would stop future propagation but must not erase legitimate later-touch evidence. Publishing a Pages branch may create a new immutable hostname: verify isolation and existing security authorization first; never extend Access automatically.

## Exact continuation

1. Reuse this branch/ledger; do not recreate PRs, synthetic records or the original export draft. Keep the canonical opportunity open.
2. Producer connection and producer-detail UI retrieval now work. Complete remaining detailed source/consent/touch comparison when the authorized surface exposes it. Do not request a credential in chat or inspect browser storage.
3. Review changed code and deployment scope before any push that could trigger Pages. No deployment occurred during this checkpoint.
4. Continue remaining local export adapters/count reconciliation and focused synthetic failures, keeping hard release blockers until actual acceptance. Independently continue source-audited feature checks where hosted access is unnecessary.
5. Hand the reconciled exact request/source/opportunity fixture to Data Portability acceptance; it is verified for identity, locally tested for touch projection/export, and still PARTIAL for current hosted producer experience.


## Resumed Chrome acceptance — 2026-10-29 PDT

Original filesystem and branch recovered intact at c2cb472; all listed exact local commits exist and the initial working tree was clean. No replacement PR, record or reconstruction was needed.

Browser control: PASS. The extension identified Chrome and actual DOM interaction succeeded in existing tab 550800969. Producer connection displayed Connected. Selecting WEB / DIRECT and opening Synthetic Portability Alpha rendered detail at the exact canonical opportunity URL. Open status remained visible. The workspace source implements this action through GET producer-detail; this run verified the rendered application result, not a captured raw network body or wire status. No credential was read from storage or requested.

Visible comparison: original source web_408_restaurant; route /restaurant/; variant immediate_question_v1; audience restaurant; current channel 408_contextual; reviewTrack business; reviewReason coverage review; reviewContext requested call; contact evidence explicit_agency_contact_consent. Next action: Respond to the contact request. These agree with the recorded TEST context. Detailed source ID, consent version/channel flags, restaurant qualification answers and first/subsequent touch arrays were not exposed in the deployed UI. They remain pending response-level or patched-UI comparison; historical database evidence was not rerun or reclassified as fresh proof. The existing full-record link remains visible, as expected for undeployed UI fixes; it was not invoked. No work update, status change, sync or communication was submitted. Detail access may update derived profile/priority state as previously documented.

Cloudflare browser access: PASS. Current Applications view confirms exact distribution destination fa3adc1d.coveragefit.pages.dev/api/distribution/* with authorized-browser policy and one additional policy; wildcard Pages applications remain listed. Policy contents/credential expiry were not newly verified. Changed-code deployment remains NOT PERFORMED: a new immutable hostname and paired distribution request path have not been established within existing exact-host authorization. Do not automatically change Access destinations or push-trigger deployment. A separately scoped UI-only deployment may be assessed, but is not accepted by this observation. Touch propagation hosted acceptance remains blocked; no replacement submission or backfill is permitted.

Independent portability correction: acquisition source_key overrides now require their own explicit source-rights decision, including deny and missing-decision failures. Historical recordType=pvx_web_journey now fails with legacy_journey_adapter_required instead of being silently excluded as anonymous. This is a fail-closed guard, not implementation or acceptance of the missing adapter. Remaining checkpoint, legacy SMS, linked evidence, retention and completeness gates above still apply; HTTP activation stays hard-blocked.

Fresh validation: node --test tests/*.test.mjs passed 417/417 with zero failures/skips/cancellations; includes 21 export tests. The new source-rights fixture initially failed its database NOT NULL constraint; corrected the fixture to include required source_family and updated_at, then the full suite passed. Log: /tmp/continuous-resume-regression.log. Local code and ledger committed on the existing branch, not pushed or deployed.

Checkpoint status: hosted producer acceptance PARTIAL (connection and rendered detail PASS, detailed evidence comparison and changed-code hosted acceptance pending). Export release BLOCKED. Production NO-GO. No new measured revenue outcome.
