# CoverageFit + SIGNAL — Operational Consolidation Certification Gates 1.0

## P1 Continuous Evidence Accumulation — additional data and execution gates

[CF-CONTINUOUS-EVIDENCE-1.0](CF-CONTINUOUS-EVIDENCE-1.0.md) is the principal-approved **P1 foundational evidence engine** beneath Roadmap 3.0. Safe synthetic/test-only work may progress while production RingCentral inbound is blocked, but each source or action must retain hard safety gates.

**Evidence-specific gates:** workspace- and owner-scoped permitted data rights; documented event time/source; deterministic dedup/replay; conservative identity linking; assertion precision/verification/conflict/staleness; correction and deletion/retraction propagation into derived profiles; privacy/security retention and untrusted-source instruction handling; independent positive channel/consent/provider eligibility. Unknown/held source material never upgrades identity or permission. A high-intent fact/renewal never permits messaging on its own.

**Workflow gates:** every proposed SIGNAL next question consumes the current versioned profile and justified missing-field state. Every simulated new reply must update evidence and alter later SHADOW decisions when warranted. Never send in SHADOW or falsely mark a delivery/customer reply. TEST/CONTROL/STOP, opted-out/wrong-number, changed revision, producer takeover, purchased RingCentral list and uncertain provider receipt cases must fail closed.

**Release boundary:** Existing 19/19 accepted read-only Preview does not certify the future durable Evidence Flywheel. Data/migration changes, actual customer evidence processing, hosted worker execution, producer workflow writes and any external provider/customer actions require their own separate review and authorization, including any Cloudflare auto-deploy risk.

---

## Roadmap 3.0 priority integration (principal-approved 2026-10-13)

[Autonomous Insurance Growth Roadmap 3.0](COVERAGEFIT-AUTONOMOUS-GROWTH-ROADMAP-3.0.md) is now the **high-priority economic product execution guide** for CoverageFit + SIGNAL. Its P0–P6 delivery sequence prioritizes source-traceable acquisition, durable Prospect/renewal memory and safe no-send SIGNAL qualification before nonessential UI work. This **does not weaken or bypass** any operational certification requirement below: PR merge/deployment effects, provider permissions, actual RingCentral inbound/receipt/recovery, verified opt-in, source provenance, STOP/CONTROL, AgencyZoom cadence owner and separate real-data/canary authorization remain independent hard gates. P1 test-only draft implementation can proceed while live provider changes remain blocked; no synthetic PASS grants authority to send.

---

## Unified Command Center hosted acceptance complete; integration release still gated — 2026-10-13

**Preview gate accepted:** The principal has now attested all four final visual checks for the combined Command Center on the verified immutable Preview: Today urgent replacement CALL, linked Inbox no-send multi-select draft review, Prospect 360 verified versus conflicted renewals, and desktop/mobile/keyboard layout. Operator's final combined GET-only report `COVERAGEFIT_UNIFIED_RESULT` = **PASS 19/19**, failures [], `sms_sends=0`, expected HTTP **401** on unauthenticated request, original synthetic CALL's later STOP `DO_NOT_CONTACT` preserved. Tested runtime SHA `d8083570c0425371c67b1bae74813ec6c50a9be6`, tested immutable host `ece607a0.coveragefit.pages.dev`; CI **544/544** at this code SHA. Served-deployment SHA and distinct Preview/Production D1 UUID **operator-attested only**, not independently observed through this connector. Scope is limited to the governed **read-only** UI, API and synthetic test behavior; prior Phase 2 Action Quality remains accepted.

**Release gate now active: PR integration review, not implicit release.** Main/PR state must be freshly inspected: default-on Production is NOT authorized; PR #7 is a draft child of main and aggregate PR #16 is a draft child of #7, containing the #12/#14/#15 review layers (linear, not independent merges). Check current heads and CI on intended merge heads, protection checks, exact aggregate diff, ownership/consent/STOP/CONTROL safeguards, no-send fallback, Preview fixtures and debug scripts, Cloudflare environment separation, and rollback. Prepare **one separate explicit merge approval packet** (exact code refs, boundaries, risk, rollback, cost/attention). On approval, integrate **#7 then #16**, refresh/retest after any base drift, verify main. Do **not** separately merge #12/#14/#15 or mark merged before evidence.

**After authorized integration:** production feature flags remain OFF until independent release approval. Conduct producer read-only dogfood only in a separately assessed controlled scope, with measurable follow-up quality/producer time and manual AgencyZoom/RingCentral fallback; preserve individual verification and negative STOP/CONTROL tests. New bulk SMS, approval POST, Calendar writes, production deployment, automated follow-up and district rollout are not within the accepted scope.

**Live provider Phase 3 remains not certified:** the last sanitized operator check found `sender_ready=true`, `webhook_configured=false`, `subscription_active=false`; specifically `RINGCENTRAL_WEBHOOK_URL` and `RINGCENTRAL_WEBHOOK_VALIDATION_TOKEN` absent in isolated Preview while Preview's RingCentral realm was production. Existing subscription POST may activate real account notifications and history recovery. Do not perform a provider mutation or SMS canary without a separate account-isolation/approval packet. The accepted linked SIGNAL Inbox is **not** a verified live RingCentral inbox.

**No repeat principal acceptance:** For the unchanged tested runtime, the Preview visual/API gate is complete; do not ask for duplicate SQL or new Chrome certification to approve documentation-only edits. Only new runtime changes, different bindings or expanded authority require appropriate new targeted verification.

---

## Phase 2 acceptance / Phase 3 active execution gate — 2026-10-12

**Gate 1 status: ACCEPTED FOR ISOLATED PREVIEW PRODUCER ACTION QUALITY (operator-attested)**. The principal supplied browser evidence of 9/9 hosted synthetic cases PASS on immutable `ee3f966a.coveragefit.pages.dev` at tested code `1bb773debb339b595e5b39a9f53f35ac0f1850a5`, with no sends, proper unauthenticated HTTP 401 denial, and later explicitly confirmed desktop/mobile, STOP, CONTROL, TEST-exclusion visual acceptance. Review `docs/COVERAGEFIT-CURRENT-STATE.md` for the complete audit trail. Cloudflare D1 UUID separation was **operator-attested**, not independently inspected by ChatGPT. No production release or provider-send authorization is implied.

**Gate 3 status: ACTIVE; LIVE BIDIRECTIONAL PROVIDER EVIDENCE NOT YET VERIFIED.** Start with the existing implementation:
- `GET /api/sms/ringcentral/status` — authenticated **read-only endpoint**, handled by `handleRingCentralStatus`, reports presence of outbound and webhook configuration, sender readiness, subscription health, masked number, recovery cursor/status and maintenance state. This GET can call RingCentral read-only provider APIs and read D1 state; do not paste entire JSON or credentials into public logs. Any status result requires proof of which isolated environment it came from.
- `POST /api/sms/ringcentral/subscription` — may **create or renew** RingCentral webhook and start recovery; a mutation. Not included in read-only audit authority.
- `POST /api/sms/ringcentral/recovery` — may **replay missed provider history** into durable stores. Not included in read-only audit authority.
- `POST /api/sms/ringcentral/webhook` — inbound callback with validation-token/provider-readback authentication, message-level dedup and ownership locks. No synthetic unauthenticated event injection against hosted Preview.
- `POST /api/sms/ringcentral/maintenance` — privileged webhook renewal/recovery; do not trigger during configuration inspection.
- Existing `server/sms-outbound-gateway.mjs`, `server/sms-signal-api.mjs`, `server/ringcentral-webhook-recovery-core.mjs`, `server/sms-ownership.mjs`, `server/sms-consent-core.mjs` are canonical: preserve provider IDs, send-once decisions, human takeover and STOP/CONTROL boundaries.

**Sequenced Phase 3 execution:**
1. **3A — No-send status inventory.** Verify same deployment/env as intended; get masked/read-only status, record only booleans and state labels: `outboundConfigured`, `webhookConfigured`, `missingWebhook` names, `senderReady`, `connected`, `subscriptionHealth.state`, `subscriptionHealth.active`, `recovery.lastRecoveryStatus` if returned, `maintenance.status` if returned. Determine what is missing, without changing settings. Existing account history of `sender_ready_webhook_unconfigured` is not evidence of today's state.
2. **3B — Deterministic simulation and exact-path tests.** Cover webhook authentication failures; repeated message IDs; inbound/outbound ordering and no duplicate; OPT_OUT/STOP and wrong-number; CONTROL/unknown-owner holds; manual producer takeover; ambiguous outbound result `delivery_review`; retry-safe recovery across a failed event; stale revision and send-once; profile evidence/due commitment refreshed on inbound. Do not manufacture real RingCentral events.
3. **3C — Separate provider readiness authorization.** If webhook URL/token, provider subscription, Preview binding or external provider changes are missing, present a **single approval packet** (what changes, exact environments, impact, rollback, provider costs, no customer recipients) before any POST or configuration mutation.
4. **3D — Controlled end-to-end canary.** Only after proper consent/registered sender and explicit separate owner approval: operator-controlled/test numbers and isolated relationships; receipt → actual inbound → durable history → current SIGNAL → actionable producer follow-up → outcome. Prove no duplicate after webhook replay/recovery and truthful status on timeout; verify AgencyZoom remains current cadence owner. No unrelated customer communications.
5. **3E — Release decision.** Capture real provider acknowledgement, history/recovery records, evidence/renewal projection and producer-minute measurements. Until canary/authority checks pass, Phase 3 remains **not live-certified** and no automatic purchased-list messaging is authorized.

**Parallel no-send product work:** Ready-to-review Today/Inbox/Approval UX, Prospect 360 and renewal evidence schema, and permissioned SMS automation SHADOW simulation may advance on draft branches without expanding send or CRM authority.

---


> **Integration update (2026-10-12):** This checklist is now included in the canonical PR #12 development lane with Master Roadmap 2.0. The seven-day age assertion was separately corrected already on PR #7; do not reapply it from draft PR #11. Producer Action Quality/Attention confirmation regressions now cover tentative or unknown calendar evidence. GitHub CI on runtime head `01915b41bbb2b8c1d6d9ce0943dc411b3c02ee29` passed **480/480 tests**, but this is **not** hosted Preview certification. Current Cloudflare PR #12 comment reports deployed build `30ad4ca` (historical Preview) rather than this newer runtime head. Re-check exact deployment SHA, Preview/Production D1 isolation, flags, and authenticated browser behavior before turning on anything. Separate approval is still required for merge/deploy/config/external action.\n\n
**Date:** 2026-10-12  
**Status:** Review-only execution gate; **not** production or district launch authorization  
**Scope:** Operational consolidation, Producer Action Quality certification, reliable lead-to-follow-up loop, and measured producer leverage  
**Canonical context:** Read `docs/COVERAGEFIT-CURRENT-STATE.md` from the latest `signal-copilot` branch and the existing near-term producer roadmap before implementing. This gate **does not** replace either document.

## One outcome

A producer should open CoverageFit and see a small, justified set of actions: **who needs attention, why now, what to do, and supporting evidence**, without manually reconstructing context across lead sources, AgencyZoom, RingCentral, and Calendar.

The smallest complete operating loop is:

`source intake -> immutable provenance/population -> SIGNAL evidence -> action-quality reconciliation -> producer-approved action -> provider receipt/inbound observation -> durable next commitment -> outcome measurement`

Complete and certify the loop before increasing lead volume, contact autonomy, scope of integrations, or public adoption.

## Audited repository starting point

- CoverageFit `main`: `5f47f2b7367110ca04ff03cc189983f136ab32fa` (2026-09-29). Recheck before integration.
- Draft PR #6: race-safe district promotion and seven-day eligibility preservation.
- Draft PR #7: Signal Reply Copilot, current Producer Action Quality work, read-only Attention development, source-level release documentation. Its more recent code must not be replaced by a historical #8 base.
- Draft PR #8: commitments/Attention/Calendar foundations; stacked on an older PR #7 head and overlaps PR #6. Reconcile deliberately rather than merging branches blindly.
- Draft PR #9: default-off producer email notices for 408FARMERS handoffs; separate validation gate.
- Draft PR #10: separate Windows Desktop Copilot, not on the critical operational path.
- 408FARMERS draft Signal Decision/preview work remains unmerged. Existing landing pages should not be migrated during this phase.
- The repo contains a stale test assertion expecting “48 hours” even though the approved fresh-lead pilot window is **seven days**. This PR repairs the assertion only; it does not change runtime eligibility.

All above are **repository claims**, not assertions that production deploys equal branch heads. Review current Cloudflare / provider state before claiming a live feature.

## Gate 0 — restore trustworthy tests (first deliverable)

- Align the legacy `tests/agencyzoom-raw.test.mjs` age-hold expectation with `outside 7 days`.
- Preserve the existing six-day eligible / eight-day ineligible test and older-inventory safe-hold behavior.
- Run the full repository regression suite on a supported Node version with its documented loader. A previously passing suite on a different branch is **not** current-head evidence.
- Require green checks or document any separately proven infrastructure-only failure before requesting an integration review.
- No runtime behavior or production configuration change is part of Gate 0.

## Gate 1 — certify Producer Action Quality in isolated Preview

Use the existing `server/producer-action-quality.mjs` implementation on the current `signal-copilot` branch. Do not implement a rival recommendation engine.

For synthetic, non-customer fixtures, confirm that **Work list and detail** show identical `Why now / Do / Evidence` for:

| Case | Required outcome |
| --- | --- |
| Recent meaningful inbound, Decision 2 `ASK_ONE_QUESTION` | Ask the single known missing fact; urgency alone must not turn it into CALL |
| Current explicit request, Decision 2 `CALL` | Clearly show the call action when contact safety permits |
| Confirmed callback/appointment now due | Surface the due obligation ahead of merely attractive Opportunity Priority |
| STOP, wrong number, opt-out, suppression, or CONTROL | No actionable contact guidance; no AI/provider call or send implied |

Also verify: synthetic QA records do not clutter producer attention; stale evidence invalidates advice; underlying evidence refs remain visible; disabled flags preserve the existing manual workspace.

Certification requires **verified Preview/Production DB isolation and the exact deployed SHA**. If that cannot be established, use deterministic mocked tests and record the hosted gate as blocked. Do not use production data or force Preview bindings.

## Gate 2 — establish a single controlled integration lane

Prepare an integration branch from a freshly verified base and a requirement-by-requirement change inventory. Do not merge any existing PR automatically.

1. Preserve PR #6's compare-and-swap district promotion safety and ownership boundaries.
2. Preserve the *latest* PR #7's Copilot and Producer Action Quality code, test fixtures, and provenance.
3. Reconcile PR #8's commitment, Attention, and Calendar work against the latest #7; avoid an obsolete stacked-base regression.
4. Integrate PR #9 only after its intake-to-email linkage and Resend configuration pass a controlled synthetic canary.
5. Leave Desktop Copilot #10 separately scoped; it cannot bypass CoverageFit's evidence or send authority.

For every overlap record: source head, retained behavior, displaced implementation, affected files, regression tests, rollback, and whether permissions/provider writes have changed.

## Gate 3 — certify the communication and follow-up loop

- Producer-approved SMS must remain the only outbound authorization. Draft selection is **not** send approval.
- Verify stable message IDs, stale-revision rejection, duplicate/retry behavior, opt-out/manual takeover, owner/cohort gating, and provider acknowledgement reconciliation.
- Distinguish **outbound certified in a prior controlled Preview canary** from **inbound webhook/subscription still unverified**. Recheck RingCentral subscription, validated webhook handling, and actual inbound projection before claiming bidirectional sync.
- AgencyZoom remains the district cadence/CRM owner during the pilot. CoverageFit provides intelligence, evidence, attention, and producer action support; it does not silently take over SMS ownership.
- A saved/confirmed commitment should drive future due attention without fabricating a completed call or a Calendar event.
- Resolve ambiguous provider success through reconciliation, not blind repeated writes.
- Ensure 408FARMERS WEB/DIRECT handoff produces one Workspace opportunity and, if separately enabled, one correct producer notification without making notification success a condition of lead persistence.

Do not introduce production AI flags, RingCentral subscriptions, Google invites, automated SMS or email, customer-data model calls, or CRM writes under this review-only authorization.

## Gate 4 — establish economic evidence before district expansion

Use a small, controlled population of **fresh California personal-lines leads** and stable cohorts. The operating comparison is normal AgencyZoom/RingCentral process versus governed SIGNAL support, not raw total-contact volume.

Measure per cohort and time window:

- leads received, successfully normalized, actionable, held, excluded, duplicated;
- producer minutes spent on triage, conversation, correction, callbacks, and administration;
- **useful conversations** (defined in advance), quotes, policies bound, verified written premium;
- unanswered meaningful inbound, missed due commitments, delivery-review exceptions;
- contacts per useful conversation, producer minutes per useful conversation, binds and verified premium per producer hour.

Keep CONTROL isolated and preserve the audit of any documented allocation override. Synthetic/test opportunities never count toward outcomes. Do not claim uplift, savings, ROI, or production lift from passing tests alone.

## Release decision

**NO-GO** until all of the following have evidence:

1. Full suite and relevant security/ownership regressions green on the exact integration head.
2. Producer Action Quality Preview cases certified or explicitly blocked with a bounded fallback plan.
3. RingCentral inbound/outbound and producer-approved send idempotency proven in an authorized, isolated environment.
4. AgencyZoom ownership, source/provenance, seven-day cohort rules, STOP/CONTROL exclusions verified.
5. Lead -> action -> receipt/inbound -> next commitment -> outcome traceable without reconstruction.
6. Baseline/control measurement available for a genuine small pilot.
7. Separate operator authorization for main merge, production deploy/configuration, external sends, calendar invites, live lead enrollment, and district expansion.

## Principal attention budget

Default to **zero owner interruptions** for read-only audits, mock tests, code review, and draft PR preparation. Batch consequential approvals into one compact review with evidence, reversible recommendation, risks, and clear cost of delaying. The owner should not need to repeatedly switch among GitHub, Cloudflare, RingCentral, AgencyZoom, and ChatGPT merely to certify a development increment.

**Definition of success:** fewer minutes of producer attention required for each useful, compliant insurance conversation—not more automation for its own sake.
