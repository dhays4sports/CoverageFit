# CoverageFit Producer Command Center UX 1.0
**Status:** PRODUCT DIRECTION ACCEPTED — implementation/release authority gated; no runtime changes, deployments, or new send authority  
**Date:** 2026-10-12  
**Repository:** `dhays4sports/CoverageFit`  
**Governing plan:** Master Roadmap 2.0 in `docs/COVERAGEFIT-NEAR-TERM-PRODUCER-ROADMAP-1.0.md`  
**Existing reference:** `docs/COVERAGEFIT-CURRENT-STATE.md`, `docs/COVERAGEFIT-PRODUCER-ACTION-QUALITY-1.0.md`, `docs/AGENCYZOOM-COEXISTENCE-DATA-GOVERNANCE-1.0.md`, `docs/COVERAGEFIT-SECURITY-DATA-GATE-1.0.md`  
**Primary success:** fewer producer minutes per useful compliant conversation, with better renewal coverage, faster priority follow-up, and more verified written premium per productive hour.

> This is a **scoped UX and development specification**, NOT a new competing roadmap or permission to merge PRs, contact prospects, enable automatic sends, or alter Cloudflare/AgencyZoom/RingCentral configurations. Continue through the current Phase 2 hosted safety gate. Re-evaluate external providers' policy and agency/carrier approval before real campaigns.

## Roadmap 3.0: Command Center is a control surface, not the terminal product

**Principal-approved 2026-10-13 high-priority overlay:** [Autonomous Insurance Growth Roadmap 3.0](COVERAGEFIT-AUTONOMOUS-GROWTH-ROADMAP-3.0.md) governs the next economic development sequence. This document remains the approved **human-facing UX contract**, not a competing delivery priority list. The currently accepted hosted Preview supports Today, linked SIGNAL Inbox, read-only Prospect 360 renewal evidence and selected no-send draft review (19/19 automated and principal desktop/mobile/keyboard signoff, operator-attested isolation). Do **not** restart UI development for milestones already accepted.

Future UX changes must serve one **economic operating loop**: high-volume documented acquisition → canonical relationship/evidence and verified renewal memory → permission-aware qualification/orchestration → fewer producer-worthy tasks → measured useful conversations, quotes/binds, verified written premium and producer minutes. Prioritize back-end intake, memory and no-send autonomous decision work ahead of additional controls or dashboards. No new live RingCentral, batch send, purchased-list outreach, merge or Production activation is implied by this directive.

**Feature acceptance filter:** A producer-facing change should remove observable clicks, context switches, unnecessary questions, delayed high-intent action or manual correction in the qualified-conversation flow. If it does not, defer unless a real safety/reliability deficiency requires it. The single-source CRM/identity, AgencyZoom owner, STOP/CONTROL, source consent and independent provider send authority remain non-negotiable.

---

## Product decision LOCK — 2026-10-12

The principal explicitly adopted this **Command Center product architecture** as the durable product direction. This authorization **locks UX/architecture priorities only**, not main merges, deployment, regulatory decisions, provider account changes, purchased-lead SMS campaigns, real outreach, or financial commitments.

### Core objectives that must NOT be deferred away
1. **Bulk purchased lead acquisition is a first-class requirement**, with reputable vendors, source agreements and provenance, accurate normalization/dedupe, contactability classification, exceptions-only operation, and measurable source economics.
2. **Automated SMS qualification and follow-up is a first-class requirement**, not merely an optional later enhancement. Develop the runtime in bounded shadow mode in parallel with provider/consent readiness; qualify and nurture renewable opportunities with minimal owner intervention.
3. **Producer SMS approvals must be fast and optionally batched.** Deliver multi-select review and individual per-recipient send safety before controlled unattended operation.
4. **Prospect 360 and Renewal Intelligence form the durable data asset.** Every allowed lead field, SMS, call transcript, attachment, screenshot, email or verified note contributes to source-linked prospect evidence without arbitrary overwrites.
5. **Principal Attention Sovereignty:** seek owner review for high-intent prospects, consequential exceptions and release decisions, not repeated daily compliance/source checks.

### Provider and data-rights architecture (not an excuse to halt development)

The business goal is **permissioned automated lead engagement**, including leads acquired from legitimate vendors. Do not confuse vendor quality or a vendor's declaration of opt-in with authorization under a particular sender, registered campaign, consent scope and provider policy.

RingCentral's current US SMS policy allows registered/consented automation, but expressly states **no SMS to purchased or third-party-generated lead lists**, even if such leads were allegedly opted in to SMS. Reference: https://www.ringcentral.com/legal/sms-mms-content-policies.html. That is a provider-specific **send route constraint**, not an architectural prohibition on building bulk purchased-lead ingestion, intelligence, consent handling or SMS workflows. Do not bypass RingCentral's limits by misrepresenting provenance or suppressing source metadata. Evaluate whether a proposed list is truly a first-party lead to the named agency versus a third-party-generated/purchased list; do not assume either based solely on how the vendor markets its leads.

Implement **provider-neutral Contact Authority**, explicit source agreements/consent proof and a transport compatibility matrix. Authorized send routes must be reviewed for the actual use case; when a route is not eligible, retain the lead and route to compliant alternatives or a direct first-party opt-in capture process. Do not silently substitute another provider merely to evade restrictions. Current RingCentral conversation and response flows stay untouched unless specifically approved. Respect state/federal restrictions, DNC/opt-out, carrier/agency requirements, and registered messaging categories.

**Engineering directive:** Start *design and offline simulation of an automated qualification family* in parallel with Today, Inbox, Prospect 360 and the provider-certification work. Activate only for an approved eligible population and sending route after positive consent evidence, producer controls, idempotency and pilot proof. This avoids making the system permanently approval-only without authorizing prohibited SMS.

### Acquisition → engagement operating sequence

`Source purchase / first-party intake → Raw ingestion & attribution → Identity/dedupe → Consent evidence & route verification → Source-qualified prospect record → Permissioned engagement / alternative channel → Evidence & renewal capture → Follow-up clock → Producer attention when warranted → Quote/bind outcome → Re-enter the next annual cycle`

**Acceptance principle:** The automation has succeeded only if it turns raw acquired prospects into more useful conversations, confirmed renewal dates, and verified premium **at lower producer effort**—not because it sent more texts.

## A. Product position and operating loop

**CoverageFit is the insurance acquisition, evidence, and relationship operating surface. SIGNAL is its governed attention and action intelligence.** 408FARMERS and designated satellites are acquisition/consent entry points. AgencyZoom retains the current district CRM and cadence authority. RingCentral is an SMS/phone transport **only within its authorized use and policies**. Farmers remains underwriting, rating, binding, servicing, and policy administration authority.

The producer experiences one loop:

`Acquire → Normalize & Verify → Prospect 360 → Score Evidence → Prioritize → Draft/Act → Verify Delivery & Inbound → Commit Follow-Up → Measure Outcome → Learn`

The desired day begins on **Today**, moves through **Inbox / Approvals**, and uses **Prospect 360** when deeper context matters. No separate Inbox CRM, shadow fact store, or competing send gateway.

**Core success criteria:**
- A producer knows *who, why now, exact action, evidence, renewal timing, last interaction, and permission state* in one glance.
- Approving multiple customer replies feels like one coherent review, yet each transmission receives its own consent, ownership, freshness, compliance and provider-idempotency check.
- Raw purchased leads can be imported, quality-ranked and organized; no recipient enters an SMS sending queue merely because a vendor supplies a phone number or asserts opt-in.
- Every new authorized source can add provenance to the same prospect record without silently upgrading uncertain facts.
- The system is useful with AI OFF and if RingCentral or AgencyZoom is temporarily unavailable.

## B. Information architecture — evolve the existing route, no replatform

Canonical URL remains `/agent/workspace/`.

Primary top-level navigation (once enabled):
1. **Today** — ranked, explanation-first producer action agenda.
2. **Inbox** — inbound communications, delivery exceptions, pending decisions, with **Approvals** as a persistent inbox filter/queue and visible badge count.
3. **People** — Prospect 360 search, identity and relationship context.
4. **Pipeline** — actionable stages and timed renewals; distinguish potential pipeline from verified quotes/binds.
5. **Tools** — import/rehearsal, agency sync, analytics, provider health, consent audit, specialist/legacy links. Analytics is not the default daily experience.

For Phase 1 UX rollout, **Today / Inbox / Approvals can be implemented as opt-in views over the existing Work surface**, without replacing original `Work / Import / Analytics / Tools` routes. Preserve all deep links and legacy task/specialist views.

On mobile, bottom navigation: **Today · Inbox · People · More**; Approvals is a prominent Inbox tab and Today shortcut, not a fifth crowded item. One-hand reach for selection, send confirmation, and Undo (selection only; **no undo after provider acceptance**).

## C. Today — first open, 30-second decision

**Intent:** "What are the few best actions for me to do right now?"

### Desktop wireframe (concept)
```text
+------------------ TODAY ------------------+-----------------------------+
|  ACTIONABLE  12     REPLIES  8            |  MY NEXT ACTION            |
|  RENEWALS   6      DELIVERY REVIEW  2    |  Prospect 360 quick panel   |
|                                            |  Why now / exact action     |
| [Recommended] [Due now] [High intent]      |  Evidence + source/time     |
| [Renewal window] [Waiting] [Exceptions]    |  Renewal: date & confidence |
|                                            |  Contact permission/channel |
|  1  Customer requested call   NOW         |  [Call] [Reply] [Schedule]  |
|     Renewal 10/28 • 2 recent replies      |  [Open full record]         |
|  2  Awaiting producer response  NOW       |                             |
|     Quote requested • renewal unknown     |  NEXT COMMITMENT            |
|  3  Renewal callback due      TODAY       |  Due time / status          |
|     Confirmed Nov policy expiry           |                             |
| ...                                        |                             |
+--------------------------------------------+-----------------------------+
```
Synthetic examples only; this is a UI proposal, not a verified production screenshot.

### Today row contract
- Name/person with correct opportunity ID and source provenance.
- Product and signal band; **Why now** (max 1 line) and **Do** (max 1 line).
- Renewal date as `Verified 2026-11-15`, `Imported/Unverified`, `Month only`, `Unknown`, or `Stale` — **never invented**.
- Latest relevant change and its timestamp, unresolved inbound marker, next due commitment.
- Contact permission concise status: `SMS permitted`, `SMS not documented`, `STOP`, `Manual review`; do not turn permission into lead quality.
- A direct action or a disabled action with an intelligible reason. Row tap opens a slide-over Prospect 360 mini-panel; full deep link remains available.

### Ranking and buckets
- Contact safety is a hard filter/suppression, not a weak score; STOP/CONTROL cannot be actionable.
- Use the existing **Attention Priority** for urgency/clock, existing **Producer Action Quality** for exact action, **Opportunity Priority** for broad allocation, and NBA for fallback.
- Prefer explicit current proceed/call/quote requests, unanswered meaningful inbound, due confirmed commitment, expiring relevant renewal, then strong recent interest.
- Future renewal timing and stale interest cannot be pinned NOW forever; show waiting/upcoming without spurious immediate outreach.
- Today buckets: `NOW`, `DUE TODAY`, `HIGH INTENT`, `RENEWAL WINDOW`, `WAITING/UPCOMING`, `EXCEPTIONS`. Suppressed stays in audit/People, never a default action bucket.
- Do not use protected characteristics, income/wealth/credit proxies, or unsupported underwriting assumptions in ranking.

**Empty state:** "No urgent actions. You have X upcoming follow-ups. Continue working on approved acquisition and quotes." Do not fabricate work.

## D. Inbox — one relationship thread, meaningful interruptions

**Intent:** "What changed, what requires human attention, and what is still awaiting reliable delivery?"

Two-pane desktop: left filterable conversation list, right thread + compact Prospect 360 rail. Mobile: conversation list → full-screen thread with sticky action bar.

Inbox filters:
- `Needs reply`; `Review drafts (N)`; `Call requested`; `Renewal date captured`; `Delivery review`; `Waiting`; `All`.
- Unread/unanswered is based on durable inbound message identities and outbound acknowledgement timestamps, not merely string matching.
- Search by exact opportunity/person, phone (authorized), policy month or lead source; ambiguous identity is **held for manual reconciliation**, not automatically merged by number.

Each row provides: last inbound preview, latest direction, received timestamp, current decision, renewal status, explicit commitment, permission/channel, confidence of source linkage, and one-click open.

Inbox conversation panel:
- Chronological SMS with provider message ID and delivery state; later append email, RingCentral call transcript, uploaded declaration/policy document, screenshot and manual note as **distinct evidence types**.
- One canonical **known answers / unanswered signals** section (zero-repeat).
- Visible conflicting facts with source/time and "Verify or correct" affordance.
- Suggested next question/action and a draft with edit/revise. **Editing is not sending**.
- One persistent producer takeover/automation pause button, visibly reflected across provider workflows and queue eligibility.
- `Delivery needs review` is not silently changed to "unsent": suspend retries and provide safe RingCentral reconciliation.

Transport failure and AI failure never hide an incoming customer reply; if inbound webhook is unhealthy, flag missing-history/connection state and direct the producer to RingCentral.

## E. Approvals — safe multi-message review, NOT blind bulk blasts

**Intent:** "Show everything I can safely send, let me edit multiple replies quickly, and let one explicit approval execute those individually."

### Desktop wireframe
```text
+----------------- INBOX > APPROVALS ------------------------------------------+
|  18 proposed  |  11 eligible  |  5 need attention  |  2 delivery review      |
|  [Eligible only] [High intent] [Newest] [Renewal follow-ups]                 |
|                                                                             |
|  [x] Synthetic A | Renewal verified | 1 question | SMS permission verified  |
|      "Thanks. Is November 15 your current renewal date?" [Edit] [View proof]|
|  [x] Synthetic B | Asked for quote  |  0 repeats | SMS permission verified  |
|      "I can help compare. What's the easiest time to connect?" [Edit]       |
|  [ ] Synthetic C | STOP             | INELIGIBLE [Why not?]                  |
|  [ ] Synthetic D | Changed inbound  | STALE [Regenerate / review]           |
|  [ ] Synthetic E | Vendor CSV only  | NO DIRECT SMS PERMISSION              |
|                                                                             |
|   2 SELECTED • 2 distinct conversations • no unattended automation         |
|  [Review selected (2)]   [Clear]                                            |
+-----------------------------------------------------------------------------+
```

### Required workflow
1. Queue includes only **existing, governed pending replies**. A candidate can be `SUGGESTED`, `READY_FOR_REVIEW`, `ELIGIBLE`, `STALE`, `BLOCKED`, `DELIVERY_REVIEW`, `SENT`, `DECLINED`. A UI badge is not send permission.
2. Producer reviews each message, or a concise review digest linking each exact body/recipient; edits remain unsent.
3. Select specific eligible rows. `Select all` selects **only visible, proven eligible**, never hidden results/suppressed or stale. Default selected count 0; persisted bulk selection requires revalidation.
4. `Review selected` presents full recipient identity, exact message, permission proof, freshness status and total count. Every message remains inspectable. Confirmation is explicit.
5. On `Approve selected`, backend re-evaluates *each* opportunity and conversation against **its current revision**, source identity, STOP/DNC, legal/provider campaign permission, cohort/ownership, takeover lock, consent provenance, send window and recipient number. Approval fails closed individually on any change.
6. Execute through the **existing governed RingCentral SMS gateway and per-conversation lock**, not a new sender. Bound concurrency/rate; pilot starts with **max 10 distinct individually reviewed messages per confirmation**, configurable only after provider/agency approval.
7. Per-item results: `ACCEPTED/SENT`, `BLOCKED`, `STALE`, `DELIVERY_REVIEW`, or `REQUIRES_MANUAL_ACTION`. Partial success is expected; one failure must not trigger whole-batch retry.
8. Provider ambiguously accepted message? Mark `DELIVERY_REVIEW`, reconcile by idempotency/provider message ID; **never automatically resend**. A bulk button is not permission to bypass phone/system quotas.
9. Maintain durable producer approval ledger: actor, time, exact body/body hash, conversation, evidence snapshot/revision, permission basis, sending provider/campaign, batch ID, per-message idempotency key, result and provider receipt. Audit never logs unneeded full personal data.

### Incremental implementation strategy
- **First:** read-only queue + single-message edit/approve shortcut using existing ( `approve_send` ) authority. No batch backend yet.
- **Next:** approval-review surface + server-side individual preflight snapshots and multi-select. All sends still invoke existing verified single-message handler/gateway; no new default auto-send behavior.
- **Then:** bounded batch orchestration with durable per-item receipts/locks, partial reconciliation and per-item approval trace. No parallel speculative sends. Fail closed on provider uncertainty.
- **Eventually:** bounded **preauthorized workflow families** may generate/send routine replies without per-message approval, but only after consent, provider/TCR campaign registration, ownership, monitoring, opt-out, economics, pause/kill switch and separate explicit activation. Batch approval is not itself autonomous sending.

**Operator shortcut:** an exception-aware "Approve 5 / Review 2 / Hold 3" summary is useful, but must never conceal actual selected recipients or exact outgoing message bodies.

## F. Prospect 360 — shared profile contract beneath all three views

A **Person/Household** may have multiple insurance **Opportunities** (home, auto, life, commercial, renewal). Maintain stable IDs and links; **never merge on phone number alone**. Reuse current Universal Customer Profile, `cf_solo_opportunities`, `cf_solo_sources`, `cf_solo_tasks`, SMS stores and existing read-only projections; do not start a second parallel CRM.

Minimum dimensions:
- `contact`: identity aliases, verified contact channels, preferred contact method, source IDs.
- `insurance`: product line, carrier, coverage facts (if verified), quote status (never infer bind).
- `timing`: `renewal_exact_date` or `renewal_month`, verification state, evidence timestamp, expected return window, future bind/closing; unknown allowed.
- `intent`: shopping reason, explicit request for quote/call, price/coverage concerns, recent engagement, current stage.
- `consent`: source-specific channel permission and revocation evidence, provider campaign scope, SMS permission reason.
- `commitments`: explicit promised callback, review, document, appointment and due status.
- `evidence`: provider import, SMS, call/transcript, document, screenshot, email, producer note; original source/time and actor.
- `facts`: normalized current working values with source references and conflict/verification state.
- `audit`: decisions, edits, source amendments, sends, outcomes, rationale.

### Evidence → Facts → Decisions (different authority)
- **Evidence** is append/provenance-oriented: original claim, source kind/source ID, event ID, timestamp, received timestamp, extraction version, retention classification and trust level. AI extraction is a proposal, not a verification.
- **Facts** are materialized from evidence with known/unknown/contradicted, confidence/verification status, last confirmed time and conflict resolution history. A newer source does not automatically supersede a direct, producer-confirmed fact when ambiguous.
- **Decisions** are current deterministic projections: Opportunity Priority, Attention, SIGNAL Decision 2, Producer Action Quality, permitted channel and suggested next action. AI may propose language or evidence interpretation, never manufacture contact permission.

### Multi-channel admission rules
- Raw lead CSV: accept only supported schema, preserve original field/value and normalize known insurance facts. Unrecognized/shifted rows → exceptions.
- SMS: stable conversation/message identity, explicit opt-out, provider delivery/ownership and inbound ordering.
- Call transcript: capture only with compliant call recording/transcription notice/consent and provider access; mark speaker and uncertainty, do not silently infer a customer commitment.
- Screenshot/desktop: user-selected capture, redaction, explicit attach to verified opportunity, separate "visual observation" vs verified customer fact.
- Documents: file provenance, access control, sensitive-data minimization; policy extraction requires source inspection and producer verification.
- Email/manual notes: linked via verified identity, quoted evidence and actor.
- Conflicts go to small producer review exceptions, not hidden auto-overwrites.

## G. Renewal Intelligence 1.0 — compounding pipeline

Renewal is a **first-class timing record**, not just free-text in a conversation.

Fields/semantics:
```text
product_line, source_id, calendar_date | year_month | unknown,
precision (exact/month/unknown), verification (imported_unverified/
customer_confirmed/document_verified/producer_confirmed/conflicted/stale),
observed_at, last_confirmed_at, historical_dates, next_review_date,
followup_commitment_id, opportunity_id, contact_permission_snapshot
```

Lifecycle: `UNKNOWN → CANDIDATE → VERIFIED → UPCOMING → WINDOW_OPEN → QUOTE_READY → WON/LOST/FUTURE_RETURN`. State is independently tracked from SMS permission; passing a renewal window **does not grant the right to text**.

The Today surface must support:
- `Renewal in 0–30 days` and `31–90 days` views by configurable, line-specific quote lead time (not a fixed blanket SMS cadence).
- `Date unverified` micro-question suggestions for currently permissioned channels.
- Expiration/closing risk above ordinary nurture, if supported by explicit evidence.
- Annual review of previously confirmed dates; provisional timing should decay and request confirmation rather than remain permanently "verified".
- Follow-up commitments automatically return to Today when due; completed/dispositioned commitments no longer generate NOW urgency.

Measure **% prospects with verified usable renewal timing** and **renewal-to-useful-conversation conversion**, not just renewal dates collected.

## H. Acquisition and contact authority are different

**Purchased leads and automated messaging are foundational product requirements, with separately verified send authority.** Purchased records enter acquisition, enrichment, source attribution, deduplication, prospect intelligence and the pipeline by default; **send eligibility is a separate positive decision**. RingCentral's published US SMS policy prohibits SMS to purchased/third-party-generated lead lists even when vendor opt-in is claimed; approved registered and consented automated messaging remains possible for eligible first-party populations. Build the provider-neutral eligibility contract and approve each route/campaign on its merits. See https://www.ringcentral.com/legal/sms-mms-content-policies.html .

Define a **Consent & Contact Authority** projection independent of high-intent scoring and existing legacy `smsConsent.status`. Before each prospective SMS, require positive evidenced permission for the actual sender/campaign/message class (not merely "not opted out"), source and scope, capture timestamp, retention, proof, opt-out status, DNC, ownership and applicable provider policy. **Default UNKNOWN→NO_SEND** for bulk approval and future autonomous outreach, while continuing safe ingestion, enrichment, producer triage and eligible non-SMS work. Existing one-to-one use cases need their own separately reviewed authorization assumptions.

High-priority prospects with no SMS permission can be placed in **Manual permitted-channel work**, never smuggled into the SMS queue. Buying/sourcing lists does not confer permission.

## I. Data/API plan (design only — no migrations authorized)

Retain existing core `soloRepository`, UCP, `producerWorkspace`, Attention, Action Quality, `sms-signal-api` and RingCentral gateway.

Proposed **read-only query projections**:
- `GET /api/solo-desk/producer-today`: compact attention agenda, buckets, counts, cursor; per-record why/action/provenance.
- `GET /api/solo-desk/producer-inbox`: merged relationship threads/exception status; cursor by event timestamp + stable ID, no phone-only merges.
- `GET /api/solo-desk/producer-approvals`: selected pending draft snapshot, consent readiness, block reasons, revision/freshness. **Not a send API.**
- `GET /api/solo-desk/prospect-360?id=...`: minimally authorized evidence/fact/commitment/timing state.

Potential **write contracts, subject to separate review**:
- `POST /api/solo-desk/producer-approval-review`: producer selection → ephemeral short-lived exact-message proposal snapshot, each item independent.
- `POST /api/solo-desk/producer-approve-selected`: explicit confirmation, bound capped per-item approved sends through existing SMS gateway, no new transport.
- `POST /api/solo-desk/prospect-fact-review`: producer evidence correction with optimistic versioning/audit.
- `POST /api/solo-desk/renewal-confirm`: confirm actual date with evidence; no implicit outreach.

**Do not implement a write route or table simply because it appears in this proposal.** Start with projection over existing stores; introduce migrations only for demonstrably missing durable events: per-message approval batch/item ledger, canonical cross-source evidence and fact assertions, renewal verification history, and consent evidence. Design migrations additive, workspace-scoped, indexed, reversible via application rollback (no destructive customer-history rollback). Include export/deletion/retention design.

### Proposed normalized source schema sketch
```text
FactAssertion {
  workspace_id, prospect_id, opportunity_id?, field_key,
  raw_value, normalized_value, source_kind, source_id, evidence_ref,
  observed_at, received_at, verification_status, correction_of?,
  extraction_version?, conflict_group?, created_at
}
ContactAuthority {
  workspace_id, prospect_id, channel, sender_id, message_class,
  consent_basis, consent_scope, evidence_ref, confirmed_at?,
  expires_at?, revoked_at?, provider_campaign_id?, policy_status
}
ApprovalItem {
  batch_id, item_id, opportunity_id, conversation_id,
  exact_body_hash, requested_revision, producer_id, approved_at,
  contact_permission_snapshot_hash, state, idempotency_key,
  provider_message_id?, delivery_review_reason?, reconciled_at?
}
```

System state must preserve **unknown** rather than falsely filled values. No raw medical, protected-class or sensitive underwriting guesses in ranking; capture only appropriate minimum business information.

## J. Reliability, performance, and security requirements

- **Single source of send authority:** reuse existing gateway; no "bulk SMS provider" side channel.
- **Lock/idempotency:** stale context 409, conversation lock, stable approval ID/item ID, provider message identity, optimistic event revision; provider ambiguity freezes item for review.
- **Ownership/experiments:** CONTROL never receives SIGNAL treatment, even if a bulk selector contains its record; AgencyZoom remains owner for its active cadence family. One owner per automation family.
- **Security first for enlarged authority:** current long-lived browser bearer token is an explicit boundary. Before broad batch writes, scope actor authentication, short-lived sessions/CSRF, authorization, minimal data response, audit and role separation in line with `COVERAGEFIT-SECURITY-DATA-GATE-1.0`.
- **No hidden send:** page unload, timeout or retries cannot send new recipients. Loading/scrolling/selecting is not approval.
- **Limits:** start with a 10-item human-reviewed batch cap, with configurable per-minute provider limit stricter than documented policy; disabled when provider readiness uncertain.
- **Performance target (hypotheses to measure, not claims):** Today actionable list usable within 2–3 seconds at tested pilot volume; first Inbox page within 2 seconds; edit/select remains responsive on iPhone; no five-minute waits for bulk send confirmation; report partial outcomes progressively.
- **Access:** keyboard focus order, screen-reader actionable labels, high contrast status meanings, mobile safe-area/sticky footer; sending requires an explicit confirmation distinct from navigating away.
- **Fallbacks:** if AI off → deterministic templates/manual edit; if SMS ingress down → provider health warning and manual RingCentral work; if sender unavailable → HOLD queue; if calendar broken → commitments still due in Today.
- **Observability:** producer minutes by activity, eligible/rejected draft counts, staleness/conflict rates, sends/receipts, reply latency, exceptions, renewed conversations, useful conversations, quotes/binds and verified written premium. Privacy-preserving metadata only in diagnostic logs.

## K. Build sequence and release gates

This is a **UX workstream within Master Roadmap 2.0**, not a replacement for the core phase ordering. Dependencies:

```text
[Existing Phase 2 hosted Action Quality acceptance]
       |
       +-- [RingCentral inbound / owned message sync certified]
       |        |
       |        +-- [Inbox read-only threaded list] -- [Review queue / per-item preview]
       |                                          |
       |                                          +-- [Multi-select + explicit human approval]
       |                                                (separate send approval required)
       |
       +-- [Today view read-only] ---------------+
       |
       +-- [Prospect 360 evidence / renewal fact contracts]
                  |
                  +-- [Renewal Today views / follow-up commitments]
                  |
                  +-- [Multi-channel admission adapters later]
                                                     |
                                      [Permissioned automation families]
                                                     |
                             [Purchased-lead import scale via permitted channels]
```

### M0 — Design, instrumentation and provider/consent rules (NO_SEND)
Deliver: this now-adopted product direction, personas/tasks, route inventory, data contracts, source/permission capture design, channel/sending-route compatibility review, safe demo data, acceptance fixtures and qualitative usability evaluation. Gate: engineering design freeze and documented backlog; no production writes.

### M1 — Today 1.0 read-only (NO_SEND)
Deliver: existing Attention/Action Quality data in a compact Today list, explainable priority, renewal and commitment chips, deep link to current detail; default-off flag `CF_COMMAND_CENTER_TODAY_ENABLED`. Gate: list/detail parity, STOP/CONTROL and manual fallback, desktop/iPhone acceptance.

### M2 — Unified Inbox + Review Queue (NO_SEND)
Deliver: provider-authored inbound timeline, reply-needed filter, safe draft statuses, manual delivery exception bucket, consent/ownership eligibility projection, `CF_COMMAND_CENTER_INBOX_ENABLED`; do not claim inbound is complete before webhook/subscription certification. Gate: chronological identity/dedup tests, stale/STOP/CONTROL exclusion, honest missing-history indicators, accessible mobile review.

### M3 — Selected approvals 1.0 (WRITES: separately authorized)
Deliver: multi-select, exact-body producer confirmation, per-recipient eligibility/revision preflight, bounded per-item sends through existing `approve_send` semantics/gateway, durable per-item receipt, resume/reconcile delivery review. Gate: 0 duplicate sends under races/timeouts, STOP/consent/CONTROL fail-closed, clear partial results, authorized synthetic provider canary; approval and send flags OFF by default. No purchased-list SMS.

### M4 — Prospect 360 + Renewal Evidence 1.0 (NO_SEND initially)
Deliver: source-linked fact assertions and conflict review, renewal precision/verification, source/time trail, future-return commitments, read-only adapters for SMS/RAW, later calls/files/screenshots. Gate: importer fidelity, identity conflict holds, zero silent fact overwrite, renewal verified vs imported distinction, producer usability.

### M5 — Permissioned workflow automation (core product, progressive authority)
Deliver: one single-owner, opt-in, registered-message-class qualification/follow-up workflow. Start implementing its deterministic scheduling, missing-question logic, renewal memory, STOP, provider identity, review queues and SHADOW evaluator during earlier milestones; keep transport OFF until approved. Gate LIVE on verified first-party or otherwise provider-eligible permission, registered campaign and sender-route confirmation, legal/agency approval, opt-out/retry/fail-close, pilot evidence and explicit activation. RingCentral's restriction on third-party/purchased-list SMS remains in force for that route. Reuse one verified gateway/provider adapter rather than constructing evasive send paths.

### M6 — Bulk acquisition scale and compounding pipeline
Deliver: recurring ingestion of reputable bulk leads with source attribution, schema/identity reconciliation, permission/route eligibility ledger, lawful acquisition channel routing, scheduled follow-up and renewal triggers, exceptions-only work and source-funnel economics. Begin import/source and route-readiness engineering earlier without granting send authority. Gate high-volume deployment on import accuracy, duplicate/exception rates, vendor permission evidence, eligible-contact fraction, verified renewal capture, cost per useful conversation, premium per producer hour and measured producer time savings. Escalate only consequential exceptions.

Each milestone must provide: exact PR/commit, read-only vs write boundary, flags OFF by default, replay/edge tests, independent hosted environment isolation, user acceptance, rollback, security/data/privacy review and explicit sign-off for new external authority. **Never call a feature live simply because CI is green.**

## L. Acceptance scenarios (minimum)

1. Due callback and recent explicit call request rise to Today; old unverified renewal does not.
2. STOP, wrong number, opt-out, CONTROL: no actionable text approval, even if high priority.
3. Seven new inbound messages and two due callbacks render one clear "Needs reply" queue without duplicate identities.
4. Known carrier/renewal from inbound is not re-asked; evidence conflicts are visible and correctable.
5. Three SMS candidates selected, one replies meanwhile: 2 can be approved, 1 becomes STALE; no stale send and no whole-batch resend.
6. Provider accepts message then times out: exactly one attempt is tracked as `DELIVERY_REVIEW`; subsequent click cannot cause duplicate.
7. One missing positive opt-in on purchased third-party row blocks SMS despite high lead score.
8. Renewal month known but exact date unknown: no fabricated "renewal Nov 1", and qualified future follow-up remains possible.
9. Multiple opportunities under a person/household retain distinct policy-specific renewal dates; no silent merges.
10. AI unavailable: deterministic evidence/priority, manual inbox and send control still usable.
11. iPhone + Windows keyboard operator can review ten drafts without opening ten new browser tabs.
12. Provider webhook outage is visible, not hidden as "no replies"; recovery is deduplicated on replay.

## M. Metrics, decision gates and resource budget

Primary:
- **Producer Minutes per Useful Conversation** = attributable manual triage + conversation + review + correction + callback + admin minutes ÷ genuine useful conversations (undefined at 0).
- **Producer approval minutes per safely sent message**, before and after batch UX.
- **% of prospects with usable, verified renewal dates** and quality/age distribution.

Secondary:
- missed meaningful inbound / overdue commitments, reply-time bands, draft staleness/rejection rates, unresolved provider receipts, quote-rate, bind-rate, verified written premium/producer hour.
- source acquisition cost, duplicates, unsupported contacts, lawful contactable fraction, cost per useful conversation.
- percent of review queue blocked by consent/provider/ownership by category, not raw queue volume.

Pilot experiments must retain CONTROL baseline isolation and distinguish **improved response/efficiency** from provider deliverability or source-selection effects. No hypothetical uplift claims.

**Principal Attention Sovereignty:** build mock/read-only slices, run CI, draft PRs, use synthetic fixtures, batch approvals and surface only consequential decisions. Owner should approve a small number of product choices and external write gates—not babysit each AI agent.

## N. Product defaults locked (2026-10-12) — no deployment authority

The principal has approved this product direction. The following are adopted engineering defaults; material UX changes or new production send authority still require review:
1. Keep canonical route `/agent/workspace/`; evolve navigation, no complete UI rebuild.
2. Today and Inbox first; Approvals embedded as dedicated Inbox queue with a Today shortcut.
3. Mobile-first responsiveness with two-pane desktop and quick view of Prospect 360.
4. Start with **read-only queues**, then explicit **human-reviewed selected approval**, initial cap **10**.
5. Bulk purchased leads and documented permissioned SMS automation are core outcomes; source records and provider/sender-route rules are evaluated separately. Never route RingCentral purchased/third-party lists contrary to its published SMS rules.
6. Prospect 360 evidence/fact/timing ledger is the durable intelligence substrate, shared across every input channel.
7. End state: permission-governed automation only after observed provider reliability/economics and separate activation approval.

**Current program status:** Product direction locked, implementation gated. Existing PR #12 hosted Producer Action Quality acceptance, RingCentral inbound/subscription certification, Preview data isolation, provider route/campaign compatibility and agency approvals remain independent gates. This document authorizes no live customer communication or release.
