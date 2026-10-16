# CF-SIGNAL-COMMITMENT-ENGAGEMENT-1.0 — Unified Growth and Relationship Engagement

**Adopted product direction:** 2026-10-16 (principal-approved)  
**Status:** LOCKED STRATEGIC CONTRACT; DRAFT / SHADOW-ONLY ENGINEERING IN PROGRESS; NO LIVE AUTOMATION AUTHORIZED  
**Canonical parent:** [Autonomous Insurance Growth Roadmap 3.0](COVERAGEFIT-AUTONOMOUS-GROWTH-ROADMAP-3.0.md). This is one cross-cutting child contract, **not another roadmap, CRM, sender, customer store, or independent AI agent**.  
**Other governing contracts:** [Dynamic Cadence](CF-SIGNAL-DYNAMIC-CADENCE-1.0.md), [Evidence Flywheel](CF-CONTINUOUS-EVIDENCE-1.0.md), [Near-Term Producer Roadmap](COVERAGEFIT-NEAR-TERM-PRODUCER-ROADMAP-1.0.md), [Hosted Validation Preflight](CF-ROADMAP3-HOSTED-VALIDATION-PREFLIGHT.md), current AgencyZoom authority and SMS safety.

## A. Locked outcome and product identity

CoverageFit is a **Unified Insurance Growth & Relationship Operating System**, with SIGNAL as its evidence-driven decision and attention layer. Optimize useful, compliant customer conversations, fulfilled commitments and verified written premium per producer hour—not sent SMS count, automated turn count, booking count or AI-generated text volume.

**Nonnegotiable rule:** `The smallest effective step toward a valuable, fulfilled insurance outcome—not necessarily the smallest missing question.`

The customer should receive timely, relevant assistance without repeating information. The producer should receive meaningful, contextualized work, not automation noise. No source acquisition, lead score, technical delivery acknowledgement, appointment reservation, or LLM interpretation creates consent, verified customer engagement or binding authority.

## B. One governed interaction, three complementary engagement approaches

SIGNAL Decision 2 remains canonical: `CALL / ASK ONE QUESTION / LATER / CLOSE / STOP`, with separate internal `HUMAN REVIEW`, `NO ACTION` and quote-preparation outcomes already recognized in the C1 planner. **Engagement strategy is a subordinate presentation/handoff recommendation, not a replacement for these actions or a sender authorization.**

1. **COMMITMENT_FIRST**: when the customer has a time-sensitive need, has expressly asked for a producer, is quote-ready, or a meaningful commitment is due, favor a producer call, quote review, or honest booking opportunity before further SMS questions. Do not invent a booked appointment. When the governed decision is a producer handoff, simply hand off; do not send an unsolicited appointment text.
2. **CHOICE_FIRST**: default candidate for a permitted, fresh first-party inquiry with unresolved channel preference. Offer a short call or text assistance **when the canonical decision and approved communication authority permit that specific invitation**. Customer choice is evidence; it does not override restrictions.
3. **QUESTION_FIRST / TEXT_ASSIST**: when the prospect prefers text or one specific answer is genuinely decision-critical, use the existing short deterministic BUYER/HOME/AUTO/LIFE/BUNDLE/BUSINESS/TECH journeys and the minimum relevant question. Do not insist on finishing an intake sequence after a customer requests a quote, call or appropriate next step.

Every meaningful inbound event invalidates/reviews pending cadence work. A scheduled step cannot interrupt an ongoing customer conversation, a confirmed callback, producer takeover or STOP. `LATER` means reevaluation at an evidence-backed time, not guaranteed future SMS.

**Preserve working systems:** `sms-conversation-core.mjs` and `sms-orchestrator-core.mjs` own existing vertical deterministic intake and takeover; `sms-signal-core.mjs` handles contextual prospecting-template replies; `signal-dynamic-planner.mjs` owns governed C1 evaluation; `sms-outbound-gateway.mjs` remains the single guarded transport gateway. Do not conflate the BUYER/HOME/AUTO/LIFE journeys with AgencyZoom FRESH/AGED/QUOTE template identification.

### Commitment fulfillment is a separate, durable state machine

Record **offered → customer preferred time → availability checked → confirmed booking / producer callback obligation → attempted → held/fulfilled or missed/rescheduled/cancelled**, with evidence, timestamp precision, timezone, owner, source, revision and provider/calendar receipts. A proposed slot is not a confirmed booking; a confirmed booking is not a held useful conversation. An actual explicit call request outranks repeated qualification. Double booking, holiday collisions, repeated schedule prompts and contradictory human/automation messages are failures requiring deterministic holds and producer attention.

## C. Acquisition lanes and legitimate contact

Classify bulk imports, day-to-day direct inquiries, prior quotes, renewals, referrals, policyholder service and provider-owned records separately. Use source rights, freshness, observed intent, needed coverage, timing and explicit channel authorization—not raw lead price—as the treatment keys.

- **High-intent, directly requested help**: prompt response/producer attention, commitment-first where warranted, choice-first when channel preference is unknown; preserve closing or renewal deadlines.
- **Verified first-party, SMS-eligible fresh requests**: choice-first default candidate with optional minimal guided intake; don't over-interrogate.
- **Appropriately authorized older inquiries**: relevance/reconfirmation before contact; short, conservative reengagement; honor waiting preferences and stop conditions.
- **Bulk vendor/purchased and district/AgencyZoom inventory**: source-provenance and eligibility review. Importing 1,000 records does not create 1,000 send jobs. **Do not send purchased/third-party-generated lead-list SMS through RingCentral or recast vendor records as first-party;** any alternative channel needs its own legal/agency/provider permission. Existing AgencyZoom cadences stay owned there until approved family-level cutover.

A customer may have HOME and AUTO needs but should not receive competing messages from independent family schedulers. Prospect Memory is canonical, with identity holds and no speculative cross-person merge.

## D. Dynamic Cadence, Delivery Governor, capacity and human attention

Use **three distinct clocks**: (1) SIGNAL next evaluation, (2) permitted communication window/deadline, and (3) actual transmission slot. A due evaluation creates **no entitlement to send**.

The Delivery Governor is a **subordinate deterministic extension of the existing guarded outbound gateway**, not a replacement or new transport. Before any execution it must enforce owner/campaign/sender/source consent, STOP/DNC/wrong-number/CONTROL/TEST, context revision, no duplicate attempts, producer takeover, quiet hours, expiration, per-recipient policy, per-sender capacity and provider delivery reconciliation. Uncertain acceptance is held; never blind-retry.

Forecast 7–30 days of possible demand: new approved enrollments + surviving cohort follow-ups + active vertical journeys + quote/renewal commitments + expected customer replies + producer/manual traffic. Run demand admission with delivery- and producer-capacity limits. Reserve capacity for active customer responses and due human commitments, not simply old FIFO work. Reevaluate or expire low-urgency work when congested. A callback deadline that cannot be served becomes a producer exception, not a secretly delayed text.

**40 messages/minute is not permission to automate.** RingCentral's effective tier, A2P registration, sender/campaign eligibility, permitted automation type, segment accounting and shared-number capacity remain account-specific verification gates. Other AgencyZoom/manual messages may consume unobservable capacity. Never assume a dedicated high-volume product preserves exactly the current standard-number conversational feature set; evaluate provider options separately. No external provider change is authorized.

Delivery statuses and codes are independently audited; provider submitted/accepted/delivered/failed/unknown do **not** imply read or response. Include failure-class breakdown, rate-window bursts, carrier/content/sender restrictions, circuit breakers, redacted telemetry and operator resolution. Historical sampled 73/438 failed RingCentral SMS statuses (16.7%) warrant diagnosis, not a presumption that throttling fixes every failure.

## E. AgencyZoom coexistence and future replacement

One approved cadence owner per `workspace + verified profile + workflow family + permitted channel/campaign`. Existing district stage/cadence remains AgencyZoom-owned. CoverageFit may OBSERVE → SHADOW → run a distinct human-approved synthetic/test-number canary → request scoped agency cutover (inventory, cancel/suppress overlapping legacy jobs and confirm receipts) → run one approved first-party family → compare useful economic outcomes and maintain rollback. Stage and CRM field authority do not silently transfer with cadence ownership. Do not use an alternative sender to evade RingCentral source restrictions.

## F. AI is exception assistance, not the default engine

Deterministic flows own normal routing, questions, STOP, timing, delivery, booking state, agent ownership and irreversible actions. Optional bounded OpenAI interpretation may propose structured facts, unclear preference/date, multiple intents or next-question wording, **with provenance and deterministic validation**. Unsafe/ambiguous responses yield producer review. AI never independently grants consent, creates a quote/bind, sends SMS, confirms a booking without a calendar receipt, changes cadence owner or retries a failed/unknown send.

## G. Historical evidence and measurement

A privacy-minimized review of accessible September–October 2026 RingCentral history found genuine appointment/time responses to appointment-first SMS, meaningful insurance facts through question-first SMS, at least one choice-first response stating a text preference and progressing to a home proposal, and harmful repeated booking prompts including a later opt-out. **This supports a default design choice, not causal uplift.** Inbound windows were more complete than high-volume outbound windows; source mixes differed. Do not commit customer message bodies, identifiers, phone numbers or individual records to this public repository.

**Primary outcome:** Held useful conversations per eligible attempted opportunity, with attributable producer minutes per useful conversation. Track separately: actual SMS-eligible denominator, provider submission/receipt/failure, unique meaningful replies, customer preferred channel, appointment requested/accepted/confirmed/attended, quote prepared/sent, verified binds/premium, duplicate questions, misbookings, opt-outs, total message/segment burden, workload backpressure and SMS delivery exceptions. No experiment is required before improving obvious defects; observe normal operations after authorization rather than inventing attribution.

## H. Phased delivery and gates — preserve Roadmap 3.0

- **Now/P0:** Preserve draft #7→#24 stack, do not merge; finish #24 Section H sanitized read-only Cloudflare owner inventory and distinct hosted acceptance/rollback evidence. Separately obtain read-only RingCentral campaign/sender/automation/error-code capability evidence. No customer query or credential exposure.
- **P1-SHADOW 0.1:** Extend **existing** pure `signal-dynamic-planner.mjs` with a non-authorizing engagement approach projection consuming the canonical decision and versioned facts; test commitment-first vs choice-first vs question-first and all hold/safety precedence. No new database, web route, scheduler, provider call, AI call, SMS or production activation.
- **P1-SHADOW 0.2:** Simulate queued cohorts, 1k/5k multi-source imports, overlapping vertical SMS and SIGNAL steps, 7–30-day capacity, 40/min theoretical ceiling vs verified actual allowable automation, clock/timezone windows, source holds, delivery-reconciliation faults, cancellation, service takeover, and producer workload.
- **P2 conditional:** Only with separate hosted/provider/agency/recipient approvals, controlled first-party human-reviewed test-number communication and proven booking fulfillment, delivery behavior and rollback.
- **P3 conditional:** Narrow separately approved autonomous engagement families only with useful economic and safety evidence; do not make a full chatbot a milestone by default.

### Required P1 0.1 deterministic acceptance

Known direct CALL or quote request never becomes another qualification prompt. Valid confirmed callback does not get scheduled again. Known text preference yields a text-assist candidate. Unresolved fresh first-party inquiry yields choice-first candidate only when communication route is independently eligible. Urgent BUYER timing may yield a commitment-first **advisory requiring canonical decision review**, never an unauthorized external call/message. STOP, opt-out, identity conflict, control, test, purchased list, unknown owner and provider ambiguity yield held/no-outreach. No model, fetch, database, scheduler, calendar or provider access. Existing C1 decision objects and digests remain unchanged.

**Release classification:** Product direction approved; draft SHADOW-only preparation approved; no GitHub merge, Preview/Production configuration, customer/provider action, real scheduled job or automated SMS approved. Existing P0 hosted-read work remains the earliest external dependency.
