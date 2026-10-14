# CoverageFit Current State

## Latest verified integration snapshot — 2026-10-14

The [Roadmap 3.0 integration-readiness report](CF-ROADMAP-3-INTEGRATION-READINESS.md) supersedes earlier implementation-status, test-count and next-engineering snapshots below. Main and #7 → #16 → #17 → #18 → #19 → #20 → #21 were refreshed; all PRs remain draft/unmerged. Reviewed #21 is `089cd3860247fc66e9cce0dd68c48368123342b1` (634/634 exact-head CI). E2 durable memory, C1 SHADOW planning, C2 fenced queue, Current Decision C3 and Producer Integration C4 are locally implemented/tested, not hosted-certified. This consolidation adds two test-only blocker characterizations (636/636 local), no runtime change; final package head/CI are in #21.

Release gaps: page-local C4 ranking can omit urgent later-page work; no accepted D1 snapshot/auth adapter; local query fan-out/allowlist exceed direct-port D1 budgets; real-data authority and economic measurement remain unaccepted. Main reports unprotected/no rulesets, with detailed protection access denied. No merges/deployments or Cloudflare login request. **Producer Integration C4 is not Dynamic Cadence C4's live communication canary**, which remains unapproved/unimplemented. The earlier hosted Preview evidence remains scoped to its historical runtime.

## FUTURE PRIVACY-FIRST MONETIZATION BOUNDARY ADOPTED — 2026-10-13

## P1 DYNAMIC CADENCE ARCHITECTURE ADOPTED — 2026-10-14

**Principal direction:** Embed [CF-SIGNAL-DYNAMIC-CADENCE-1.0](CF-SIGNAL-DYNAMIC-CADENCE-1.0.md) directly in Growth Roadmap 3.0 as a **P1 child of SIGNAL Autonomy**. CoverageFit should eventually govern evidence-aware **next evaluation / next useful action** for specifically authorized first-party workflows, not operate a naive day-based drip. Existing district AgencyZoom cadences remain AgencyZoom-owned; **one active cadence owner per workflow family**, with explicit agency-approved cutover to CoverageFit if later justified. RingCentral's role is strictly policy-compatible transport/receipt/inbound.

**Current actual code:** [draft PR #17](https://github.com/dhays4sports/CoverageFit/pull/17) demonstrated first source-to-fact-to-changed-SIGNAL-question simulation, in-memory and **test-only**, with 556/556 CI on its prior tested head. It did **not** implement a durable profile ledger, live scheduling, AgencyZoom cadence cutover or actual SMS automation. The approved Command Center 19/19 Preview continues to be read-only and its live inbound provider route uncertified. **No new runtime code in this documentation update.**

**Next engineering:** keep P0 #7 → #16 merge/deployment-effects review bounded and unmerged. In P1, E2 safe durable/replayable evidence memory and C0 AgencyZoom ownership audit precede C2 durable cadence state; C1 pure no-send dynamic evaluation planner can be implemented in parallel. Send and provider authority, live D1/customer data, workflow family cutover, CRM mutations and Production activation require independent explicit approvals. The future aggregate market-intelligence option remains parked.

---

**Principal preference recorded:** Do **not** sell or redistribute enriched individual Prospect 360 profiles and accumulated customer evidence as leads. Possible **future optional** monetization: (1) aggregated, genuinely de-identified insurance market intelligence **only** where original source/vendor/agency/carrier rights and privacy rules permit the analysis and external use; (2) perhaps minimal, specifically authorized **direct CoverageFit inquiry** introductions after separate consumer notice/authorization, licensing/agency and compensation reviews. No automatic rights for 408FARMERS, district/Farmers, purchased or vendor lead sources.

**Current status:** [CF-DATA-RIGHTS-AND-MARKET-INTELLIGENCE-OPTIONAL-1.0](CF-DATA-RIGHTS-AND-MARKET-INTELLIGENCE-OPTIONAL-1.0.md) is a **product/data-rights decision record**, not an implemented resale/aggregation feature, lawful resale finding or authorized commercial launch. Within P1 [Continuous Evidence Accumulation](CF-CONTINUOUS-EVIDENCE-1.0.md), future data contracts should preserve provenance, data owner, rights to secondary analysis/commercial transfer, retention/withdrawal, minimum fields and a **default-deny external transfer state**. No new D1 schema, provider change, live data sharing, market-data exports, new monetization product or lead distribution approved.

**Priority:** Prove CoverageFit's core acquisition-to-useful-conversation economics and preserve private relationship data first. Later market-intelligence commercialization is optional and must be supported by a new economic, contract/legal and reidentification-risk case before action. The already accepted 19/19 read-only Preview status remains unchanged.

---

## P1 FOUNDATION ADOPTED — Continuous Evidence Accumulation (2026-10-13)

**Principal decision:** Promote the [Evidence Flywheel / CF-CONTINUOUS-EVIDENCE-1.0](CF-CONTINUOUS-EVIDENCE-1.0.md) to **P1 foundational capability** within [Roadmap 3.0](COVERAGEFIT-AUTONOMOUS-GROWTH-ROADMAP-3.0.md). This is the shared contract linking bulk acquisition, Prospect 360 / verified renewal memory and SIGNAL's repeated evidence-aware qualification. It is not a secondary profile enrichment or separate system.

**Currently implemented:** Read-only Prospect 360 (`server/prospect-360-readonly.mjs`) projects sources, SMS renewal claims, structured `renewal_verification_v1` and existing UCP links with conflict/precision semantics; current SMS conversation/RAW import data and standalone offline no-send SHADOW simulator (`server/engagement-shadow-simulator.mjs`) exist. **Not implemented/certified:** canonical persistent cross-channel FactAssertion event history, auditable corrections and retention/deletion propagation, continuous admitted event-driven profile updates or stateful live SIGNAL feedback/workers. Do not describe this newly approved P1 as a deployed feature.

**Next no-send work:** Existing schema/owner/retention audit; deterministic source/event-to-assertion mapping with identity conflict holds and replay keys; source-backed versioned profile/renewal projection; multi-turn evidence-driven SHADOW that uses existing facts to avoid repeated questions; operator time/quality instrumentation. Start with synthetic/test-only scope and draft reviews. No D1 migration, real data ingestion, Cloudflare flags, provider changes, actual outreach, merge or Production release is implied.

**Required separation:** Retained evidence and a verified insurance fact **never confer** communication permission or overrule STOP/CONTROL/TEST, opted-out/wrong-number, source rights or restricted provider campaign routes. A suppressed original synthetic CALL from prior Preview remains suppressed. Evidence handling must comply with source-specific retention, minimization, correction and deletion requirements.

---

## HIGH-PRIORITY ECONOMIC ROADMAP ADOPTED — 2026-10-13

**Principal directive:** Bake the entire approved [Autonomous Insurance Growth Roadmap 3.0](COVERAGEFIT-AUTONOMOUS-GROWTH-ROADMAP-3.0.md) into CoverageFit and use it as the high-priority economic North Star for subsequent product/engineering decisions. The complete P0–P6 implementation roadmap, measurable acceptance criteria, source/identity/consent data contracts, permission-aware SIGNAL SHADOW, provider canary, SIGNAL/CONTROL economics, discretionary engineering allocation and Principal Attention Sovereignty governance now live in that canonical document.

**Priority shift:** Preserve the already accepted read-only Command Center. Invest incremental product engineering first in scalable source-traceable intake, persistent profile/renewal memory and resumable qualification orchestration; use the UI only as a high-value producer handoff. Every material cycle must target genuine useful conversations, written premium or producer minutes saved, or remove an evidenced blocker. New screens/agents/integration complexity without that connection are deferred.

**Scope of authorization:** Adoption is **product direction and reviewable draft/test-only engineering approval**, **not** a merge, Production deployment, direct live customer data acquisition, vendor purchase, AgencyZoom/calendar write, provider configuration, SMS execution or autonomous live contact. Existing STOP/CONTROL/TEST and purchased-list provider restrictions are unchanged. Current PR #7 → #16 integration gate remains open; accepted Preview 19/19 and visual signoff remain valid for the unchanged runtime. Live RingCentral inbound and producer economic benefits are still unverified.

**Next implementation handoff:** Complete one #7/#16 merge-triggered Cloudflare effect/rollback review, while designing/slicing `CF-ACQUISITION-INTELLIGENCE-1.0`, `CF-PROSPECT-MEMORY-1.0` and `CF-SIGNAL-AUTONOMY-SHADOW-1.0` in test-only drafts with shared data contracts, and prepare a single consequential owner decision packet when genuinely needed.

---

## Combined Command Center HOSTED-CERTIFIED in isolated Preview — 2026-10-13

**Principal visual signoff (October 13, 2026):** The owner explicitly attested that all four final checks passed **on the verified immutable Preview**: (1) Today displays the new synthetic replacement CALL with the correct recommended action; (2) Inbox displays the draft and multi-select review without a send action; (3) Prospect 360 distinguishes source-confirmed renewal and conflicting dates; (4) desktop, mobile and keyboard navigation are usable without overlapping controls. This completes the previously outstanding manual visual acceptance gate.

**Hosted automated acceptance:** Operator-run GET-only checker on `https://ece607a0.coveragefit.pages.dev/agent/workspace/` reported `COVERAGEFIT_UNIFIED_RESULT` with `status=PASS`, `checked=19`, `passed=19`, `failures=[]`, `http_actions=GET_ONLY`, `sms_sends=0`, and `original_call_stop_preserved=true`. The deliberately unauthenticated `GET /api/solo-desk/producer-command-center` returned **401**, expected and passing. Three additional Command Center markers (`new_three=3`) accompanied the original nine (`original_nine=9`); a separate replacement synthetic CALL fixture (run `qa-20261013-replacement-call-499d2e80`) was added after the original CALL fixture's stored SMS disposition became STOP. The prior CALL remains suppressed with `DO_NOT_CONTACT` and was **not overwritten** to force a test pass. All tested QA records were asserted to be fictional; source and message content stayed outside shared output.

**Reviewed deployed code:** `d8083570c0425371c67b1bae74813ec6c50a9be6` (source-ref for unified draft PR #16). The operator attested the immutable Preview serves that SHA and that its Preview D1 UUID differs from Production D1. **Deployment and database isolation evidence remain OPERATOR_ATTESTED_ONLY; ChatGPT has not independently inspected the Cloudflare deployment header or database bindings.** Prior CI on this exact runtime head: [38334953705](https://github.com/dhays4sports/CoverageFit/actions/runs/38334953705), **544/544 passing** (plus syntax). This documentation-only follow-up requires its own exact-head CI before review completion.

**Release disposition:** `COMMAND_CENTER_UNIFIED_HOSTED_PREVIEW_ACCEPTED (OPERATOR_ATTESTED_ISOLATION)`. This status applies to **read-only Producer Action Quality, Today, linked SIGNAL Inbox, Prospect 360 renewal evidence, and selected SMS draft review** plus no-send SHADOW test coverage. It is **NOT** production authorization, pilot/economic certification, live full RingCentral Inbox, bulk approval/send, new consent authority, autonomous messaging, Calendar writes, or a verified end-to-end provider delivery/receipt path. Existing manually governed Work capabilities are not replaced. `CF_ATTENTION_ENABLED`, `CF_COMMAND_CENTER_READONLY_ENABLED`, `CF_PROSPECT_360_READONLY_ENABLED`, `CF_SMS_REVIEW_READONLY_ENABLED` were accepted within the operator-verified isolated Preview only; do not infer Production flag states.

**Integration handoff, requiring a separate merge/release decision:** PR #7 remains draft/unmerged from `main`. PR #16 is a mergeable draft whose base is PR #7 (`signal-copilot`); it contains fast-forward ancestry of unmerged #12 → #14 → #15 and the unified acceptance code/tests. To avoid duplicate integration, review exact refs/diffs/permissions and request a single **explicit** merge authorization packet for **#7 then #16**, with normal branch protection, fresh CI, rollback and no Production feature-flag activation. Do **not** separately merge #12/#14/#15 after merging the aggregate or silently close them now. Preserve no-send defaults on Production. If upstream changed, revalidate before integration.

**Next product gates:** (A) complete non-mutating release-integrity/security/data/rollback review and draft merge recommendation, (B) producer dogfood in a separately authorized controlled environment measuring useful conversations, attention minutes and exceptions, (C) keep Phase 3 live RingCentral webhook/receipt/recovery blocked pending provider sandbox versus production-account strategy, missing `RINGCENTRAL_WEBHOOK_URL` and `RINGCENTRAL_WEBHOOK_VALIDATION_TOKEN`, and a separately authorized canary. Real SMS campaign permission/recipient-specific evidence, source restrictions and AgencyZoom cadence ownership remain hard gates. Do not turn a read-only UI acceptance into permission for customer communications.

**Owner attention:** No additional Cloudflare SQL or repeated visual checks are needed for **this scoped certification**. Any subsequent consequential action should be presented as one consolidated approval packet rather than incremental manual steps.

---

## Command Center 0.2 — Prospect 360, SMS review and SHADOW implemented — 2026-10-12

**Active development branch/PR:** Draft PR #15 (`feature/prospect360-sms-review-shadow-20261012`) is stacked on draft Command Center PR #14, itself stacked on accepted-Preview Action Quality draft PR #12. **No merges, production releases, SMS sends, provider subscription mutations or Cloudflare setting changes were performed.**

**Ordered delivery:**
1. **Prospect 360 / Renewal Intelligence 0.1** — source-linked read-only fact projection (`server/prospect-360-readonly.mjs`) and optional existing-Workspace detail rail. Existing UCP identity links are reused without phone-based auto-merge; structured verification evidence can mark date confirmed, raw imports/SMS remain provisional, conflicts do not auto-resolve, dates in the past go stale and no timing establishes contact permission. Default-OFF `CF_PROSPECT_360_READONLY_ENABLED`, authenticated `GET /api/solo-desk/prospect-360?id=...`.
2. **Selected SMS Review 0.1** — bounded 1–10 current SIGNAL draft snapshots with revision, STOP/CONTROL/takeover/delivery review guards, local multi-edit textarea; **no save, send, bulk send or approval POST endpoint**. Default-OFF `CF_SMS_REVIEW_READONLY_ENABLED` plus existing Command Center flag; authenticated `GET /api/solo-desk/producer-approval-preflight?ids=...`. Every snapshot explicitly lacks send authority.
3. **Engagement SHADOW 0.1** — pure deterministic qualification/follow-up proposal simulator, including 100-synthetic-prospect exercise. TEST, CONTROL, STOP, third-party/purchased acquisition, unverified campaign route and permission block any SMS proposal. Even eligible synthetic scenarios never call a provider, write state or send; this is **not an operational background worker**.

**Validation:** Final implementation including the escaped-HTML review regression passed **536/536 tests, zero failures**, on head `dbaaa82f1aabaf917b00d3930d9dc399875902f5` (GitHub Actions [38333749315](https://github.com/dhays4sports/CoverageFit/actions/runs/38333749315)). This documentation-only update will have a separate exact-head CI result.

**Outstanding gates:** No hosted acceptance of new 0.1 views or newly wired Preview flags; no durable customer-confirmed renewal correction/write process; no positive message-specific consent ledger; no end-to-end live provider inbox, delivery receipt or send idempotency certification for batch approvals. Existing Phase 3 webhook blocker (`RINGCENTRAL_WEBHOOK_URL` and `RINGCENTRAL_WEBHOOK_VALIDATION_TOKEN` absent on accepted Preview with production RingCentral realm) is **deferred for a consolidated separately approved setup**. Neither this development nor a SHADOW simulation lifts it.

**Contract/details:** `docs/COVERAGEFIT-PROSPECT360-REVIEW-SHADOW-0.1.md`. No owner action required for this draft implementation; continue test-only engineering and batch consequential decisions.

---

## Command Center Today + Inbox 0.1 implemented as default-off read-only draft — 2026-10-12

**Parallel Phase 3 product slice:** Draft PR #14 (`feature/command-center-today-inbox-readonly-20261012`) is **stacked on draft PR #12** and adds a small, real Today/Inbox panel inside canonical `/agent/workspace/`. This is development, **not production activation**. It reuses existing governed `producerWorkspace.list`, Attention, Producer Action Quality, Signal SMS drafts and identity; no second CRM, message transport or profile database. The default-off flag is `CF_COMMAND_CENTER_READONLY_ENABLED=1` (absent/off by default), and Attention must be enabled for meaningful output.

The first preview shows (a) ranked actionable NOW/TODAY/HIGH opportunities, (b) narrow linked SIGNAL `DRAFT_REVIEW`, `NEEDS_PRODUCER_ATTENTION`, and `DELIVERY_REVIEW` buckets, (c) explicit warning that RingCentral **live inbound synchronization remains unverified**, and (d) no send or batch-approval controls. Record deadlines are labeled unverified, not confirmed policy renewal. Every SMS item declares `sms_send_eligible=false`, `can_bulk_approve=false` and contact authority NOT_EVALUATED. STOP/CONTROL/suppressed items cannot be promoted; TEST fixtures are excluded by existing Work.

**Evidence:** GitHub Actions run [38332527408](https://github.com/dhays4sports/CoverageFit/actions/runs/38332527408) passed **514/514** tests, zero failures, on implementation head `5928b55643c7c2c2e7fa550458d76f1a2e8adc72`. Design/implementation contract at `docs/COVERAGEFIT-COMMAND-CENTER-TODAY-INBOX-0.1.md`.

**Release conditions:** This remains an off-by-default, review-only feature. Before enabling in isolated hosted Preview, independently certify D1 isolation, UI keyboard/mobile usability, Performance and STOP/CONTROL parity; before any bulk SMS sending, implement a separate durable positively verified consent/route and individual action-authority gate. No Cloudflare intervention, provider subscription, external SMS, CRM write or main merge is requested during the development phase. Phase 3 RingCentral webhook `sender_ready_webhook_unconfigured` remains separately unresolved.

---

## Phase 3A observed RingCentral status: webhook configuration blocked — 2026-10-12

**Operator-observed sanitized authenticated GET** from the accepted immutable CoverageFit Preview (reported 2026-10-12):

```json
{
  "outbound_configured": true,
  "webhook_configured": false,
  "sender_ready": true,
  "connected": false,
  "connection_state": "sender_ready_webhook_unconfigured",
  "subscription_active": false,
  "subscription_health": "missing",
  "recovery_status": "unknown",
  "provider_environment": "production",
  "missing_config_keys": [
    "RINGCENTRAL_WEBHOOK_URL",
    "RINGCENTRAL_WEBHOOK_VALIDATION_TOKEN"
  ],
  "sends": 0
}
```

**Phase 3A finding:** outbound credentials and the configured RingCentral sender's SMS capability are present, but the Preview environment has **neither a webhook URL nor a webhook validation token**. No matching active subscription can be established from this state, so inbound events, recovery, and end-to-end bidirectional synchronization are **NOT CERTIFIED**. This is a configuration/subscription blocker, not an instruction to rebuild the transport.

**Critical account boundary:** `provider_environment=production` is the **RingCentral API account realm** used by Preview. It does **not** mean CoverageFit itself is deployed to Production, but creating a subscription from Preview in this realm may affect real account events, historical data and automatic recovery. Prefer separate sandbox/test RingCentral credentials and a publicly accessible isolated webhook endpoint, or prepare a separately approved production-account canary plan. Do not change the existing production sender/subscriptions or blindly register an unreviewed Preview URL.

**Existing implementation:** `RINGCENTRAL_WEBHOOK_URL` must be a publicly reachable absolute HTTPS endpoint handled at `/api/sms/ringcentral/webhook`. The configured `RINGCENTRAL_WEBHOOK_VALIDATION_TOKEN` is an operator-generated **server secret used as RingCentral's developer validation token**, not the RingCentral JWT, producer access key or the provider's separate Verification-Token header. Never print token values. RingCentral validates new webhooks by pinging the URL and requiring a prompt HTTP 200 with echoed `Validation-Token`. Existing `handleRingCentralSubscription` is a **POST that may create/renew a real provider subscription and start history recovery**; do not invoke it from a read-only diagnosis.

**Next Phase 3B/3C actions:**
1. Run local deterministic security/regression checks for webhook validation, replay/idempotent inbound, STOP/CONTROL/ownership, missing/out-of-order history and no blind outbound retry.
2. Prepare **one operator decision**: isolated RingCentral sandbox/test account vs approved controlled production-account integration, webhook hostname/route and sender identity, current subscriptions collision review, whether history recovery needs to be disabled/bounded for an initial canary, rollback procedure, and Cloudflare Preview-only binding/secret plan.
3. After explicit approval, configure only the intended environment, redeploy, use read-only status to reconfirm the newly configured sender and webhook; then separately approve provider subscription POST and an operator-controlled SMS canary.
4. Until then: **NO SEND, NO SUBSCRIPTION MUTATION, NO SECRET CHANGE, NO PRODUCTION MERGE**, and no claim that live inbound sync is operational.

**Operator workload:** no further Cloudflare verification work requested until the single account/sender-route decision is resolved. Source: user's redacted Phase 3A status JSON in conversation, not independently observed external dashboard state.

---

## Phase 3A RingCentral no-send preflight prepared — 2026-10-12

**Current state:** Phase 2 Producer Action Quality hosted functional and desktop/mobile visual acceptance is operator-accepted. Phase 3 is ACTIVE. GitHub code audit confirms existing `handleRingCentralStatus`, `handleRingCentralSubscription`, `handleRingCentralWebhook`, `runRingCentralRecovery`, `sms-outbound-gateway` and safety/ownership code must be preserved, not reimplemented.

**New no-send engineering slice:** `scripts/phase3-ringcentral-readiness.mjs` projects a bounded, secret-free status from the existing authorized `GET /api/sms/ringcentral/status`; `tests/phase3-ringcentral-readiness.test.mjs` checks redaction, config gaps, sender/subscription mismatch, and unusable API status. The operator procedure and self-contained Chrome console GET snippet are in `docs/COVERAGEFIT-PHASE3-RINGCENTRAL-READONLY-CHECK-1.0.md`.

**What has NOT happened:** No Preview RingCentral account/status GET has yet been observed in this phase, no subscription renewal/creation, no provider recovery replay, no controlled sender/inbound canary, no real message, no Cloudflare provider/secret setting change, and no PR merge. Existing historical `sender_ready_webhook_unconfigured` is not today's status. The Phase 3A operator should check the **same immutable authenticated Preview** used for Phase 2, `ee3f966a.coveragefit.pages.dev`, and share only the sanitized report fields.

**Next**: obtain operator's read-only Phase 3A status snapshot, triage missing webhook/subscription/provider configuration; then run deterministic Phase 3B replay/STOP/ownership/recovery tests before asking for any provider writes or live canary.

---

## Phase 2 Producer Action Quality accepted; Phase 3 now active — 2026-10-12

**Decision:** Phase 2 **HOSTED-CERTIFIED (operator-attested Preview)** for the existing **Producer Action Quality** surface. The principal explicitly confirmed all remaining visual checks passed on the tested Preview: desktop layout, mobile viewport, correctly presented WHY NOW / DO / EVIDENCE, STOP and opt-out suppression, CONTROL isolation, and synthetic TEST exclusion. This closes the Phase 2 **functional/visual acceptance gate** and advances the program execution focus to Phase 3.

**Evidence chain:**
- Hosted immutable Preview: `https://ee3f966a.coveragefit.pages.dev/agent/workspace/`; tested deployment head `1bb773debb339b595e5b39a9f53f35ac0f1850a5` (the browser runner contained this expected head and Cloudflare's PR deployment notification identified `1bb773d` at this Preview). A constant embedded in the browser checker is not independent cryptographic proof of served content.
- Operator-run console checker: `COVERAGEFIT_PHASE2_RESULT` `status=PASS`, `passed=9`, `checked=9`, `failures=[]`, `authorization=401_verified`, `sends=0`; the intentionally unauthenticated API request returned HTTP 401.
- Nine scenarios: `ask_one_question`, `call`, `due_callback`, `due_appointment`, `stop`, `opt_out`, `control`, `test_excluded`, `tentative_calendar`; list/detail agreement and provenance were checked using fictional fixtures.
- Principal's visual acceptance: direct user attestation that **desktop, mobile, STOP, CONTROL and synthetic TEST exclusion passed**, October 12, 2026.
- D1 isolation is **operator-attested only** through the browser confirmation prompt and prior manual steps; database binding UUIDs have **not** been independently observed by ChatGPT. This evidentiary qualification remains in the release record.
- Full CI at PR #12 head before this note: `03e1a5355d7c3f7a99177d61fe45a9fcf2dbc36a` passed. New documentation revisions require separate exact-head checks.

**Scope of acceptance:** hosted **read-only producer decision display and governed interpretation** in the isolated Preview, *not* RingCentral inbound/outbound live delivery, provider webhook subscription, durable end-to-end customer conversion, external message approval, calendar/API writes, production database binding review, auth redesign, or district rollout. This decision **does not** authorize merging PR #7/#12 or changing flags/secrets/deployments in Production. The code remains on review branches until a separate integration and release decision.

**Phase 3 active — RINGCENTRAL-INBOUND + LEAD-TO-FOLLOW-UP-LOOP:** Continue the verified current code rather than reimplement transport. First obtain read-only provider/configuration/status evidence (without exposing credentials or customer information). Audit RingCentral `GET` status vs actual subscription, webhook validation and durable inbound projection. Then certify simulated duplicate/out-of-order messages, STOP and takeover, delivery acknowledgment, failure/timeout/reconciliation, commitments and AgencyZoom ownership. Only after separate explicit permission and proper Preview isolation should any subscription creation/renewal (`POST`), recovery replay (`POST`), controlled real operator SMS or live-config mutation be attempted. Capture one end-to-end trace:
`source intake → identity/consent/cohort → inbound/provider event → profile evidence → SIGNAL → Attention/Action Quality → producer-reviewed action → provider receipt → durable follow-up → verified outcome`.

**North Star priority:** maintain Today/Inbox/Approvals, Prospect 360/renewal, bulk acquisition and permissioned SMS SHADOW engineering as the agreed product target; don't pause safe parallel design. Actual autonomous sends remain off pending owner/provider approval and separate positive eligibility evidence.

**Next operator request:** None for the completed Phase 2 functional gate. Phase 3 should start with read-only inspection/tests and batch any genuinely consequential provider/configuration decisions into one approval packet.

---

## Phase 2 hosted acceptance: nine synthetic scenarios PASS — 2026-10-12

**Operator-supplied browser evidence (17:30 PDT):** In Chrome DevTools on immutable Cloudflare Pages Preview `https://ee3f966a.coveragefit.pages.dev/agent/workspace/`, the authenticated synthetic certification checker printed `COVERAGEFIT_PHASE2_RESULT` with `status: PASS`, `passed: 9`, `checked: 9`, `failures: []`, `sends: 0`. The browser displayed PASS for: `ask_one_question`, `call`, `due_callback`, `due_appointment`, `stop`, `opt_out`, `control`, `test_excluded`, and `tentative_calendar`.

**Auth boundary:** The browser's `401 Unauthorized` for an intentionally unauthenticated `GET /api/solo-desk/producer-work` is **expected** and the checker recorded `authorization: 401_verified`. This is evidence the route denied a request without the producer bearer credential, not an application failure.

**Provenance and deployment:** The run's embedded expected head was `1bb773debb339b595e5b39a9f53f35ac0f1850a5`, matching the then-reported PR #12 Cloudflare deployment on `ee3f966a.coveragefit.pages.dev`. The checker validated fixture source/run markers, fictional names, reserved test contacts, list/detail parity and positive Attention flag. Preview D1 isolation is **operator-attested** by the confirmation prompt, **not independently inspected by ChatGPT**; treat exact D1-binding UUID evidence separately.

**Scope limits:** This was GET-only browser API certification; the existing GET handlers can refresh internal Workspace projections. No outbound SMS, calendar writes, AgencyZoom writes or production activation was tested or authorized. The result does **not** certify RingCentral bidirectional live webhook/delivery, autonomous messages, purchased-lead outreach, or the proposed Today/Inbox/Bulk Approval UI.

**Remaining Phase 2 release gate:** Brief operator visual review of the existing `/agent/workspace/` Work UI on the **same immutable Preview URL** in desktop and mobile widths: WHY NOW / DO / EVIDENCE visible and readable; CALL / ASK_ONE_QUESTION / due actions correct; STOP/opt-out lack send controls, CONTROL has no SIGNAL guidance, TEST excluded; error/empty states, focus/navigation and manual/AI-OFF fallback. If the UI acceptance passes, Phase 2 **Action Quality hosted acceptance** may be marked complete with the operator-isolation qualification. Production merge/flag changes remain separately authorized. Next engineering gate: RingCentral inbound and lead-to-follow-up reliability, followed by approved Today/Inbox UI work.

**Record source:** User-provided screenshot of Chrome console PASS (9/9), October 12, 2026. Do not interpret a browser-side `deployed_commit_operator_verified` constant as a server-origin cryptographic attestation.

---

## Producer Command Center North Star locked — 2026-10-12

**Product-level decision approved by principal:** `docs/COVERAGEFIT-PRODUCER-COMMAND-CENTER-UX-1.0.md` now governs the intended user experience: Today, unified Inbox, efficient multi-message approval, Prospect 360 evidence memory, verified Renewal Intelligence and progressively automated engagement. **Bulk purchased-lead acquisition and permissioned automated SMS are core product requirements**, not optional or indefinitely deferred features. The project remains CoverageFit + SIGNAL; no new competing CRM or SMS sender is authorized.

**Practical engineering interpretation:** continue Phase 2 hosted Producer Action Quality gate and Phase 3 RingCentral inbound reliability. In parallel, allow bounded code/design/testing for purchaser/source lineage, consent/contact authority, import qualification, renewal capture, and no-send SHADOW messaging workflows. Minimize owner interruptions via automated classification and exception-only review. Separately certify provider route/TCR campaign requirements before any live messaging. RingCentral's published current SMS policy disallows purchased/third-party lead list SMS for its SMS solutions; do not assume lead-vendor opt-in bypasses sender restrictions, and do not obscure lead origin. Eligible first-party or otherwise actually authorized contact routes may be pursued under documented provider rules and agency approvals.

**Authority distinction:** This locks the product direction; it does **not** merge PRs, modify Cloudflare/D1 bindings, purchase lead lists, send texts, alter AgencyZoom campaign ownership, or expand production autonomous sending. Latest code state, hosted Preview environment isolation, consent records, sender approvals and performance economics still require independent verification.

---

## Producer Command Center 1.0 UX implementation proposal — 2026-10-12

A review-only design has been added at `docs/COVERAGEFIT-PRODUCER-COMMAND-CENTER-UX-1.0.md` in the active PR #12 development lane. It specifies Today, Inbox, multi-select **individually governed** SMS approvals, the Prospect 360 evidence/renewal substrate, mobile/desktop interactions, feature-flag sequence, and release gates. It reuses existing Producer Workspace, Opportunity/Attention/Action Quality, Signal Decision 2, consent/ownership and the current SMS gateway; **no new sender, production route, mutation endpoint or automation activation is implemented by this document**.

Important product decision for review: RingCentral US SMS policy prohibits purchased and third-party-generated lead lists for SMS, even where vendors assert opt-in. Buying/importing leads is distinct from documented recipient permission and sender/campaign authority; default unknown permission to NO_SEND for new selected approvals/automation. Batch approvals must recheck consent, source provenance, STOP, ownership and revisions independently for every item. These controls and user testing must be certified before external write authority expands.

**Execution order unchanged:** complete isolated Phase 2 Action Quality acceptance, certify inbound provider state, then build Today/Inbox as read-only and finally propose separately approved SMS batch writes. Prospect/renewal fact projection can proceed in parallel without provider authority expansion. Source of truth remains Master Roadmap 2.0 and current repository/provider evidence. This design is NOT live.

---

## Phase 2 Step 3 fixture package — 2026-10-12

**Code prepared, not remotely executed.** PR #12 now contains `scripts/prepare-producer-action-preview-fixtures.mjs` and `tests/producer-action-preview-fixtures.test.mjs`. The offline generator emits replay-safe INSERT-only SQL and a private manifest (schema 1.1) for nine controlled synthetic scenarios. It requires an explicit workspace ID and exact 40-character Preview deployment SHA; the SQL does not call providers, create real calendar events, or send communications.

**Validation:** The generated SQL was executed twice against real repository migrations in an in-memory SQLite integration test and the authentic `producerWorkspace` list/detail produced all nine expected certification outputs. GitHub CI on `2ffaf42e7d7164e9df7592c478268d12fd62d436` passed **497/497**, zero failures ([run 38313729386](https://github.com/dhays4sports/CoverageFit/actions/runs/38313729386)). Documentation commits afterward require fresh exact-head checks.

**Operator-only next step:** Use `docs/PRODUCER-ACTION-PREVIEW-FIXTURES-STEP3.md` to paste the generated SQL into the *verified isolated Preview D1 Console only*, checking database UUID and workspace ID first. Obtain a marker count of 9. The authenticated Preview acceptance runner remains **unexecuted against Cloudflare**, and Phase 2 remains **BLOCKED** until isolated hosted PASS plus UI review. A successful Cloudflare build or in-memory test does not substitute for D1-console insertion/certification. Do not ask ChatGPT to bypass Cloudflare's verification checkpoint.

---

## Phase 2 synthetic fixture-provenance gate — 2026-10-12

**Certification-tool safeguard added on PR #12, after the previous 488-test head:** The preview runner must not accept the manifest's `synthetic_only` declaration as evidence that an opportunity is synthetic. It now requires an explicit per-record `preview_cert_fixture_v1` source marker matching a `run_id` and scenario, a fictional contact name and test-only phone/email values. It additionally checks true TEST provenance for the excluded fixture and actual DISTRICT_CONTROL classification. Only immutable 8-hex Pages Preview hosts are accepted. Nine fixture detail records are provenance-checked before scanning the broader Work list.

**Validation:** Current runtime changes at `4bfc9c74a042932e626e41127e68b39022e6323e` passed **492/492** Node.js tests, with no failures ([GitHub run 38311795821](https://github.com/dhays4sports/CoverageFit/actions/runs/38311795821)). Subsequent documentation changes are not automatically covered by that historical exact head; consult the newest workflow run.

**Remaining blocker:** Independent Cloudflare D1 Preview/Production isolation verification and operator-controlled Preview fixture construction are still required before the runner's hosted acceptance can be claimed. The per-record marker is **not** cryptographic authorization or proof of isolation. `main` is unchanged; no live customer activity was performed. Follow `docs/COVERAGEFIT-PRODUCER-ACTION-QUALITY-1.0.md` for the manifest schema 1.1 and safe operator procedure.

---

## Phase 2 Preview acceptance automation — 2026-10-12

**Master Roadmap 2.0:** Phase 1 runtime integration and Phase 2 producer-decision certification remain the active lane. The canonical release checklist is `docs/COVERAGEFIT-SIGNAL-OPERATIONAL-GATES-1.0.md`; Producer Action Quality contract and hosted runner instructions are in `docs/COVERAGEFIT-PRODUCER-ACTION-QUALITY-1.0.md`.

**Latest independently reviewed evidence:**
- Draft PR #12 on `ops/producer-action-quality-parity-20261012` now includes `scripts/certify-producer-action-preview.mjs` and `tests/producer-action-preview-certification.test.mjs`; no second roadmap or separate test repository was created.
- The runner permits only Cloudflare Pages **Preview subdomains**, blocks redirects and changed/unverified deployment heads, requires explicit recorded Preview/Production D1 isolation, uses a producer credential supplied at execution time and never prints the token, verifies public denial (HTTP 401), and checks list/detail agreement on **nine synthetic-only scenarios**. It sends no SMS or external writes. Its authenticated GET endpoints may refresh internal projection/classification state; **isolation must be confirmed before running**.
- Exact runtime commit `eb09c66395d5b83651fe3967952ec49efef1444d` passed the Node 24 GitHub Actions suite **488 passed, 0 failed, 0 skipped** ([run 38309924317](https://github.com/dhays4sports/CoverageFit/actions/runs/38309924317)).
- GitHub's Cloudflare Pages PR comment reports a successful immutable Preview deployment for `eb09c66`: `https://d3c3521f.coveragefit.pages.dev`. This is deployment-event evidence **only**, not authenticated environment/configuration certification.

**Blocking operator evidence:** current Preview D1 database identifier and Production D1 identifier are independently verified distinct, actual Preview flags are known, appropriate synthetic noncustomer fixture IDs exist, and the authenticated acceptance runner plus browser keyboard/mobile review complete on the exact deployed SHA. Neither the assistant's public web access nor the available connected tools can inspect those private Cloudflare settings or establish a logged-in browser session. No customer data, real messages, production configuration or live control cohorts were used here.

**Next action:** Complete isolated Cloudflare Preview verification and one certified run of the existing script against nine controlled fixture identities; capture only its redacted PASS/NO_GO evidence and manual UI checks. If blocked, report the missing condition explicitly and do not attempt unsafe production fallbacks. Then return to Phase 3 RingCentral inbound/lead-to-follow-up certification. PR #12 remains draft and unmerged until release authority is separately granted.

---

## Master Roadmap 2.0 execution handoff — 2026-10-12

**Canonical plan:** [docs/COVERAGEFIT-NEAR-TERM-PRODUCER-ROADMAP-1.0.md](COVERAGEFIT-NEAR-TERM-PRODUCER-ROADMAP-1.0.md), see **Executive execution map — CoverageFit + SIGNAL Master Roadmap 2.0 (2026-10-12)** at the top. It is the approved reference for phase order; later architectural detail in that same file remains valid unless explicitly reconciled. Do not create a separate competing roadmap.

**Current release lane:** Phase 1 consolidation -> Phase 2 hosted Producer Action Quality certification -> Phase 3 lead/communication/commitment reliability -> Phase 4 daily producer dogfood -> Phase 5 SIGNAL economics -> conditional Phase 6 scale and Phase 7 enrichment.

- Production `main` last verified at `5f47f2b7367110ca04ff03cc189983f136ab32fa`, unchanged on the 2026-10-12 audit. Recheck before any integration.
- Draft PR #7 `signal-copilot` at `ad2915a7889637580505293ce38ab4db66f0a9b3` supplies current Copilot/Attention/Action Quality, including already reconciled district-promotion CAS safety.
- Draft PR #12 is stacked on #7, at least through **runtime head `83a6bd1faaed94a8aba57623711e8500eaf9c864`**, where Node 24 full CI passed **475/475**, 0 failed, 0 skipped ([run 38307468735](https://github.com/dhays4sports/CoverageFit/actions/runs/38307468735)). Its later roadmap documentation commits are **not** automatically included in that historical test claim.
- Draft PR #11 on `main` is retained as a historical duplicate: its operational certification checklist has now been incorporated into PR #12 as `docs/COVERAGEFIT-SIGNAL-OPERATIONAL-GATES-1.0.md`, and its seven-day assertion was already corrected on PR #7. Do **not** merge PR #11 separately.
- Draft PR #8 is an old stacked base. The read-only Commitment and Attention portions have been ported/reconciled into #7; calendar write surfaces remain separately gated.
- Draft PR #9 is a separate off-by-default producer email notification integration; PR #10 is isolated Desktop Copilot, not critical path.
- GitHub-only review has **not** certified the newest code in Cloudflare hosted isolated Preview, current RingCentral inbound subscription, production flags/bindings, or real producer economics. Remain **NO-GO** for live activation/district rollout.
- Approved seven-day fresh lead window, AgencyZoom cadence ownership, explicit-send review, CONTROL/STOP suppression, and producer attention budget remain mandatory.

**Resume instruction:** Check current refs and exact hosted/config state; read the canonical executive roadmap; execute the earliest unmet certification gate. Do not confuse a green suite with a deployed, production-authorized loop.

---

## Desktop Copilot parallel-coordination audit — 2026-10-08

CoverageFit canonical development continues on draft PR #7 / `signal-copilot`. The separate Desktop Copilot initiative is visible as draft PR #10 on `feature/coveragefit-desktop-copilot-1.0`.

Current overlap audit:
- PR #10 is isolated under `apps/desktop-copilot/`, its desktop workflow, and desktop-specific documentation;
- it does not modify Producer Action Quality, Attention, Producer Workspace, AgencyZoom import, RingCentral/SMS authority, or CoverageFit business-state modules;
- its gateway reuses the existing constant-time bearer helper with a separate desktop-scoped token, but it does not currently call CoverageFit CRM/Producer Work routes;
- it explicitly does not accept verified lead links or governed actions yet.

CoverageFit integration-readiness is documented at:
`docs/COVERAGEFIT-DESKTOP-COPILOT-INTEGRATION-READINESS-1.0.md`.

Assessment outcome:
- do not add a Desktop integration API yet;
- current `producer-work` / `producer-detail` demonstrate the required intelligence but are internal UI contracts, not appropriately minimized/versioned external contracts;
- Producer Action Quality is the correct future authoritative intelligence primitive;
- future integration still needs scoped/revocable auth, a minimized versioned context envelope, normalized contact-safety reasons, and a unified context freshness token;
- screenshot/model observations must remain separate from verified CoverageFit evidence;
- Desktop must never independently reconcile Attention, Signal Decision 2, Opportunity Priority, Commitments and NBA.

Producer Action Quality remains Priority 1. Hosted Preview certification of ASK_ONE_QUESTION, CALL, due commitment and STOP/suppressed remains the next operator gate.

Fresh CI at head `01388a4269c528e492fd3974d85883520bacbbde`: **463 passed, 0 failed, 0 skipped**.

## Producer Action Quality 1.0 started — 2026-10-08

The current branch now contains the first deterministic reconciliation layer for producer action quality.

Audit conclusion:
- Attention owns **why now**;
- Signal Decision 2 owns the current governed SMS disposition;
- Opportunity Priority owns scarce-attention allocation from Need / Intent / Timing / Fit;
- Commitments own recorded obligations/timing;
- NBA owns broad opportunity-level next action;
- before this slice, these could all be individually valid but still leave the producer to resolve conflicts manually.

New module:
- `server/producer-action-quality.mjs`
- canonical doc: `docs/COVERAGEFIT-PRODUCER-ACTION-QUALITY-1.0.md`

The projection returns:
- **Why now**
- **Exact action**
- **Supporting evidence**
- explicit precedence used to resolve collisions.

Current precedence:
1. contact safety;
2. Signal STOP / CLOSE / LATER;
3. due/overdue confirmed commitment;
4. current Signal Decision 2;
5. upcoming confirmed commitment;
6. NBA.

Opportunity Priority remains supporting evidence unless consumed by Attention/NBA. It never directly grants contact authority.

Producer Work list/detail now expose the projection behind the existing Attention gate. Actionable rows render:
- Why now;
- Do;
- Evidence.

Important collision discovered during integration:
- a fixture produced Attention NOW from an explicit call request while the current Signal Decision 2 remained ASK_ONE_QUESTION;
- the reconciliation correctly kept **ASK_ONE_QUESTION** as the exact action rather than silently converting urgency into CALL;
- the test was corrected; runtime precedence was not weakened.

Fresh CI at head `f38dab62b31be43a5a2a4aa5f08bf2aa8e498a26`: **463 passed, 0 failed, 0 skipped**.

Next gate: isolated Preview certification of list/detail consistency for ASK_ONE_QUESTION, CALL, due commitment and STOP/suppressed cases. No new AgencyZoom write, calendar write, autonomous send or provider authority is introduced by this slice.

## Attention Preview certification complete enough for operational gate — 2026-10-07

Hosted Preview certification now proves the intended producer-attention boundaries:
- 100 TEST rehearsal records are excluded from normal Producer Work;
- legacy synthetic NEW_LEAD QA fixtures are excluded by durable `pilot.synthetic=true` provenance, not by display name;
- generic NORMAL fallback remains non-actionable;
- CONTROL receives no Attention guidance;
- deterministic canaries cover NOW, TODAY, HIGH, SUPPRESSED and CONTROL precedence;
- a fresh unanswered inbound outranks HIGH and correctly becomes NOW;
- suppression/STOP is non-actionable.

The previous hosted inventory result before the legacy synthetic exclusion was `total=1`, `NORMAL=1`, `actionable=0`; that remaining record was confirmed by direct detail to carry `pilot.synthetic=true`.

Fresh CI at head `8150103c204403db5737723b1fd24afb750ccb69`: **454 passed, 0 failed, 0 skipped**.

Next hosted checkpoint: deploy this head with `CF_ATTENTION_ENABLED=1` and verify normal Producer Work returns zero synthetic QA/test records. If clean, the Attention feature can remain Preview-enabled while the next roadmap work focuses on real operational evidence and producer action quality.

## Attention certification tightened: TEST inventory excluded — 2026-10-07

Hosted Preview showed the corrected Attention model with 100 synthetic rehearsal records carrying no guidance, but they still cluttered Producer Work. That is now resolved.

Normal Producer Work now:
- excludes `pilot_phase: TEST` / `is_test: true` records from list totals, counts and ranking;
- reports `test_excluded` so the exclusion remains visible and auditable;
- keeps direct record detail and intake receipts/evidence available for TEST records;
- keeps fallback `NORMAL — Review current evidence` non-actionable unless stronger work evidence exists.

This preserves the product distinction between audit/test evidence and operational producer work. Synthetic rehearsal records cannot consume producer attention merely by existing.

Fresh CI at head `6867613072ca87811be5c1444e7da11c702cfdf6`: **452 passed, 0 failed, 0 skipped**.

Next hosted checkpoint: deploy this head with `CF_ATTENTION_ENABLED=1` and re-run Producer Work. Expected result is approximately the real non-test inventory only, with the 100 rehearsal records excluded from `total` and `top_10`.

## Producer Attention surfaced in Workspace — 2026-10-07

The deterministic Attention layer is now surfaced in `/agent/workspace/` behind the existing default-off `CF_ATTENTION_ENABLED=1` gate.

When enabled, Producer Work now exposes:
- aggregate Attention bands for the current result set: NOW, TODAY, HIGH, UPCOMING, WAITING, NORMAL and SUPPRESSED;
- actionable count;
- Recommended, High intent, Due now, Newest and Baseline sorts;
- the evidence-backed Attention reason directly on each work row;
- the same Attention reason in opportunity detail.

Safety/governance remains unchanged:
- DISTRICT_CONTROL receives no Attention guidance;
- STOP, opt-out, wrong-number and suppression states remain non-actionable;
- Attention is deterministic orchestration, not contact permission or bind probability;
- AgencyZoom remains CRM authority and no stage is written by Attention;
- the feature remains default-off until hosted Preview certification.

Fresh CI at runtime head `b9ae9bb2ebf36ec7af23b2120b8ce4201c2eecf9`: **447 passed, 0 failed, 0 skipped**.

Next hosted checkpoint: deploy the current branch to isolated Preview with `CF_ATTENTION_ENABLED=1`, load Producer Work, verify summary/sorting/reasons against real Preview inventory, and confirm CONTROL and suppressed records never receive actionable guidance.

## RAW Import switched to resumable chunking — 2026-10-07

Hosted certification is complete enough to make the ingestion architecture decision.

Observed failure mode:
- 100-row synchronous preview succeeded;
- 100-row synchronous commit returned 503 after **30 rows had already committed**;
- lightweight status proved the exact partial state: 30 present, 70 missing.

Hosted recovery:
- rows 30–39: 10/10 imported, 0 duplicates, 0 review exceptions, 0 SMS, 1,581 ms total / 933 ms preparation;
- subsequent 10-row chunks advanced imported TEST rows to 50, 60, 70, 80, 90 and 100;
- final status: `complete=true`, `next_missing=null`, no missing ordinals.

The normal Import UI has now been migrated from `raw-import` one-shot writes to resumable 10-row `raw-import-chunk` writes. On a transient failure, the UI stops at the current chunk and presents **Resume import**; replaying that chunk safely deduplicates any rows that committed before failure.

Chunk processing also now:
- persists true review exceptions;
- reports actual batch-imported count from attribution evidence;
- writes durable per-chunk receipts;
- finalizes a durable batch receipt on the last chunk.

Fresh CI at runtime head `818742a38581333e86c439b47a79f6fd76550137`: **446 passed, 0 failed, 0 skipped**.

The old one-shot endpoint remains available for compatibility/small internal callers, but it is no longer the intended UI path for normal multi-row RAW imports.

## Resumable raw intake after hosted partial commit — 2026-10-07

Hosted certification proved that a 100-row synchronous write is not an acceptable ingestion primitive: the original synthetic commit returned HTTP 503 after **30 of 100 TEST rows** had already committed (18 SIGNAL / 12 CONTROL assignments). Stable source identity made the partial write recoverable and observable.

The active branch now contains a resumable chunk path:
- `commitChunk` commits a bounded 1–20-row slice; certification uses 10 rows;
- preparation limits database ownership/duplicate checks to the active slice while still parsing/validating the exact source batch;
- each chunk persists a receipt with start, limit, next start, timing and result counts;
- replaying an already committed chunk resolves to duplicates rather than duplicate opportunities;
- synthetic rehearsal status reports exact present/missing ordinals and the next missing row;
- TEST rehearsal rows skip Opportunity Priority refresh, avoiding production-only projection work during throughput certification;
- `/api/solo-desk/raw-rehearsal` supports `commit_chunk` for Preview certification;
- generic `/api/solo-desk/raw-import-chunk` is present for the later production UI migration, but the existing Import UI has not yet been switched from one-shot commit.

Fresh CI at branch head `55b8b52df522bbe1ecf269c762c77530955ef23e`: **444 passed, 0 failed, 0 skipped**.

Next hosted checkpoint: deploy this head to isolated Preview, re-read the original failed batch, then resume only missing ordinals in 10-row chunks. Do not retry the old 100-row one-shot commit.

## 100-row intake rehearsal readiness — 2026-10-07

A default-off hosted certification path now exists for the current RAW intake architecture.

- `syntheticRawRehearsalBatch` generates exactly 100 deterministic synthetic records using reserved 202-555-0100 through 0199 numbers.
- `/api/solo-desk/raw-rehearsal` is unavailable unless `CF_RAW_SYNTHETIC_REHEARSAL_ENABLED=1`.
- The endpoint uses the real importer with `synthetic:true`, requires producer authentication/same-origin mutation controls, creates TEST rather than real pilot inventory and sends zero SMS.
- CI now includes an end-to-end 100-row synthetic importer rehearsal.
- Latest full suite: **442 passed, 0 failed, 0 skipped**.
- The 100-row in-memory rehearsal test itself completed in approximately **124 ms**. This is not hosted D1 latency.
- Both push and PR CI paths passed on the rehearsal implementation.

Hosted Preview measurement remains the next operator checkpoint. Canonical steps are in `docs/RAW-LEAD-HOSTED-CERTIFICATION-1.0.md`.

Do not increase the synchronous row limit until Preview records `preview_duration_ms` and `import_duration_ms` for the 100-row canary.

## Durable intake exception queue update — 2026-10-07

RAW-LEAD-INTAKE Slice B is now implemented on the active branch.

After a confirmed import:
- CoverageFit writes a durable batch receipt with imported/duplicate/review/pilot/SMS-link counts;
- true review exceptions are persisted separately as bounded exception records;
- exception records support OPEN, DEFERRED and RESOLVED dispositions;
- the Import UI loads unresolved exceptions independently from successful rows;
- recent batch receipts remain visible;
- exception persistence intentionally excludes raw CSV bodies and phone values;
- successful/duplicate rows do not become unresolved exception work.

Slice C instrumentation is also present: preview responses expose `preview_duration_ms`, and receipts persist `prepare_duration_ms` plus total `import_duration_ms`. These measurements are intended for hosted 100-row timing before any batch-size increase.

CI was strengthened with explicit syntax checks for critical importer/workspace/API modules. A syntax regression introduced during this slice was caught by CI and corrected before hosted certification. The corrected branch push suite passed **441/441**, and the initially scheduler-sensitive PR concurrency test passed on rerun **441/441**. No runtime concurrency guard was weakened.

No production configuration, customer send, AgencyZoom write, calendar write or schema migration was enabled by this slice.

## Fresh full-suite certification — 2026-10-07

GitHub Actions now runs the repository's full Node test suite on every push / pull request using Node 24.

Current active branch head at certification: `a77e1429a2fc757429469e8bc3cc770a64fc26be`.

Fresh CI result:

**440 passed, 0 failed, 0 skipped**  
Duration reported by Node test runner: approximately **2.18 seconds**.

The first CI attempt failed before tests because Node 22 did not support the historical `--test-isolation=none` option. CI was corrected to Node 24; both the push and pull-request runs then completed successfully.

This fresh suite includes the recent:
- Producer OS promotion race-safety reconciliation;
- Commitment/Attention foundations and current-head read-only workspace integration tests;
- raw intake machine-triage tests;
- audited CONTROL-enrollment-pause test;
- current Copilot/RingCentral/SMS safety regressions.

This is repository test certification, not hosted Cloudflare behavior certification. Hosted CONTROL/OTHER/wrong-number denial checks, current environment matrix review and Preview inbound-webhook certification remain separate gates.

## Raw lead intake / triage update — 2026-10-07

The first RAW-LEAD-INTAKE-1.0 slice is now implemented on the active branch.

New behavior:
- deterministic preview triage separates READY, READY_NO_SMS, SAFE_HOLD, DUPLICATE and true review exceptions;
- review exceptions are classified into identity, schema, time, bounded-field and other buckets;
- the Import UI leads with true exceptions and collapses validated/held/duplicate rows;
- preview returns aggregate triage counts so producer attention is measured in exceptions rather than total rows;
- a default-off `CF_DISTRICT_CONTROL_ENROLLMENT_PAUSED` capability can route newly eligible deterministic CONTROL assignments to operational SIGNAL while preserving `assignment_cohort` and an explicit override reason for audit;
- historical CONTROL records are not relabeled;
- import still sends zero SMS.

The synchronous 100-lead batch limit remains intentionally unchanged until hosted latency is measured. Higher throughput should be achieved without creating timeout/retry ambiguity.

Canonical intake contract: `docs/RAW-LEAD-INTAKE-1.0.md`.

Fresh full-suite execution is still outstanding. GitHub currently exposes no Actions/check run for the active PR head, and the local container cannot reach GitHub to clone the repository; therefore no new test-pass count is claimed.

## Security/data gate update — 2026-10-07

A current-source security review has been formalized in `docs/COVERAGEFIT-SECURITY-DATA-GATE-1.0.md`.

Key conclusion: existing RingCentral/Copilot/action code has meaningful fail-closed controls, but producer authentication is still a single long-lived bearer key stored in browser `sessionStorage`. This remains acceptable only for the bounded single-producer Preview/early-production phase. Multi-producer access or materially broader external-write authority is now gated on per-user/short-lived session authentication and stronger browser-session controls.

The review also records required gates for:
- current-tree environment inventory and Preview/Production matrix;
- runtime secret-exposure review;
- Producer Workspace CSP/browser hardening;
- RingCentral inbound webhook/subscription security;
- platform-wide retention classes;
- AgencyZoom write-integrity/reconciliation;
- fresh full-suite evidence.

The source-only environment inventory generator has been ported to the active branch at `scripts/environment-contract-inventory.py`. No deployed secret values were read or stored.

Development may continue on read-only intelligence, governed raw-lead ingestion, durable evidence and Attention while these gates are completed. New multi-user identity authority and broader external writes remain deferred.

## Read-only Attention integration update — 2026-10-07

The active `signal-copilot` branch now contains the standalone Commitment Projection and deterministic Attention Priority foundation from PR #8, plus a **surgical current-head Producer Workspace integration** behind `CF_ATTENTION_ENABLED=1`.

The integration was reimplemented against the current Copilot branch instead of copying PR #8's stale workspace wholesale. When the flag is absent/off, baseline Work sorting and behavior remain unchanged. When enabled, the workspace may return read-only commitments, Attention projections and optional sorts (`recommended`, `high_intent`, `due_now`, `newest`). DISTRICT_CONTROL receives no Attention guidance. Suppression checks include opt-out, STOP, wrong-number and explicit opt-out facts.

No calendar mutation, Google write, AgencyZoom write, customer message, migration or production flag was enabled.

Regression coverage was added for the default-off behavior, CONTROL exclusion and invalid sort rejection. These tests have **not yet been freshly executed on the current full tree**; full-suite certification remains a Phase 0 gate.

## PR #8 reconciliation update — 2026-10-07

The remaining PR #8 work has been triaged rather than merged wholesale.

**Ported now:** standalone read-only `commitment-projection.mjs`, deterministic `attention-priority.mjs`, and their regression tests.

**Reimplement against current head:** Producer Workspace integration for commitments/Attention. The old PR #8 workspace is stale relative to the hosted-certified Copilot branch and contains integration assumptions that should not overwrite current behavior.

**Deferred:** calendar mutation/UI and related external Google write paths until read-only Attention/Commitment integration is clean and the AgencyZoom/data-governance authority gate is satisfied.

**Regenerate:** environment-contract inventory from the current tree; do not treat PR #8's generated inventory as current evidence.

No new production flag, migration, customer action, AgencyZoom write or calendar action was enabled by this reconciliation.

## Phase 0 stabilization update — 2026-10-07

PR #6's unique district-promotion race-safety behavior has now been reconciled into the active `signal-copilot` branch rather than leaving it stranded on a divergent PR.

Reconciled behavior:
- promotion preview fingerprints the exact source snapshot;
- each promotion attempt gets an operation ID;
- dependent activity/SMS ownership writes execute only if the exact compare-and-swap promotion succeeded;
- a lost compare-and-swap returns `SKIPPED_CHANGED` without ownership, audit or priority side effects;
- transaction failure remains fail-closed;
- regression coverage for SIGNAL and CONTROL promotion, stale evidence, lost compare-and-swap and rollback has been added;
- the Producer OS foundation architecture reference is now present on the active branch.

This is source reconciliation, **not fresh full-suite certification**. Historical PR #8 evidence showed these regressions passing in its older stacked tree, but the current PR #7 head still requires a fresh complete test run after all recent Copilot and documentation changes.

Next Phase 0 work: audit the remaining unique PR #8 commitment/attention/calendar changes against the now-current PR #7 tree; port only compatible increments; complete hosted denial/security checks; then obtain fresh full-suite evidence before merge/production authority changes.

## Roadmap direction override — 2026-10-07

CoverageFit's near-term strategy is now: **intelligence and attention operating layer first; CRM replacement only if earned later.**

AgencyZoom remains the current CRM authority where agency workflows depend on it. CoverageFit must not silently become a second conflicting CRM. New CRM-like authority is gated by `docs/AGENCYZOOM-COEXISTENCE-DATA-GOVERNANCE-1.0.md`.

Forward sequence:
1. finish Phase 0 stabilization and hosted safety;
2. reconcile Producer OS foundation with current Copilot/commitment work;
3. complete AgencyZoom coexistence and data-governance rules before new CRM-like writes;
4. improve raw-lead intake and evidence normalization;
5. build durable conversation state and commitments;
6. build Attention Priority / Recommended / High Intent / Due Now;
7. expose calendar actions and connect them to commitments/attention;
8. certify RingCentral inbound webhook/subscription handling;
9. add call intelligence;
10. expand governed document/visual evidence and Producer Context;
11. mature Signal and bounded producer-approved actions.

Operational North Star: **turn a large pile of raw leads into a very small number of things the producer actually needs to do.**

Existing CONTROL history and cohort capability are preserved. New CONTROL enrollment may be reduced or paused during production crunch; historical records are not retroactively relabeled.

## Current certification override — 2026-10-06

Latest audited PR #7 head: `640285435fc0dd166c3f220c318fed82514db9ea`; still draft/unmerged. Main remains `5f47f2b7367110ca04ff03cc189983f136ab32fa`. This override supersedes older hosted-certification summaries below.

Hosted Preview certification materially advanced on isolated `coveragefit-signal-preview` using synthetic opportunity `copilot-preview-qa-001` and an operator-controlled mobile recipient only. The following are now operator-proven in hosted Preview: real OpenAI Suggest generation; bounded validation and safe diagnostics; Use This selection; pending-draft persistence; stale approval rejection after source evidence change; explicit one-send approval; actual RingCentral SMS receipt on the operator-controlled phone; and duplicate/replayed approval rejection with HTTP 409 and no second send.

The hosted 409 investigation produced bounded fixes without weakening authority: resilient Copilot usage metrics, safe validation-field diagnostics, normalized literal evidence matching, canonical boolean normalization, redundant-known-fact suppression, and deterministic Copilot version advances through `SIGNAL-COPILOT-1.0.4`. Historical failed request records were preserved.

RingCentral outbound Preview configuration is now verified with a JWT belonging to the authenticated producer extension: `outboundConfigured=true`, configured from-number found, `SmsSender=true`, and `senderReady=true`. A controlled outbound SMS from +1 *** *** 6377 to the operator-controlled test phone was received. A replay of the consumed approval was rejected with 409 and produced no duplicate message.

Preview RingCentral webhook configuration remains intentionally incomplete: `RINGCENTRAL_WEBHOOK_URL` and `RINGCENTRAL_WEBHOOK_VALIDATION_TOKEN` are absent, so inbound subscription/webhook readiness is not certified. Production configuration, production AI, customer messaging, AgencyZoom automation and main remain unchanged.

Remaining Phase 0 hosted/safety work: direct authenticated denial checks for CONTROL/OTHER/unsupported populations and held/wrong-number states; full runtime secret-exposure review; fresh full-suite test evidence; PR #6/#7/#8 reconciliation; canonical roadmap/current-state cleanup. Do not treat the successful synthetic send as production rollout authorization.

## Current certification override — 2026-10-05 16:22 PDT

Latest audited PR #7 head: `9ef8c793d4c8ee9c8c3a22c703f3da98cfbe854b`; still draft/unmerged. Main remains `5f47f2b7367110ca04ff03cc189983f136ab32fa`. This documentation update changes no runtime code.

Operator-tested preview is `f1777403.coveragefit.pages.dev` with isolated `coveragefit-signal-preview`. Generation, revision, Use This/save/reload, stale-selection rejection, basic mobile/focus, STOP/suppression/opt-out UI checks and synthetic fixture restoration are confirmed. Real-provider sample: four completed requests and one unsupported_evidence rejection; successful average 8.896s; total estimated cost of five usage-bearing rows $0.009522. Not provider billing or a broad quality certification.

CONTROL hosted testing was explicitly deferred. Hosted direct API/unsupported-population enforcement, explicit controlled SMS delivery/duplicate-send/stale-approval checks, full runtime secret-exposure review and final full-suite rerun remain outstanding. PR #7 is not certified for production AI or merge. No production changes or real customer messages. Full evidence and limitations: latest section of `docs/SIGNAL-COPILOT-1.0.md`.

Cloudflare is a manual operator checkpoint. Do not repeat inaccessible dashboard login attempts. Preview CF_SMS_SIGNAL_ENABLED=1 enabled the existing draft path; this is not itself a sandbox transport. No RingCentral credentials were added for certification. Historical sections below describe earlier snapshots; this override controls current Copilot readiness.


**Document:** COVERAGEFIT-CURRENT-STATE  
**Status:** Canonical operational handoff for active development  
**Last audited:** 2026-10-05 (preview follow-up; historical repository inventory below retains its dates)  
**Repository:** dhays4sports/CoverageFit  
**Canonical working branch for this document:** signal-copilot

## How to use this document

This file exists to prevent CoverageFit development from fragmenting across multiple ChatGPT threads.

For any future CoverageFit architecture, implementation, Cloudflare, deployment, Signal, SMS, calendar, importer, Producer OS, or Copilot work:

1. Read this file first.
2. Re-audit the repository before making a material change.
3. Treat the repository and deployed configuration as higher authority than chat memory.
4. Update this file when branch state, deployment state, roadmap order, blockers, or operating assumptions materially change.
5. Do not create a competing "current state" document.
6. Do not trust stale SHAs, preview URLs, test counts, or environment assumptions from older conversations.

Source-of-truth order:

**current repository / provider configuration → this document → canonical roadmap docs → chat context**

This file is a handoff, not a substitute for verification.

---


## Preview certification update — 2026-10-05

This update supersedes older preview-access blockers above; it does not certify live activation.
- Operator confirmed Preview COVERAGEFIT_DB -> coveragefit-signal-preview, separate from production; initial empty application schema bootstrapped with final CREATE-only DDL. Operator counts: 51 application tables, 53 explicit application indexes. Counts are not full schema equivalence certification. No production migration/reset.
- Preview producer access now works at da1f721a.coveragefit.pages.dev. Earlier branch alias returned inbox_not_configured. Alias routing/configuration discrepancy remains unresolved; use exact successful deployment URLs.
- Synthetic copilot-preview-qa-001 created without phone/email. OTHER detail loaded with AI off. Synthetic district_pilot_v1 NEW_LEAD SIGNAL source and synthetic transcript then attached in isolated preview only.
- Operator confirmed basic workspace layout at 320/375/390/430px and Tab focus/Enter disclosure behavior. Copilot controls, screen-reader and full accessibility certification remain outstanding.
- Operator confirmed manual Save edit persisted across refresh with AI off at da1f721a. This is not SMS delivery certification.
- At 7f06eefe.coveragefit.pages.dev, AI flags on exposed Copilot for synthetic SIGNAL. Screenshot also shows SMS sending OFF; runtime SMS flag parity across deployments remains unresolved.
- First provider canary failed. D1 screenshot shows TWO failed request records: ai_unavailable, gpt-5-mini, 522ms and 1744ms, estimated_cost_usd null, reserved_usd 0.0115 each. These are failed-attempt elapsed times and conservative reservations, not successful model latency or measured billed cost.
- No automatic retries or real customer SMS. Do not repeat paid attempts before diagnosis. Existing records must remain intact.
- Diagnostic fix preserves allowlisted provider error codes and HTTP statuses in request telemetry. Provider bodies/messages/headers and secrets are never retained by this diagnostic change. Rate-limit failures no longer collapse to ai_unavailable.
- Validation: 11 targeted provider diagnostic tests passed, 0 failed, 0 skipped; modified service passes syntax check. Historical full suite was NOT rerun for this patch.
- PR #7 remains draft/unmerged. PR #8 is stacked separately; this patch does not update that branch. Production AI remains unapproved. Hosted suppression/CONTROL/unsupported population tests with AI on, stale draft, selection/revision and controlled transport approval remain outstanding.
- Preview operator settings: CF_AI_PROVIDER=openai; CF_AI_MONTHLY_BUDGET_USD=1; CF_AI_REQUEST_TIMEOUT_MS=15000; NORMAL_REASON gpt-5-mini input/output per million .25/2, reasoning low; server-only OPENAI_API_KEY saved privately. No RingCentral credentials added. Flags/settings were operator-managed, not independently enumerated from runtime.

## 1. Canonical repository state

### Main

Current audited main SHA:

**5f47f2b7367110ca04ff03cc189983f136ab32fa**

Commit:

**Clarify imported-lead promotion helper**

At the time of this audit, recent repository history shows no newer commit on main.

### Open PR #6 — Producer OS foundation

PR:

**#6 — Producer OS foundation: make district promotions race-safe**

Branch:

**producer-os-foundation**

Head:

**c315d42dbbfb6363fc282eeadb05c2a90c76bbe9**

Base:

**main @ 5f47f2b7367110ca04ff03cc189983f136ab32fa**

Status:

- open;
- draft;
- unmerged;
- mergeable;
- one commit ahead of the shared base.

Primary purpose:

- harden district imported-lead promotion race safety;
- prevent dependent audit / SMS ownership writes after a lost compare-and-swap;
- bind preview approval to the exact source snapshot;
- preserve seven-day eligibility;
- preserve deterministic cohort assignment;
- preserve no-send behavior;
- document Producer OS foundation / migration boundaries.

Recorded test evidence on PR #6:

**333 passed, 0 failed, 0 skipped**

This is historical PR evidence, not a claim that the suite was rerun today.

Cloudflare branch preview last observed successful:

**producer-os-foundation.coveragefit.pages.dev**

Latest deployment commit observed:

**c315d42**

### Open PR #7 — Signal Copilot

PR:

**#7 — Add default-off Signal reply copilot with bounded AI usage**

Branch:

**signal-copilot**

Head:

**c08721d304685d01fe82c3429de07c4d0771ba6a**

Base:

**main @ 5f47f2b7367110ca04ff03cc189983f136ab32fa**

Status:

- open;
- draft;
- unmerged;
- mergeable.

Primary runtime purpose:

- review-first Signal SMS Copilot;
- producer-triggered Suggest;
- natural-language producer direction;
- revised suggestion;
- Use This / draft selection;
- existing explicit Approve & Send remains the only SMS transport authority;
- bounded OpenAI provider adapter;
- structured output;
- stale-context protection;
- budget / rate / telemetry controls;
- CONTROL / STOP / DNC / unsafe-owner isolation.

Primary documentation purpose now also includes:

- Producer Copilot roadmap;
- near-term Producer OS roadmap;
- Attention Priority;
- Commitments;
- Calendar Actions.

Recorded latest full-suite evidence before subsequent documentation-only commits:

**376 passed, 0 failed, 0 skipped**
**48 Copilot tests**

Do not report this as a newly rerun suite unless tests are actually rerun.

Cloudflare branch preview last observed successful:

**signal-copilot.coveragefit.pages.dev**

Latest deployment commit observed:

**c08721d**

Latest immutable preview observed:

**946ea9e8.coveragefit.pages.dev**

The Cloudflare bot reported that exact branch head deployed successfully.

---

## 2. PR #6 / PR #7 relationship

The two PRs share base:

**5f47f2b7367110ca04ff03cc189983f136ab32fa**

Current comparison:

- status: **diverged**
- signal-copilot is **9 commits ahead** of producer-os-foundation;
- signal-copilot is **1 commit behind** producer-os-foundation.

Interpretation:

PR #7 contains substantially more recent Copilot / roadmap work but does not contain PR #6's unique Producer OS promotion-race-safety commit.

Do not mechanically merge branches.

Before integration:

- inspect the unique PR #6 changes;
- preserve its transactional / compare-and-swap guarantees;
- reconcile them deliberately with the latest working branch;
- rerun the full suite.

---

## 3. Canonical product / roadmap documents

The current producer-side roadmap is defined by:

- **COVERAGEFIT_NORTH_STAR.md**
- **docs/COVERAGEFIT-PRODUCER-COPILOT-ROADMAP-1.0.md**
- **docs/COVERAGEFIT-NEAR-TERM-PRODUCER-ROADMAP-1.0.md**
- **docs/SIGNAL-COPILOT-1.0.md**

PR #6 also contains:

- **docs/COVERAGEFIT_PRODUCER_OS.md**

Do not create another competing roadmap unless replacing one of these explicitly.

### Current approved near-term sequence

1. SIGNAL-COPILOT-1.0 certification
2. Producer OS foundation alignment
3. SIGNAL-COPILOT-1.1 — durable conversation state + commitments
4. SIGNAL-ATTENTION-1.0 — Recommended / High Intent / Due Now
5. CALENDAR-ACTIONS-1.0 — create / invite / reschedule / cancel
6. Attention + Calendar convergence
7. SIGNAL-COPILOT-1.2 — call intelligence
8. Visual Copilot
9. Document Copilot
10. PRODUCER-CONTEXT-1.0
11. Mature Signal
12. PRODUCER-ACTION-1.0

Do not skip directly into later AI capabilities while the operating primitives remain incomplete.

---

## 4. Producer OS architecture — current invariant

The operating loop is:

> **Input → Interpret → Evidence → State Change → Signal → Next Action → Producer Approval → Action**

The Producer OS should answer:

> **Who needs attention, why, what happened, what happens next, and what is the system handling?**

Preserve these separations:

### Opportunity Priority

Need / Intent / Timing / Fit.

Answers the general allocation question.

It is not P(Bind), underwriting, eligibility, or permission to contact.

### Attention Priority

Clock-aware producer orchestration.

Answers:

> **Who specifically needs attention now, and why?**

It should eventually combine current Signal state, unresolved inbound, commitments, appointments, callbacks, tasks, deadlines, quote / closing state, engagement momentum and Opportunity Priority.

Do not turn this into a black-box AI lead score.

### NBA

Answers:

> **What exactly should happen next?**

Keep separate from both Opportunity Priority and Attention Priority.

### Commitment

Represents what the customer or producer said is supposed to happen next.

Initial canonical types:

- CALLBACK
- APPOINTMENT
- FOLLOW_UP
- QUOTE_REVIEW
- DOCUMENT_EXPECTED
- FUTURE_BIND
- CLOSING
- RENEWAL

Keep:

**evidence → confirmed business state → external action**

separate.

### Calendar

Google Calendar is an execution / synchronization provider.

CoverageFit owns the relationship commitment and external linkage.

A calendar event does not prove a call happened.

---

## 5. Existing implementation relevant to the near-term roadmap

### Opportunity Priority

Existing implementation:

**server/opportunity-priority-core.mjs**

Current model:

- Need — 25
- Intent — 30
- Timing — 25
- Fit — 20

It already recognizes scheduled conversations and explicit customer state.

### NBA

Existing implementation:

**server/next-best-action-core.mjs**

Already recognizes:

- client proceed;
- unanswered customer question;
- scheduled conversation;
- contact request;
- open tasks;
- closing state;
- Opportunity Priority queues;
- FIV fallback.

A scheduled appointment within 24 hours already yields preparation-oriented NBA behavior.

### Current producer attention ordering

Existing implementation:

**server/producer-workspace.mjs → attentionRank()**

Current ranking includes:

- STOP / suppression;
- CALL;
- human-required inbound;
- HIGH / URGENT inbound;
- pending draft;
- quote ready;
- Opportunity Priority queues.

This is the seed for SIGNAL-ATTENTION-1.0.

Do not create a disconnected second ranking engine without auditing this first.

### Google Calendar / callback infrastructure

Existing implementation includes:

**server/sms-callback-scheduling-core.mjs**

Current capabilities already include:

- Google OAuth refresh-token auth;
- free/busy;
- alternative slots;
- event creation;
- event lookup;
- event update/delete;
- deterministic event IDs;
- retry / recovery behavior;
- CoverageFit public appointment records;
- event ID / URL storage;
- Solo Desk booking projection.

Existing related modules include:

- server/callback-web-booking-core.mjs
- server/producer-booking-alert-core.mjs
- server/solo-desk-event-projection.mjs
- assets/js/callback-calendar.js
- appointment/index.html

CALENDAR-ACTIONS-1.0 should reuse these rails.

Do not create another Google Calendar transport.

Current calendar event body does not yet establish the full desired producer-facing prospect-attendee invitation workflow. Audit before implementation.

---

## 6. Signal Copilot 1.0 — current state

Current implementation on PR #7 is repository-complete enough for continued certification but is **not approved as live production AI**.

Current intended authority:

- Suggest: advisory only;
- Revise: advisory only;
- Use This: saves/selects draft only;
- Approve & Send: existing explicit producer action;
- no automatic send;
- no autonomous stage/fact/quote mutation.

Current guardrails include:

- exact NEW_LEAD SIGNAL population gate;
- CONTROL blocked before provider call;
- OTHER blocked;
- STOP blocked;
- suppression / opted-out blocked;
- wrong-number / unsafe ownership blocked;
- sending / delivery-review blocked;
- stale context before selection blocked;
- stale context before approval blocked;
- provider key server-side;
- store:false;
- strict structured output;
- bounded context / output;
- no provider tools;
- no automatic provider retry;
- budget reservation;
- per-producer rate limiting;
- manual workflow fallback.

### Remaining certification gates

Still not fully certified:

- authenticated hosted end-to-end Copilot workflow;
- mobile / keyboard hosted visual certification;
- real provider quality;
- measured real provider latency / cost;
- controlled real OpenAI synthetic canary if a safe environment exists;
- safe hosted explicit-send rehearsal with operator-controlled data/transport if available.

Do not use real customer data solely for certification.

---

## 7. Cloudflare — current known state

Canonical Pages project:

**coveragefit**

This project name is confirmed by successful Cloudflare bot deployments for PR #6 and PR #7.

### What is verified

- PR #7 current branch head c08721d deployed successfully;
- branch preview exists;
- PR #6 branch preview previously deployed successfully.

### What is NOT yet verified

The following require a fresh Cloudflare configuration audit:

- current production deployment SHA;
- production branch setting;
- current variables;
- current secrets;
- current D1 bindings;
- whether Preview and Production bindings actually differ;
- whether Preview uses an isolated database;
- Google Calendar credentials/config status;
- OpenAI variables/config status;
- RingCentral variable/config completeness;
- runtime compatibility settings;
- stale config candidates.

Do not infer these from repository code.

### Important browser discovery

Previous Cloudflare verification loops appear to be browser-session-specific.

The operator confirmed:

> Cloudflare works normally when opened in an Incognito / clean browser session.

For future Work / Computer Use:

- start Cloudflare from a fresh browser/session state;
- avoid stale cached Cloudflare verification state;
- stop for manual MFA / CAPTCHA / passkey only if genuinely required;
- continue automatically after the user completes the checkpoint.

### Preview isolation warning

Do not assume branch preview means isolated data/configuration.

Until audited, Preview must not be treated as a safe mutation sandbox.

Do not swap COVERAGEFIT_DB or use production customer records merely to complete certification.

---

## 8. AgencyZoom / district pilot / importer state

Canonical fresh-lead eligibility window:

**7 days**

The old 48-hour rule is stale.

Main contains:

- AWL normalization hardening;
- separation of ingestion from pilot eligibility;
- supported multi-row import;
- older leads import outside NEW_LEAD;
- one-click promotion of previously imported newly eligible leads;
- stable identity / provenance handling.

PR #6 adds additional promotion race safety that is not yet in main or PR #7.

AgencyZoom remains the current district automation owner.

Do not disable AgencyZoom or claim CoverageFit has replaced its cadence.

---

## 9. SMS / stage boundaries

Canonical AgencyZoom / Signal stage vocabulary remains:

- NEW
- CONTACT_ATTEMPT
- AWAITING_SIGNAL
- ENGAGED
- QUOTE_READY
- QUOTE_SENT
- FUTURE_BIND
- WON
- CLOSED
- STOP

Probe 1 / Probe 2 live inside AWAITING_SIGNAL.

CoverageFit / Solo Desk also has a separate phase model.

Do not silently rename or collapse these models.

Decision 2 remains:

- CALL
- ASK_ONE_QUESTION
- LATER
- CLOSE
- STOP

Do not introduce a sixth Decision 2 action as a shortcut.

---

## 10. Current exact next development path

Unless a fresh audit finds material changes, proceed in this order:

### A. Cloudflare configuration inventory

Read first, change nothing.

Determine:

- project;
- production branch;
- production deployment;
- branch preview deployment;
- variables / secrets names;
- D1 bindings;
- environment scoping;
- Google config;
- RingCentral config;
- OpenAI / Copilot config;
- runtime settings.

Never expose secret values in docs or chat.

### B. Finish PR #7 safe certification

- fresh repository full-suite run;
- flags-off hosted checks;
- mobile / keyboard checks if browser access works;
- optional real provider canary only if environment safety is verified.

If safe hosted mutation isolation is not available, document the limitation and continue.

### C. Reconcile PR #6 / PR #7

Bring forward the unique Producer OS promotion-race-safety behavior deliberately.

Do not mechanically merge branches.

### D. Implement Commitment projection

Audit existing tasks / appointments / future timing / closing state first.

Prefer a normalized projection over existing state before creating a migration.

### E. Implement SIGNAL-ATTENTION-1.0

Build on existing attentionRank(), Opportunity Priority, NBA and commitments.

First rollout:

- read-only;
- explainable;
- optional sorting.

Required initial sort modes:

- Recommended
- High Intent
- Due Now
- Newest

Do not make Recommended default until evaluated.

### F. Implement CALENDAR-ACTIONS-1.0

Reuse existing Google Calendar infrastructure.

Producer actions:

- create;
- invite;
- reschedule;
- cancel.

Then feed appointment state back into Attention Priority and NBA.

---

## 11. Stale references to ignore

Unless re-verified, treat the following as stale:

### Stale Cloudflare project

**dontworrycoverage**

Do not investigate or configure this project for current CoverageFit work.

Current project is:

**coveragefit**

### Stale pilot eligibility

**48 hours**

Current approved fresh-lead window:

**7 days**

### Stale Signal Copilot heads

Older PR #7 heads such as:

- a65edd1...
- ac48d53...
- fa401ddb...
- dcb3085...

are historical.

Current audited PR #7 head is:

**c08721d304685d01fe82c3429de07c4d0771ba6a**

Always recheck before use.

### Stale preview deployment URLs

Immutable Cloudflare preview URLs change with deployments.

Use the branch preview or read the latest Cloudflare PR comment.

### Stale test counts

Earlier counts such as 365 are superseded by the latest recorded PR #7 full-suite evidence of 376.

Still rerun before claiming a new current result.

### Stale assumptions about Preview isolation

Do not state that Preview is isolated until Cloudflare bindings/config are inspected.

---

## 12. Thread discipline

Use one canonical CoverageFit implementation thread for:

- architecture;
- GitHub;
- branches;
- PRs;
- roadmap;
- Cloudflare;
- deployments;
- Producer OS;
- Signal;
- Copilot;
- Attention;
- Commitments;
- Calendar product work.

Separate operational threads may still handle narrow live tasks such as:

- actual prospect SMS;
- actual appointment creation;
- sales coaching.

If another thread changes CoverageFit code/configuration:

1. bring the result back to the canonical CoverageFit thread;
2. re-audit repository/provider state;
3. update this document if material;
4. only then continue implementation.

Do not let independent chat threads establish competing architectural truth.

---

## 13. Instructions for future Work Mode

Begin any substantial CoverageFit Work Mode mandate with:

> **Read docs/COVERAGEFIT-CURRENT-STATE.md from the current active development branch first. Then independently audit the repository and external configuration before acting. If the document conflicts with current repository/provider state, current state wins and the document must be updated before implementation continues. Do not rely on stale chat context.**

For Cloudflare:

> **Use a fresh browser/session because normal-session Cloudflare verification previously looped while a clean Incognito session worked. Pause only for genuine MFA/CAPTCHA/passkey/security checkpoints, then resume.**

For safety:

> **Do not merge to main, enable production AI, alter production D1, send customer communications, disable AgencyZoom automation, rotate secrets, or make irreversible production changes without explicit authorization.**

---

## 14. Definition of current success

The near-term producer experience should converge toward:

> **Open CoverageFit → immediately see who needs attention and why → understand what has happened and what was promised next → take the smallest useful producer-approved action without reconstructing context across AgencyZoom, RingCentral, Google Calendar and ChatGPT.**

That is the current producer-side operating target.
