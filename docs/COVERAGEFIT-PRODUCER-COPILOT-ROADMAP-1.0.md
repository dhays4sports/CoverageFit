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

Once evidence is unified, Signal should answer five producer questions quickly:

1. Who needs attention?
2. Why now?
3. What changed?
4. What do we know / what is still missing?
5. What is the smallest effective next action?

Examples:

**CALL NOW** — explicit quote request, recent engagement, renewal in 12 days, only driver details missing.

**WAIT** — prospect promised declarations page tonight; no useful action until tomorrow.

This is the mature producer operating-system expression of Signal.

## Phase 9 — PRODUCER-ACTION-1.0

Only after advisory reasoning proves reliable, allow CoverageFit to propose bounded operational actions such as:

- create callback;
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
