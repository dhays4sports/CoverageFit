# CF-SIGNAL-DECISION-1.0

**Build:** CF-SIGNAL-DECISION-1.0  
**CoverageFit baseline:** v3.20.256  
**Status:** Signal decision architecture / pre-production  
**Date:** 2026-09-20

## Purpose

CoverageFit becomes the canonical decision authority for anonymous 408FARMERS Signal Sessions without turning those sessions into leads.

The browser should be able to ask:

> Based on the bounded evidence supplied so far, what is the single most useful next action?

CoverageFit may answer:

- `ASK_ONE_SIGNAL`
- `OFFER_HUMAN`
- `OFFER_LEARN`
- `CONTINUE_LATER`

The public response never exposes Opportunity Priority score, queue points, dimensions, underwriting conclusions, pricing, eligibility, or contact authority.

## Architecture

```text
408FARMERS SignalSession
        ↓
POST /api/signal/decision
        ↓
Signal input validation
        ↓
Anonymous Signal adapter
        ↓
Opportunity Priority engine
(evidenceMode = signal)
        ↓
Public decision sanitizer
        ↓
ASK / HUMAN / LEARN / LATER
```

There is one scoring truth. Signal Decision does not copy the 30/25/25/20 weights.

## Signal evidence mode

The existing Opportunity Priority engine may treat recent structured lead engagement as weak Intent evidence.

That behavior is valid for a real lead, but not for anonymous signal capture. Merely answering a web question is not buying intent.

`evidenceMode: 'signal'` therefore disables the `recent_structured_engagement` inference while preserving the rest of Opportunity Priority.

## Anonymous request contract

Accepted top-level fields:

```text
schemaVersion
signalSessionId
flowId
flowVersion
canonicalSignals
attribution
```

No name, email, phone, DOB, SSN, driver license, VIN, health information, or full street address is accepted.

Signal values are canonical option codes, not free-form prose.

## Supported canonical signal fields

- product
- statedTrigger
- shoppingIntent
- decisionTiming
- reviewReason
- renewalTiming
- closingDate
- propertyType
- autoNeed
- businessNeed
- businessType
- professionalProgram
- lifeCoverageStatus
- lifeProtectionTrigger
- lifeGoal

`closingDate` is the only date-valued field. Other values must be approved canonical option codes.

## Opening-question policy

Signal Decision does not blindly use the producer-side missing-dimension order for a blank consumer session.

For a newly selected product:

- Life → ask personal coverage status first
- Home → ask what changed / why they are looking
- Auto → ask what changed / why they are looking
- Business → ask what changed / why coverage is needed
- Unknown product → ask which product the visitor wants help with

After that opening evidence exists, Opportunity Priority determines the next missing fact.

## Public decision semantics

### ASK_ONE_SIGNAL

Returned when another bounded fact can materially improve routing.

The response includes a declarative `nextQuestion` object with:
- stable question ID
- dimension
- prompt
- canonical field
- bounded option codes and labels

### OFFER_HUMAN

Returned only when the underlying Opportunity Priority is evidence-complete and falls in:
- Shoot Now
- Quick Play

Commercial additionally requires `businessType` before the public handoff is offered.

### OFFER_LEARN

Used for completed but weaker/early evidence where education is more appropriate than producer interruption.

### CONTINUE_LATER

Used when current evidence does not justify a sales conversation, including explicit no-current-interest state.

A human override remains a public action option on non-human routes; accepting that action belongs to the later handoff/promotion phase and must create explicit contact state.

## Life sequence

Typical high-value sequence:

```text
lifeCoverageStatus
  → shoppingIntent
  → decisionTiming
  → OFFER_HUMAN or lower-friction outcome
```

If the user already owns personal coverage, coverage status alone does not prove Need. When necessary, CoverageFit asks `life_protection_goal` rather than pretending current coverage is a protection gap.

## Business exception

Commercial traffic must establish a basic business class before `OFFER_HUMAN`.

This does not currently add Fit points. It is a routing/handoff requirement so the producer is not handed a high-priority commercial conversation with no idea what kind of business is involved.

## Security and privacy

The public endpoint:

- is stateless
- does not persist SignalSession content
- does not create a lead or opportunity
- does not grant contact permission
- rejects identity/contact/health fields
- rejects arbitrary free-form signal values
- restricts browser origins
- is D1 rate-limited fail-closed
- has an 8 KB request limit
- does not use cookies or CORS credentials
- returns no internal priority score

Default allowed production origins:
- https://408farmers.com
- https://www.408farmers.com

Additional preview origins can be configured through `CF_SIGNAL_ALLOWED_ORIGINS`.

Localhost is disabled unless `CF_SIGNAL_ALLOW_LOCALHOST=true`.

## API route

`POST /api/signal/decision`

Preflight:
`OPTIONS /api/signal/decision`

Rate limit:
90 requests / minute / client IP, fail-closed when D1 rate-limit state is unavailable.

## Phase boundary

This build does not:
- persist anonymous Signal Sessions server-side
- create AgencyZoom leads
- create CoverageFit opportunities
- collect contact identity
- grant consent
- book callbacks
- send SMS/email
- migrate a 408FARMERS production page

The next 408FARMERS package should replace the local lab decision adapter with this API and then build the Life pilot on top of the same Signal Shell.
