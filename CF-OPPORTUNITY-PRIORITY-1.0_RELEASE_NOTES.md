# CF-OPPORTUNITY-PRIORITY-1.0 — Signal-First Producer Attention

**CoverageFit release:** v3.20.255  
**Status:** additive implementation candidate / feature branch  
**Migration:** `migrations/0019_cf_opportunity_priority.sql`  
**Runtime engine:** `CF-OPPORTUNITY-PRIORITY-1.0`  
**Calibration:** `CF-OPPORTUNITY-PRIORITY-CAL-1.0`  
**Date:** 2026-09-20

## Purpose

CoverageFit now has a deterministic internal producer-attention projection for the signal-first acquisition doctrine:

> **Expose many → ask little → detect signal → score evidence → route → use human judgment only where it has disproportionate value.**

The projection is not a consumer score and is not a prediction of who will buy. It allocates scarce producer attention from evidence already present in CoverageFit.

## Canonical dimensions

A complete Opportunity Priority projection is 0–100:

| Dimension | Maximum | Meaning |
|---|---:|---|
| Intent | 30 | Is the customer actually moving toward a relevant decision? |
| Timing | 25 | Is there a current, concrete decision window or deadline? |
| Need | 25 | Is there a meaningful protection, transaction, or coverage problem? |
| Fit | 20 | Is there evidence that this is a workable agency/product path? |

The current implementation uses the strongest supported reason within each dimension rather than summing correlated signals. Supporting reasons are retained for explanation, but do not double-count the same idea.

## UNKNOWN is not LOW

A numeric score is emitted only when all four dimensions have evidence.

If one dimension is unknown, CoverageFit emits a range instead:

- known points become `scoreMin`
- missing dimension capacity becomes part of `scoreMax`
- queue remains `UNCLASSIFIED`
- one next micro-question is returned

Example:

- Need 25
- Intent 22
- Timing UNKNOWN
- Fit 10

CoverageFit returns **57–82**, not 57/100.

The next question for a life opportunity becomes:

> “When would you ideally want the life coverage in place?”

This protects the producer queue from false certainty created by incomplete data.

## Queue mapping

Only evidence-complete scores receive score-derived queues:

- **80–100 — SHOOT NOW**
- **65–79 — QUICK PLAY**
- **50–64 — DEVELOP**
- **30–49 — NURTURE**
- **0–29 — LOW PRIORITY**
- incomplete — **UNCLASSIFIED**

These are internal attention queues, not underwriting or eligibility classes.

## Routing precedence

Opportunity Priority is subordinate to explicit customer state.

The following states beat the score:

1. Explicit request to proceed
2. Active customer question / reply requiring a human
3. Explicit contact request
4. Scheduled conversation
5. Existing closing / recommendation state
6. Waiting blocker / dated follow-up
7. Score-derived routing
8. FIV fallback when Opportunity Priority is unavailable

A low score can never bury a customer who has already raised their hand.

## Evidence-specific decay

Different evidence decays differently.

### Durable evidence
Underlying need can remain relevant until contradicted or updated. Examples include:
- no personally owned life coverage
- employer-only life coverage
- a stated mortgage/income protection goal
- a concrete coverage disruption
- a documented transaction requirement

### Short-lived evidence
Intent and relative timing are treated as perishable.

Current behavior:
- customer-reported intent is full strength through 30 days
- 31–90 day intent evidence is reduced and labeled as aging
- older intent is not used as current intent
- relative timing such as “within 30 days” expires after 30 days
- an absolute future deadline is recalculated each time
- a passed deadline does **not** receive low timing points; timing becomes unknown and CoverageFit asks again

The score therefore does not confuse a historical “ready now” with present-day readiness.

## Life micro-signals

The life lane now understands explicit low-friction signal fields including:

- `lifeCoverageStatus`
- `lifeProtectionTrigger`
- `lifeGoal`
- `shoppingIntent`
- `decisionTiming`

The canonical first life question remains:

> **Do you currently have personal life insurance outside of anything through work?**

Examples of supported Need evidence:
- no personally owned life coverage — 25
- employer-only coverage — 23
- concrete protection trigger — 22
- stated life goal — 15–22

The score does not use health information, medical history, age, protected traits, or inferred affluence.

## Cross-line micro-question contract

Normalized lead context now accepts:

- `shoppingIntent`
- `decisionTiming`
- `statedTrigger`
- `lifeCoverageStatus`
- `lifeProtectionTrigger`

Existing line-specific fields remain available for home, auto, business, and life. Future 408FARMERS pages, SMS flows, and outbound agents can write these same canonical signal fields instead of inventing channel-specific scoring systems.

## Producer handoff

The projection includes:

- score or score range
- evidence completeness
- Need / Intent / Timing / Fit
- strongest supported reasons
- why-now explanation
- already-known facts
- `doNotAskAgain` facts
- missing critical fact
- one recommended micro-question
- recommended opening
- contactability state
- route override, when applicable

This is the ZERO-REPEAT handoff contract. A producer should not restart intake after automation has already captured usable evidence.

## Consent and authority boundary

Opportunity Priority does not create authority.

The projection explicitly does **not**:
- authorize a call, text, email, or marketing message
- infer consent
- determine underwriting
- determine carrier eligibility
- determine price
- determine coverage adequacy
- authorize binding
- merge identity
- alter the consumer Protection Score
- predict a person's buying propensity

Authoritative consent/suppression, carrier, underwriting, recommendation, and binding states remain separate.

## Prohibited scoring inputs

The engine declares the following inputs out of scope for priority scoring:

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
- behavioral-propensity profiles

Opportunity Priority is about evidence of the opportunity, not a judgment of the person.

## FIV relationship

FIV remains a separate object.

- **FIV** answers a qualitative possession question: Fit / Intent / Value.
- **Opportunity Priority** answers an attention-allocation question: Need / Intent / Timing / Fit with evidence completeness and a bounded numeric score.
- **NBA** answers: what exactly should happen next?

Where a governed FIV fit projection exists, Opportunity Priority may reuse it as one piece of Fit evidence. It does not overwrite FIV.

## Acquisition denominator

Migration 0019 also adds `cf_acq_exposure_rollups` so channel measurement can use an exposure denominator without creating person-level impression records.

Supported aggregate exposure bases include:
- first-party visits
- platform-reported impressions/deliveries
- outbound delivered
- direct-mail households
- event attendance
- manual import
- other documented aggregate basis

The acquisition scoreboard now supports:
- exposures
- qualified opportunities per 1,000 exposures
- bound relationships per 1,000 exposures
- verified premium per 1,000 exposures
- spend
- cost per bound relationship
- premium per acquisition dollar

## Revenue per producer hour

The existing economics layer now also exposes:

`firstYearCommissionPerProducerHourCents`

when:
- an explicit first-year commission rate is configured, and
- actual producer minutes are recorded.

This is the implementation of the operating KPI:

> **Revenue per Dylan Hour**

CoverageFit does not invent producer time. Missing time remains missing.

## Calibration

The first evidence-complete Opportunity Priority projection is frozen into `cf_opportunity_priority_baselines`.

The 90-day observational calibration view compares:
- first-ready score band
- opportunities
- binds
- bind rate
- verified premium
- minutes per bind
- premium per producer hour
- individual evidence-signal outcomes

Calibration is **observational only**.

CoverageFit never changes scoring weights automatically. Point changes require explicit review and a versioned engine update.

## Existing opportunity backfill

The producer sync flow includes an idempotent priority backfill.

It:
- finds opportunities with no priority projection or an outdated engine version
- refreshes existing evidence
- derives current FIV when available
- derives Opportunity Priority
- captures first-ready baseline only once
- processes in bounded batches

No customer message is sent by backfill.

## Data objects

### `cf_opportunity_priority_projections`
Current mutable projection.

### `cf_opportunity_priority_baselines`
Immutable first-ready calibration baseline.

### `cf_acq_exposure_rollups`
Aggregate acquisition exposure denominator.

## Runtime/API additions

Producer-only Solo Desk additions:

- `GET /api/solo-desk/priority-calibration?days=90`
- `POST /api/solo-desk/acquisition-exposure`
- `POST /api/solo-desk/priority-backfill`

These use the existing producer authorization boundary.

## Producer UI

The Solo Desk now shows:

- score / score range
- evidence completeness
- Need / Intent / Timing / Fit
- strongest reasons
- the one next micro-question when incomplete
- Opportunity queue before FIV fallback
- exposure-normalized acquisition performance
- Opportunity Priority calibration
- commission / producer hour when configured

The original FIV evidence remains visible separately.

## Deployment order

Do not call v3.20.255 live until all of the following are complete:

1. Review the feature branch.
2. Apply `migrations/0019_cf_opportunity_priority.sql` to the intended D1 environment.
3. Deploy the corresponding runtime build.
4. Open the producer workspace and run **Sync & refresh**.
5. Confirm existing opportunities backfill without duplicate baselines.
6. Verify incomplete records show ranges rather than false scores.
7. Verify explicit proceed/question/appointment states beat score routing.
8. Enter at least one aggregate exposure count and verify per-1,000 metrics.
9. Confirm consumer surfaces never expose the internal priority object.
10. Observe outcomes before changing any point values.

## Explicit non-goals for 1.0

This release does not yet create a numeric referral-partner score. Referral-source performance should remain a separate source/channel object so a partner's value is not mixed into an individual's Opportunity Priority.

This release also does not auto-optimize weights from conversion outcomes, use black-box ML propensity, or infer missing life-insurance facts from demographic characteristics.
