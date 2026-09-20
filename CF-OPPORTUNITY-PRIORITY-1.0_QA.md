# CF-OPPORTUNITY-PRIORITY-1.0 — QA Matrix

**CoverageFit:** v3.20.255  
**Branch:** `cf-opportunity-priority-1.0`  
**Date:** 2026-09-20  
**Purpose:** verify deterministic priority behavior, migration safety, routing precedence, ZERO-REPEAT handoff, and exposure/economics calculations before production deployment.

## Automated / executable checks completed

### Runtime syntax

The following touched JavaScript modules were parsed as JavaScript after removing module import/export syntax for the isolated check:

- `server/opportunity-priority-core.mjs`
- `server/opportunity-priority-calibration.mjs`
- `server/solo-desk-repository.mjs`
- `server/next-best-action-core.mjs`
- `server/acquisition-measurement.mjs`
- `server/solo-desk-api.mjs`
- `server/lead-operations-core.mjs`
- `server/solo-desk-sync.mjs`
- `server/economics-core.mjs`
- `assets/js/solo-desk.mjs`

**Result:** PASS.

### Migration syntax / idempotency

`migrations/0019_cf_opportunity_priority.sql` was executed against SQLite with a stub `cf_solo_opportunities` parent table.

Checks:
- first execution succeeds
- second execution succeeds
- all three tables exist
- valid score projection inserts successfully
- invalid exposure count of zero fails the CHECK constraint

**Result:** PASS.

### Producer workspace DOM identifiers

The updated `agent/workspace/index.html` was checked for duplicate `id` attributes.

New required IDs checked:
- `deskExposureForm`
- `deskExposureCampaign`
- `deskExposureStatus`
- `deskPriorityCalibration`
- `deskPriorityCalHeadline`
- `deskPriorityCalMetrics`
- `deskPriorityCalRows`
- `deskPriorityCalWarning`

**Result:** all present exactly once; no duplicate IDs found.

## Priority-engine scenarios

All scenarios below were evaluated at a fixed time so relative timing was deterministic.

### LIFE-001 — fresh high-signal life opportunity

Evidence:
- personal life coverage: employer only
- protection goal: mortgage protection
- intent: ready now
- timing: within 30 days
- product lane: life

Expected:
- Need: 23
- Intent: 30
- Timing: 23
- Fit: 10
- score: 86
- queue: SHOOT NOW

**Result:** PASS.

### LIFE-002 — same opportunity, timing missing

Evidence:
- no personally owned life coverage
- income-replacement goal
- open to review
- no current timing
- product lane: life

Expected:
- score is not emitted
- score range: 57–82
- queue: UNCLASSIFIED
- missing dimension: Timing
- next micro-question: “When would you ideally want the life coverage in place?”

**Result:** PASS.

### LIFE-003 — 60-day-old “ready now / within 30” signal

Evidence is identical to LIFE-001 but lead evidence is approximately 60 days old.

Expected:
- durable Need persists
- Intent is reduced as aging evidence
- relative Timing is no longer current evidence
- score is not emitted
- score range: 51–76
- missing dimension: Timing

**Result:** PASS.

### LIFE-004 — 120-day-old intent and timing

Evidence is identical to LIFE-001 but lead evidence is approximately 120 days old.

Expected:
- durable Need persists
- old explicit shopping intent no longer counts as current intent
- old relative timing no longer counts
- score is not emitted
- score range: 33–88
- missing dimension selected first: Intent
- next question asks whether the customer is actively looking now

**Result:** PASS.

### LIFE-005 — passed absolute deadline

Evidence:
- strong Need
- open Intent
- recorded deadline is already in the past

Expected:
- passed date is not converted to “low timing”
- Timing becomes unknown
- score remains a range
- next question reconfirms desired effective timing

**Result:** PASS.

### ROUTE-001 — explicit proceed beats score

Evidence:
- active task priority 100 / request to proceed
- hypothetical low score

Expected NBA:
- `RESPOND_TO_PROCEED`
- source: explicit client response
- no score-derived delay

**Result:** PASS.

### ROUTE-002 — scheduled conversation beats high score

Evidence:
- future scheduled conversation
- hypothetical Tier A priority

Expected NBA:
- `PREPARE_SCHEDULED_CONVERSATION`
- scheduled appointment remains authoritative

**Result:** PASS.

### ROUTE-003 — incomplete score asks one signal

Evidence:
- provisional Opportunity Priority
- Timing unknown
- range 57–82

Expected NBA:
- `ASK_ONE_SIGNAL`
- label is the recommended micro-question
- no full intake restart

**Result:** PASS.

### ROUTE-004 — complete Tier A

Evidence:
- ready score 86
- queue SHOOT NOW
- no higher-precedence customer state

Expected NBA:
- `CONNECT_OR_PREPARE_NOW`

**Result:** PASS.

## Acquisition denominator math

Synthetic channel evidence:
- 1,000 exposures
- 20 qualified opportunities
- 5 binds
- $5,000 verified bound premium
- $1,000 spend
- 600 recorded producer minutes

Expected:
- qualified / 1,000 exposures = 20
- binds / 1,000 exposures = 5
- verified premium / 1,000 exposures = $5,000
- premium / producer hour = $500

**Result:** PASS.

## Revenue / producer-hour math

Using the same synthetic evidence and an explicit 10% first-year commission rate:

Expected:
- first-year commission = $500
- recorded producer hours = 10
- first-year commission / producer hour = $50

**Result:** PASS.

This check verifies arithmetic only. CoverageFit must use the agency's actual explicit commission-rate configuration if this KPI is used operationally.

## Guardrail assertions

The projection currently asserts:
- `internalProducerPriorityOnly: true`
- `consumerVisible: false`
- `underwritingDecision: false`
- `bindAuthorized: false`
- `identityAutoMerged: false`
- `usesSensitiveDemographics: false`
- `unknownIsNotLow: true`
- `buyingPrediction: false`
- `autoRecalibration: false`

Prohibited scoring inputs are declared in the engine:
- age
- race
- ethnicity
- religion
- sex
- sexual orientation
- health information
- credit
- household income
- inferred affluence
- behavioral propensity

## Manual staging gates still required

These checks require the actual Cloudflare/D1 staging or production-like environment and are intentionally not claimed complete from repository QA alone.

### MIGRATION-001
Apply `0019_cf_opportunity_priority.sql` to the target D1 database.

Verify:
- existing Solo Desk tables remain intact
- projection, baseline, and exposure tables are present
- indexes are present

### BACKFILL-001
Open producer workspace and run **Sync & refresh**.

Verify:
- existing opportunities get current priority projections in bounded batches
- repeated sync does not duplicate first-ready baselines
- no customer communication is sent by backfill

### UI-001
Open representative Tier A–E and incomplete records.

Verify:
- ready records show one score
- incomplete records show a range
- evidence completeness is correct
- N/I/T/F reasons are readable
- micro-question appears only when needed
- FIV remains separately visible

### OVERRIDE-001
Create or locate records with:
- explicit proceed
- active question
- contact request
- appointment
- recommendation / close state

Verify each state outranks score-derived routing.

### CONSENT-001
Verify that a high priority score does not make a prohibited call/text/email action available when the authoritative channel consent/suppression state disallows it.

### CONSUMER-001
Verify consumer/public surfaces do not expose:
- Opportunity Priority score
- priority queue
- FIV
- internal economics
- internal suppression / operations data

### EXPOSURE-001
Record one real aggregate exposure denominator with evidence.

Verify:
- acquisition summary uses the matching source/campaign key
- qualified / 1,000 exposure metric is correct
- repeated request IDs remain idempotent

### ECON-001
If the agency deliberately configures a first-year commission rate and producer attention cost:
- verify units are cents/rates as documented
- verify actual producer minutes are used
- verify missing time is not estimated

## Release criterion

The feature is ready for production only when:
- repository QA remains green
- migration is applied successfully
- backfill is verified
- precedence tests pass in staging
- consumer/internal separation is verified
- no consent regression is observed

Outcome data should then be observed before any scoring weight is changed.
