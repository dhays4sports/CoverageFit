# CoverageFit Near-Term Producer Roadmap

**Document:** CF-NEAR-TERM-PRODUCER-ROADMAP-1.0  
**Status:** Canonical near-term implementation sequence  
**Date:** 2026-10-01  
**Repository:** dhays4sports/CoverageFit  
**Scope:** Producer OS, Signal Copilot, attention orchestration, commitments, and calendar actions

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

The recommended sequence is:

1. **SIGNAL-COPILOT-1.0 certification**
2. **Producer OS foundation alignment**
3. **SIGNAL-COPILOT-1.1 — durable conversation state and commitments**
4. **SIGNAL-ATTENTION-1.0 — Recommended / High Intent / Due Now**
5. **CALENDAR-ACTIONS-1.0 — create / invite / reschedule / cancel in CoverageFit**
6. **Attention + Calendar convergence**
7. **SIGNAL-COPILOT-1.2 — calls**
8. **Visual Copilot**
9. **Document Copilot**
10. **PRODUCER-CONTEXT-1.0**
11. **Mature Signal**
12. **PRODUCER-ACTION-1.0**

The reason for moving attention and calendar earlier is practical: CoverageFit already has the Opportunity Priority, NBA, producer-workspace ordering and Google Calendar rails required to make them useful. They close immediate producer-operating gaps without waiting for every future evidence channel to exist.
