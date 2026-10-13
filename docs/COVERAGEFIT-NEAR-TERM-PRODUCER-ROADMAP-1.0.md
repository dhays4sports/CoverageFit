# CoverageFit Near-Term Producer Roadmap

**Document:** CF-NEAR-TERM-PRODUCER-ROADMAP-1.0  
**Status:** Canonical near-term implementation sequence  
**Date:** 2026-10-01  
**Repository:** dhays4sports/CoverageFit  
**Scope:** Producer OS, Signal Copilot, attention orchestration, commitments, and calendar actions

## Executive execution map — CoverageFit + SIGNAL Master Roadmap 2.0 (2026-10-12)

> **Product North Star adoption (2026-10-12):** The principal approved the CoverageFit Producer Command Center UX 1.0 product direction as the roadmap's operating target: **Today → Inbox / Bulk Approvals → Prospect 360 / Renewal Intelligence → permissioned SMS workflow autonomy and large-scale purchased-lead acquisition**. Purchased lead ingestion and automated SMS are **core goals, not optional features**. Build send-free acquisition/consent data contracts and SHADOW automation in parallel with Phase 2/3 integration, but do not grant live send authority until sender/campaign permission and provider-specific constraints are verified. The RingCentral route is not authorized for purchased or third-party-generated SMS lead lists under its published policy; the acquisition objective should not be abandoned, nor should list provenance be masked. See `docs/COVERAGEFIT-PRODUCER-COMMAND-CENTER-UX-1.0.md` for locked UX details and escalation rules.
>
> **Governance:** This adopts the product plan, **not** approval to merge code, change Cloudflare, ingest live purchases, send messages or activate automation. Keep Phase 2 hosted certification and the existing release gates; avoid making consent/provider evidence a recurring principal task by using auditable import receipts, automatic eligibility classification and consolidated exception reviews.

**Purpose:** Give the principal and every implementation thread **one short, phase-gated reference** for what to build next. This is the executive execution map within the **existing canonical near-term roadmap**, not a second roadmap or a replacement for the architectural details below. The detailed Milestones 0–10 describe capabilities; **the seven phases here set operating order and release gates**. Read the latest `docs/COVERAGEFIT-CURRENT-STATE.md` and current repository/provider evidence before relying on any recorded SHA, flag, test count, or hosted environment claim.

**North Star:** CoverageFit is the insurance producer command center; SIGNAL is its governed decision/attention engine; 408FARMERS and its acquisition satellites are entry surfaces; AgencyZoom retains existing district cadence ownership, RingCentral transports communications, Google Calendar executes approved appointments, and Farmers retains underwriting/binding/policy administration. The target is **fewer producer minutes per useful, compliant conversation and more verified premium per productive hour**, not the largest feature list.

### Seven-phase progress map

| Phase | Outcome | Current disposition (as of 2026-10-12) | Evidence required to exit |
| --- | --- | --- | --- |
| **1. Consolidate the foundation** | One tested, safe, reviewable producer runtime | **INTEGRATION REVIEW REMAINS OPEN.** Main/PR merge not authorized; PR #12 stacked on #7, current code verified separately. Preview functional gate does not merge branches. | Reconcile overlapping PRs deliberately; exact-head CI green; preserve cohort, ownership, consent, race-safety, flags-off manual fallback; document release and rollback; separate merge approval |
| **2. Certify producer decisions** | Work list and detail agree on **Why now / Do / Evidence** | **HOSTED PREVIEW FUNCTIONAL + VISUAL ACCEPTED (operator-attested), 2026-10-12.** 9/9 synthetic cases passed on immutable `ee3f966a` Preview at tested head `1bb773d`; operator confirmed desktop/mobile, STOP, CONTROL and TEST behavior. D1 UUID isolation remains operator-attested, not independently verified. | **Met for scoped Preview Producer Action Quality.** Production merge/config/send gates remain separate; evidence captured in CURRENT-STATE |
| **3. Close the operational loop** | One qualified lead travels safely from source to documented next outcome | **ACTIVE ENGINEERING GATE.** RingCentral inbound webhook/subscription and end-to-end receipt/recovery remain unverified in authorized isolated environment; review read-only status first. | One traced controlled `intake → dedupe/population → evidence → approved action → provider receipt → inbound → confirmed follow-up → outcome`; provider healthy, no duplicate send, no missing/ambiguous state; 408FARMERS handoff and AgencyZoom coexistence |
| **4. Daily producer dogfood** | Producer opens CoverageFit and can work a small real queue without reconstructing context | **NOT YET CERTIFIED.** Existing Work UI and read-only Attention provide a foundation | Useful Today/Inbox/Opportunity views, reliable commitments and follow-ups, accurate exceptions, suppressed leads kept out of action queue, low app switching and a documented manual fallback |
| **5. Prove SIGNAL economics** | SIGNAL beats or is honestly compared with the existing district workflow | **NOT YET DEMONSTRATED.** Measurement/data structures exist; no verified uplift | Approved small fresh California personal-lines pilot with stable SIGNAL/CONTROL cohorts, predefined useful-conversation definition, producer-time accounting, quotes/binds/verified premium, and observed comparison |
| **6. Scale safely** | Higher lead volume and selectively reduced manual work without losing ownership or trust | **CONDITIONAL.** Do not treat draft automation as authorized | Gate one automation family through OBSERVE → SHADOW → separately approved LIVE, one owner per family, consent/STOP checks at execution, no ambiguous retry sends, measurable positive economics |
| **7. Expand intelligence** | Calls, documents, screenshots, cross-channel evidence and advanced actions add incremental leverage | **LATER / SEPARATE.** Desktop Copilot #10 exists as an isolated draft installer, not production; call/document intelligence is not a prerequisite for phases 1–5 | Scoped authorization, canonical evidence provenance, cost/latency measurements, privacy/vendor approvals, Action Quality compatibility, no duplicate reasoning/sending authority |

**Current focus (updated 2026-10-12):** Phase 2 Producer Action Quality hosted functional + visual acceptance is COMPLETE for operator-attested isolated Preview; Phase 1 merge/integration remains separately gated. **Phase 3 RingCentral inbound reliability and the complete lead-to-follow-up loop is now ACTIVE.** Phase 4 Today/Inbox/Approvals and Prospect 360/renewal and no-send automation foundations can be developed in scoped parallel, but no new send authority follows from Phase 2. Phases 4–5 must still demonstrate operational and economic value.

### What each phase concretely means

**Phase 1 — integrate, don't rebuild.** PR #7 contains the newest producer Copilot/Attention/Action Quality work, including the guarded district-promotion pattern already present in PR #6. PR #12 is stacked on #7 and adds list/detail suppression/evidence/next-action parity and regression checks. PR #11 is a narrow main-based seven-day assertion/release-gate draft; its release-gate document has now been carried into PR #12 and its assertion already exists on #7. Do not merge PR #11 separately or reapply stale code. PR #8 is based on a stale #7 revision: retain already ported read-only commitment/attention primitives, defer calendar write surfaces until the appropriate gate, and **do not merge #8 wholesale**. PR #9 (producer notifications) has an independent provider/secret/hosted-canary gate. PR #10 (Desktop Copilot) is parallel and nonblocking. Before a merge, explicitly record retained source of truth per overlapping file, test coverage, flag defaults, release and rollback instructions. Draft PRs and green CI alone are not deployment approval.

**Phase 2 — trust the action.** The governing signal is:
`Why now → exact governed action → evidence reference → producer judgment`.
CoverageFit must not promote a stale, completed, cancelled, unconfirmed, or unrelated future task over a fresh governed reply. It must not turn a high Opportunity Priority score into a contact permission, let Attention outrank STOP/CONTROL, invent a completed call from calendar presence, or show actionable instructions for synthetic TEST records. Certify on the **exact deployed SHA with verified Preview/Production database separation**; if isolation cannot be established, record a blocker and use deterministic non-mutating tests rather than production data.

**Phase 3 — one closed loop.** A lead arrives from district raw intake or 408FARMERS; strict provenance, normalization and deduplication keep it in the correct population. SIGNAL determines current evidence/priority; the Workspace presents action and why. If communications are permitted, Copilot may draft but **only explicit producer approval sends**. Provider acknowledgements and inbound webhook events reconcile by stable identity; ambiguous external acceptance never triggers blind resends. A confirmed follow-up or appointment becomes durable work, and a real outcome is recorded. Preserve AgencyZoom existing district cadence/automation ownership. Prior controlled RingCentral outbound Preview delivery is **not** proof that inbound subscriptions are ready.

**Phase 4 — the producer-day product.** Favor **Today → Inbox → Opportunity detail → Action → Outcome** over additional screens. Today surfaces actionable commitments/high-signal people with succinct why-now reasons; Inbox shows inbound and failed-delivery exceptions; detail shows what is known, missing, disputed, promised and last done. Prioritize reliable one-question, call, reply, follow-up and quote-preparation flows. Google Calendar create/invite/reschedule/cancel may enter only behind its distinct explicit-action provider gate, with duplicate-safe writes and truthful invite status. The producer must be able to work the manual path if AI or external services are unavailable.

**Phase 5 — measure before district expansion.** Preserve the canonical **seven-day** fresh-lead eligibility policy and immutable assignment/override audit. Before real comparison, lock definitions for *useful conversation*, producer minutes, cohort eligibility, policy/bind evidence and observation window; never count synthetic data or equate a drafted SMS with a useful conversation. The **primary unit economic metric** is **Producer Minutes per Useful Conversation** = total attributable producer effort minutes / number of qualified useful conversations, reported as undefined if denominator is zero. Count triage, exception handling, conversation, correction, follow-up and administrative effort in the numerator; don't cherry-pick only the speaking minutes. Report quotes, binds, verified written premium, premium/producer hour and missed commitments as secondary measures. If evidence does not demonstrate improvement, revise the process rather than invent ROI.

**Phase 6 — autonomy must earn its authority.** Start with read-only analysis and no-send SHADOW evaluation. An automation family has a single explicitly identified owner (AgencyZoom or CoverageFit, never both), durable version/step identity, consent and suppression rechecks at execution, retry-idempotency, manual pause/takeover, audit and rollback. Do not cut over a live family merely because templates or a scheduler compile. Integrate 408FARMERS, MortgageProtectionCA.com, BayAreaLandlordInsurance.com, RentalInsuranceCA.com and other approved acquisition satellites through shared CoverageFit/SIGNAL intake; they are **distribution surfaces of the existing insurance operation, not independent producer operating systems**. Scale distribution only when the workflow is reliable and measured.

**Phase 7 — reuse the intelligence spine.** RingCentral call transcripts, documents, screenshots/Desktop Copilot, email and manual notes can propose evidence. Each channel must use the same provenance, consent, identity, commitment, Attention and Producer Action Quality contracts. Do not create a second lead scoring engine or give desktop/visual inference independent CRM or external-send power. Evaluate each input by added usable conversations or reduced producer time, subject to privacy/agency/carrier authorization.

### Dependency and release map

```text
[1 Integration & safety baseline]
                |
                v
[2 Action Quality hosted certification]
                |
                v
[3 Reliable lead ↔ communication ↔ commitment loop]
                |
                +----> [4 Daily producer dogfood] ----> [5 SIGNAL economic pilot]
                |                                            |
                |                                            v
                +----------------------------------> [6 Selective scale / automation]
                |
                +----> [7 Advanced evidence inputs, individually justified]
```

The work inside phases 3–4 may be engineered in parallel **only** where provider, authority and testing boundaries are isolated. Phase 6 activation depends on the economic proof and distinct external-action approvals; advanced inputs are optional.

### Evidence standard at every release gate

A phase is not DONE based on implementation or test-count claims alone. The release note must identify: **exact repository head; diff/overlap decision; passing relevant checks; exact deployed head when hosted; data and secrets/environment isolation; synthetic/provider canary results; deny/STOP/CONTROL cases; manual fallback and rollback; remaining risks; specific approval for every external change**. If an item is unavailable, label it **BLOCKED** rather than inferring success.

Operational statuses use **NOT STARTED → IMPLEMENTED → TESTED → HOSTED-CERTIFIED → PILOT-MEASURED → PRODUCTION-AUTHORIZED**, and should not be compressed into a generic "done" label.

### Principal Attention Sovereignty

The owner should be interrupted only for a consequential approval or a real operational risk. Development should proceed with automated CI, bounded read-only audits, synthetic tests, draft PRs, and one consolidated decision packet per gate. The packet states **recommended decision, evidence, risk, reversible fallback, attention/cost impact, and the exact permission requested**. No silent merges, live AI enablement, D1/secret mutations, customer sends, appointments/invitations, AgencyZoom family cutover, district outreach, or production deploys.

### Reference index and handoff

- This file: **canonical implementation roadmap and seven-phase execution map**.
- `docs/COVERAGEFIT-CURRENT-STATE.md`: latest operational audit, branch and provider status; update whenever materially changed.
- `docs/COVERAGEFIT-PRODUCER-ACTION-QUALITY-1.0.md`: exact deterministic decision and evidence contract.
- `docs/COVERAGEFIT-PRODUCER-COMMAND-CENTER-UX-1.0.md`: **design proposal under review** for Today / Inbox / selected SMS approvals, Prospect 360 and renewal intelligence. It does not reorder the current Phase 2 certification gate or authorize any sends.
- `docs/PR8-RECONCILIATION-2026-10-07.md`: why historical PR #8 cannot be blindly merged.
- `docs/COVERAGEFIT-SIGNAL-OPERATIONAL-GATES-1.0.md`: explicit near-term certification/release checklist, **now incorporated into draft PR #12**. PR #11 is superseded for integration purposes.
- PR #7 → PR #12: current read-only producer-action development lane. Production `main` is not assumed to include either.

**Implementation priority refinement:** Develop permissioned acquisition source evidence, renewal/Prospect 360 projections and the automated qualification SHADOW runner *alongside* Today/Inbox engineering. Keep batch approvals human-governed until their separate send gate passes. Do not treat the last phases of the seven-phase executive map as a requirement to wait before designing or coding safe shadow automation.

**Resume instruction for future work:** *Re-audit current repo and deployment state, read this execution map and CURRENT-STATE, identify the earliest unmet gate, and deliver only the smallest reviewable slice that measurably advances it. Do not start another workstream merely because a later-phase capability is technically interesting.*

---

## Purpose

This document converts the current CoverageFit Producer OS and Producer Copilot direction into a concrete near-term implementation sequence.

It is intentionally narrower than the long-range product North Star. Its job is to define what should happen next in the producer workspace so CoverageFit becomes meaningfully better at four operational questions:

1. **Who needs Dylan's attention right now?**
2. **Why now?**
3. **What did either side say was supposed to happen next?**
4. **What useful action can Dylan take without leaving CoverageFit?**

The governing loop remains:

> **Input → Interpret → Evidence → State Change → Signal → Next Action → Producer Approval → Action**

The near-term operating shorthand is:

> **Who needs attention → why → what happened → what happens next → act without restarting the relationship.**

## Current architectural starting point

The roadmap should extend existing CoverageFit primitives rather than invent parallel systems.

### Existing primitives to preserve

CoverageFit already has:

- cf_solo_opportunities as the operating opportunity record;
- cf_solo_tasks / activity history for due work and audit;
- Universal Customer Profile and source provenance;
- Opportunity Priority using Need / Intent / Timing / Fit;
- FIV as a separate qualitative possession lens;
- Next Best Action as the action-selection layer;
- Signal Decision 2 actions: CALL / ASK_ONE_QUESTION / LATER / CLOSE / STOP;
- RingCentral-backed SMS conversation state;
- the Producer Workspace and its current attentionRank() ordering;
- callback scheduling and Google Calendar integration;
- Google free/busy lookup, alternate slots, event create/update/delete, deterministic event IDs, and duplicate recovery;
- booking projection back into CoverageFit / Solo Desk;
- existing appointment sources consumed by Opportunity Priority and NBA;
- the review-first Signal Copilot work in draft PR #7;
- the Producer OS foundation work in draft PR #6.

These are the rails for the next increments.

### Current gaps

The producer workspace still lacks a durable cross-evidence answer to **"who needs me now?"**

The current attentionRank() is useful but narrow. It mostly considers Signal SMS state, pending draft state, quote-ready state and Opportunity Priority queue. It does not yet comprehensively combine:

- same-day / near-term appointments;
- callbacks and explicit follow-up commitments;
- overdue producer promises;
- repeated recent customer engagement;
- accumulated positive evidence;
- active quote comparison language;
- renewal / closing / bind deadlines;
- recent direction-of-travel in intent;
- missed producer response after meaningful inbound;
- customer promises such as "I'll send that tonight";
- producer promises such as "I'll call Monday at 10";
- due work across non-SMS channels.

The calendar stack is also more capable than the current producer UI exposes. CoverageFit can already create Google Calendar events, but the producer cannot yet create, invite, reschedule and cancel a customer-facing appointment directly from an opportunity detail view.

## Architectural distinction: Opportunity Priority vs Attention Priority

Do not replace or overload Opportunity Priority.

### Opportunity Priority

Opportunity Priority answers:

> **Given what is known about Need, Intent, Timing and Fit, how much scarce producer attention does this opportunity deserve in general?**

It remains:

- deterministic;
- evidence-based;
- explainable;
- bounded by Need / Intent / Timing / Fit;
- separate from probability of bind;
- separate from contact permission;
- separate from underwriting or eligibility.

### Attention Priority

Attention Priority answers a different question:

> **Given the current relationship state and the clock, who specifically needs producer attention now, and why?**

Attention Priority is a producer-time orchestration projection. It may use:

- Opportunity Priority;
- current Signal state;
- latest inbound evidence;
- engagement momentum;
- commitments;
- tasks;
- appointments;
- callback times;
- deadlines;
- quote state;
- closing state;
- overdue follow-up;
- suppression / STOP state;
- explicit producer or customer promises.

Attention Priority must remain deterministic and explainable even when AI contributed proposed evidence.

Do not expose a mysterious person-level "AI lead score."

## New durable primitive: Commitment

The two near-term capabilities—attention sorting and calendar actions—should share a normalized Commitment projection.

A Commitment records what one side or both sides said is supposed to happen next.

### Commitment types

Initial supported types:

- CALLBACK
- APPOINTMENT
- FOLLOW_UP
- QUOTE_REVIEW
- DOCUMENT_EXPECTED
- FUTURE_BIND
- CLOSING
- RENEWAL

Do not create a type merely because a message contains a date. The commitment must have a clear operational meaning.

### Commitment fields

The normalized projection should support at least:

- id
- workspace_id
- opportunity_id
- type
- status
- due_at
- window_start
- window_end
- source_kind
- source_id
- evidence_ref
- customer_committed
- producer_committed
- confirmed
- title
- notes
- external_provider
- external_event_id
- external_event_url
- invite_status
- created_at
- updated_at
- completed_at
- cancelled_at

The first implementation may project this contract over existing appointment/task/source state before introducing new persistence. The goal is one normalized interpretation, not an unnecessary migration.

### Evidence vs business state

Keep these layers separate:

**Evidence:**  
"Monday at 10 works."

**Business state:**  
Confirmed appointment Monday at 10:00 AM.

**External action:**  
Google Calendar event created and invitation sent.

An AI model may propose the first interpretation, but the confirmed commitment and external action remain CoverageFit / producer-controlled state.

## Milestone 0 — certify current Signal Copilot work

### SIGNAL-COPILOT-1.0

Finish readiness on the latest PR #7 head before adding these roadmap features into that implementation branch.

Acceptance remains:

- review-first SMS drafting;
- context-aware drafts;
- producer direction / revision;
- ZERO-REPEAT;
- stale-draft protection;
- CONTROL isolation;
- deterministic STOP / DNC / suppression precedence;
- mobile usability;
- provider cost telemetry;
- AI-off manual fallback;
- no autonomous send;
- no production authority expansion.

The purpose of this gate is to stabilize the reasoning surface before new state and action affordances depend on it.

## Milestone 1 — Producer OS foundation alignment

### PRODUCER-OS-FOUNDATION

Land or reconcile the safety and architecture work represented by PR #6 before treating the Producer Workspace as the primary operating surface.

Preserve:

- canonical opportunity identity;
- source provenance;
- population boundaries;
- stage compatibility;
- ownership controls;
- current AgencyZoom automation ownership;
- transactional promotion guarantees;
- no implicit migration of old or ambiguous inventory.

This milestone does not require replacing AgencyZoom. It establishes the durable CoverageFit operating substrate.

## Milestone 1A — AgencyZoom coexistence and data-governance gate

Before CoverageFit becomes the producer's primary operating surface or receives additional CRM-like write authority, apply **docs/AGENCYZOOM-COEXISTENCE-DATA-GOVERNANCE-1.0.md**.

This is a required architecture gate, not a side project.

The objective is:

> **CoverageFit becomes the intelligence and attention operating layer first. AgencyZoom remains the current agency CRM where it is authoritative. CoverageFit earns write authority field-by-field rather than becoming a shadow CRM.**

Required work:

- build a field-level authority matrix: external authority / CoverageFit authority / derived projection / producer-confirmed / compliance hard-state;
- document READ / DERIVE / OWN / WRITE / CONFIRM / RECONCILE / RECOVER / AUDIT behavior for every AgencyZoom-integrated field or action;
- preserve observed AgencyZoom state separately from CoverageFit recommendations;
- define stale/conflict behavior instead of last-write-wins;
- define export and rebuild behavior for CoverageFit-owned state;
- complete Local / Preview / Production provider/secret/binding matrix;
- complete runtime secret-exposure review;
- define minimum retention/deletion rules before broad ingestion;
- preserve STOP / DNC / wrong-number / suppression precedence across systems;
- keep AgencyZoom writes recommendation-only until a narrower write tier is explicitly certified.

This milestone does **not** block read-only lead ingestion, CoverageFit-owned scoring, Signal reasoning, commitments or Attention work. It blocks ungoverned expansion of CRM-like authority.

### Operational experiment policy

Preserve existing CONTROL records and cohort capability. During production crunch, new CONTROL enrollment may be paused or reduced rather than withholding the improved workflow from a large share of usable leads. Do not retroactively relabel historical CONTROL records.

## Milestone 2 — durable conversation state

### SIGNAL-COPILOT-1.1

Strengthen the state that survives beyond a single SMS draft.

Add:

- compact CoverageFit-owned thread summary;
- shopping-reason evolution;
- objection evolution;
- known-answer ledger;
- customer commitments;
- producer commitments;
- callback / follow-up dates;
- promised document / information delivery;
- meaningful state-change detection;
- explicit conflict / ambiguity handling;
- contextual re-entry after days or weeks;
- update reason / provenance;
- producer correction path.

### Required contract

The system must distinguish:

- customer evidence;
- business state;
- producer direction.

For example, producer direction such as "ask if financed too" must not become a customer fact.

### Commitment extraction behavior

Conversation reasoning may propose:

- commitment type;
- date/time;
- who committed;
- confidence;
- evidence span;
- whether confirmation is required.

But deterministic validation should reject or hold ambiguous dates/times rather than guess.

### Exit criteria

A producer should be able to reopen a conversation days later and immediately understand:

- what the customer is trying to do;
- what changed;
- what is known;
- what is still missing;
- what either side promised to do next.

## Milestone 3 — cross-evidence producer attention

### SIGNAL-ATTENTION-1.0

This milestone upgrades the current attentionRank() concept into a durable producer-facing Attention Projection.

### Core question

> **Who needs attention now, why now, and what is the smallest effective next action?**

### Inputs

Attention Projection may consume:

- current Signal Decision 2;
- current Signal priority;
- Opportunity Priority projection;
- NBA;
- latest inbound timestamp;
- latest outbound timestamp;
- unresolved inbound state;
- recent reply count / engagement momentum;
- explicit proceed / quote / contact requests;
- quote readiness / quote sent state;
- appointment / callback commitments;
- task due dates;
- producer promises;
- customer promises;
- renewal / closing / bind deadlines;
- FUTURE_BIND date;
- stage / closing state;
- suppression / STOP / wrong-number state.

### Example attention bands

Initial user-facing bands should be qualitative, not an unexplained score:

- NOW
- TODAY
- HIGH
- UPCOMING
- NORMAL
- WAITING
- SUPPRESSED

Internal deterministic rank values are acceptable for stable sorting.

### Ordering rules

Hard state must outrank heuristic attractiveness.

Suggested precedence:

1. STOP / DNC / wrong-number / hard suppression → remove from actionable queue.
2. Explicit request to proceed / bind / quote / call now.
3. Unanswered meaningful inbound requiring human response.
4. Appointment or callback due now / within configured near-term window.
5. Overdue producer commitment.
6. Same-day follow-up / quote review / closing commitment.
7. High or urgent recent Signal evidence.
8. Strong engagement momentum plus active shopping evidence.
9. Opportunity Priority shoot_now / quick_play.
10. Quote-ready / quote-sent follow-up.
11. Upcoming appointment / callback.
12. Develop / nurture / low-priority fallback.
13. Stable tie-breakers such as due time, last meaningful inbound, updated time, ID.

### Perishability

Attention must decay when the reason expires.

Examples:

- yesterday's "call me now" cannot stay NOW indefinitely;
- a passed appointment becomes overdue / disposition-needed, not permanently high-intent;
- an old active-shopping statement weakens unless refreshed;
- a FUTURE_BIND record should rise only as its return window approaches.

### Why-now explanation

Every elevated record should expose a compact list of evidence-backed reasons.

Examples:

**Needs attention now**
- Appointment at 10:00 AM today
- Proposal already sent
- Customer confirmed yesterday

**High intent**
- Asked for comparison quote
- Replied 3 times in 48 hours
- Current premium known
- No producer response after last inbound

**Waiting**
- Customer promised declarations page tonight
- No useful producer action until tomorrow

### Producer Workspace UI

Add sort modes:

- Recommended
- High intent
- Due now
- Newest

Add filters where useful:

- Today
- Callback
- Appointment
- Quote follow-up
- Future Bind
- Waiting on customer
- Waiting on producer

Default behavior should eventually become Recommended, but only after certification against current Work ordering.

### Opportunity-row presentation

Each row should show:

- person / opportunity;
- product;
- attention band;
- one-line why-now reason;
- next commitment if any;
- next action;
- relevant time.

Do not overload the row with every score.

### High-intent sort

"High intent" is a view over evidence, not a new black-box score.

It should preferentially surface:

- explicit shopping / comparison language;
- repeated recent engagement;
- quote requests;
- current price / coverage comparison;
- proceed language;
- active objection resolution;
- appointments / callbacks;
- recent meaningful state advancement.

It must not use protected traits, health, credit, income, inferred affluence or demographic proxies.

### Exit criteria

CoverageFit should surface the kinds of missed opportunities that currently require manual transcript searching.

A bounded historical replay should demonstrate that known high-intent messages and same-day commitments rise above ordinary inventory without violating suppression or population boundaries.

## Milestone 3A — producer action quality

### COVERAGEFIT-PRODUCER-ACTION-QUALITY-1.0

Before adding more action providers, reconcile the existing reasoning layers into one producer-facing instruction.

Every **actionable** Work row must answer:

1. **Why now?**
2. **What exactly should the producer do?**
3. **What evidence supports that recommendation?**

This is a reconciliation projection, not a new source of authority.

#### Authority model

- Attention owns **why now**.
- Signal Decision 2 owns the current governed SMS disposition.
- Commitments own due/overdue recorded obligations.
- Opportunity Priority owns general scarce-attention allocation.
- NBA owns broad opportunity-level action selection.
- Contact safety outranks all of them.

#### Precedence

1. STOP / DNC / wrong-number / suppression.
2. Signal STOP / CLOSE / LATER.
3. Due or overdue confirmed commitment.
4. Current Signal Decision 2.
5. Upcoming confirmed commitment.
6. NBA.
7. Opportunity Priority remains supporting evidence unless used by Attention/NBA.

Attention urgency must not silently replace the exact current conversation action.

For example:

- Attention: NOW — explicit customer signal
- Signal Decision 2: ASK_ONE_QUESTION
- Opportunity Priority: shoot_now
- NBA: CONNECT_OR_PREPARE_NOW

The producer action remains the one governed question until conversation state changes.

#### Exit criteria

- list and detail agree on the same exact action;
- every actionable row shows Why / Do / Evidence;
- STOP/suppression cannot be overridden;
- CONTROL receives no action-quality guidance;
- current Signal Decision 2 cannot be overwritten by a generic Opportunity Priority/NBA recommendation;
- due commitments can supply the exact task when they are the clock reason;
- no new external write or autonomous action authority is added.

Canonical contract: `docs/COVERAGEFIT-PRODUCER-ACTION-QUALITY-1.0.md`.

## Milestone 4 — producer calendar actions

### CALENDAR-ACTIONS-1.0

Expose the existing Google Calendar capability inside the Producer Workspace.

This is a deterministic producer action, not an AI-autonomy milestone.

### Reuse existing infrastructure

Reuse and refactor around the existing callback scheduling stack:

- Google OAuth refresh token configuration;
- free/busy lookup;
- alternate slot discovery;
- event create / get / update / delete;
- deterministic event IDs;
- duplicate recovery;
- CoverageFit booking records;
- Google event ID / URL;
- public appointment page where appropriate;
- Solo Desk / opportunity projection.

Do not create a second Google Calendar adapter.

### Producer workflow

From an opportunity detail:

**Schedule appointment**

Open a compact confirmation surface containing:

- prospect name;
- date;
- time;
- duration;
- timezone;
- phone;
- email;
- event title;
- description preview;
- checkbox: **Send calendar invitation to prospect**.

Default title pattern:

Insurance Review — [Prospect Name]

Default duration:

20 minutes for producer-created insurance review calls unless explicitly changed.

### Attendee invitations

Extend the existing Google event body to support attendees when:

- the producer explicitly chooses to invite;
- a valid prospect email is known;
- contact state does not prohibit the action.

The Google Calendar request should use the appropriate guest-update behavior so the attendee receives the invitation.

Never infer an email address.

### Idempotency and duplicate protection

Before creation:

- check for an existing CoverageFit appointment for the opportunity/time;
- check the deterministic external event identity where applicable;
- do not create a second event because of a network retry;
- recover after ambiguous provider acceptance before retrying.

### Reschedule

Rescheduling should:

- update the same CoverageFit commitment;
- update the same Google event when owned by CoverageFit;
- preserve the external event ID;
- send guest updates when an attendee was invited;
- update Attention Priority;
- update NBA;
- preserve audit history.

### Cancel

Cancellation should:

- mark the CoverageFit commitment cancelled;
- cancel/delete the owned Google event using the existing calendar adapter;
- notify invited attendees through the provider update flow when appropriate;
- preserve historical evidence that the appointment existed;
- recompute NBA / attention.

### Appointment state in the opportunity

After creation, the opportunity should show:

- appointment date/time;
- status;
- invite status;
- email invited;
- Google Calendar link;
- reschedule action;
- cancel action.

Calendar is not the source of truth for the relationship. CoverageFit retains the business commitment and external linkage.

### Exit criteria

From one opportunity detail, the producer can create, invite, reschedule and cancel a controlled test appointment without opening Google Calendar manually.

The corresponding appointment must feed Opportunity Priority / NBA / Attention Projection.

## Milestone 5 — attention and calendar convergence

After SIGNAL-ATTENTION-1.0 and CALENDAR-ACTIONS-1.0 are both available, connect the loop.

Example:

1. Prospect confirms Monday at 10.
2. Commitment is confirmed.
3. Producer creates appointment and sends invite.
4. CoverageFit stores Google event linkage.
5. Appointment becomes evidence/state on the opportunity.
6. Attention Projection marks it UPCOMING.
7. On Monday morning it rises to TODAY.
8. Near 10:00 it rises to NOW.
9. After the scheduled time it becomes disposition-needed if no outcome is recorded.
10. Producer records outcome and next commitment.
11. The old appointment stops driving attention.
12. Any new follow-up date becomes the next return trigger.

This is the first complete expression of:

> **Evidence → commitment → action → clock → attention → next action → outcome**

## Milestone 6 — call intelligence

### SIGNAL-COPILOT-1.2

After the durable commitment and attention layers are stable, add RingCentral call transcripts as another evidence channel.

Calls should update the same:

- customer evidence;
- conversation summary;
- shopping reason;
- objections;
- commitments;
- follow-up dates;
- Attention Projection;
- NBA.

Do not build a separate call-priority model.

## Milestone 7 — visual and document evidence

Continue the existing roadmap:

- VISUAL-COPILOT-1.0;
- optional shortcut / companion after measured need;
- DOCUMENT-COPILOT-1.0.

Each new input source must be able to create evidence and propose state changes without bypassing the commitment / attention / action rails.

## Milestone 8 — PRODUCER-CONTEXT-1.0

Unify governed evidence across:

**AgencyZoom RAW + SMS + calls + screenshots + documents + email + manual notes**

The context layer must answer:

- what is established;
- how we know it;
- when we learned it;
- what changed;
- what conflicts;
- what is missing;
- what commitments are open;
- what deserves attention now.

## Milestone 9 — mature Signal

The mature producer operating system should answer, in seconds:

1. Who needs attention?
2. Why now?
3. What changed?
4. What is known / missing?
5. What is the smallest effective next action?
6. What commitment is due next?
7. What action is CoverageFit waiting for Dylan to approve?

This phase refines the earlier Attention Projection rather than introducing attention for the first time.

## Milestone 10 — PRODUCER-ACTION-1.0

Once reasoning is reliable, allow Copilot to propose bounded operational actions:

- create appointment;
- create callback;
- reschedule appointment;
- request document;
- draft email;
- prepare quote checklist;
- suggest FUTURE_BIND;
- suggest review-required state.

Initial authority remains:

> **Suggested action → producer review → explicit approval → action**

AI never gains action authority merely because its recommendations test well.

## Producer-day target state

The near-term target is not a generic CRM replacement.

A producer opening CoverageFit should increasingly see:

### Today

A prioritized list of people requiring attention, with why-now context.

### Inbox

Meaningful inbound customer communication requiring review.

### Opportunity detail

The durable relationship context, known evidence, commitments and next action.

### Actions

Call, reply, schedule, reschedule, request, prepare or defer—without rebuilding context in another system.

### Pipeline

Durable sales progress without silently renaming current AgencyZoom / Solo Desk stage models.

### Automations

Visible system-owned waiting / follow-up state, introduced only as ownership is explicitly migrated.

## Safety and compliance invariants

The following outrank prioritization and convenience:

- STOP / DNC / suppression;
- wrong-number handling;
- consent / channel authorization;
- CONTROL isolation;
- population / experiment integrity;
- no protected-trait prioritization;
- no inferred underwriting or eligibility conclusion;
- no autonomous SMS / email / calendar invitation;
- no hidden identity merging;
- no duplicate provider actions on retry;
- no treating calendar presence as proof that a call occurred.

An appointment being due does not mean the call happened. Outcome requires explicit evidence.

## Testing requirements

### Attention tests

Cover:

- explicit proceed;
- unanswered inbound;
- repeated recent replies;
- quote requested;
- quote sent;
- same-day appointment;
- same-day callback;
- appointment within 24 hours;
- passed appointment;
- overdue producer promise;
- customer promise with future wait;
- renewal / closing deadline;
- FUTURE_BIND approach;
- stale old intent;
- STOP / suppression precedence;
- CONTROL exclusion;
- incomplete Opportunity Priority;
- deterministic tie-breaking.

### Calendar tests

Cover:

- create without attendee;
- create with attendee;
- invalid / missing email;
- duplicate click;
- provider timeout after event acceptance;
- collision / busy slot;
- alternate slot;
- reschedule;
- cancellation;
- attendee update;
- existing event recovery;
- stale / foreign event ID;
- appointment projection to opportunity;
- Attention / NBA refresh after create/update/cancel.

### End-to-end certification

Use synthetic or operator-controlled contacts only.

Verify:

**Opportunity → Schedule → Google event → attendee invite → CoverageFit commitment → Attention refresh → Reschedule → Google update → Cancel → CoverageFit historical state**

No production prospect should be used solely as a test fixture.

## Rollout sequence

1. Documentation / contracts.
2. Read-only Attention Projection in shadow.
3. Compare projected ordering against current Work ordering and real producer judgment.
4. Add optional Recommended / High Intent / Due Now sorts.
5. Make Recommended default only after observed usefulness.
6. Add calendar action UI behind a producer-only flag.
7. Certify create/update/cancel without attendees.
8. Certify attendee invitations with controlled email.
9. Enable producer calendar actions.
10. Later allow Copilot to propose these actions, still requiring approval.

## Measurement

Measure whether these features reduce producer leakage and friction.

Suggested metrics:

- high-intent inbound left unanswered > X hours;
- same-day commitments missed;
- appointments surfaced before due time;
- producer time from opportunity open to next action;
- number of manual app/context switches;
- duplicate calendar events;
- appointment invite success;
- reschedule / cancel consistency;
- opportunities reactivated from missed high-intent evidence;
- proportion of prioritized records whose why-now explanation the producer accepts as useful.

Do not optimize for a vanity score or notification volume.

## Explicit non-goals for this slice

Do not use this roadmap as permission to:

- replace AgencyZoom wholesale;
- launch autonomous outbound;
- build a generic calendar product;
- build a generic task manager;
- create a black-box AI lead score;
- collapse Opportunity Priority, FIV, NBA and Attention Priority into one number;
- infer customer intent from protected or sensitive traits;
- treat a scheduled event as proof of contact;
- build a separate memory store for each channel;
- add a new Google Calendar transport beside the existing adapter.

## Canonical near-term sequence

**Execution order is the seven-phase Master Roadmap 2.0 at the top of this file.** The detailed Milestones 0–10 remain capability specifications and acceptance guidance, not a competing run order. Proceed now through:

1. **Phase 1 — Integration and safety:** consolidate PR #7/#12, reconcile PR #6/#8/#11 overlap, keep PR #9 and #10 behind their own gates, green exact-head CI and configuration audit.
2. **Phase 2 — Action Quality certification:** isolated hosted Work list/detail, CALL / ASK_ONE_QUESTION / due work / STOP/CONTROL cases, known evidence and flags-off fallback.
3. **Phase 3 — Closed communication loop:** RingCentral inbound webhook/subscription, explicit approved send and idempotent delivery, valid follow-up projection, 408FARMERS lead notifications only after separate canary.
4. **Phase 4 — Producer daily use:** trusted Today/Inbox/work detail, explainable tasks and commitments, governed calendar actions when certified.
5. **Phase 5 — Controlled SIGNAL economics:** fixed cohorts, correct numerator/denominator, usefulness and premium per productive hour.
6. **Phase 6 — Scale only by evidence and approval:** capacity, one owner per automation family, shadow evaluation, acquisition satellite routing.
7. **Phase 7 — Optional enrichment:** call, document, visual/desktop and cross-channel context without duplicating trust/authority.

**Next exact release gate (updated 2026-10-12):** Phase 3 read-only RingCentral sender/subscription/webhook/recovery status audit and missing-config inventory; then replay/ownership/idempotency regression and one separately authorized controlled end-to-end lead-to-follow-up canary in isolated Preview. Phase 1 PR integration and production merge/rollout still require separate approval. No new customer-facing send authority follows from the Phase 2 PASS.
