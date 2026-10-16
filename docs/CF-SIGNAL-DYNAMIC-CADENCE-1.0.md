# CF-SIGNAL-DYNAMIC-CADENCE-1.0 — Evidence-Driven Engagement Orchestration

## 2026-10-16 LOCKED CHILD — Commitment-Oriented Engagement + Shared Delivery Governance

Apply [CF-SIGNAL-COMMITMENT-ENGAGEMENT-1.0](CF-SIGNAL-COMMITMENT-ENGAGEMENT-1.0.md) as the **P1 customer-engagement policy of this existing cadence**. The primary target is the next **valuable fulfilled commitment**, not the next question or another scheduled SMS.

1. Preserve canonical C1 decision and Decision 2 precedences. Add a **SHADOW-only subordinate strategy**: commitment-first for approved high-intent needs/explicit producer requests, choice-first for permitted fresh inquiries with unknown channel preference, question-first for a genuinely needed field or a clear text preference. A strategy never changes send authorization or silently overrides C1 action.
2. Route customer-chosen texting into the existing BUYER/HOME/AUTO/LIFE/BUNDLE/BUSINESS/TECH vertical flows; route a call/quote request into human-owned commitment/quote preparation instead of forcing more intake turns.
3. Distinguish evaluation due time, channel-eligible window and provider transmission slot. Future Delivery Governor, forward cohort capacity forecasts, recipient/producer backpressure and failure-code classification extend the current guarded gateway rather than duplicate it.
4. A confirmed or proposed callback, new inbound, provider ambiguity, producer takeover and STOP invalidate or hold stale outbound steps. One active owner per AgencyZoom/CoverageFit workflow family; no competing campaigns.
5. Treat bulk/vendor acquisition classification and lawful SMS eligibility as separate. Never schedule purchased/third-party-generated list SMS on RingCentral. A documented 40/minute sending figure is neither verified account throughput nor permission to automate.

**First increment:** add a pure proposal helper to the existing C1 module plus no-send tests only. No new runtime sender/schedule, schema, API, model invocation, provider subscription or PR merge follows from this adoption. Continue #24 hosted isolation inventory as the next external dependency.

---


**Terminology/status reconciliation — 2026-10-14:** [Verified integration report](CF-ROADMAP-3-INTEGRATION-READINESS.md). Local C1 planning and C2 durable evaluation are implemented/tested on #18/#19; feedback behavior is covered by the E2/C1/C2 spine. Current Decision Integrity C3 (#20) and **Producer Integration C4 (#21)** are separately named engineering slices. They do not complete this document's **Dynamic Cadence C4 authorized communication canary**, which remains **UNAPPROVED AND UNIMPLEMENTED**. The C3 feedback label below is historical roadmap terminology, not the #20 slice name. Earlier future/next-work language is superseded only for local engineering status; live agency/provider/Production authority gates remain unchanged.

**Status:** PRINCIPAL-APPROVED P1 DESIGN / TEST-ONLY ENGINEERING CONTRACT — NOT A LIVE CADENCE  
**Adopted:** 2026-10-14  
**Priority:** **P1 child of SIGNAL Autonomy**, depending on P1 [Continuous Evidence Accumulation](CF-CONTINUOUS-EVIDENCE-1.0.md) and [Growth Roadmap 3.0](COVERAGEFIT-AUTONOMOUS-GROWTH-ROADMAP-3.0.md).  
**Governing coexistence:** [AgencyZoom authority contract](AGENCYZOOM-COEXISTENCE-DATA-GOVERNANCE-1.0.md), [Operational Gates](COVERAGEFIT-SIGNAL-OPERATIONAL-GATES-1.0.md).  
**Release boundary:** This is a roadmap/engineering decision, not authorization for an SMS, real scheduled job, provider/CRM mutation, D1 schema migration, agency cadence cutover, PR merge or Production deployment.

## 1. North Star: a cadence of decisions, not messages

**CoverageFit/SIGNAL should eventually own the intelligent cadence**—whether, when and why to evaluate a prospect again, what is actually missing, what small next action is justified, or why to wait/hold—**only for separately approved CoverageFit-owned workflow families**. Existing district AgencyZoom campaigns continue under **AgencyZoom ownership** until individually reconciled and explicitly approved for transfer. RingCentral or another approved route transports actual messages, handles receipts and inbound; it is not the source of SIGNAL decisions.

`Permitted new evidence or an evaluation due-time → current versioned Prospect 360 facts → missing/conflicted/stale information and customer intent → action/next evaluation → current workflow owner/consent/sender/campaign/route/frequency/suppression gate → propose, safely wait, human handoff or separately authorized execution → actual receipt/reply/event → evidence reconciliation → next decision.`

**The next evaluation time is NOT the next SMS send time.** A cycle may yield no outreach, a producer call, quote preparation, conflict review or waiting months for a verified renewal window. Optimize qualified conversations, premium and producer attention—not message count.

## 2. Single active cadence owner / authority split

| Family or system | Current owner | Approved destination |
| --- | --- | --- |
| Existing district CRM stages, assignments, active campaigns and cadences | **AgencyZoom** | Remain there until separately approved field/family cutover; CoverageFit can observe/recommend |
| Prospect evidence, candidate facts, renewals, intent, next useful action | **CoverageFit + SIGNAL** (some read-only / SHADOW today) | Canonical, source-traced decision and evidence spine |
| New eligible direct CoverageFit inquiry qualification family | **Not live / no active cadence** | CoverageFit may own scheduling/execution **only** after agency, data, consent, route and release gates |
| Sender, delivery, provider inbound and receipts | RingCentral only when actual campaign/source route allowed | Governed transport, not independent decision owner |
| Producer calls, advice, rating/quote review and binding | Producer / Farmers | Human remains accountable |

Track single family ownership by `workspace_id + verified prospect/profile_id + family_id + channel/campaign`. Proposed states: `AGENCYZOOM_ACTIVE`, `COVERAGEFIT_SHADOW`, `CUTOVER_PENDING`, `COVERAGEFIT_ACTIVE`, `PAUSED_TAKEOVER`, `STOPPED`. Record owner version, producer and source, transition receipt and active scheduled work. **Unknown or double ownership means no CoverageFit automatic outbound.** Never run a CoverageFit message scheduler alongside an active AgencyZoom cadence for the same workflow.

A future **explicit agency-approved cutover** must inventory exact legacy scheduled items; pause/disable only the overlapping family; verify no outstanding send; atomically establish one owner/version; run a test-recipient canary; retain rollback/manual fallback. CRM stage ownership remains separate and does not silently transfer with cadence ownership.

## 3. Evidence- and time-triggered evaluations

**Immediate decision triggers:** new separately permitted first-party intake, actually authenticated/deduplicated SMS inbound, source fact/renewal correction, verified explicit CALL/QUOTE interest, changed producer commitment, stage or family owner change, manual producer takeover, STOP/opt-out/wrong number, confirmed provider receipt or uncertain delivery.

**Timed reevaluation triggers:** confirmed renewal review windows, explicit callback dates, promised follow-up, age-based review of material stale facts, awaiting-response/cooldown expiration, approved delivery/reconciliation review. The date is a reason to reevaluate, not consent to send.

**Schedule policy:** consider evidence relevance and freshness; line-specific quote lead time; customer's stated preferences and previous contact; whether a response is pending; timezone/quiet hours; applicable frequency rules and business/agency constraints; owner and workflow version. Silence is not consent and does not automatically justify escalating a series of reminders. No immutable day-1/day-3/day-7 template as the primary intelligence model.

## 4. Minimal durable workflow/state contract (proposed, not existing schema)

- Identity: `workflow_id`, `family_id`, `family_version`, `workspace_id`, `profile_id`, `opportunity_id`, `cohort`, `population`, `assigned_producer`.
- Ownership: `cadence_owner`, `owner_version`, `agency_cutover_ref`, `human_takeover`, `manual_pause`, `family_authority_scope`.
- Memory: `latest_evidence_watermark`, `profile_projection_version`, `fact_requirements`, `answered_question_refs`, `known_missing_conflicted_stale_fields`, `last_real_inbound_at`, `last_real_outbound_at`.
- Decision: `decision_code`, `why_now`, `evidence_refs`, `next_evaluation_at`, `next_evaluation_reason`, `cooldown_until`, `evaluation_state`, `revision`.
- Authority: source rights and acquisition type, independent contact consent reference, DNC/STOP state, sender number, campaign, provider route policy version, ownership/agency decision; **not** a cached blanket permanent send permission.
- Execution receipts (later): `approval_id`, `attempt_id/idempotency_key`, `provider_message_id`, `delivery_state`, `exception_state`, `last_actual_result`, `retry_reconcile_ref`.
- Privacy/operations: `retention_class`, `created_at`, `updated_at`, `state_expiration` and suitable audit fields, scoped per workspace; not arbitrary permanent raw SMS bodies or sensitive inferred traits.

Workflow internal states (do **not** replace AgencyZoom lifecycle): `EVIDENCE_READY → DECISION_EVALUATED → WAITING_FOR_EVIDENCE / WAITING_FOR_TIME / AWAITING_PRODUCER_REVIEW / PENDING_APPROVED_EXECUTION / PRODUCER_HANDOFF / PROVIDER_RECONCILIATION / HELD / STOPPED / COMPLETE`.

Use an atomic revision/CAS or equivalent stable transaction; durable deduplicated due-time evaluation queue and wakeup; idempotent replay; single execution owner; crash/restart recovery; do not invent receipts or treat approval as delivery. No real scheduler until persistence and permissions are certified.

## 5. Precedence and actual decision logic

1. **STOP/opt-out, wrong number, DNC, TEST, CONTROL, human suppression, prohibited use** → STOP or HELD; no outbound.
2. **Unknown/mismatched identity, source rights, double/unknown cadence owner, producer takeover, no positive channel/sender/campaign consent or prohibited provider route** → HOLD / safe producer exception. An enriched profile does not grant contact authority.
3. **Uncertain provider send result** → DELIVERY_REVIEW, no blind retries or duplicate subsequent sends.
4. **Customer explicitly asks to CALL/QUOTE, or a real due producer commitment exists** → producer handoff, not continued qualification.
5. **Verified future renewal, waiting preference or existing unanswered permitted question** → WAIT until an actually justified reevaluation; never invent renewal dates.
6. **Conflicting important evidence** → human review or one permitted verification question; do not silently select a date.
7. **Decision-critical missing evidence** → propose the **smallest needed question**, only when communication separately eligible; skip information already reliably answered.
8. **Sufficient evidence / no imminent need** → no communication; propose quote/preparation or wait as appropriate.

Distinguish `QUESTION_PROPOSED`, `HUMAN_APPROVED`, `PROVIDER_SUBMITTED`, `PROVIDER_ACKNOWLEDGED`, `DELIVERY_UNCERTAIN`, `ACTUAL_REPLY_RECEIVED`, `PRODUCER_CONFIRMED_OUTCOME`. A new message proposal is not a send receipt.

## 6. Concrete multi-cycle example (fictional)

| Event | Relevant current profile | Next warranted decision |
| --- | --- | --- |
| Direct inquiry | Auto insurance, unknown renewal | When permitted, propose asking renewal date |
| Genuine customer reply | Nov 20, customer-reported | Persist assertion; do **not** repeat renewal question |
| Later genuine reply | Two vehicles, homeowner, source-linked | Skip already known vehicle/homeowner fields; find next material gap or stop asking |
| "Please call me tomorrow" | Express call request and time evidence | Human callback handoff; stop robotic SMS qualification |
| Date changes and conflicts | Two incompatible dates for same policy | Flag conflict, only essential reconfirmation/review |
| STOP/opt-out at any point | Suppressed contact | Cancel conflicting pending communication; keep only lawfully retainable history |
| Distant renewal, no permitted channel | Rich relationship evidence | May reevaluate internal work on due date; **no automatic SMS** |

The value is **a changed decision because new evidence was retained**, not an AI rewrite of the next template.

## 7. Required reuse and provider boundaries

- Reuse `CF-CONTINUOUS-EVIDENCE-1.0` for canonical admission, typed facts, policy-specific renewal conflicts, versioned projection and rights. Do not invent a second cadence database or alternative CRM.
- Retain existing `SIGNAL Decision 2` action vocabulary `CALL / ASK ONE QUESTION / LATER / CLOSE / STOP`, Attention, Producer Action Quality and the existing guarded messaging gateway; don't start another generic outbound API or ungoverned agent.
- **AgencyZoom** retains current district cadence ownership; avoid an overlapping send or stage write. Use the existing AgencyZoom field-authority ladder for any future CRM mutation, and approved reversible cutover for any family.
- **RingCentral** use must comply with the actual sender/campaign/source policy, including **no purchased/third-party-generated lead-list SMS**. Never launder a vendor source into first-party status or claim vendor consent permits a prohibited campaign.
- Real inbound and outbound require actual provider webhook/recovery/dedup and delivery canary, currently **not live-certified**. The accepted 19/19 read-only Preview is not a live scheduled cadence.

## 8. P1 build slices, not a new roadmap phase

**C0 — Audit existing authority and jobs (read-only):** list actual agency-owned cadence families, ownership and scheduled work; map consent/provider rights, existing SMS state and Evidence Flywheel projected facts. Identify exact overlap/stop conditions. No changes to AgencyZoom.

**C1 — Pure dynamic decision planner (test-only):** function consumes a versioned Prospect Profile, source/consent scenario, agency owner state, producer commitments and controlled clock. Returns action category, reason, evidence refs, next **evaluation** time, review/hold state and proposed missing question. No provider call, actual schedule or sender capability.

**C2 — Test-isolated durable state/queue (future after E2 evidence persistence):** revision-safe workflow and idempotent due-time evaluation, conflict-free owner, replay/out-of-order clocks, crash/restart and duplicate-trigger protection. D1 migration and real provider/cadence action remain separately gated.

**C3 — Evidence-feedback SHADOW:** simulator receives permitted synthetic replies, updates the same current Prospect Profile, prevents redundant questions and changes action/time while respecting STOP/CONTROL and no-contact gates. Show only useful producer exceptions.

**C4 — Explicitly authorized human-approved canary:** after verifying agency family cutover, data rights and real provider inbound/receipt/send-once, use allowed operator-controlled recipients and current positive consent. No general public/purchased-list SMS.

**C5 — Separately authorized bounded autonomy:** only one eligible first-party family after real SIGNAL/CONTROL economics, recipient/day frequency limits, kill switch, monitoring, agency signoff, live provider reliability, rollback and independent authorization.

**Dependency:** C1 pure SHADOW can start alongside durable Evidence Flywheel work; C2 needs E2 source/revision persistence. No active cadence can bypass P0 production release, agency and provider gates.

## 9. Deterministic exit tests / economic measurement

Required tests: missing-then-known renewal never re-asked; vehicle/homeowner facts not repeated; CALL/QUOTE and real callback outrank questions; conflicting/precision/date-specific renewal and waiting preferences; absent consent or purchased RingCentral route yields HOLD; STOP/CONTROL/TEST/wrong-number/DNC and producer takeover dominate; AgencyZoom already active prevents CoverageFit scheduling; owner transition race and retry cannot duplicate; duplicate/out-of-order inbound changes evidence only once; quiet-hours/cooldown/timezone and stale clock behavior; no-response does not automatically contact; provider ambiguous result waits for receipt; restart reconstructs one owner and one next evaluation; retention/retraction changes profile and invalidates stale proposals; **zero actual network or messages in SHADOW**.

Measure producer minutes per useful conversation, useful handoffs per hour, redundant questions, unnecessary SMS contact attempts, missed callbacks, decision relevance, duplicate attempts/unsafe replays, eligible-to-engaged conversion, exceptions per producer day and later actual quote/bind/verified written premium. No score for sending more messages.

**Release status:** local E2/C1/C2 plus Current Decision C3 and Producer Integration C4 are tested; no live agency/provider mutation or scheduled SMS workflow is certified. The separately named Dynamic Cadence C4 canary remains unapproved/unimplemented.

## 10. Principal-attention handoff

Routine C0/C1 audits and synthetic tests can be carried out on draft branches with no recurring manual Cloudflare work. Before any PR merge that may auto-publish, D1 migration, real-data intake, AgencyZoom family cutover, SMS/provider send or live activation, present **one** consequential owner approval packet with actual scope, impact, rollback, test evidence, cost and measured value.

**Handoff instruction:** Make `CF-SIGNAL-DYNAMIC-CADENCE-1.0` the **P1 evidence-driven orchestration child** of SIGNAL Autonomy. AgencyZoom remains the active owner of current district cadences; only specifically approved, eligible families may transition to CoverageFit. Signal evaluates **when a decision is due**, not mechanically **when a text should be sent**. Prove the no-send dynamic evidence feedback first; persistence, 1,000-record intake, live provider and economics follow their gates.
