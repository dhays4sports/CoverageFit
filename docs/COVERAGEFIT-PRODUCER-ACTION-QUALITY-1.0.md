# COVERAGEFIT-PRODUCER-ACTION-QUALITY-1.0

**Status:** Active implementation mandate  
**Date:** 2026-10-08  
**Repository:** dhays4sports/CoverageFit  
**Branch:** signal-copilot

## Purpose

Make each actionable Producer Work row answer three questions consistently:

1. **Why now?**
2. **What exactly should the producer do?**
3. **What evidence supports that recommendation?**

This mandate does not replace Attention, Signal Decision 2, Opportunity Priority, Commitments, or NBA. It reconciles their existing authority into one deterministic producer-facing projection.

## Audit findings

### Attention Priority
Question answered: **Why does this relationship deserve producer attention now?**

Strengths:
- clock-aware;
- suppression-aware;
- explains NOW / TODAY / HIGH / UPCOMING / WAITING / NORMAL;
- recent unresolved inbound, due commitments and current urgency can outrank static opportunity scoring.

Boundary:
- Attention does not determine the exact producer action.

### Signal Decision 2
Question answered: **What is the current governed SMS disposition?**

Canonical actions:
- CALL
- ASK_ONE_QUESTION
- LATER
- CLOSE
- STOP

Strengths:
- closest to current conversation state;
- captures compliance, wrong-number, opt-out, human-required, future timing, quote response and bounded one-question qualification;
- STOP/suppression must outrank every sales-priority signal.

Boundary:
- Decision 2 is conversation-specific and does not replace broader opportunity workflow or commitments.

### Opportunity Priority
Question answered: **How much scarce producer attention does this opportunity deserve from Need / Intent / Timing / Fit?**

Strengths:
- evidence-gated;
- separates UNKNOWN from LOW;
- supports shoot_now / quick_play / develop / nurture / low_priority / unclassified;
- can recommend one missing micro-question when evidence is incomplete.

Boundary:
- it is not the exact next action and never grants contact permission.

### Commitments
Question answered: **What did someone say should happen next, and when?**

Strengths:
- preserves callback, appointment, follow-up, quote review, document expectation, future bind, closing and renewal state;
- separates evidence-only timing from producer-recorded commitments;
- due and overdue confirmed commitments can create actionable clock state.

Boundary:
- raw renewal or closing evidence is not automatically a producer commitment.

### NBA
Question answered: **What is the broader opportunity-level next best action?**

Strengths:
- already handles explicit proceed requests, client questions, calendar preparation, Policy.box review, recommendation/closing state, Opportunity Priority and FIV fallback;
- gives a concrete action label and rationale.

Boundary:
- NBA was designed independently of the newest SMS/Attention layer and can be stale or more generic than current conversation state.

## Reconciliation problem

Before this mandate, Producer Work could simultaneously expose:

- Attention = NOW
- Signal Decision 2 = ASK_ONE_QUESTION
- Opportunity Priority = shoot_now
- NBA = CONNECT_OR_PREPARE_NOW

Each statement could be individually valid, but the producer still had to decide which instruction controlled the immediate action.

That is the gap this mandate closes.

## Producer Action Quality projection

New deterministic module:

`server/producer-action-quality.mjs`

Output contract:

- `why_now`
  - Attention band
  - compact reason
  - source reference
  - due time when present
- `action`
  - stable action code
  - producer-readable label
  - channel when known
  - due time when known
  - actionable boolean
  - source authority
- `evidence`
  - bounded provenance-preserving support from Attention, Signal Decision 2, Commitments, Opportunity Priority and NBA
- `precedence`
  - explicit authority order used to resolve collisions

## Precedence

Immediate producer-action authority is:

1. **Contact safety**
   - STOP
   - opt-out
   - wrong number
   - suppression
2. **Signal Decision 2 STOP / CLOSE / LATER**
3. **Due or overdue confirmed commitment**
4. **Current Signal Decision 2**
5. **Upcoming confirmed commitment**
6. **NBA**
7. Opportunity Priority remains supporting evidence unless NBA or Attention uses it.

Important consequence:

> Attention can say **why now** without overriding the exact current Signal Decision 2 action.

Example:

- Attention: NOW — explicit call request
- Signal Decision 2: ASK_ONE_QUESTION — "When does your policy renew?"
- Opportunity Priority: shoot_now
- NBA: CONNECT_OR_PREPARE_NOW

Producer Action Quality returns:

- Why now: explicit customer signal
- Do: ask the one governed missing question
- Evidence: Attention + Signal Decision 2 + Opportunity Priority + NBA

The broader urgency does not silently override the current conversation state.

## UI behavior

When Producer Action Quality is actionable, each Work row should show:

- **Why now:** compact Attention reason
- **Do:** exact producer action
- **Evidence:** top supporting governed evidence

Opportunity detail should show the full evidence list and explicitly state that the projection:

- is deterministic;
- does not grant contact permission;
- does not make underwriting, eligibility, pricing or bind decisions;
- does not mutate AgencyZoom or provider state.

## Safety rules

- DISTRICT_CONTROL receives no Producer Action Quality projection.
- TEST/synthetic records remain excluded from normal Producer Work.
- STOP/suppression cannot be overridden by Opportunity Priority, NBA, quote readiness or commitments.
- CLOSE/LATER cannot be converted back into immediate sales outreach by a generic high score.
- Evidence-only dates do not become producer commitments.
- AI may assist draft generation elsewhere, but it does not own action authority here.

## Initial implementation

Implemented:
- deterministic reconciliation module;
- Producer Work list projection;
- Producer detail projection;
- actionable row rendering for Why / Do / Evidence;
- detailed evidence rendering;
- collision tests for STOP, CLOSE, LATER, due commitments, current Signal Decision 2, Opportunity Priority and NBA;
- CONTROL exclusion.

## Remaining certification

Before broadening scope:
1. fresh full-suite CI must pass;
2. deploy to isolated Preview with Attention enabled;
3. certify at least one controlled actionable fixture for:
   - ASK_ONE_QUESTION;
   - CALL;
   - due callback/appointment;
   - STOP/suppressed;
4. verify Work list and detail agree on the exact action;
5. verify no action surface implies contact permission beyond existing governed state.

## Next slice after certification

After the projection is clean, improve **action specificity** without adding new authority:

- CALL → distinguish explicit callback vs fresh inbound review vs quote response;
- ASK_ONE_QUESTION → preserve the exact approved question and known evidence it fills;
- quote-ready → distinguish prepare quote vs review existing quote;
- commitment actions → use type-specific labels and due-state language;
- NBA fallback → tighten labels where they remain generic.

Do not add calendar mutation, AgencyZoom mutation, autonomous send, or new provider authority as part of this slice.
