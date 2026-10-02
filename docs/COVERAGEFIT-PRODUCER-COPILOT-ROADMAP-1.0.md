# CoverageFit Producer Copilot Roadmap

**Document:** CF-PRODUCER-COPILOT-ROADMAP-1.0  
**Status:** Canonical capability roadmap  
**Date:** 2026-09-30  
**Repository:** dhays4sports/CoverageFit

## Purpose

This roadmap defines how CoverageFit should expand from Signal Reply Copilot into a broader producer-intelligence layer without becoming a generic chatbot, a replacement CRM, or an autonomous sales agent.

The governing principle is:

> **Input → Interpret → Evidence → State Change → Signal → Next Action → Producer Approval → Action**

Every new channel should feed the same governed CoverageFit evidence and Signal state. The model is a replaceable reasoning provider; CoverageFit remains authoritative for identity, provenance, compliance, business state, experiment assignment, and action authority.

## Phase 1 — SIGNAL-COPILOT-1.0

Finish and certify the existing review-first SMS copilot.

Core loop:

**Inbound SMS → understand → extract facts → identify what changed / what is missing → candidate Decision 2 → suggested reply → producer direction → revised reply → producer edit/review → explicit Approve & Send**

Acceptance gates:

- high-quality context-aware drafts;
- ZERO-REPEAT behavior;
- stale-draft protection;
- CONTROL isolation;
- deterministic STOP / DNC / suppression precedence;
- mobile usability;
- cost telemetry and budget controls;
- manual workflow remains available when AI is disabled;
- no autonomous sending.

Production authority remains unchanged.

## Near-term sequence refinement

The near-term implementation order is now explicitly:

1. **SIGNAL-COPILOT-1.0 certification**
2. **Producer OS foundation alignment**
3. **SIGNAL-COPILOT-1.1 — durable conversation state and commitments**
4. **SIGNAL-ATTENTION-1.0 — Recommended / High Intent / Due Now**
5. **CALENDAR-ACTIONS-1.0 — create / invite / reschedule / cancel from the producer workspace**
6. **Attention + Calendar convergence**
7. **SIGNAL-COPILOT-1.2 — call intelligence**
8. Continue Visual Copilot, Document Copilot, Producer Context, mature Signal and bounded Producer Actions.

This refinement moves producer attention orchestration and deterministic calendar actions earlier because CoverageFit already has the required Opportunity Priority, NBA, producer-workspace ordering and Google Calendar infrastructure. These are not separate products; they are missing operating layers on top of existing primitives.

See docs/COVERAGEFIT-NEAR-TERM-PRODUCER-ROADMAP-1.0.md for the detailed contracts, acceptance gates, rollout sequence and test requirements.

## Phase 2 — SIGNAL-COPILOT-1.1

Strengthen durable conversation state.

Add:

- compact CoverageFit-owned thread summaries;
- commitment extraction;
- callback / follow-up date extraction;
- prospect and producer promises;
- objection evolution;
- shopping-reason evolution;
- meaningful conversation state-change detection;
- stronger edit / acceptance evaluation;
- contextual re-entry after days or weeks.

The lead should reopen with durable context rather than requiring the producer to reread the entire thread.

Commitments are now a first-class near-term bridge between conversation evidence, Attention Priority and Calendar Actions. CoverageFit should normalize operational commitments such as CALLBACK, APPOINTMENT, FOLLOW_UP, QUOTE_REVIEW, DOCUMENT_EXPECTED, FUTURE_BIND, CLOSING and RENEWAL while preserving the distinction between customer evidence, confirmed business state and external provider actions.

## Phase 2A — SIGNAL-ATTENTION-1.0

Upgrade the current producer-workspace attentionRank() behavior into a cross-evidence Attention Projection.

Attention Priority answers:

> **Given the current relationship state and the clock, who specifically needs producer attention now, and why?**

It remains separate from Opportunity Priority, FIV and NBA. It may consume current Signal state, Opportunity Priority, unresolved inbound, engagement momentum, commitments, appointments, callbacks, tasks, quote state, closing state, deadlines and suppression state.

Required producer surfaces:

- Recommended sort;
- High Intent sort;
- Due Now sort;
- Newest sort;
- compact why-now reasons;
- next commitment;
- smallest effective next action.

Hard state outranks heuristic attractiveness: STOP / suppression first, then explicit proceed / call / quote requests, unanswered meaningful inbound, due appointments / callbacks, overdue producer commitments, same-day follow-up, high recent engagement, Opportunity Priority and normal fallback ordering.

Do not create a black-box AI lead score. High Intent is an evidence-backed view, not a person-quality judgment.

## Phase 2B — CALENDAR-ACTIONS-1.0

Expose the existing Google Calendar scheduling capability directly inside the Producer Workspace.

Reuse the current Google OAuth, free/busy, alternate-slot, create/get/update/delete, deterministic event ID, duplicate-recovery and booking-projection rails. Do not create a second calendar adapter.

The producer should be able to create, invite, reschedule and cancel an appointment from the opportunity detail view. When explicitly selected and a valid prospect email is known, the Google event may include the prospect as an attendee and send the invitation. CoverageFit should retain the commitment and external event linkage as business state.

Calendar actions are deterministic producer actions and do not need to wait for mature AI autonomy. Later Producer Action work may suggest them, but the producer still explicitly approves execution.

## Phase 2C — Attention + Calendar convergence

Connect appointments and commitments back into Attention Priority and NBA:

**confirmed commitment → calendar action → upcoming attention → due-now attention → disposition → next commitment**

A scheduled event never proves that contact occurred. Outcome requires explicit evidence.

## Phase 3 — SIGNAL-COPILOT-1.2

Extend the same reasoning contract to calls.

RingCentral call transcripts should feed:

- structured facts;
- shopping reason;
- objections;
- commitments;
- follow-up dates;
- conversation summary updates;
- candidate Decision 2;
- best next action;
- follow-up SMS draft;
- bounded coaching observations.

Do not build a separate call-AI product. Calls and SMS are evidence channels into the same Signal state.

## Phase 4 — VISUAL-COPILOT-1.0

Add user-triggered screenshot / screen-capture reasoning inside CoverageFit.

Initial interaction:

**Paste or capture screenshot → type instruction → combine screenshot with current CoverageFit lead context → return answer / extraction / comparison / draft / next action**

Primary intents:

- Ask;
- Extract;
- Compare;
- Draft reply;
- What am I missing?;
- What should I do next?

Vision-derived facts remain proposals with provenance and confidence until validated or confirmed.

Do not continuously stream the producer's screen.

## Phase 5 — VISUAL-COPILOT shortcut / companion

Only after in-app Visual Copilot proves useful, reduce friction further.

Target interaction:

**Hotkey → select screen region → type instruction → CoverageFit result**

Potential contexts include:

- AgencyZoom;
- RingCentral;
- carrier quoting portals;
- lender portals;
- email;
- competitor quote screens;
- policy screens.

Build this only after measured usage demonstrates the highest-value visual workflows.

## Phase 6 — DOCUMENT-COPILOT-1.0

Extend governed interpretation to insurance documents.

Candidate inputs:

- declarations pages;
- competitor quotes;
- FAIR Plan documents;
- Farmers proposals;
- cancellation / nonrenewal notices;
- mortgage / lender requirements;
- inspection notices.

Desired flow:

**Document → extract structured facts → compare to known state → identify material differences → identify missing information → recommend next action**

Document intelligence should feed CoverageFit and Policy.box-compatible evidence rather than create another source of truth.

## Phase 7 — PRODUCER-CONTEXT-1.0

Unify evidence across channels.

Canonical input channels should include:

**AgencyZoom RAW + SMS + calls + screenshots + documents + email + manual notes**

All feed one governed evidence layer capable of answering:

- what is established;
- how we know it;
- when it was established;
- confidence;
- conflicts;
- what changed;
- what is still missing.

The durable context architecture—not the model vendor—is the strategic asset.

## Phase 8 — mature Signal: “What should I do next?”

By this phase, Attention Priority already exists. Mature Signal expands and refines it across all governed channels rather than introducing producer prioritization for the first time.

Once evidence is unified, Signal should answer seven producer questions quickly:

1. Who needs attention?
2. Why now?
3. What changed?
4. What do we know / what is still missing?
5. What is the smallest effective next action?
6. What commitment is due next?
7. What producer-approved action is CoverageFit waiting to execute?

Examples:

**CALL NOW** — explicit quote request, recent engagement, renewal in 12 days, only driver details missing.

**WAIT** — prospect promised declarations page tonight; no useful action until tomorrow.

This is the mature producer operating-system expression of Signal.

## Phase 9 — PRODUCER-ACTION-1.0

Only after advisory reasoning proves reliable, allow CoverageFit to propose bounded operational actions such as:

- create appointment;
- create callback;
- reschedule appointment;
- request document;
- draft email;
- prepare quote checklist;
- suggest FUTURE_BIND;
- suggest review-required state.

Initial rule remains:

**Suggested action → producer approval → action**

Do not infer autonomous authority from reasoning accuracy.

## Shared architecture across all phases

Every new capability should reuse the same durable primitives:

- provider adapter;
- canonical context builder;
- structured output validation;
- evidence provenance;
- customer evidence / business state / producer direction separation;
- ZERO-REPEAT ledger;
- cost governor;
- review / approval gates;
- usage and evaluation telemetry;
- provider portability;
- graceful AI-off fallback.

Do not create channel-specific memory silos.

## Explicit deferrals

Do not prioritize yet:

- generic AI chatbot;
- autonomous SMS;
- autonomous email;
- autonomous quoting;
- autonomous binding;
- general-purpose multi-agent runtime;
- fine-tuning pipeline;
- large vector database merely because AI is present;
- broad CRM replacement;
- customer-facing AI chat unless separately approved.

## Roadmap gate

Before advancing to the next phase, ask:

1. Does the current phase measurably reduce producer friction?
2. Does it strengthen durable CoverageFit evidence/state?
3. Is the producer retaining appropriate action authority?
4. Is the capability reusing the same context and governance rails?
5. Is cost bounded and observable?
6. Does CoverageFit still function when the AI provider is unavailable?
7. Is expansion justified by observed usage rather than novelty?

If not, refine the current layer before expanding.

## Canonical shorthand

> **CoverageFit should progressively understand whatever the producer is already looking at or discussing—SMS, calls, screenshots, documents and other governed evidence—so it can preserve context, identify what changed, and recommend the smallest effective next action without forcing the producer to restart the relationship or hand authority to the model.**
