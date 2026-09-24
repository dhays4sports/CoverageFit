# CoverageFit North Star

**Document:** CF-NORTH-STAR-1.0  
**CoverageFit baseline:** v3.20.256  
**Status:** Product North Star / long-range architectural reference  
**Date:** 2026-09-20

## North Star

CoverageFit should ultimately become a **persistent consumer protection-intelligence platform**: a place where a person or household can understand what insurance protection they have, what has changed, what may deserve attention, and what useful action to take next.

The shorthand is:

> **Credit Karma for insurance protection — not a quote marketplace, not a generic CRM, and not merely a service portal.**

CoverageFit should earn an ongoing consumer relationship by providing useful, evidence-grounded protection intelligence first. Recommendations, producer involvement, product expansion, and transactional opportunities should follow from that utility rather than replace it.

## The long-term consumer loop

CoverageFit should evolve toward this recurring loop:

**Snapshot → Understand → Add Evidence → See What Changed → Consider Recommendations → Act → Monitor → Life Changes → Update → Reassess**

A consumer should be able to return months or years later and still recognize the same living protection profile rather than starting over.

## What CoverageFit should know over time

CoverageFit's Universal Customer Profile should gradually become a durable protection graph with distinct, governed domains.

### Household
- People and household relationships
- Dependents and relevant life-event context
- Contact preferences and consent
- Historical relationship with the agency / advisor

### Property and exposures
- Primary residence
- Condos / townhomes
- Rental and investment properties
- Vehicles
- Businesses and commercial exposures
- Other material insurable assets when explicitly provided

### Insurance
- Home / condo / landlord
- Auto
- Umbrella
- Life
- Commercial
- Other supported lines
- Carrier, term, limits, deductibles, key endorsements and renewal dates when evidence exists

### Protection evidence
- Uploaded declarations and policy documents
- Producer-verified recommendations
- SmartDevices / mitigation information
- Customer-reported changes
- Historical CoverageFit snapshots and revisions

### Opportunity history
- Why the customer entered
- What changed
- Recommendations made
- Decisions taken
- Policies ultimately bound / not bound
- Open and completed follow-up actions

## Two views of one underlying relationship

CoverageFit should support two projections from the same governed customer/opportunity state.

### Consumer view
The consumer should see only information that is useful, understandable, authorized, and appropriate for them:

- **Your CoverageFit**
- What is currently known
- What changed since the last review
- Upcoming renewals or relevant dates
- Evidence-backed areas worth reviewing
- Recommendations and open actions
- One useful next action at a time
- Secure ways to add/update evidence and request human help

The consumer should **not** see internal lead-priority constructs such as Fit, Intent, Value, producer queue labels, opportunity economics, suppression states, internal notes, or underwriting workflow details.

### Producer / agency view
The producer should see the richer operational projection needed to allocate scarce human attention:

- Universal Customer Profile
- Opportunities and source history
- Opportunity Priority — Need / Intent / Timing / Fit, with score ranges when evidence is incomplete
- Fit / Intent / Value (FIV)
- Small Ball / attention queue
- Next Best Action (NBA)
- Assignments, tasks and blockers
- Documents and evidence
- Recommendations and client responses
- Opportunity cost / acquisition economics when available

This is the same relationship viewed for two different purposes.

## Current operating architecture

The product family should retain clear responsibilities.

### 408FARMERS — acquisition and intent capture
408FARMERS creates and routes possessions. It should remain lightweight, progressive and low-friction.

It may capture bounded contextual signals, but should not become the customer intelligence engine or CRM.

### CoverageFit — protection intelligence and orchestration
CoverageFit is the system that understands the relationship, preserves state, interprets evidence, prioritizes opportunities, explains what changed, and determines useful next actions.

### Anonymous Signal Decision
Before a person becomes a lead or opportunity, 408FARMERS may hold a lightweight anonymous SignalSession. CoverageFit may evaluate that bounded evidence without persisting it or promoting it into the durable customer graph.

The public decision surface returns only the next useful interaction state — ask one signal, offer human help, offer education, or continue later. Internal Opportunity Priority score, queue, dimensions, underwriting state, eligibility, pricing and contact authority remain private.

Anonymous participation itself is not buying intent. Signal evaluation therefore must not award the weak Intent credit that a real recent structured lead interaction may receive merely because the visitor answered a web question.

A qualified signal is still not an Opportunity. Promotion occurs only after a later explicit human/contact action or another governed promotion event. Contact permission remains a separate object and is never inferred from score or signal strength.

### Policy.box — document intelligence
Policy.box should eventually extract structured, provenance-preserving insurance facts from declarations, proposals and related documents so CoverageFit can use evidence without forcing customers or producers to re-enter known information.

Policy.box should feed CoverageFit rather than become a competing CRM or customer profile.

### SmartDevices — physical protection intelligence
SmartDevices should provide governed protection / mitigation evidence and actionable device guidance where relevant.

It should feed CoverageFit's protection picture without claiming insurer acceptance or replacing underwriting decisions.

### Servicing layer — commodity policy service
ID cards, payments, routine policy servicing, carrier document retrieval and similar functions may be handled by carrier systems, a partner such as a GloveBox-like service, or a future dedicated layer.

CoverageFit does **not** need to recreate every commodity servicing function in order to achieve its North Star.

## The Small Ball operating layer

CoverageFit's near-term agency intelligence should continue to support the long-term consumer platform rather than diverge from it.

The agency-side operating chain is:

**Source → UCP → Opportunity → Opportunity Priority + FIV → Queue → NBA → Assignee / Action**

### Opportunity Priority

Opportunity Priority is the deterministic, explainable producer-attention projection for the signal-first acquisition model.

It asks:

> **Given what is actually known right now, how much scarce human attention does this opportunity deserve—and what single missing signal would most improve that decision?**

A complete Opportunity Priority score is bounded to 100 points:

- **Intent — 30**
- **Timing — 25**
- **Need — 25**
- **Fit — 20**

A score is emitted only when all four dimensions have usable evidence. Missing evidence does not become zero. Incomplete records carry a bounded score range and remain **UNCLASSIFIED** until the next useful signal is captured.

The score is an internal allocation device, not a probability that someone will buy. It must not use protected or highly sensitive characteristics, health information, credit, household income, inferred affluence, or demographic proxies as quality shortcuts. It does not grant contact permission, make underwriting or eligibility decisions, determine price, authorize binding, or alter the consumer Protection Score.

Explicit customer state outranks scoring. A request to proceed, active customer question, explicit contact request, scheduled conversation, or existing closing state must route appropriately even when the numeric projection is incomplete or low.

Intent and relative timing are perishable. Durable protection need may persist, while old “ready now” or “within 30 days” statements must weaken or expire and be reconfirmed. A passed deadline becomes unknown timing rather than a low-timing judgment.

Opportunity Priority and FIV remain separate objects:

- **Opportunity Priority** allocates producer attention from Need / Intent / Timing / Fit.
- **FIV** remains a qualitative possession / relationship lens using Fit / Intent / Value.
- **NBA** determines the exact next action.

Where appropriate, governed FIV evidence may inform Opportunity Priority, but neither object silently overwrites the other.

### Fit
**Can the agency / available carrier path plausibly win this opportunity without disproportionate friction?**

Fit may consider product/class appetite, known operational friction, bundle fit, quote complexity and evidence-backed characteristics. It is a sales-priority signal, not an eligibility, underwriting, pricing or coverage determination.

### Intent
**How close is the customer to making a relevant decision?**

Examples include active shopping, renewal timing, verified nonrenewal, purchase/closing deadline, explicit contact request, appointment, document upload or recommendation response.

### Value
**How economically meaningful or relationship-expansive could the opportunity become?**

Examples include multiple products, bundle potential, multiple properties, commercial relationships, umbrella or life opportunities, and actual premium once verified.

Value describes the opportunity—not the worth of the person.

### Queue
FIV and other governed operational signals can place opportunities into queues such as:

- **SHOOT NOW** — high-priority producer attention
- **QUICK PLAY** — high-intent / easy-execution opportunity
- **DEVELOP** — attractive fit/value with later timing or missing development
- **NURTURE** — legitimate future opportunity
- **LOW PRIORITY** — known weak use of immediate producer time
- **UNCLASSIFIED** — insufficient evidence

### NBA
NBA answers a different question from FIV:

> **What exactly should happen next?**

Priority and next action must remain separate. Two opportunities in the same queue can have different NBAs.

### Signal-first acquisition principle

The operating doctrine is:

> **Expose many → ask little → detect signal → score evidence → route → use human judgment only where it adds disproportionate value.**

408FARMERS should maximize low-friction surface area. CoverageFit should convert responses into governed signals and preserve them. Automation should ask the smallest question that materially improves routing. Dylan / the licensed producer should disproportionately spend time on nuanced discovery, recommendations, objections, underwriting/application guidance, relationship building, and closing.

The primary channel metric should move toward **qualified opportunities per 1,000 exposures**, followed by downstream economics such as bound premium, acquisition cost, producer minutes, and useful revenue per producer hour. Channel/source performance is a separate object from individual Opportunity Priority; a great opportunity can come from a weak channel and vice versa.

### Producer throughput principle
Producer-facing workflows should collapse available intelligence into the clearest useful next action. FIV and NBA should prioritize scarce human attention without creating unnecessary intake friction or starving producers of workable opportunities. When an opportunity is not actionable now, CoverageFit should preserve context and create a dated return rather than repeatedly reworking the possession.

The production surface should therefore favor truthful milestone measurement, fast disposition, and visible pace-to-goal while keeping the deeper customer intelligence available on demand. Activity that did not happen must never be inferred from a click; for example, opening a call link is not evidence of contact.

## Opportunity cost is a first-class product concern

CoverageFit should eventually help answer not merely "what lead is next?" but:

> **Where is the next hour of qualified human attention most likely to be useful?**

Future measurement should distinguish:

- acquisition spend
- producer minutes consumed
- quote / preparation effort
- bound premium
- gross commission / revenue
- retention and expansion
- downstream products / relationships

A free lead is not economically free when it consumes scarce producer time without producing a viable opportunity.

The long-term optimization target should move toward **relationship value and useful revenue per producer hour**, not raw lead volume or vanity conversion metrics.

## Why the consumer North Star and agency intelligence belong together

The agency-side operating system is not a detour from the consumer vision. It creates the primitives the consumer platform will need:

- persistent identity and household state
- zero-repeat information reuse
- governed documents and evidence
- opportunity and recommendation history
- living state and change tracking
- producer review
- next-action orchestration
- protection / mitigation context

Today these capabilities help an advisor work more efficiently. Long term, the same underlying state should help the consumer understand and continuously manage protection.

## Future consumer concepts

CoverageFit may eventually support experiences such as:

### Your CoverageFit
A persistent, mobile-first protection home showing:
- connected / known policies
- recent changes
- upcoming renewals
- open recommendations
- areas worth reviewing
- one prioritized useful action

### Change intelligence
When evidence changes, CoverageFit should explain the delta truthfully:
- new or removed policy
- changed limit / deductible
- changed property / vehicle / household context
- new rental or business exposure
- new life event
- mitigation / SmartDevices update

### Life-event loops
A legitimate life event may create a reason to update CoverageFit and, when appropriate, a new opportunity:
- home purchase
- marriage / partnership change
- new child / dependent
- teen driver
- rental-property acquisition
- business start / ownership change
- significant remodel
- material asset or liability change

Life events should create useful review prompts, not manufactured urgency.

### Evidence-first recommendations
CoverageFit should increasingly distinguish:
- what the customer told us
- what documents show
- what a producer verified
- what a carrier / insurer actually confirmed

Recommendations should be traceable to evidence and should never masquerade as eligibility, approval, binding or carrier acceptance.

## Marketplace restraint

A future marketplace or comparison surface is possible, but it is **not the North Star itself**.

The correct order is:

1. Deliver immediate consumer utility.
2. Build a trustworthy, persistent protection profile.
3. Show evidence-backed changes and useful actions.
4. Earn repeat engagement.
5. Only then surface appropriate ways to act, compare, or purchase.

CoverageFit should not become a disguised lead-generation marketplace where every insight is merely a pretext to sell another product.

## What CoverageFit is not

CoverageFit should resist becoming:

- a generic CRM with insurance branding
- a carrier quoting engine
- a replacement for official carrier policy systems
- a giant intake questionnaire
- an ID-card / billing portal as its primary purpose
- a black-box lead score
- an underwriting or eligibility decision engine
- a consumer risk score that implies objective safety or insurability
- a marketplace before consumer value is established
- a collection of disconnected microsites and features

## Product principles

Future CoverageFit work should preserve these principles.

### 1. Value before friction
Show a useful result as early as truthfully possible. Do not require deep intake before earning the next step.

### 2. Never restart the possession
Reuse compatible information across 408FARMERS, CoverageFit, Policy.box, SmartDevices, appointments and producer workflows.

### 3. Known data should not become a question
Ask only for genuinely missing information needed for the next useful action.

### 4. Evidence over inference
Keep customer-reported, document-derived, producer-verified and carrier-confirmed facts distinct.

### 5. One useful next action
Prefer progressive reveal and a clear next step over dashboards full of equal-priority choices.

### 6. Human advice remains valuable
Automation should create advantage and context, not insert friction between a ready customer and a qualified human.

### 7. Consumer utility is not producer priority
Internal FIV / queue / economics must remain separate from consumer-facing guidance.

### 8. UNKNOWN is not LOW
Missing evidence must not silently become a negative judgment.

### 9. Sensitive traits are not opportunity-quality shortcuts
Do not use protected or highly sensitive characteristics to prioritize service, infer eligibility or value people. Acquisition targeting, underwriting and agency operations must stay within applicable legal, carrier and compliance boundaries.

### 10. Build the smallest durable primitive
Prefer reusable identity, evidence, state, source and action primitives over one-off flows.

## Product evolution

### Now — Advisor effectiveness
CoverageFit helps Dylan / producers:
- understand opportunities
- preserve context
- prioritize attention
- prepare recommendations
- reduce repeat work
- close and follow up more effectively

### Retail — Agency operating intelligence
CoverageFit helps a multi-person agency:
- maintain one customer / household context
- coordinate multiple opportunities
- assign work by role
- route FIV / NBA queues
- understand acquisition economics
- preserve organizational zero-repeat

### North Star — Consumer protection intelligence
CoverageFit helps consumers:
- understand their protection picture
- maintain a living record
- see what changed
- identify evidence-backed areas worth reviewing
- take useful actions
- involve a trusted advisor when human judgment is valuable

## North Star test for future work

Before adding a major feature, ask:

1. **Does this help the consumer understand or manage protection, or help the advisor create that value more efficiently?**
2. **Does it strengthen the durable customer / evidence / opportunity state?**
3. **Does it reduce repeated work or unnecessary friction?**
4. **Does it clarify what changed or what useful action comes next?**
5. **Is CoverageFit the correct system to own this capability?**
6. **Are we building the smallest durable primitive instead of prematurely recreating a carrier, CRM, servicing platform or marketplace?**
7. **Will this still make sense when CoverageFit serves many households, multiple producers and years of relationship history?**

If the answer to these questions is mostly no, the feature probably does not belong in CoverageFit.

## Canonical shorthand

When future product work needs a concise statement of direction, use:

> **CoverageFit is building a living protection profile for consumers and an intelligence layer for advisors. It should help people understand what they have, see what changed, know what deserves attention, and take the next useful action—without restarting the relationship every time.**



## CF-SIGNAL-DECISION-1.0 — Anonymous Signal Decision (v3.20.256)

CoverageFit adds a stateless public decision layer for 408FARMERS Signal Sessions. Anonymous canonical signals are adapted into the existing Opportunity Priority engine under a dedicated signal evidence mode, so there is one scoring truth without treating mere web-question participation as buying intent. Public decisions are limited to ASK_ONE_SIGNAL, OFFER_HUMAN, OFFER_LEARN and CONTINUE_LATER; score, queue, dimensions and producer-only evidence remain hidden. The endpoint rejects identity/contact/health fields and arbitrary prose, rate-limits fail-closed, restricts browser origins, and does not persist, create a lead/opportunity, grant contact permission, price, underwrite or bind. Commercial high-priority sessions must still identify a basic business class before human handoff.

## CF-OPPORTUNITY-PRIORITY-1.0 — Signal-First Producer Attention (v3.20.255)

CoverageFit adds an evidence-gated Opportunity Priority projection built around Need / Intent / Timing / Fit, bounded to 100 points only when all four dimensions are known. Incomplete opportunities carry a score range and one next micro-question instead of treating UNKNOWN as LOW. Explicit customer requests and scheduled conversations override score-derived routing. Intent and relative timing decay while durable need can persist. The producer workspace shows the explainable priority evidence alongside, not instead of, existing FIV. Aggregate exposure rollups add qualified opportunities per 1,000 exposures without person-level impression storage, and the economics layer can show first-year commission per producer hour when explicit commission and actual producer-time evidence exist. Calibration freezes the first ready score and remains observational; CoverageFit never auto-rewrites weights from outcome data. Internal priority does not authorize contact, underwriting, eligibility, pricing, binding, identity merging, or consumer-facing scoring.

## CF-AGED-LEAD-1.0.1 — Aged Lead SMS Reply Intelligence

Added a bounded aged-lead reply layer ahead of generic callback heuristics. It recognizes AgencyZoom-style re-engagement prompts and safely interprets disposition replies, renewal/x-date timing, TEXT/CALL preference, carrier status, and AUTO/HOME/BOTH handoff. Negative/closed language wins over generic affirmation, so replies such as “Yeah, I’m all set” are never classified as open. Renewal-month replies are protected from callback-date routing. Explicit CoverageFit reply contexts are now preserved by the outbound gateway, including `aged_line_of_business`; CALL preference hands off to the existing `callback_time_request` workflow. Structured aged-lead fields are included in producer summaries.

## CF-CALLBACK-ACK-GUARD-1.0 — Scheduled Callback Lock (v3.20.251)

Scheduled callbacks are now treated as a locked booking state for inbound SMS routing. Benign acknowledgements such as “Yes, talk to you soon,” “Sounds good,” “Perfect,” “Thanks,” “See you then,” and 👍 are consumed without an automated reply and without reopening scheduling. Explicit status questions still return the booked time; explicit CHANGE/reschedule and CANCEL language still invoke the existing appointment controls. A bare new day/time while a callback is already scheduled no longer changes or re-enters scheduling automatically; CoverageFit asks whether the prospect intends to reschedule and preserves the existing booking until explicit confirmation. Insurance/service questions and ordinary conversation are allowed to leave the callback router and continue through normal routing. Callback runtime build: RC-SMS-1.10.3.

## CF-AGENT-CAPABILITY-1.0 — Agent-Native Capability Facade (v3.20.252)

CoverageFit now exposes a bounded canonical capability layer for agent-originated distribution while remaining the insurance system of record. The initial interface supports coverage-review requests, callback scheduling, and licensed-agent connection for existing CoverageFit contact references. External platforms such as Muse are distribution adapters rather than canonical business identity or authority sources. `mesh-service-auth-v1` authenticates the Mesh caller; a fresh Mesh `ALLOW` result is still required; and CoverageFit's persisted customer contact/consent state remains authoritative. The runtime defaults to `PREPARE_ONLY`, with `LIVE_BOUNDED` requiring both an explicit execution-mode setting and a second enablement flag after staging validation. Invocation IDs are digest-bound and idempotent, service-auth nonces are replay-protected in D1, and callback retries reuse CoverageFit's deterministic scheduling safeguards. New-contact registration, unrestricted CRM access, carrier quoting/binding, marketing automation, and payment handling remain outside this interface.


## CF-MUSE-LEGAL-SUPPORT-1.0 — Muse Submission Legal + Support Readiness (v3.20.253)

CoverageFit now exposes a public `/support/` destination suitable for third-party connector review and user support. The support page provides a monitored web form plus the existing agency call/text path without requiring a dedicated support inbox. The privacy policy now explicitly covers agent/connector-originated requests, third-party agent-platform privacy boundaries, contact consent, service-provider use, sensitive-information restrictions, and the rule that external platform metadata does not independently authorize insurance binding, payment, or unrelated contact. `/support/` is added to the public sitemap. The existing `/terms/` page remains the canonical Terms of Use.

## CF-MUSE-API-DOCS-1.0 — Raw API Review Surface (v3.20.254)

CoverageFit now exposes a public agent-API discovery endpoint at `/api/agent`, a human-readable `/docs/agent-api/` reference, and an OpenAPI 3.0.3 document at `/openapi.json`. These surfaces document the existing `CF-AGENT-CAPABILITY-1.0` contract for connector review without expanding its authority or capability set. The public docs identify the California-only jurisdiction, existing `408d_...` contact requirement, custom signed `X-Mesh-Service-Auth` boundary, fresh Mesh `ALLOW` requirement, CoverageFit consent checks, idempotency/replay protections, exact inputs for the three bounded capabilities, and the `PREPARE_ONLY` versus explicitly enabled `LIVE_BOUNDED` execution modes. This release does not enable live execution, add new-contact registration, expose CRM data, add quoting/binding, or treat a third-party platform as insurance authority.


## SIGNAL-NORTH-STAR-1.0 — Future economic decision layer

Current runtime: **Signal → Evidence → Deterministic Priority / State → NBA → Execution → Outcome**.
Future direction: **Signal → Evidence → State → Action EV → Execution → Outcome → Learning**.

Action EV is future calibration, not current runtime behavior. Opportunity Priority is Need / Intent / Timing / Fit; FIV is Fit / Intent / Value; NBA selects the next action. None is P(Bind): 82 priority points never means an 82% bind probability. Value is not a fifth Priority dimension. Explicit customer state and suppression outrank scores.

The economic unit is evidence plus a selected action, not an undifferentiated lead. Current intent must be earned by fresh evidence; passed timing becomes UNKNOWN / NEEDS REFRESH. Ask one question only when its answer can change evidence, state, priority or routing. ZERO-REPEAT preserves Evidence(t+1) = Evidence(t) + New Evidence across governed channel transitions; it never authorizes silent anonymous-to-identified stitching.

Optimize useful revenue / producer hour and producer effort / useful conversation. A useful negative disposition can save time without being sales-positive. Preserve Future Bind context instead of repeatedly calling now. CLOSED means no opportunity; STOP means hard suppression.

Future EV(action | state) = expected incremental customer value − expected execution cost. Contactability, response velocity and channel responsiveness may later inform execution success/cost, not intrinsic person quality. No arbitrary points, numeric EV, fake DIG/$ or automatic weight changes are introduced. Calibration remains observational; scoring changes require human review and a new engine version.

market.ad integration is deferred. It is one potential acquisition source, not the North Star. Generic attribution, canonical Signal, exposure, spend and outcome contracts should allow future source and feedback adapters without a core rewrite. Channel economics remain separate from individual opportunity quality. The system must work if market.ad never launches. See [the economic roadmap and conformance evidence](docs/SIGNAL-NORTH-STAR-1.0.md).
