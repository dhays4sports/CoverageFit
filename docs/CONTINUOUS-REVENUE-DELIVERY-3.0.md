# Continuous revenue delivery — canonical engineering ledger

Mandate: CF-CONTINUOUS-REVENUE-DELIVERY-3.0. Updated 2026-10-30 UTC.
Current checkpoint: exact hosted fixture history repaired and verified (2/2/2); producer-detail UI acceptance PARTIAL. Portability and consumer-handoff repairs locally tested. Preview deployment BLOCKED on exact-commit Git transport authentication. No later phase is accepted. Production remains NO-GO.

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

Historical hosted defect (repaired below): journey had two subsequent touches; checkpoint/source had one. The resumed exact-fixture correction below supersedes this observation. Local correction copies only additionalTouches from the authoritative stored journey to the exact linked existing rows in one batch. It does not invoke source synchronization, create work, refresh profiles, alter consent/first touch/timestamps/status or send anything. Repeated events can repair a failed prior projection; stale loaded state cannot overwrite newer stored touches.

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
| Producer Work/recommendations/closing | cf_solo_*, cf_recommendations/revisions/events, cf_close_events | Work locally tested; authenticated Preview detail renders; revision/close export adapter outstanding |
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


## Execution checkpoint — source-history recovery and feature repairs (2026-10-29 PDT)

Ancestry/worktree: resumed clean at 8c959022ba3bc52040ec4d4b168325032fe6343c, parent c2cb472b4614615c41e9b3613ad26919abd2bc3e. Verified both e52581a and 709db69 are ancestors. Fresh GitHub reads confirm #36 and #37 remain open drafts, #37 head 709db69 and base e52581a. No PR was replaced.

### Hosted exact-fixture recovery — PASS for stored history

Fresh SELECT joined the exact TEST marker, journey, checkpoint, source and opportunity: one relationship, Open, first touches equal, counts 2/1/1 for later touches. Consent remains requested_review_call, distribution-contact-v1, callPermitted=true, personalTextPermitted=false, automatedSmsAuthorized=false, automatedSmsSuppressed=true.

Under the renewed mandate to reconcile the original fixture, executed only the two exact guarded UPDATE statements preserved in docs/acceptance/EXACT-SYNTHETIC-TOUCH-RECOVERY.sql. They are generated from the existing touch-projection SQL, further constrained by exact opportunity, Open status and TEST database marker. Only context.distribution.additionalTouches changes. No INSERT, broad sync/backfill, new journey, credential access, provider request or migration. The SQL artifact records the execution-time retention cutoff; do not reuse at a later date without refreshing and revalidating retention.

Fresh follow-up SELECT: one exact relationship; Open; journey/lead/source counts 2/2/2; both full later-touch JSON arrays equal the canonical journey; original first-touch equality preserved. Lead and source updated_at remain 2026-10-30T01:43:54.995Z. Global TEST counts before and after: opportunities 2, sources 4, tasks 4, activities 4, customers 2, SMS records 0, PVX records 28. No extra profile/task/notification or CRM enrollment was created by this correction. Source history screenshot: docs/acceptance/source-history-hosted.png. Existing producer Refresh conversation was invoked without submitting work changes. Raw producer-detail response/full history still requires patched UI or supported response capture; do not equate the database repair with complete hosted UI acceptance.

Local operator-SQL regression verifies TEST guard, interrupted execution after the first statement, recovery by rerun, unchanged non-touch fields, and a no-op repeated run. Application propagation now additionally refuses conflicting first-touch provenance. Automatic propagation changes remain undeployed until the next Preview release is verified.

### Confirmed repairs and independent Feature Integrity work

1. Corrected 8c95902's overbroad legacy guard: restaurant distribution and older web journeys share recordType=pvx_web_journey. Distribution is recognized by seed.journey.experience=canonical_signal. Added actual-handler export test, not just simplified JSON fixtures.
2. Export rejects source_history_mismatch rather than silently exporting a stale projection. Actual-handler test injects projection failure, verifies export rejection, recovers the same local relationship, and verifies two-touch deterministic read-only export. Local fixture is independent; it is not a new hosted submission or a claim that hosted CSV was downloaded.
3. Added owner-scoped recommendation revision/closing history and exact scoped UCP customer/household relationship IDs. Explicit field projection excludes token hashes, document capabilities and arbitrary payload keys. Closing decisions and quote premiums are labeled stored evidence, not carrier-confirmed binds. Missing/foreign recommendation parents fail closed.
4. Retained sources now preserve permission and source timestamp evidence even when their checkpoint is absent.
5. Feature Integrity discovered a confirmed consumer failure: handlePVXCheckpoint referenced undefined options after persisting. Corrected the injected db binding across create/continue/contact-only/contact and web advancement. Local tests exercise save/read/retry/contact and exact existing producer projection with no duplicate opportunity. No consumer production certification is implied.
6. Prepared the narrow future export candidate GET /api/solo-desk/export-leads.csv only, producer-authenticated, fixed server workspace, no query parameters, no-store. Firewall remains unchanged. Negative tests prove GET/HEAD/POST/PUT/DELETE/OPTIONS and trailing/extra-path/scope-query variants remain denied before handler execution. Do not request activation before completeness/source-rights/suppression gates pass.

Fresh full validation: node --test tests/*.test.mjs — 429/429 pass, zero skipped/cancelled/failing; includes 25 export tests and 14 producer-retrieval tests. Logs: /tmp/continuous-delivery-next-regression.log and /tmp/continuous-recovery-tests.log. git diff --check passes. Initial new fixtures were corrected for required Date values and UCP parent foreign keys; no failing tests remain.

### Deployment effect review

Fresh Cloudflare UI: production main remains 4aacbb82d789bf55a5b7e289a9f014382df5d36f; current backend Preview fa3adc1d corresponds to 709db6908cd8edb9cce349569e7ce699c65b3569. Automatic deployments are enabled, Preview branch control is All non-production branches and watch paths '*': pushing this branch triggers a Preview build.

Preview settings independently verified: COVERAGEFIT_DB -> coveragefit-distribution-test, UUID f5ac694d-1028-4a30-9fbd-c264b2e5995e; BUYER_STAGING_ISOLATED=1; workspace distribution-engine:synthetic-test; no forbidden provider credential names/bindings in Preview; CF_AI_ENABLED=0; CF_SMS_SIGNAL_ENABLED=0; platform Fail closed; wildcard Pages browser Access remains enabled. Existing service credential displays Enabled, 24h duration, expiry October 30 12:46 AM in the dashboard; no secret viewed, expiry extended or credential replaced. This is metadata verification, not a new server-to-server authorization probe.

A backend-only changed-code Preview deployment can use existing wildcard browser Access and unchanged TEST bindings. It does not require changing the old exact-host distribution Service Auth application. Do not change frontend origin or claim paired frontend-to-backend acceptance on a new hostname. A new immutable origin may require private producer-key connection by the user; never transfer the existing key through browser storage or chat. Export and consumer APIs remain blocked in Preview. Rollback is the existing fa3adc1d/709db69 Preview; do not undo the legitimate second touch when rolling code back. Production remains NO-GO.

Remaining portability gates: legacy checkpoint/web/SMS adapters and reviewed legacy ownership/source rights, full suppression coverage, UCP evidence/document metadata inventory, reconciled candidate exclusions/aliases, D1 capacity, and hosted download authorization. No complete-export promise or business/revenue uplift claim. Reliable ingestion/producer handoff audit has started via the consumer checkpoint correction, but the next milestone is not accepted.


### Deployment attempt and concrete continuation dependency

Engineering checkpoint: 50f0c87dd4c3e831a37742877f684f4918d98bf7, parent 8c959022ba3bc52040ec4d4b168325032fe6343c. All code and acceptance evidence committed; working tree clean before this documentation update.

Attempted the authorized changed-code Preview push: git push origin HEAD:fix/restaurant-intake-1-0. It failed with Git exit 128 because this workspace has no usable HTTPS Git credential (could not read Username). This was an authentication failure, not an automatic approval rejection. Fresh GitHub PR read after failure confirms remote head is still 709db6908cd8edb9cce349569e7ce699c65b3569. No new deployment was triggered.

The connected GitHub app remains usable for PR reads; its create_commit API does not accept original author/committer metadata, so it cannot upload these exact local commit objects. Do not replace the local history with recreated commits, force a branch, extract a browser credential or create new security grants to bypass this dependency.

Prepare a verified incremental Git bundle containing the exact existing branch commits since remote baseline 709db69, including this ledger update, for transfer to an already-authenticated Git clone. In that clone, fetch the bundle's fix/restaurant-intake-1-0 branch and push FETCH_HEAD to the same remote branch after confirming remote head remains 709db69. This is an alternative transport for the existing history, not a replacement PR or reconstructed implementation. A push will trigger Preview; no production merge is authorized.

Next hosted step after exact-commit transport: confirm new Preview deployment SHA and unchanged TEST/provider-isolation configuration, then open the same opportunity on that origin. If needed the user privately connects the existing producer key there. Compare visible source ID, consent, restaurant facts, first touch, both later touches and current action. Keep the original tab and record identities. No frontend origin repoint, Access change or export activation is authorized by this transport.

Required future security approval is limited to GET /api/solo-desk/export-leads.csv on an explicitly selected TEST Preview origin, with producer authentication, fixed server-side workspace, no query scope and existing provider isolation. It is only a proposal: first complete missing adapters, source-rights/legacy ownership and suppression review, reconciliation and capacity acceptance. Do not enable it yet or interpret route approval as completeness approval.

Feature Integrity/ingestion milestone started with a verified local save/read/retry/contact/producer-link repair. Remaining audit domains retain the classifications above. No live import, enrollment, provider send, cadence update or production action. No measured producer-time savings or revenue result. Safe hosted continuation now requires exact-commit push capability; remaining portability claims depend on unresolved inventory/source-rights and hosted acceptance.


### Git OAuth recovery attempt — 2026-10-30 UTC

Verified exact checkpoints c7b1e991b3b2d3112dd759dc5c86dff765875161 and its direct parent 50f0c87dd4c3e831a37742877f684f4918d98bf7. Branch fix/restaurant-intake-1-0, origin https://github.com/dhays4sports/CoverageFit.git, initially clean. Remote PR #37 remains open/draft at 709db6908cd8edb9cce349569e7ce699c65b3569, base e52581aed14980a1aa48ca8bcd7b1e66d6908442; verified remote head is a local ancestor. Existing continuation bundle through c7b1e99 verifies successfully. No history rewrite or replacement PR.

Fresh Chrome Pages Preview settings confirm all non-production branches deploy, watch paths *, TEST binding coveragefit-distribution-test UUID f5ac694d-1028-4a30-9fbd-c264b2e5995e, workspace distribution-engine:synthetic-test, BUYER_STAGING_ISOLATED=1, provider actions disabled, encrypted producer credential, Fail closed and restricted Preview Access. No configuration or secret was changed. This does not grant the old exact-host distribution Service Auth rule to a new hostname.

GitHub CLI is unavailable. Installed Git Credential Manager supports OAuth device login, but its default credential store is unconfigured and memory cache failed with Operation not permitted. No plaintext store was selected. Attempted the authorized exact-SHA normal push with GCM's no-persistence store and device OAuth. It produced no authorization code or success output; the first attempt was cancelled, and a bounded terminal retry timed out (exit 124). No interactive authorization was available for the user to complete. Root cause of the stalled OAuth exchange is unconfirmed; this was not an approval-review rejection. No credential was requested in chat, extracted from browser storage or added to remote URLs. No lingering push is intended.

GitHub connector reread still reports remote head 709db69. No commits pushed, deployment created, new CI result or hosted acceptance obtained. The unchanged engineering code retains the existing 429/429 test evidence, including 25 export tests; not rerun or represented as fresh hosted proof. git diff --check passes. Hosted stored-history recovery remains PASS; patched producer UI acceptance PARTIAL; CSV and consumer hosted acceptance BLOCKED; production NO-GO.

Essential next dependency: a working Git OAuth exchange in this workspace, or transfer the existing verified bundle to an already-authenticated clone and push the preserved history after rechecking remote ancestry and Preview scope. Do not recreate commits through GitHub file APIs. Consumer snapshot-to-producer handoff remains started/local-tested; remaining portability work still requires reviewed legacy ownership/source-rights and complete inventory/suppression coverage before route activation. No new downstream milestone accepted and no observed producer-time or revenue result.
