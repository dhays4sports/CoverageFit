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

## PRINCIPAL-LOCKED DATA MONETIZATION OPTIONALITY — privacy-first, not a new workstream

**Priority treatment:** The owner wants **genuinely de-identified aggregate insurance-market intelligence as the preferred *optional long-term* data product**, and **possibly monetizing appropriately authorized direct CoverageFit inquiries later**. The owner **does not want a resale business for individual enriched Prospect 360 profiles**. These are **OPTIONAL / NOT ACTIVATED**, not P1 revenue execution workstreams. [Full product/privacy gates](CF-DATA-RIGHTS-AND-MARKET-INTELLIGENCE-OPTIONAL-1.0.md).

**Two carefully separate possible future outcomes:**

- **Aggregated, genuinely de-identified intelligence:** Source rights must permit the underlying analytics **and external commercial use**, even when statistics appear anonymous. Only appropriately coarsened, risk-assessed, source-rights-approved outputs may ever leave the protected environment. Cohort size, rare combinations, ZIP/time granularity, linkage/differencing across repeated releases, small-cell suppression, de-identification methods, retention/deletion and contractual reidentification prevention require a documented case-specific release review. No pseudonymized row-level exports, transcript examples or small-cohort statistics masquerading as de-identification.
- **Direct CoverageFit inquiries:** Only original **direct CoverageFit** inquiries with verifiable source, permitted use, recipient/purpose-specific consumer authorization and independent insurance/agency/licensing/referral-compensation review may be considered for eventual introductions. Sharing must be purpose-limited and minimal. No automatic extension to 408FARMERS, imported, Farmers/AgencyZoom or vendor-derived populations, and no disclosure of a whole enriched history.

**P1 Evidence Flywheel consequence:** Add source/collection-purpose, agency/vendor ownership, secondary analytical rights, commercial disclosure restrictions, subject authorization/opt-out, retention and recipient field-scope awareness to the **shared canonical source-rights contract**; the default is **NOT TRANSFERABLE / NOT ELIGIBLE** for third-party use. This is groundwork for lawful future flexibility, **not** authority to sell data, activate an API, buy lists, create a new domain/BusinessUnit, or deploy external analytics.

**Economic order stays intact:** First prove scalable lead-to-useful-conversation performance and verified written premium with less producer attention. Later, only if supported by sufficient permitted data and actual market demand, present one separately reviewed de-identification/legal/business case. The direct-inquiry option remains a separate lower-priority concept. No client or carrier data transfer has been approved.

---

## P1 FOUNDATION — Continuous Evidence Accumulation / Evidence Flywheel (principal-approved 2026-10-13)

**Work package:** `CF-CONTINUOUS-EVIDENCE-1.0` · **P1 foundational and cross-cutting** · [detailed engineering contract](CF-CONTINUOUS-EVIDENCE-1.0.md).

> **Continuous Evidence Accumulation:** Every *permitted* acquisition event and meaningful customer/producer interaction is an opportunity to improve CoverageFit's understanding of a prospect. SIGNAL extracts and reconciles relevant evidence into the **same durable, source-linked Prospect Profile**, preserving uncertainty, timestamps, verification, identity boundaries, conflicts, contact restrictions, correction and retention rules. Every subsequent decision uses the best currently justified facts, asks only for necessary missing information and seeks the smallest useful next action. **Intelligence accumulates continuously; communication happens only when separately justified and authorized.**

**Strategic priority:** This is **the mechanism connecting** Phase 1 acquisition, Phase 2 Prospect Memory/renewals, and Phase 3 SIGNAL orchestration. Without it, bulk acquisition is merely loading contacts, Prospect 360 is a static display and SMS automation is an outreach sequence. With it, authorized replies and source corrections **compound** into more accurate context, less redundant questioning, better renewal timing, sharper human handoffs and, when proven, better economic outcomes. Do **not** create an eighth phase, rival CRM or separate evidence silo. P1 workstreams must all consume the same shared evidence contract.

### Continuous evidence flywheel

`ADMIT source with permitted use and retention → RESOLVE reliable identity (or HOLD conflict) → EXTRACT typed, source-traced assertions → RECONCILE contradictory and stale facts → PROJECT versioned current Prospect Intelligence → DECIDE minimal justified SIGNAL action → RECORD actual reply/outcome and repeat`.

**Independent states:** Received event ≠ verified assertion ≠ correct identity match ≠ consent ≠ action authority ≠ provider-delivered communication ≠ useful conversation/verified premium. No stage may manufacture approval or truth for the next one.

### Three-layer canonical intelligence model

| Layer | Data and responsibility | Hard requirement |
| --- | --- | --- |
| **1. Source/evidence event** | Vendor or first-party lead, inbound SMS, actual permitted interaction, document/producer correction or verified outcome; original source/time, record key, batch, data rights and retention | Admit only authorized/useful data; replay-safe; protect raw contents and purge/withhold under policy |
| **2. Sourced fact assertions** | Typed claim and insurance line/context, value/precision, original evidence reference, when observed/effective, verification, extractor version, supersession and contradiction | Newer is not always truer; vendor-supplied or SMS-sourced date is not inherently document-verified; never silently overwrite |
| **3. Current relationship projection** | One current profile of usable/missing/stale/contradictory facts, renewal windows, stated intent, commitments, last meaningful event, identity link and safety reference | Prospect 360, SIGNAL and Today consume the same derived facts; channel/contact authority is an independent gate |

The existing source rows (`cf_solo_sources`), permitted SMS state, UCP links (`cf_ucp_opportunity_links`), commitment projection and `server/prospect-360-readonly.mjs` are **reuse targets**; the current Preview does **not** prove a persistent FactAssertion ledger exists. Reconcile schema ownership before any proposed D1 table/migration. The existing `server/engagement-shadow-simulator.mjs` is pure no-send simulation, not a durable live automation worker.

### What users should experience

An authorized imported lead reports an insurer and a tentative December renewal: retain these as *vendor assertions*, not verified truth or contact permission. A later **separately authorized** exchange provides three vehicles and a customer-reported December 18 renewal; the profile records source and precision, while history remains traceable. A follow-up confirms homeownership and a preference to wait; SIGNAL should not ask again about vehicles or renewal if sufficiently known. At the correct justified time, it can propose a bounded follow-up **only after checking the specific channel authority**. An explicit "please call me" should reach the producer rather than trigger more qualifying questions. If STOP arrives, all prohibited contact ceases even if other evidence suggests high value.

**No-send is a legitimate cycle outcome:** On a purchased/vendor batch with no eligible route, the engine may lawfully organize permitted evidence and rank opportunities, but must not send RingCentral purchased-list SMS, launder source identity or treat an imported number/vendor opt-in as positive per-message sender permission.

### Mandatory P1 engineering behavior

- **Provenance and idempotency:** original source/actor, immutable event reference, observed/received/effective times, workspace, source-rights, extractor version, retention class and dedupe key. Same source event cannot create multiple independent claims; contradictory same-key payload must be held for investigation.
- **Typed assertions and authority:** field precision, per-policy/per-line context, source class, `customer_reported` vs `producer_confirmed` vs `document_verified` vs `carrier_confirmed` (only if actually evidenced), uncertainty, revisions and explicit conflict links. Extractor confidence alone never verifies a claim or contact permission.
- **Identity safety:** only genuinely verified links join evidence from several sources. Shared phone, home address, name or presumed household association does not justify auto-merge; ambiguous profile links go to a focused exception queue.
- **Temporal memory:** track raw observation date vs when CoverageFit learned it; renewal month vs exact day; historical dates vs current dates; field-level stale/expiry behavior. Do not roll an expired date into next year without evidence.
- **Reconciliation and correction:** retain legitimate contradictory assertions, mark disputed current field UNKNOWN/CONFLICTED until justified resolution, append corrected/verified evidence, allow authorized retraction and recalculate the derived projection. Do not erase an old fact invisibly to make a test pass.
- **Privacy, minimization and erasure:** collect only relevant authorized data, enforce retention and access roles, prevent cross-workspace leakage, propagate deletion/withholding to derived profile/caches and avoid indefinite transcript or attachment hoarding. Untrusted import/SMS/document text cannot instruct the agent to take privileged actions.
- **Decision feedback:** every SIGNAL evaluation reads the current profile version, knows why a question is missing or redundant, and can update after a later actual permitted event. Compare latest revision before acting; a stale SMS draft or provider uncertainty must not create duplicate sends.
- **Separate contact authority:** source right to store ≠ right to message. Respect opt-out, STOP, CONTROL, TEST, wrong number, owner/takeover, DNC, campaign/sender/provider restrictions and the RingCentral purchased-list prohibition at actual action time. Evidence accumulation never silently clears suppression.
- **Economic relevance:** prefer meaningful verified evidence that reduces producer work and improves real conversations; do not reward messages sent, raw fact count or overcollection.

### First P1 delivery slices and exit gates

**E0 / Inventory:** Audit actual source rows, raw intake, UCP links, SMS state, retention obligations and current derived Prospect 360. Identify smallest compatible event/assertion data contract, source-rights and field whitelist. No schema mutation without review.

**E1 / Admission + extraction:** In deterministic synthetic/tests, admit permitted intake events and simulated eligible replies, link only proven identities, append sourced typed assertions, quarantine unknown or conflicting links and implement idempotency. Exercise **at least 1,000 mixed synthetic records** plus duplicate/out-of-order message cases.

**E2 / Versioned Prospect Memory:** Reconcile customer-reported vs verified dates, product-specific conflicts, stale renewal, retractions and source expiry; generate one repeatable current Profile with referenced evidence. Show same profile in the existing read-only Prospect 360 contract only after separate scoped runtime review/flag.

**E3 / SIGNAL feedback SHADOW:** Feed that versioned Profile to persistent *test-only* multi-cycle qualification, make minimal missing-question proposals, then ingest newly simulated reply evidence and prove the next action changes appropriately. STOP/CONTROL, wrong number, unsupported contact route, manual takeover, stale revision and ambiguity must remain held; **zero sends**.

**E4 / Gated real-event adapters:** After separate data/security/agency approvals, connect authorized first-party submission/actual inbound and producer corrections. Actual provider receipt and end-to-end messaging still require their independent certified provider canary.

**E5 / Outcome measurement:** Pilot only when separately authorized, and report usable sourced facts, correctly verified renewal coverage, redundant question rate, manual profile correction minutes, false extraction/merge rate, verified useful conversations and premium per producer hour. Accurate *less data* may beat inaccurate *more data*.

**Acceptance must prove:** two imports don't duplicate assertions; conflicting customer/document renewals remain visible; two individuals sharing a phone don't merge; repeated SMS doesn't duplicate question/action; prior reliable answer prevents repeat question; explicit CALL bypasses rote questions; STOP from a formerly CALL lead remains STOP; suppression and purchased-list route restrictions survive enriched profile; expiry/deletion invalidates derived knowledge; offline SHADOW changes decisions without sending. [Full P1 specification and negative tests](CF-CONTINUOUS-EVIDENCE-1.0.md).

**Release classification:** This P1 is **PRINCIPAL-APPROVED DIRECTION / ENGINEERING CONTRACT**, **NOT** a deployed persistent accumulation engine, actual live SMS worker, D1 migration authorization, consent authority, permission to purchase lists, production release or automated quote/bind authority. Safe audit, synthetic tests and draft PRs may proceed; user-facing/real data/provider writes each need their own actual gate.

**Binding architectural rules:** **No acquired source without provenance into the evidence spine. No lasting memory without reconciliation and source-backed assertions. No meaningful SIGNAL automation without consuming and feeding current Prospect Intelligence. No new UI merely to inflate profile completeness.**

---

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

**P1 shared foundation:** `CF-CONTINUOUS-EVIDENCE-1.0` is the evidence-admission/reconciliation/projection contract **beneath acquisition, Prospect Memory and SIGNAL SHADOW**. P1 test-only work can run concurrently with P0 release review. A full live provider link remains separately gated.

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

**P1 EVIDENCE DEPENDENCY:** Every permitted import supplies source rights, immutable lineage, identity resolution/hold state and typed vendor-asserted evidence to [Continuous Evidence Accumulation](CF-CONTINUOUS-EVIDENCE-1.0.md); it is not merely a new CRM contact. No automatic identity merge, promotion of vendor claims to customer verification, or imported contact consent. Safe intake tests must demonstrate downstream profile facts remain source-linked.

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

**P1 FLYWHEEL FOUNDATION:** [`CF-CONTINUOUS-EVIDENCE-1.0`](CF-CONTINUOUS-EVIDENCE-1.0.md) is a **mandatory** shared event/assertion/reconciliation/projection capability **inside** Prospect Memory, not a later enrichment add-on. Current read-only Prospect 360 projects sourced renewal information but is not yet durable full fact-history infrastructure. Identity conflicts, temporal precision, verification, correction, expiry and deletion propagation require explicit tests.

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

**P1 FLYWHEEL EXECUTION:** Every SHADOW cycle must read the versioned current Prospect Intelligence projection, derive only a justified missing question or higher-value next action, and feed simulated new evidence back into the profile before the next cycle. A timed message sequence without evidence feedback is **not** an acceptable autonomous qualification engine. Preserve separate consent/STOP/CONTROL/provider gates and no-send semantics.

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

**EVIDENCE LOOP CLOSURE:** A provider canary must prove that an **actual** authorized inbound event reaches the canonical profile, changes the source-backed state and consequently updates the producer action/commitment; an outbound receipt or drafted message alone is not evidence of a customer reply. This remains gated and not currently live-certified.

**Work package: `CF-LEAD-TO-CONVERSATION-PILOT-1.0` (provider/agency canary portion)**

Prove: `Eligible source lead → dedup/profile and documented channel authority → producer-approved action → provider acknowledgement and durable receipt → actual inbound update → persisted fact/commitment → correct SIGNAL action → producer resolution → documented result`.

The immediate external blocker is **live RingCentral webhook/subscription/recovery certification**, not another UI redesign. Preserve current sender, webhook, consent, ownership, recovery and outbound gateway primitives. First complete non-mutating status/realm review and offline event tests; then prepare a *single separately approved* provider configuration packet covering Preview/Production isolation, missing webhook token/URL, subscription lifecycle and any production account impact.

A controlled provider canary, if authorized, must use an operator-controlled/test recipient and a permitted registered sender/campaign, demonstrate actual provider receipt + inbound + recovery and correct STOP/CONTROL/UNKNOWN handling, and must not contact unrelated customers or automatically message purchased lists.

When the provider path is unavailable, no-send qualification/intelligence continues, with existing human AgencyZoom/RingCentral fallback and truthful Inbox history/coverage labels.

**Exit:** One real, expressly authorized canary proves message and outcome causality with no duplicate send, no provider-state ambiguity silently resolved as delivered, no lost follow-up, and no false claim of a complete live inbox. Full rollout remains separately gated.

## 10. Phase 5 — SIGNAL economic pilot

**EVIDENCE FLYWHEEL MEASURES:** In addition to end outcomes, assess relevant source-backed facts, verified renewal timing, redundant questions, manual reentry/correction minutes, false extraction/identity-link rates, valid conflict resolutions, privacy/retention compliance and whether known evidence materially improved useful conversations. More stored events is **not** an economic success metric.

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
| **P1 FOUNDATION** | [`CF-CONTINUOUS-EVIDENCE-1.0`](CF-CONTINUOUS-EVIDENCE-1.0.md) | Reused source-event → fact assertion → safe reconciliation → durable Profile → SIGNAL feedback; 1,000 synthetic/multi-turn checks | No unauthorized data retention, profile auto-merge, D1 migration, live sends or new contact authority |
| P1 | `CF-ACQUISITION-INTELLIGENCE-1.0` | Source, identity, consent and cost attribution extensions to existing resumable importer; 1,000 synthetic replay | No real vendor purchase, no contact send |
| P1 | `CF-PROSPECT-MEMORY-1.0` | Durable source fact/renewal timeline + conflict-safe projection with test evidence | No ambiguous auto-merge or inferred permission |
| P1 | `CF-SIGNAL-AUTONOMY-SHADOW-1.0` | Stateful no-send qualification/follow-up simulation and authority compatibility decisions | No live scheduler/provider send |
| P2 | `CF-LEAD-TO-CONVERSATION-PILOT-1.0` | Controlled RingCentral provider path, then eligible small-cohort SIGNAL/CONTROL measurement | Separate provider/agency, real-data and outreach authorization |
| P3 | `CF-AUTONOMY-SCALE-1.0` | One proven permissioned automation family with limits | Verified positive economics and explicit live autonomy approval |

**Concurrency:** Establish the shared `CF-CONTINUOUS-EVIDENCE-1.0` admission/projection contract first; P1 acquisition, memory and SHADOW can then proceed in coordinated draft/test lanes while P0 release review proceeds; provider-independent work must not create another CRM, contradictory migrations or unresolved branch overlap. P2 provider testing may proceed only within its own authorized boundaries.

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

> Implement `CF-AUTONOMOUS-GROWTH-ROADMAP-3.0` as the **highest-priority economic product execution guide**, and `CF-CONTINUOUS-EVIDENCE-1.0` as its **P1 compounding-intelligence foundation connecting Acquisition, Prospect Memory, renewal facts and multi-turn SIGNAL SHADOW** beneath the adopted CoverageFit North Star and constitutional safety floor. Continue from the current verified code; do not restart. Preserve combined Command Center's operator-attested hosted Preview acceptance, STOP/CONTROL and default-off no-send behavior. Perform the bounded PR #7 → aggregate PR #16 merge/publish integrity review, without merging or deploying absent express approval. In parallel, advance the smallest reviewable test-only slices of acquisition source/provenance/identity/cost intelligence, durable Prospect Memory and renewal facts, and multi-step permission-aware SIGNAL SHADOW orchestration. Use one canonical profile and message authority model. No live purchased-list texting, no new autonomous sends, no unaudited identity merges, no provider changes, no real-data acquisitions or spending. Define each slice by its prospective contribution to useful conversations, verified premium and attributable producer minutes. Consolidate future consequential decisions into one owner packet, and move to an approved live provider canary/economic trial only when corresponding gates pass.

**North Star reminder:** We are not building a more elaborate producer dashboard. **We are building an evidence-driven autonomous insurance growth and relationship system that turns large amounts of permissible prospect evidence into fewer, better, producer-worthy conversations and measurable written premium—with much less producer effort.**
