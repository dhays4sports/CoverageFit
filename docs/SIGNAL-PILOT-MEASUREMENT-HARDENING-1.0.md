# Pilot measurement hardening — implementation and certification

2026-09-25. Canonical base: CoverageFit d566567cafaa90be02a71a4edce105b3c9f32db0. 408FARMERS remains 78660e8b5614ba4252af3ba55f35a543ccae21a1 and is not changed. Retain pre-workspace-production-20260925 and pre-signal-production-20260924. No Cloudflare mutation, migration, provider send or real customer certification activity is part of this source release.

## What changed

Analytics separates primary efficiency, sales preservation, attention efficiency, verified premium economics and historical reference. Primary remains **producer minutes / useful conversation**. The reference values are supplied by Dylan in the mandate; the October folio was not independently re-audited in this pass. Honor-system calls/talk time are contextual. None enters cohort calculations. No winner label or statistical significance claim.

All requested ratios are represented. Counts show observed positives with review counts. Ratios require complete underlying outcomes and effort/call evidence, and a positive denominator. Missing producer time remains unknown. Complete zero outcomes may produce zero per-100-lead rates; zero useful conversations never produces a minutes-per-useful-conversation ratio. Premium requires actual bind evidence and verified term premium on every observed bind plus complete bind review. No annualization, inferred commission or inferred premium. Farmers policy count is separate from enrolled opportunities with a bind. Small-sample premium and bind results remain directional.

The existing **CALL** Decision 2 control only records a routing decision. It does not dial RingCentral. It must never increment call attempts. The separate **+ Record call attempt** button confirms one actual attempt, on either enrolled cohort's detail. Requests are idempotent; viewing a record, generating a recommendation, editing a draft and approving SMS do not count. Events retain workspace, exact opportunity, cohort at capture, timestamp, CALL type and producer-confirmed source. No RingCentral call-log integration or reliable opportunity-linked duration source was found. Duration and duration ratios remain unavailable; no per-call duration entry is required.

## Batch reconciliation

Open **Analytics → weekly scorecard → Refresh → Batch reconciliation**. Select records that share the SAME verified update, preview, confirm once, apply. Silent/unqualified records need no individual work-detail visit. Default selections preserve unknowns; silence does not mark a lead negative or prove zero effort.

- Existing time/call records can be affirmed as complete, or actual no-work/no-call can be explicitly confirmed for a batch.
- Complete recorded calls includes prior externally reconciled calls plus newly recorded attempts, without counting them twice. The same rule preserves externally reconciled producer time.
- Optional cumulative external totals are on the worked opportunity's detail, not a second spreadsheet. These totals INCLUDE existing logs. They are not additional-minute entries.
- Quote-ready, useful conversation, actual quote, bind, Future Bind and disposition updates can be reconciled together when the evidence is common to the selected records. Different outcomes require separate selected batches or the normal worked-record update.
- Future Bind requires a real date/month. STOP cannot be cleared, and verified positive outcomes cannot be erased by a batch.
- A preview fingerprint covers inputs, current pilot version and work evidence. Changed records or newly recorded work require a fresh preview. Per-row conflicts are reported; the UI never claims an all-batch success when rows failed.
- Replays do not duplicate calls, effort or reconciliation. New calls/effort invalidate earlier completeness. Existing activity is never deleted or overwritten. Cumulative totals cannot silently reduce previously confirmed work.
- This is **producer-confirmed reconciliation against business records**, not a claim of automated AgencyZoom import/sync. AgencyZoom remains authoritative. No export format was invented or asserted compatible without an actual source export.
- Batches show up to 100 selected records with pagination. Full-cohort report reads existing ledgers in bulk, not two database queries per opportunity.

Storage reuses cf_solo_activity, cf_solo_sources and cf_opportunity_effort. New activity kinds: pilot_call_attempt, pilot_reconciliation, pilot_reconciliation_batch. Additive JSON reconciliation metadata; no migration. CSV includes call totals/completeness/source, duration null, Farmers policy count and reconciliation source. It excludes contact PII.

## Multi-turn evidence and narrow defect correction

Local tests exercise actual successive inbound handlers and approved-send API with a fake provider (never live transport):

| Scenario | Local result |
|---|---|
| Known AUTO / Mercury / renewal / Subaru context → Auto | One missing question; no repeated known fact |
| Price motivation reply | Accumulated context reevaluated; can stop early when enough context exists |
| “I need to switch this week” | CALL, HIGH/URGENT; no more qualification |
| Three actually approved questions and another reply | CALL; no fourth qualification question |
| Call me / need coverage Friday / cancellation tomorrow / quote request | Producer escalation interrupts qualification |
| Renewed, call in February | LATER, FUTURE_BIND, month retained |
| Already switched / not interested | CLOSE |
| STOP | Suppression, empty sales draft, approval rejected |
| Wrong number | Governed closure/suppression |
| Quote too expensive → under $220 | Target retained, producer handoff; no repeated price question |
| Edit / stale revision / approval replay | Edit sends nothing; stale/repeated approvals fail; one fake send |

Observed defect fixed narrowly: explicit “need to switch today/tomorrow/this week/now” could fall through to low-priority ambiguity when not answering a timing question. It now uses the existing fresh-urgent CALL branch. No scoring weights, caps, bands, templates, action vocabulary, RAW governance or three-question ceiling changed.

Selected Work details poll the canonical linked decision every 15 seconds while visible. A new revision refreshes the full evidence/draft/stage detail when there are no unsaved edits. Otherwise it prompts Refresh and preserves edits; server revision protection rejects stale approval. Manual Refresh remains. Draft revision is visible. SMS Operations is not required for normal enrolled multi-turn work.

## Local verification

Full Node suite: 192 passed, 0 failed, 0 skipped. 407 JavaScript/module syntax checks. Local Wrangler build could not run because wrangler 3.114.17 is not cached in this environment; no build-pass claim. Production render/API verification is recorded separately after publication.

Synthetic machine rehearsal: 10 CONTROL + 10 SIGNAL worked opportunities and 10 silent records through RAW preview/import, idempotent actual-call evidence, batch reconciliation and export. Stored fixtures use fictional identities and reserved test numbers in an in-memory database. The test proved 20 attempts, 100 explicitly supplied minutes, complete cohort measurement and verified test premium without real sends. These are test assertions, not projected business results.

## Administrative-burden trial — still required

**NOT MEASURED.** Machine execution time is not Dylan's administrative time. No median/slowest producer number is claimed. A browser click script also cannot measure reading a draft, verifying AgencyZoom or making a real call.

Run 10 representative CONTROL and 10 SIGNAL cases plus a silent/unqualified batch. Time only additional pilot administration, including amortized RAW downloads/import, exceptions, checking assignment, reviewing/sending treatment drafts, recording call attempts, manual AgencyZoom acknowledgement, effort/outcome entry and weekly reconciliation. Normal selling time remains in the primary producer-effort numerator but is not itself pilot administration. Include review and context-switch time; do not subtract time just because the system labels it a sales task.

Record each case's elapsed additional administration, median, slowest case, total batch time and batch time per enrolled record. Report any cases above 60 seconds. Silent/unqualified records must require zero individual pilot opens; batch verification still counts toward total administration. Do not default unknown time to zero to make the result look favorable. If totals cannot be verified without individual investigation, mark the burden gate failed and simplify from that observation.

## Production canary gates

SMS was last observed OFF. Do not enable broadly from passing tests. Preserve TEST records outside real pilot denominators and outside DISTRICT_SIGNAL/CONTROL lists: the existing population architecture intentionally places them in OTHER. Production TEST transport certification can use the existing specialist SMS tools; it does not prove a live enrolled Work journey. Do not relabel synthetic leads NEW_LEAD merely to make a certification screen appear. Local tests cover enrolled Work isolation; the full producer journey remains an explicit live gate.

Before any live SMS send, obtain Dylan's exact approval of the recipient (internal/user-controlled) and message. No provider send is authorized by approving this code. Synthetic RAW production import also needs appropriate internal identity details; do not invent a reachable number or reuse a customer.

### CLOUDFLARE MANUAL CHECKPOINT — internal canary only

Project: CoverageFit production Pages project serving coveragefit.com. Do not alter 408FARMERS.

| Setting | Type | Required value | Why / verification | Rollback |
|---|---|---|---|---|
| CF_SMS_SIGNAL_PILOT_ONLY | Variable | 1 | Constrain Signal to exact enrolled relationships; first confirm the test enrollment roster contains only intended internal relationships. Unenrolled and CONTROL replies must not receive Signal drafts. | Leave 1 while switching Signal off |
| CF_SMS_SIGNAL_ENABLED | Variable | 1, only for the agreed internal canary window | Enable interpretation/drafting. Verify API/UI enabled state and no draft is sent before explicit approval. Existing Git deployment/redeploy must pick up settings. | 0 |

No other Cloudflare settings, migration 0019 repeat, secret rotation or new binding is requested. Never paste secret values in chat. Dylan reports both values and deployment completion, without secrets. Then certify RAW, durable records, CONTROL isolation, successive replies, distinct approvals, exactly-once sends, STOP, actual-call recording and Analytics through the existing UI. Actual provider sends require the separate exact-message approval.

## Readiness matrix

| Requirement | Status | Evidence / remaining gate |
|---|---|---|
| RAW / immutable cohort / field governance | PASS WITH LIMITATION | Existing + expanded synthetic import tests; production internal import pending |
| Producer population isolation | PASS WITH LIMITATION | Regression tests; no architecture change |
| Call-attempt capture | PASS WITH LIMITATION | Idempotent producer-confirmed actual-call action; no recommendation counting; live internal action pending |
| Call attribution / duration | PASS WITH LIMITATION | Exact opportunity and source; completeness review required; RingCentral duration unavailable |
| Primary efficiency | PASS | Original metric retained with complete numerator/denominator requirements |
| Calls/useful conversation, calls/quote | PASS | Complete-only ratios tested; unavailable when attribution incomplete |
| Quote preservation / premium | PASS WITH LIMITATION | Gated observed differences, policy counts, verified term premium; production empty-cohort UI verified; actual outcome canary pending |
| Historical context separation | PASS | User-supplied reference only; no denominator/scoring use |
| Multi-turn / ceiling / interruption / zero-repeat | PASS WITH LIMITATION | Local full-handler/fake-send tests, not a live provider certification |
| Edit/no-send / approve-once / STOP | PASS WITH LIMITATION | Local contracts pass; live provider gate pending |
| Batch outcome/effort reconciliation | PASS WITH LIMITATION | Implemented and synthetic rehearsal passes; no automatic CRM sync; live operator rehearsal pending |
| Timed producer burden | BLOCKED | Human trial not measured; no median or slowest-case claim |
| Live provider canary | BLOCKED | Manual flags, intended internal relationship and exact-send approvals needed |
| District launch | BLOCKED / NO-GO | Human burden, live ingestion/isolation/provider and producer end-to-end gates outstanding |

## Files

Backend: server/pilot-efficiency.mjs, server/pilot-reconciliation.mjs, server/district-pilot.mjs, server/solo-desk-api.mjs, server/sms-signal-core.mjs.
UI: assets/js/pilot-analytics.mjs, assets/js/district-pilot.mjs, assets/js/producer-workspace.mjs, assets/js/producer-sms.mjs, agent/workspace/index.html.
Tests: tests/pilot-measurement.test.mjs, tests/agencyzoom-raw.test.mjs, tests/producer-workspace.test.mjs, tests/sms-signal.test.mjs.
Docs: this report and updated current workspace/burden gate notes.

## Publication and follow-up

Initial source release: 80e5e0ed47028b56225c4aa3af7a4225cd8a6e7a. Production served the MEASURE-1.0 workspace module on 2026-09-25; existing producer connection remained usable. Follow-up regression preserves previously complete quick-review effort when a batch changes only outcomes, while newly recorded calls invalidate previous completion. All 192 tests pass.

Rollback added: pre-measurement-production-20260925 → d566567cafaa90be02a71a4edce105b3c9f32db0. Older rollback refs retained. No force push. Git integration deployed code; Cloudflare configuration remains untouched.

Hosted Analytics verification: all five sections rendered; quote-preservation guardrail visible; historical target/minimum/folio context separate. API-backed report showed 0 CONTROL and 0 SIGNAL enrolled. Primary efficiency, call and premium ratios were Not measured with completeness counts, not fabricated zero. Batch preview controls rendered; no production batch was applied to customer data. Deployment provider SHA was not independently exposed; hosted module and rendered behavior were observed. No live SEND, synthetic production import, measured producer time trial or SMS enablement is claimed.
