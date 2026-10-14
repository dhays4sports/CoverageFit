# COVERAGEFIT + SIGNAL — Autonomous Insurance Growth Roadmap 3.0

**Mandate:** CF-AUTONOMOUS-GROWTH-ROADMAP-3.0  
**Status:** PRINCIPAL-APPROVED — HIGH-PRIORITY PRODUCT NORTH STAR AND EXECUTION GOVERNOR  
**Adopted:** 2026-10-13  
**Primary repository:** `dhays4sports/CoverageFit`  
**Primary consumer/intake brand:** 408FARMERS and explicitly designated insurance lead-generation satellites  
**Existing authorities:** `COVERAGEFIT_NORTH_STAR.md`, Master Roadmap 2.0, Producer Command Center UX 1.0, Current State and Operational Gates 1.0  
**Release authority:** This document authorizes product direction, read-only research, test-only design/implementation and reviewable draft work; it **does not authorize PR merges, a Production deployment, Cloudflare/D1 configuration or data mutations, sending to customers, vendor purchases, AgencyZoom writes, RingCentral subscription changes, carrier activities, or unattended live contact.**

> **The governing product outcome:** More **useful, compliant insurance conversations** and **verified written premium**, using substantially **less producer attention**. CoverageFit must acquire and interpret permissible lead and relationship evidence, build durable Prospect Profiles, recognize intent and verified renewal windows, orchestrate eligible qualification and follow-up, and present the producer with the few valuable decisions that need human involvement.

This is a **priority overlay and execution guide** to the approved CoverageFit North Star and existing Master Roadmap 2.0, **not a rival product, standalone system, fresh CRM, or blanket release authorization**. It changes the relative emphasis from component/UX delivery toward measurable acquisition-to-conversation economics. It preserves long-range consumer protection intelligence as a future projection of the **same** relationship/evidence spine.

## 1. Constitutional priority and conflict resolution

1. **Safety and authority are the floor, not a competing roadmap.** STOP, opt-out, wrong number, TEST exclusion, district CONTROL separation, source provenance, verified consent, message/sender/provider eligibility, producer takeover, identity conflict holds, and legal/agency/carrier constraints prevail over growth scoring. Unknown authority means no send. A verified renewal date never grants contact permission.
2. **Economic value governs feature selection above that floor.** Every significant development cycle must measurably increase qualified/useful conversations, improve conversion or verified premium, reduce attributable producer minutes, or remove a proven blocker to those outcomes. New dashboards, agents, tests and infrastructure are only means to those ends.
3. **One intelligence spine, one source of truth.** Do not fork Prospect Profiles, build a competing CRM/Inbox/gateway, or add another repository/domain merely because an integration is possible. Reuse existing CoverageFit UCP/Prospect, SIGNAL, Attention, Producer Action Quality, source ledger, commitments, AgencyZoom coexistence and RingCentral transport boundaries.
4. **Principal Attention Sovereignty.** The principal reviews high-intent opportunities, consequential exceptions and explicit authority/release decisions—not routine lead sorting, daily compliance reconfirmation, repeated setup or isolated design minutiae. Batch approvals and report one decision package per gate.
5. **Preserve backward compatibility.** Existing capabilities, first-party consumer journeys, 408FARMERS lead intake and `/farmers` device/protection integrations where used should not regress. Do not quietly replace the ongoing producer work while delivering new acquisition automation.
6. **Evidence before scale.** CI and synthetic results prove software properties, not customer outcomes. A hosted read-only Preview PASS does not prove a live inbox, outreach permission, producer dogfood, premium uplift or profitable acquisition.
7. **No production exposure by accident.** GitHub merge may trigger Cloudflare auto-deployment. Determine the actual merge/publish effects and obtain specific approval before merging; Production feature flags remain default OFF until separately authorized.

**Priority policy:** Within the product's permitted engineering capacity, target approximately **80% of discretionary *new feature* engineering attention** to acquisition/intake (30%), durable Prospect Intelligence and renewals (25%), and SIGNAL qualification/orchestration (25%). Allocate the remainder to operational reliability (15%) and incremental UI (5%). These are **planning weights, not measured progress, spend authorizations or permission to underfund mandatory safety/reliability work**. Reallocate based on observed blockers and economics.

## 2. Explicit system boundaries

| Surface/component | Role | Must not become |
| --- | --- | --- |
| **408FARMERS and insurance acquisition satellites** | First-party landing pages, lead context, permission capture, attribution | Separate CRM, carrier/rater, or independent Mesh BusinessUnits |
| **CoverageFit** | Governed insurance acquisition, evidence and relationship operating system | Unconstrained message sender or replacement for Farmers policy administration |
| **SIGNAL** | Source-backed intent, priority, next useful question/action, orchestration state and attention | Permission generator, autonomous binder, or ungrounded lead score |
| **Prospect 360 / UCP** | Canonical durable relationship and source-linked fact/evidence view | Auto-merge by phone or an overwrite-first contact list |
| **Today / Inbox / Approvals** | Minimal producer exception and high-value work control surface | Full duplicate inbox or dashboard-first product objective |
| **AgencyZoom** | Existing district stages, ownership and approved cadence | Silently replaced or modified by parallel automation |
| **RingCentral** | Authorized existing communications transport when provider/use-case rules permit | Purchased/third-party-generated lead list SMS route or assumed live inbound |
| **Google Calendar** | Explicitly approved appointments/invites and synchronization | Authority inferred from an appointment suggestion |
| **Farmers and the licensed producer** | Underwriting/rating/coverage recommendation/bind/policy authority | Fully automated, unreviewed coverage or binding decisions |

Canonical district stages remain `NEW`, `CONTACT_ATTEMPT`, `AWAITING_SIGNAL`, `ENGAGED`, `QUOTE_READY`, `QUOTE_SENT`, `FUTURE_BIND`, `WON`, `CLOSED` and `STOP`. SIGNAL may maintain *separate internal workflow execution state* without imposing a second CRM stage system.

**The operating loop:** `Acquire → Normalize and verify → Link durable Prospect Profile → Evaluate evidence / renewal / intent → Check contact/channel authority → Orchestrate governed next step → Capture actual delivery/inbound/outcome → Escalate only worthwhile producer work → Attribute economics and compound the relationship`.

## 3. Baseline: what is already accepted, and what is not

As of the 2026-10-13 principal handoff:

- **Scoped combined hosted read-only Preview ACCEPTED** at operator-attested immutable host `ece607a0.coveragefit.pages.dev` running source head `d8083570c0425371c67b1bae74813ec6c50a9be6`, with **19/19** GET-only checks, four later explicit desktop/mobile/keyboard visual signoffs, expected unauthenticated HTTP 401 and **zero sends**. Old synthetic CALL transitioned to STOP and remained suppressed; new distinct fictional CALL validated urgent behavior. Preview database isolation and actual served SHA were **operator-attested**, not independently confirmed by the connector.
- **Current code remains draft/unmerged**: PR #7 is based on `main`; aggregate PR #16 is based on #7 and includes #12 → #14 → #15 plus unified tests and accepted Preview documents. PR #12/#14/#15 should **not** be merged independently if the aggregate is integrated. The latest accepted runtime suite has **544/544 passing**, with documentation-only updates afterwards verified separately on their exact heads. Always refresh current branch/CI status before release.
- **Read-only Today, linked SIGNAL Inbox, Prospect 360 source/renewal facts, and selected 1–10 SMS draft review** are accepted only within that scope. No full live RingCentral inbox, sends, approval POST, automatic purchased-lead contact, ongoing agency operation or economic benefit is certified.
- **Raw import/resume, basic SMS conversation state and SHADOW evaluator exist**; durable multi-source memory and sustained stateful orchestration are not yet fully built or hosted-certified.
- **Phase 3 live RingCentral inbound/receipt/recovery remains BLOCKED** at last verified snapshot: Preview webhook URL and validation token absent, subscription not certified, sender apparently ready, and Preview used the production provider realm. A subscription POST may create live account effects. Re-read status instead of treating old observations as present-tense truth.

The objective is to **reuse** this foundation. The next development program does not restart Command Center implementation, redo accepted Preview SQL/visual checks for unchanged runtime, rebuild a messaging gateway, or replatform the CRM.

## 4. Time horizons, dependencies and decisions

Time ranges are **planning horizons, not delivery promises**. Phases overlap in *draft/test-only* engineering, while actual contact, external writes, production release and real-data pilots each have separate gates.

| Phase | Planning horizon | Primary economic purpose | Current gate |
| --- | --- | --- | --- |
| **0. Preserve/integrate accepted foundation** | Weeks 1–2 | Stop recurrent infrastructure friction and freeze the safe base | #7 then #16 merge/Cloudflare effect review, separate approval |
| **1. Scalable acquisition intelligence** | Weeks 1–4 | Turn high-volume legitimate leads into attributed, unique, usable opportunities | Synthetic data contracts and import fidelity; real batches separately approved |
| **2. Durable Prospect Memory / Renewal** | Weeks 2–6 | Make every conversation and verified date compound | Source-linked assertions, identity holds, persistence, provenance |
| **3. SIGNAL autonomous qualification SHADOW** | Weeks 3–8 | Minimize repeat questions and producer decision minutes | Permission-neutral stateful simulation, no sends |
| **4. Provider-coupled operational loop** | Weeks 4–10 | Safely connect actual provider receipts, inbound, commitments and outcomes | Provider realm/isolation, verified send authority, separate canary |
| **5. Producer economics pilot** | Weeks 8–12+ | Prove more useful conversations per producer hour and honest premium outcome | Agency-approved small SIGNAL/CONTROL cohort and baseline |
| **6. Economically justified autonomy and scale** | Months 3–6+ | Expand only proven automation families and source volume | Human-approved execution → separately authorized bounded autonomy |

**Dependency principle:** Provider status cannot block independent no-send acquisition/memory/SHADOW engineering. It **must** block claims of real two-way messaging, unattended SMS or full lead-to-conversation automation. A read-only UI acceptance is a component gate, not a substitute for economic pilot evidence.

## 5. Phase 0 — Integrate without drifting backward

**Work package: `CF-INTEGRATION-RELEASE-REVIEW-1.0`**

1. Refresh `main`, PR #7, aggregate PR #16, protection rules, current CI and the full diff/ancestry. Audit any unrelated PR overlap before release; #8/#9/#10/#11 do not silently enter the aggregate. Verify whether exact runtime SHA is unchanged apart from documentation.
2. Review shared runtime, auth, ownership, STOP/CONTROL, TEST, no-send contract, sensitive-data handling, migrations/fixtures, default-OFF environment flags, prompt/provider boundaries, regression tests, manual fallback and rollback.
3. **Verify Cloudflare auto-deployment semantics** for the Production branch, Production versus Preview D1 bindings, configured feature flags and availability of prior immutable release/rollback. A merge approval must explicitly cover any automatic publish effects; do not assume merges are isolated from deployment.
4. Prepare **one** principal merge/release decision packet showing exact SHAs, proof, residual risk, rollback and actual requested authority. Without authorization, leave both PRs draft. With separate approval, merge #7 then refresh/retest #16, merge #16 through protections and verify `main`; never duplicate #12/#14/#15 changes.
5. Begin acquisition/memory/SHADOW implementation in safe draft lanes without requiring premature production activation.

**Exit:** Reconciled code with passing exact-head tests, a specific yes/no merge decision and no surprise production/provider side effects. **Not an authorization to enable live engagement.**

## 6. Phase 1 — Scalable acquisition intelligence

**Work package: `CF-ACQUISITION-INTELLIGENCE-1.0`**

### 6.1 Supported intake sources

- 408FARMERS and approved satellites: first-party form events, explicit product interest, permission evidence and attribution.
- District/AgencyZoom raw inventory: preserve immutable pilot enrollment, cohort and district cadence owner; do not recast nonpilot or CONTROL inventory as SIGNAL based on score.
- Purchased/vendor leads: vendor contract/data rights, seller and batch IDs, purchase/capture time, original files, source attribution, contact restrictions, cost, source assertions **and independent contact-channel eligibility**.
- Referrals and existing customer relationships: referrer/intro provenance, documented customer requests, renewal and prior-relationship context, no assumed permission.
- Additional future sources (partner portals/calls/email/documents): adapters only when licensed, authorized and proven relevant; no generic data scraping.

### 6.2 Minimum durable acquisition contract

Store and preserve: `intake_event_id`, `source_type`, `source_id`, `vendor_id`, `batch_id`, `acquired_at`, `received_at`, `original_record_reference`, `source_rights/provenance`, `product_interest`, `normalized_identity_fields`, `dedupe_candidate_ids`, `consent_evidence_refs`, `provider_route_candidates`, `source_cost` (when known), `workspace/owner/cohort`, `import_status` and `exception_codes`. Names are proposed logical fields; reconcile with existing schema **before migrations**. Keep raw data access constrained and never log real contact details in test or status output.

### 6.3 Pipeline

`Import → schema normalization → validation/quarantine → identity match/candidate holds → provenance/source rights → product/renewal enrichment → opportunity quality → positive contact-route determination → governed queue or no-contact hold`.

Extend **existing** resumable raw importer, not a parallel implementation. Imports must resume after interruption, be replay/idempotency safe, distinguish unique/rejected/merged/held records and preserve exact reason codes.

### 6.4 Vendor and source scorecard

Attribution funnel: `Imported → Unique → Source-valid → Eligible for a specific channel → Attempted if actually authorized → Engaged → Useful conversation → Qualified → Quoted → Bound`.

Retain `cost per unique`, `cost per eligible`, `cost per useful conversation`, `verified written premium per source`, false identity matches, missing provenance, disposition and delayed-return cohorts. Never count drafts, attempted sends, opening an email, unverified SMS delivery or a raw imported record as a useful conversation.

### 6.5 Exit criteria

- Pass at least **1,000 synthetic multi-source records** with duplicates, malformed rows, consent conflicts, CONTROL, STOP, wrong numbers, replay and partial-import interruptions; all accepted/rejected/held counts reconcile.
- Real lead batch use only with separately approved vendor/data rights and a documented agency/process owner. Import must not send outreach or implicitly grant sending authority.
- Produce an inspectable source scorecard and exception queue requiring attention only where data cannot be resolved safely.
- Define measurable throughput, failure/hold rates, import time and operator minutes; do not claim profitable acquisition before an actual pilot.

## 7. Phase 2 — Durable Prospect 360 and renewal intelligence

**Work package: `CF-PROSPECT-MEMORY-1.0`**

### 7.1 One relationship; durable evidence

Add a source-linked, append/audit-capable evidence layer **under** the current Prospect 360/UCP. Each fact assertion should include subject/profile identifier, product/coverage context, value and precision, original source/event reference, observed and verified timestamps, evidence category, verification status, possible supersession, conflict relationship and capture authority. Prefer compatible existing tables and projections; new persisted primitives only when a gap is proven.

Admission adapters, sequenced by authorized benefit: lead forms/imports and SIGNAL SMS → producer confirmations and AgencyZoom-appropriate notes → approved call transcript/call outcome → policy/document evidence, screenshots and email → future consumer change evidence. A real document claim must be attributed to its source; do not fabricate proof.

### 7.2 Identity safety and household associations

Cross-source duplicate **candidates** are not automatic identity matches. Use strong references and exact authorized links; ambiguous names/phone/address/household associations become exceptions, not silent merges. Keep relationship links separate from contact permissions. Support multiple product opportunities under one profile without overwriting the person or history.

### 7.3 Renewal lifecycle

`UNKNOWN → CANDIDATE → VERIFIED → UPCOMING → WINDOW_OPEN → QUOTE_READY → WON / LOST / FUTURE_RETURN`.

Track line, source, calendar date or month precision, verification (`imported_unverified`, `customer_confirmed`, `producer_confirmed`, `document_verified`, `conflicted`, `stale`), observation and confirmation time, historical dates, next review, commitment and contact-authority snapshot. Conflict and stale logic must be explicit. Renewal may create an **eligible future work candidate**; it may **not** grant an SMS route or overwrite an opt-out.

Support configurable review windows (e.g. 0–30 and 31–90 days for relevant lines) and evidence-driven reminders. Ask for a missing renewal date only when it is genuinely needed; do not repeatedly ask known information.

### 7.4 Exit criteria

- Reimport and revisit the same fictional prospect through multiple channels without dropping prior sourced facts; uncertain identity remains held.
- Verified vs imported vs conflicting vs stale renewal date behavior remains consistent across Prospect 360, Today and next-action computation.
- Confirmed facts survive replay and old data is not silently promoted or overwritten; one producer confirmation has a traceable audit trail.
- Source linkage and permission separation hold even for duplicate records, household members and historic purchased leads.
- Report usable **verified renewal coverage** and renewal-to-useful-conversation conversion when actual outcomes become available.

## 8. Phase 3 — Stateful SIGNAL autonomous qualification

**Work package: `CF-SIGNAL-AUTONOMY-SHADOW-1.0`**

### 8.1 What changes

SIGNAL advances from individual recommendation to **durable, resumable workflow orchestration**. It knows whether a question was answered, a call was requested, a document is pending, a follow-up was promised, a renewal is upcoming, the producer took over or contact is suppressed.

Do not ask for carrier, renewal date, vehicle count or shopping reason if reliable current evidence already answers the operational need. Do not auto-question a prospect who requested a call when CALL is the right next action. Never interpret silence as consent, or acquisition as permission.

### 8.2 Orchestration contract

Each automation family has: `workflow_id`, `owner`, `prospect_id`, `source/provenance`, `decision_reason`, `authority_snapshot`, `proposed_action`, `approved_action_id` (if any), `state`, `revision`, `due_at`, `attempt_id/idempotency_key`, `provider_receipt`, `human_takeover`, `exception_reason` and `terminal_disposition`. Adapt to canonical schema; the contract is conceptual until a migration is justified.

Suggested internal execution states: `EVIDENCE_READY` → `AUTHORITY_CHECKED` → `ACTION_PROPOSED` → `AWAITING_REVIEW / ELIGIBLE_FOR_APPROVED_EXECUTION` → `WAITING_FOR_PROVIDER / CUSTOMER` → `EVIDENCE_UPDATED` → `NEXT_ACTION / PRODUCER_HANDOFF / COMPLETE / HELD / STOP`. These states **do not replace AgencyZoom stages**.

Every execution must recheck authority, stop conditions, current conversation revision, producer takeover, provider classification and idempotency **at execution time**, not only when drafted. Ambiguous sends enter delivery review; no blind retries. Stop on opt-out, wrong number, CONTROL, unknown owner, uncertain provider route or missing evidence.

### 8.3 Authority is its own product primitive

Source/right to store and evaluate a lead ≠ right to call ≠ right to use specific sender and SMS campaign. Require explicit positive consent where applicable, original evidence and capture context, send route/provider use-case acceptance, opt-out and DNC restrictions, requested message class, current owner and business/carrier agency policy.

**RingCentral's published US SMS use-case restrictions prohibit purchased/third-party-generated lead-list SMS.** Do not reclassify vendor-originated records, conceal provenance or swap transports to evade provider rules. Build a provider-neutral compatibility matrix and evaluate *lawful and provider-accepted* alternatives, documented direct first-party opt-in, permitted producer/manual channels or a no-contact hold. Contact plans are **not** invitations to launch new campaigns; actual channels require independent review.

### 8.4 SHADOW validation and first allowed family

Build deterministic simulation using a controlled clock: multi-turn replies, renewal changes, opt-outs, no response, stale revisions, conflicting evidence, wrong numbers, duplicate inbound/provider receipts, failed actions and producer takeovers.

Advance one family at a time: **permissioned, explicitly first-party inquiry qualification** is the recommended first eventual live family, after provider/agency route approval. Run `OBSERVE → SHADOW → HUMAN-APPROVED EXECUTION → SEPARATELY AUTHORIZED BOUNDED AUTONOMY`. SHADOW never sends, schedules real messages, changes source eligibility or writes to external systems.

### 8.5 Exit criteria

- Persistent multi-turn simulation resumes without repeated questions, duplicate action or lost commitment.
- Every action has a source and reason; every hold has an explicit code and safe route.
- STOP, TEST, CONTROL, opted-out, wrong number, unknown owner, prohibited list and ambiguous receipt scenarios all fail closed.
- The producer sees only high-value handoffs and meaningful blocked exceptions, not every internal step.
- No live sends simply because the SHADOW suite passes.

## 9. Phase 4 — Complete one actual operational loop

**Work package: `CF-LEAD-TO-CONVERSATION-PILOT-1.0` (provider/agency canary portion)**

Prove: `Eligible source lead → dedup/profile and documented channel authority → producer-approved action → provider acknowledgement and durable receipt → actual inbound update → persisted fact/commitment → correct SIGNAL action → producer resolution → documented result`.

The immediate external blocker is **live RingCentral webhook/subscription/recovery certification**, not another UI redesign. Preserve current sender, webhook, consent, ownership, recovery and outbound gateway primitives. First complete non-mutating status/realm review and offline event tests; then prepare a *single separately approved* provider configuration packet covering Preview/Production isolation, missing webhook token/URL, subscription lifecycle and any production account impact.

A controlled provider canary, if authorized, must use an operator-controlled/test recipient and a permitted registered sender/campaign, demonstrate actual provider receipt + inbound + recovery and correct STOP/CONTROL/UNKNOWN handling, and must not contact unrelated customers or automatically message purchased lists.

When the provider path is unavailable, no-send qualification/intelligence continues, with existing human AgencyZoom/RingCentral fallback and truthful Inbox history/coverage labels.

**Exit:** One real, expressly authorized canary proves message and outcome causality with no duplicate send, no provider-state ambiguity silently resolved as delivered, no lost follow-up, and no false claim of a complete live inbox. Full rollout remains separately gated.

## 10. Phase 5 — SIGNAL economic pilot

**Work package: `CF-LEAD-TO-CONVERSATION-PILOT-1.0` (business evidence portion)**

Pilot only with owner + agency-approved eligible California personal-lines records. Keep stable SIGNAL and existing-workflow CONTROL populations, documented source/age/channel differences and the existing **seven-day fresh-lead eligibility** rule. Predefine comparable cohorts, stop conditions and attribution. Do not manipulate historical treatment assignment or claim that a synthetic test is a real trial.

### 10.1 Primary outcome

**Producer Minutes per Useful Conversation** = total attributable producer minutes (intake triage, record lookup, context switching, draft/review/correction, calls, follow-up/admin and exception handling) / count of **genuine, two-way useful conversations**. Undefined when denominator is zero; do not substitute sends, opens or lead counts.

A useful conversation requires actual prospect participation and a meaningful verified need, timing, expressed interest, qualified next step or substantive insurance discussion. Define classification and reviewer audit before trial.

### 10.2 Economic and quality scoreboard

| Metric | Definition and direction |
| --- | --- |
| Useful conversations / producer hour | Genuine useful conversations / attributable productive hours — **up** |
| Producer minutes / useful conversation | Full manual effort, including hidden corrections — **down** |
| Verified renewal coverage | Share of active prospects with timely, usable, source-backed renewal timing — **up** |
| Qualified-to-quote and quote-to-bind | True conversion by cohort and source — **up** if quality is maintained |
| Verified written premium / producer hour | Actually recorded written premium / attributable productive hours — **up**, evaluated over a realistic lag |
| Source cost / useful conversation | Actual lead + attributable operating cost / useful conversations — **down** |
| Contact authority exceptions | Held, uncertain, DNC, opt-out, provider-ineligible items; report **accurate handling**, not suppressing counts |
| False urgent alerts / missed callbacks | Incorrect priority, overdue commitments, delivery ambiguity or producer corrections — **down** |
| Manual context switches and time to next action | Record and tool hops before a correct next action — **down** |

Separate leading indicators from lagging bound/written premium outcomes. Unknown cost stays UNKNOWN, not zero. Disaggregate by source to avoid mistaking better inventory for better SIGNAL. Prefer reliable repeated measurement over arbitrary uplift claims. No district scale on small/noisy observations or hidden manual effort.

### 10.3 Business acceptance

The pilot has positive, auditable useful-conversation throughput and lower total producer burden at equal or better safety, with meaningful evidence of quote/bind and premium contribution. If evidence is mixed, isolate the bottleneck and run **one bounded improved experiment**, not an automatic expansion.

## 11. Phase 6 — Selective growth and bounded autonomy

**Work package: `CF-AUTONOMY-SCALE-1.0`, contingent on economics and separate approval**

Expand one verified family at a time: eligible first-party inbound qualification, verified renewal follow-up via permitted channels, human-approved multi-draft action, callback/quote review reminders and high-quality exception routing. Keep human-only insurance advice, coverage recommendations and binding authority where applicable. Phase 6 requires positive permission and route evidence, agency/provider authorizations, idempotent external action, audit/rollback, spend/volume limits, takeover and kill switch.

Scale vendor/source volume only when attributable cost/useful conversation and producer throughput justify it. Do not buy larger lists just to improve volume metrics. Multi-producer routing and agency-wide deployment need separate economic and organizational justification.

## 12. Producer-day destination

CoverageFit opens at **Today**. It should answer in about 30 seconds: *Who needs me, why now, what exact governed action should I take, what evidence supports it, what is the permission state, and what happened last?* Keep four high-value attention classes:

1. **CALL NOW:** express call request or genuine due commitment.
2. **READY FOR QUOTE:** sufficiently reliable needs/evidence for the licensed producer to assess and advise.
3. **RENEWAL OPPORTUNITY:** usable window, verified timing and appropriate follow-up authority.
4. **EXCEPTION TO REVIEW:** stale/conflicted identity or date, selected current draft needing approval, ambiguous provider delivery, genuine compliance or producer-takeover issue.

Inbox must be honest about whether provider inbound is live and complete; Prospect 360 explains facts and conflicts; approved actions may flow through existing systems. No flood of equal-priority cards, artificial urgency, extra producer dashboards or redundant questions.

## 13. Planned backlog, in correct order

| Priority | Work package | Smallest independently reviewable deliverable | Mandatory stop/gate |
| --- | --- | --- | --- |
| P0 | `CF-INTEGRATION-RELEASE-REVIEW-1.0` | Exact #7/#16 diff, CI, Preview/Production flag/deployment impact and rollback packet | Explicit merge/publish approval |
| P1 | `CF-ACQUISITION-INTELLIGENCE-1.0` | Source, identity, consent and cost attribution extensions to existing resumable importer; 1,000 synthetic replay | No real vendor purchase, no contact send |
| P1 | `CF-PROSPECT-MEMORY-1.0` | Durable source fact/renewal timeline + conflict-safe projection with test evidence | No ambiguous auto-merge or inferred permission |
| P1 | `CF-SIGNAL-AUTONOMY-SHADOW-1.0` | Stateful no-send qualification/follow-up simulation and authority compatibility decisions | No live scheduler/provider send |
| P2 | `CF-LEAD-TO-CONVERSATION-PILOT-1.0` | Controlled RingCentral provider path, then eligible small-cohort SIGNAL/CONTROL measurement | Separate provider/agency, real-data and outreach authorization |
| P3 | `CF-AUTONOMY-SCALE-1.0` | One proven permissioned automation family with limits | Verified positive economics and explicit live autonomy approval |

**Concurrency:** P1 acquisition, memory and SHADOW contracts can be developed in coordinated draft/test lanes while P0 release review proceeds; provider-independent work must not create another CRM, contradictory migrations or unresolved branch overlap. P2 provider testing may proceed only within its own authorized boundaries.

## 14. Six-month success definition (illustrative April 2027 horizon)

1. **High-volume intake:** CoverageFit reliably reconciles meaningful multi-source batches into attributed, deduplicated, contact-classified opportunities.
2. **Compounding relationship memory:** prospects preserve verified renewal timing, history, evidence and commitments across touchpoints.
3. **One approved autonomous qualification family:** a genuinely eligible and authorized workflow handles routine steps without producer involvement in each step; provider and opt-out safety remain demonstrable.
4. **Producer attention sovereignty:** Today/Inbox primarily surfaces real ready conversations and exceptions; routine triage consumes materially fewer measured minutes.
5. **Measured economics:** actual useful conversations, quote/bind progression, written premium and producer time/cost can be compared to a baseline. Report uncertainty and negative results honestly.

These are **desired outcomes, not claims of current product functionality or commitments to hit dates**. If provider or agency authorization delays live messaging, continue proving intake, profiles, SHADOW decision quality and manual-channel producer efficiency rather than faking an end-to-end win.

## 15. Priorities we deliberately defer

Deprioritize until economically justified: a new CRM, redundant command center surfaces, extensive agent personas, autonomous AI calling, mass outbound SMS tooling, district-wide administration, general-purpose document or call processing, multiple messaging transports for their own sake, marketplaces, additional domain/repos and speculative integrations. Approved first-party consumer protection intelligence, future call/document evidence, SmartDevices/Policy.box compatibility and approved Calendar capabilities remain on the long-term roadmap; they are **not deleted or independently replatformed**.

No feature is prioritized because it is technically possible, fashionable or makes a demo look more autonomous. Favor **the smallest reusable durable primitive** that improves the measured operating loop.

## 16. Principal attention and implementation governance

- **Development default:** investigate repo state, reconcile existing primitives, implement scoped safe code, run deterministic tests, create draft PRs, document evidence; do not request repeated principal confirmation for routine low-risk iterations.
- **Consequential approval packet:** one consolidated decision listing exact refs/changes, evidence, economic purpose, compliance/operational risks, real-world effects (including auto-deploy), fallback/rollback, incremental cost, owner-time impact and the exact action requested. Explicit approval needed for merges with possible publish effect, real data/provider settings, external sends, financial purchases, Calendar/AgencyZoom writes, live autonomous workflow and production rollout.
- **No silent authority escalation:** default-off feature flags, safe hold on ambiguity, observable error/exception state, immutable audit records and provider/consent checks at action time. Preserve manual workflow when AI/provider is unavailable.
- **Work-cycle evidence contract:** every update states `baseline → targeted economic bottleneck → scoped change → deterministic evidence → real outcome measurement (if authorized) → remaining gaps → next smallest justified task`. Report producer minutes consumed by the *development and testing process itself* when it causes recurring owner work.
- **Unresolved edge-case policy:** if a fixture is unexpectedly STOP, preserve STOP; never reset a suppressed contact to make a test pass. Use independent synthetic fixtures and investigate underlying state separately. Avoid nonproductive manual QA repetition.
- **No new parallel master plans:** This high-priority roadmap is an execution overlay. Update `COVERAGEFIT_NORTH_STAR.md` for vision, `docs/COVERAGEFIT-NEAR-TERM-PRODUCER-ROADMAP-1.0.md` for governing phase sequencing, `docs/COVERAGEFIT-CURRENT-STATE.md` for verified operational facts and this file for economic delivery/work packages.

## 17. Evaluation checklist for every future task

Before accepting a feature or approving a PR, answer:

1. Which stage of `Acquire → Understand → Orchestrate → Producer attention → Measure` improves?
2. Which baseline producer minute, useful-conversation, verified renewal, quote/bind, premium or safety metric will demonstrate that change?
3. Can the existing canonical store, action engine, provider adapter, UI and permission model do this without duplication?
4. Are customer/source identity, consent, STOP, CONTROL, approved channel, producer/agency authority and replay boundaries preserved?
5. Is the deliverable a scoped draft/no-send implementation, hosted read-only certification, human-approved execution or live autonomy? **Name the actual level**.
6. Does this require the principal to repeat infrastructure setup or approve many small details? If yes, redesign to batch and reduce owner attention.
7. What specific evidence, dependencies and separately approved authority must exist before moving forward?

**Failure on questions 1–3 without a demonstrated blocker:** defer or redesign. **Failure on question 4:** stop/fail closed. **Unmet question 5–7:** stay at the permitted execution level and surface one clear release gate.

## 18. Immediate handoff instruction

> Implement `CF-AUTONOMOUS-GROWTH-ROADMAP-3.0` as the **highest-priority economic product execution guide** beneath the adopted CoverageFit North Star and constitutional safety floor. Continue from the current verified code; do not restart. Preserve combined Command Center's operator-attested hosted Preview acceptance, STOP/CONTROL and default-off no-send behavior. Perform the bounded PR #7 → aggregate PR #16 merge/publish integrity review, without merging or deploying absent express approval. In parallel, advance the smallest reviewable test-only slices of acquisition source/provenance/identity/cost intelligence, durable Prospect Memory and renewal facts, and multi-step permission-aware SIGNAL SHADOW orchestration. Use one canonical profile and message authority model. No live purchased-list texting, no new autonomous sends, no unaudited identity merges, no provider changes, no real-data acquisitions or spending. Define each slice by its prospective contribution to useful conversations, verified premium and attributable producer minutes. Consolidate future consequential decisions into one owner packet, and move to an approved live provider canary/economic trial only when corresponding gates pass.

**North Star reminder:** We are not building a more elaborate producer dashboard. **We are building an evidence-driven autonomous insurance growth and relationship system that turns large amounts of permissible prospect evidence into fewer, better, producer-worthy conversations and measurable written premium—with much less producer effort.**
