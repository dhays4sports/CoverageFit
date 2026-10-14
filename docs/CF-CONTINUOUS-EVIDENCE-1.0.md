# CF-CONTINUOUS-EVIDENCE-1.0 — Continuous Evidence Accumulation / Evidence Flywheel

**Status:** P1 FOUNDATIONAL PRODUCT MANDATE — LOCAL E2/C1/C2/C3/PRODUCER INTEGRATION C4 IMPLEMENTED AND TESTED; NOT HOSTED-CERTIFIED
**Adopted:** 2026-10-13  

**2026-10-14 status reconciliation:** [Integration-readiness report](CF-ROADMAP-3-INTEGRATION-READINESS.md). Historical proposed schema/slice descriptions below govern requirements; they do not negate the now-tested local persistence/queue/read contracts. Real-event ingestion, hosted operation and economic outcomes remain separately gated; no restart or new intelligence layer is needed.
**Program:** CoverageFit + SIGNAL / Autonomous Insurance Growth Roadmap 3.0  
**Governing:** [CoverageFit North Star](../COVERAGEFIT_NORTH_STAR.md) · [Roadmap 3.0](COVERAGEFIT-AUTONOMOUS-GROWTH-ROADMAP-3.0.md) · [Master Roadmap 2.0](COVERAGEFIT-NEAR-TERM-PRODUCER-ROADMAP-1.0.md) · [Current State](COVERAGEFIT-CURRENT-STATE.md)  
**Scope:** Future canonical, lawful, source-linked prospect knowledge accumulated from authorized lead sources and relationship interactions; not a separate CRM or independent agent platform.

## P1 DATA RIGHTS / TRANSFERABILITY — private-profile default, future aggregate optionality

**Principal decision:** Continuous Evidence Accumulation must remain a **private, access-controlled relationship memory**. Never treat accumulation as permission to sell individual enriched Prospect 360 histories, customer messages or imported agency/vendor leads. The only optional later concepts are (a) **genuinely de-identified aggregated insurance market intelligence** whose *source rights actually permit that secondary/commercial use*, and (b) **specifically authorized direct CoverageFit consumer inquiries**, not automatic transfer of existing agency, 408FARMERS, district or purchased leads. [Detailed option/rights specification](CF-DATA-RIGHTS-AND-MARKET-INTELLIGENCE-OPTIONAL-1.0.md).

**Build the rights architecture now, not the marketplace:** Proposed source/evidence contracts must distinguish internal insurance use, analytics rights, third-party commercial analysis rights, individual sharing restrictions, originating data owner/controller, agency/carrier/source/vendor agreements, permitted retention, consent/withdrawal evidence, recipient/purpose/field scope and request-time eligibility. **Default `external_transfer=NOT_AUTHORIZED` and `secondary_commercial_use=UNKNOWN/INELIGIBLE` until positively established.** Rights/eligibility can be revoked and derived data re-evaluated; no new independent CRM. Do not imply a contract/consent is valid just because imported metadata says so.

**Aggregate path requirements if evaluated later:** disclosure-risk assessment beyond names removed; avoid record-level pseudo-anonymous products, small cells, rare attributes, fine-grained locality/time, query differencing/linkage and reidentification. Risk mitigation may involve domain-specific cohort thresholds, suppression/generalization, controlled query budgets or differential privacy depending on the dataset. Verify law, contracts, collection notices, independent ownership authority and prospective commercial use before any external report/API/export. Consider correction/erasure propagation, output provenance and the possibility that even aggregates derived from restricted sources cannot be sold.

**Direct-inquiry path requirements if considered later:** verified direct CoverageFit origin and separate authorized distribution purpose, specific recipient/category, minimal authorized fields, applicable opt-out/withdrawal, agency/licensing/referral compensation counsel review and a separate sender/channel contact authority gate. No full profile export.

**Engineering acceptance:** rights metadata travels with any derived fact; rights changes can prohibit a source from a future aggregate or transfer without deleting otherwise lawfully retained relationship history; a denied source does not leak into a derivative export. These are conceptual future tests and no live commercialization/export implementation is approved.

---

## A. Product mandate and rationale

> **Continuous Evidence Accumulation:** Every *permitted* acquisition event and meaningful interaction is an opportunity to improve CoverageFit's understanding of a prospect. SIGNAL must admit, extract, reconcile and preserve relevant evidence within the canonical Prospect Profile, retaining uncertainty, verification, time, identity boundaries and contact restrictions. Each subsequent decision should use the best currently justified evidence, avoid redundant questions, identify genuine readiness and seek the smallest valuable next step. **Intelligence can accumulate continuously; communication happens only when separately justified and authorized.**

This is the **connecting mechanism**, not a secondary enrichment tool:

- Acquisition supplies authorized observations and source attribution.
- The Evidence Flywheel transforms them into retained and provenance-linked assertions.
- Prospect 360/UCP presents one coherent, auditable relationship memory.
- SIGNAL uses the projection to decide what is already known, what remains uncertain and whether any action is justified.
- Later permissible customer replies, source changes, producer verifications and actual provider receipts feed the same evidence pipeline.
- The next action becomes more timely, better informed and less repetitive, potentially reducing producer minutes and improving conversion.
- Better memory must **not** create hidden profiling, longer retention than authorized, inferred contact consent or contact of suppressed prospects.

The system's "learning" is **per-prospect, evidence-backed, reversible relationship state**, **not** an automatic model retraining loop, a claim that AI inference equals verified truth, or blanket reuse of private customer data to train models.

## B. Implementation position and current-state boundary

The accepted read-only Preview's existing `server/prospect-360-readonly.mjs` derives renewal claims from `cf_solo_sources`/`rawFacts`, current SMS facts, `renewal_verification_v1` and existing `cf_ucp_opportunity_links`; it preserves date precision and conflicts but does **not** yet persist a canonical multi-source FactAssertion/evidence-event ledger. `server/engagement-shadow-simulator.mjs` is a pure no-send simulator, not a persistent live conversation manager. Existing SMS conversation storage, source rows, RAW import and UCP/commitments are **reuse targets**.

Before designing migrations, audit actual current schema, read/write ownership, existing source record structures, idempotency keys, data retention rules, policy constraints and approved UCP link semantics. Extend canonical stores only where indispensable. Do **not** invent a second prospect store, relabel third-party records as first-party, or make a new Messaging/CRM source of truth.

**Dependency designation:** `CF-CONTINUOUS-EVIDENCE-1.0` is a **P1 foundation** at the same priority as acquisition, memory and SHADOW, and the **shared data contract beneath all three**. It is a prerequisite for credible cross-channel accumulating memory and evidence-aware multi-turn autonomy, not a blocker to independent safe intake/SHADOW tests.

## C. The canonical flywheel — seven bounded operations

1. **OBSERVE / ADMIT** — receive a permitted event with immutable source lineage and applicable data-rights/retention scope. Reject/hold unmapped, prohibited, unknown-origin or inadequately permissioned uses; accepting data for a legitimate purpose is *not* authorizing outreach.
2. **RESOLVE IDENTITY** — attach the event to one prospect only when an established deterministic/owner-confirmed identity link permits it. Otherwise hold with an explicit candidate/conflict reason. Never auto-merge people/households solely because they share a phone, name or address.
3. **EXTRACT** — derive narrow typed assertions and explicit intent/commitment candidates from event content. Record source spans/references, interpreted value, precision, extractor version and whether evidence is customer-reported, vendor-asserted, producer-confirmed or document-backed. Avoid unnecessary highly sensitive fields.
4. **RECONCILE** — compare with earlier assertions using provenance, effective date, observed date, verification, authority and contradiction rules. Append revision/supersession relationships rather than silent value replacement. Record UNKNOWN, CONFLICTED, STALE and WITHHELD distinctly.
5. **PROJECT** — compute versioned, read-only current Prospect Intelligence: usable facts, uncertainty, outstanding missing facts, renewal windows, stated intent, next recorded commitments, conflict flags and *separate* contact safety/eligibility from the established authority owner.
6. **DECIDE** — have SIGNAL/Attention/Action Quality consume this current projection. Ask only a material missing question when communication is separately authorized; otherwise wait, propose a human action, put a conflict in review or STOP. Recheck latest source revision, identity, opt-out, route and producer takeover at actual execution time.
7. **LEARN FROM OUTCOME** — ingest only observed delivery/inbound/producer actions and verified outcomes with their own source references; close resolved commitments, recompute projections and measure economic value. No fabricated "sent", "replied", "verified", "quoted", "bound" or premium event from a proposed action.

**Core invariant:** `Evidence admission ≠ assertion truth ≠ customer identity link ≠ contact authority ≠ action authorization ≠ provider delivery ≠ business outcome`. Each is an independently evidenced transition.

## D. Logical data contracts (reconcile to existing schema before D1 migration)

Names below are **design contracts**, not assertions that these tables/fields already exist.

### D1. Evidence event / permitted source record

Minimum: `evidence_event_id`, `workspace_id`, `prospect_or_held_identity_reference`, `source_kind` (`import`/`first_party_form`/`sms_inbound`/`call_note`/`document`/`producer_correction`/`provider_receipt` etc.), `source_record_id`, `source_batch_id` if present, `source_sequence`/provider message ID or digest, `observed_at` (when fact arose), `received_at` (when CoverageFit learned it), `source_actor`/channel, `source_lineage`/data use license, `authority_to_process_scope`, `retention_class`/expiry requirement, `payload_reference` or minimized permitted extract, `source_integrity`, `ingest_revision`, `processing_status` and `hold_reason`.

- Preserve original evidence **only where its lawful use and retention are supported**, and prefer secured links/minimized extracts when raw payloads should not be retained.
- Use an idempotency key scoped to workspace + source namespace + immutable source ID/version. Preserve collisions as conflicts when the same ID arrives with different material content.
- Record actual provider/inbound timestamps with time-zone and ordering semantics; uncertain ordering must not silently become a fresh customer reply.

### D2. Fact assertion (append/audit capable)

Minimum: `assertion_id`, `workspace_id`, `subject_id`, `field_key`, `typed_value`, `unit/precision`, `product_line` if applicable, `effective_from/to` if applicable, `source_event_id`, `evidence_locator`, `asserted_by`, `evidence_class`, `observed_at`, `extracted_at`, `extractor_version`, `verification_status`, `confidence_class` (not a standalone truth grant), `supersedes_id`/`contradicts_id` where relevant, `privacy_class`, `retention_policy`, `active/withheld/tombstone_status`.

Candidate first-wave insurance fields: product interest, current carrier, number of vehicles/drivers, self-reported homeowner status, renewal date/month, shopping reason, preferred channel, explicit call/quote request, callback timing, quoted/proposed outcome and producer-confirmed resolution. Complex coverages, premiums, household identity and document claims need precise source and proper producer/carrier verification; sensitive traits should not drive lead desirability.

### D3. Projected Prospect Intelligence

Derived current view contains `profile_id`, `projection_version`, `source_watermark`, `computed_at`, `known_current_facts` with evidence refs, `missing_material_facts`, `conflicted_facts`, `stale_facts`, `customer_stated_intent`, `renewal_window`, `open_commitments`, `last_meaningful_interaction`, `identity_link_status`, `confidence/verification labels` and `contact_safety_reference`. This is **derived**, reproducible from permitted underlying events and corrected by real source changes; it is not a second independently editable CRM.

### D4. Decision/evidence trace

When SIGNAL proposes an action, link `decision_id` → `profile_projection_version`, exact evidence refs, latest conversation/source revision, `why_now`, `what_is_missing`, `why_this_question_not_repeated`, `contact_authority_result`, `proposed_action`, `human_approval_required`, `execution_state` and `exception_code`. Keep proposal, approval, actual send and provider receipt separate. Never persist token/secrets as evidence.

## E. Evidence authority, temporal validity and contradictions

**Verification is typed:** `imported_unverified`, `customer_reported`, `producer_confirmed`, `document_verified`, `carrier_confirmed` (only with actual authorized carrier evidence), `conflicted`, `stale`, `unknown`. Do not automatically map today's `sms_fact` to customer-confirmed exact renewal where the existing implementation expects a structured verification record. The source's claim and the verification decision are distinct events.

**Conflict policy:** Comparison takes account of field semantics, time and product. Two verified renewal dates for different policies are not necessarily a conflict; same policy and effective period with different dates may be. Newer is not always truer. For a true unresolved material conflict, preserve both and avoid selecting a confident current value; propose a minimal correction/review.

**Correction/retraction:** Producer confirmation or customer correction generates a new sourced assertion and a versioned projection; it does not rewrite old evidence invisibly. Support invalidation of incorrect extractions, reassignment only after safe identity confirmation, policy-based removal/tombstoning and downstream projection recalculation.

**Freshness/decay:** Renewal precision, current carrier, vehicles and contact preferences can age at different rates. Define field-level recency rules and context-aware expiry; mark stale rather than invent a new annual date or force a message. Historical facts remain useful for provenance only to the extent lawful retention permits. Inbound urgency and evidence lifetime are separate clocks.

**Negative and protected facts:** STOP/opt-out, wrong number, privacy preferences, identity mismatch and producer takeover can **restrict** actions immediately. A new customer reply, vendor consent claim, imported phone or verified renewal date cannot implicitly cancel those restrictions. Contact authority is the independent action-time policy gate.

## F. SIGNAL SMS and relationship-cycle semantics

### F.1 Dynamic evidence-driven cadence — next evaluation, not automatic SMS

[CF-SIGNAL-DYNAMIC-CADENCE-1.0](CF-SIGNAL-DYNAMIC-CADENCE-1.0.md) is the P1 **downstream decision/scheduling child** of this evidence foundation, within existing SIGNAL Autonomy. New permitted evidence and independently justified time triggers cause a **re-evaluation** of the latest versioned profile, not automatically an SMS send. SIGNAL should determine what is meaningfully missing, already answered, conflicted, stale or ready for a producer; return minimal next action, evidence references, reason and `next_evaluation_at|null`, while independently gating source rights, STOP, CONTROL, actual channel/provider/sender authority, agency owner, human takeover, cooldown and real provider delivery. Zero-message outcomes are correct when no useful communication is justified.

**AgencyZoom is the current cadence owner** for district lead follow-up. Dynamic CoverageFit scheduling is limited to future **specifically approved families**, with one active owner and audited cutover; RingCentral is an eligible transport only when approved. Do not create duplicate cadence or a new messaging gateway. C1 pure test-only planner can advance with E2 durable evidence work; C2 durable evaluation queue, active provider jobs, family cutover and any real outbound require separate gates. The existing synthetic Evidence SHADOW demonstration proves *changed questions*, not a persistently scheduled or live cadence.

A "cycle" is an **evidence evaluation loop**, not a scheduled outbound campaign by default:

`New authorized input → event dedup/link → extraction/reconciliation → current profile → check terminal/hold states → derive next minimal question/action → positive contact authority check → propose/human review/authorized execute OR wait/hold → actual result/reply → next cycle`.

- If renewal date is already current and sourced, do not ask it again.
- If vehicle count is known at sufficient quality for the next step, ask something more relevant or ask nothing.
- If the prospect explicitly requests a call, route CALL to producer rather than insist on completing scripted SMS questions.
- If renewal is a distant candidate date, retain it and evaluate later without creating automatic contact authority.
- If delivery status is ambiguous, hold in DELIVERY_REVIEW; do not blindly retry or falsely mark as delivered.
- If STOP/opt-out/wrong number/CONTROL/test/purchased-list route prohibited/unknown-owner/human takeover, no outbound send is proposed for unauthorized execution. Existing human assistance and permitted source-processing rules govern residual information.
- After every actual permitted reply, record newly asserted facts and recompute next decision; raw model extraction is **not** enough to auto-upgrade verification or contact consent.
- If an import adds profile evidence but no outreach route, the profile may become more organized without any communication being sent.

**Guiding optimization:** minimize *unnecessary* questions, sends and producer work while maximizing verified, relevant facts and useful genuine conversations. Do not optimize for message volume or profile field count.

## G. Security, privacy, agency and provider invariants

1. **Data minimization and rights:** evidence collected only for legitimate permitted insurance purposes, from authorized sources, with source-specific use limits. Avoid speculative enrichment and unnecessary sensitive/protected attributes. Retention, correction, access, deletion and erasure propagation must be planned before storing new customer payload classes.
2. **Tenant and role isolation:** workspace-scoped identities, source rows, evidence links, projections and query/preview endpoints. No cross-agency leakage; test with adversarial workspace/owner fixtures.
3. **Provenance integrity:** store immutable references or verifiable digests, processing/extractor version, and accurate original assertion wording when appropriate; separate data from untrusted instructions in SMS, imports or documents.
4. **Untrusted text and model output:** prompt-injection resistant extraction, schema validation, field allowlists, constrained output, no external calls or privileged execution triggered by source text, fail-closed on malformed/untrusted events. Model-assisted extraction is a candidate; deterministic validators and approval govern promotion.
5. **Consent and messaging:** permitted acquisition/retention ≠ consent to call/SMS. Keep an independent positive sender/message-class/channel authority record with opt-out/DNC and provider-compatible route checks at execution time. RingCentral's restrictions on purchased/third-party-generated list SMS remain binding to that route; do not launder provenance.
6. **Action and source ownership:** AgencyZoom district stages/cadences continue under existing control; carrier/rating/bind operations remain Farmers/producer responsibilities. Profile facts should not be silently written back to AgencyZoom or used to automate carrier decisions.
7. **Operational continuity:** replay-safe ingestion, versioned projections and audit traces; manual producer fallback if AI, evidence extraction, RingCentral or provider status fails. Fail closed on incomplete evidence/unknown identity.
8. **No autonomous retention-by-default:** retaining irrelevant raw conversations forever is not a feature. Build retention classes, cleanup/testing, data-subject correction requests and verified derived-data invalidation as part of the data contract.

## H. Phased implementation slices and no-send exit gates

**H0 — Audit/reconcile sources, schema and governance (P1, research only).** Enumerate existing lead/SMS/`cf_solo_sources`/UCP/commitment paths, ownership, fields, idempotency, privacy/retention and carrier/provider gates. Produce source-of-truth crosswalk and no duplicate-store proof. No D1 migration or production change.

**H1 — Deterministic event-to-assertion adapter (P1, synthetic/test only).** Accept bounded first-party form/import and linked synthetic inbound records; generate stable IDs; validate allowed field assertions; preserve timestamps/source links; quarantine unknown identities. Write an offline fixture implementation or isolated test storage using existing primitives; never ingest real customer contents without new authorization.

**H2 — Fact reconciliation and read-only projection (P1, synthetic/test only).** Implement field/type/time-aware conflict, verification, suppression isolation, stale/renewal rules and rerunnable projection. Wire into the existing Prospect 360 **behind a new default-OFF read-only flag only if a runtime change is separately reviewed**. No silent verified-date promotion.

**H3 — SIGNAL evidence-aware decision SHADOW (P1, synthetic/test only).** Feed current projected facts and evidence refs to stateful simulator; ask only missing useful questions, honor explicit CALL/quote/follow-up, preserve callback and renewal timing, terminal holds, permission state and revision. Tests prove a reply updates the profile and changes subsequent decisions without sending.

**H4 — Source adapters and human correction (gated).** Extend to consented actual form flow, approved producer notes, authorized provider inbound, approved call/document evidence, and auditable human correction when respective security/privacy/production permissions are obtained; all reuse H1–H3.

**H5 — Continuous operation with verified outcomes (later and separately authorized).** Actual provider receipt, current inbound, follow-up and quote/bind evidence feed the ledger; measure user value. Live outreach automation remains a separate authority and economic decision even if memory is production-deployed.

### Minimum synthetic acceptance suite

- **Import replay:** 1,000 mixed-source events; unique IDs yield one logical assertion each; duplicate IDs with changed payload are held; all accepted/rejected/held counts reconcile.
- **Conversation replay:** same SMS delivered twice or out of order does not duplicate assertion or trigger repeated question; source sequencing and clock supported.
- **Known versus unknown:** customer has already supplied renewal date, carrier and vehicle count; next SHADOW cycle never asks them again without a documented stale/conflict/need reason.
- **Correction and conflict:** imported December renewal vs customer January vs document different date; preserve all assertions; verified resolution requires actual appropriate event; demonstrate no silent date rewrite and no false sender permission.
- **Identity hold:** shared phone or address across two profiles never auto-merges or leaks facts.
- **Suppression:** prospect originally marked CALL but underlying independent conversation later STOP remains suppressed; a new inbound/import cannot remove STOP. CONTROL, TEST, unknown owner, wrong number and explicit opt-out fail closed.
- **No-send list:** vendor/purchased lead becomes source-ranked/profile-enriched but remains blocked for RingCentral list SMS even if high intent or vendor claims opt-in.
- **Retention and erasure:** expired/withheld/deleted source cannot remain discoverable in derived fact projection or decision cache; preserve only records legally required, with auditable suppression of prohibited use.
- **Multichannel convergence:** independent authorized events update one correct profile and preserve original source/time; only positive verified identity links allow cross-channel facts.
- **Operational failure:** interrupted batch, extract timeout, invalid schema, concurrent updates and uncertain receipt never create duplicate external action, forged verification or lost commitment.
- **Economic trace:** demonstrate a realistic no-send test showing fewer redundant qualification questions and auditable producer-attention proposals, without claiming synthetic premium uplift.

**Exit to P1 completion:** reproducible source/identity, fact extraction, conflict and time semantics, a safe current Prospect Memory projection and a SIGNAL SHADOW consumer, with stable deterministic/replay tests and documented privacy/retention contract. **Do not mark LIVE** because tests, local SQLite or a read-only Preview passed.

## I. Economic value and quality measurement

Keep Roadmap 3.0 primary economics: **attributable producer minutes / genuine useful conversation**, useful conversations/hour, verified written premium/hour and source cost/useful conversation. Add *leading flywheel measures*:

| Indicator | Meaning | Desired interpretation |
| --- | --- | --- |
| Source-backed usable facts per eligible profile | Non-redundant current, source-traced insurance-relevant facts | Higher **only** with accuracy and relevance |
| Verified renewal coverage | Current actionable renewal evidence with correct line, precision and verification | Higher, no date invention |
| Redundant questions per real conversation | Questions whose answer was already sufficiently known at decision time | Lower |
| Manual correction/entry minutes | Producer time spent reconstructing or fixing prospect knowledge | Lower |
| Incorrect extraction / false merge rate | Audited wrongly asserted, overconfident or cross-profile claims | Near zero; explicit hold preferred |
| Material conflicts resolved validly | Proven review/correction vs hidden/ignored contradictions | Higher valid resolution |
| Evidence-derived high-intent handoffs | Actual useful conversations that benefited from retained sourced context | Higher only when verified |
| Contact-policy false-positive rate | Unauthorized/prohibited contact erroneously proposed or performed | Zero tolerated sends; enforce fail-closed |
| Retention violations / unauthorized data access | Source data misuse or expiry leakage | Zero tolerated |

Report rates with denominators and population/source context; avoid vanity metrics such as total evidence events, text volume or "AI enrichment percentage". Never optimize to collect extraneous personal information. Measure whether old verified context reduced questions and improved qualified handoffs in the later real SIGNAL/CONTROL experiment.

## J. Principal-attention and release governance

This foundational package may proceed through **repository audit, offline synthetic engineering, deterministic tests, read-only design and draft PRs** without recurring operator Cloudflare work. Schema writes, Production flags, first use of real customer records, new provider scope, credential changes, external messages, data purchases, agency/CRM writes, and autonomous activation require **separate explicit approval** with exact scope, retention and rollback. A GitHub merge may auto-publish; confirm real effects.

Present principal review as one consequential decision packet: what reusable primitive changed, why it advances producer value, exact evidence, privacy/provenance and permission risks, unknowns, alternative, cost/owner attention and requested authorization. Do not demand repeated accepted synthetic Preview SQL checks for untouched runtime.

## K. Engineering implementation handoff

> Implement **`CF-CONTINUOUS-EVIDENCE-1.0` as a P1 foundational shared intelligence contract**, not an optional profile enhancement. Begin by auditing existing `cf_solo_sources`, SMS conversation and UCP linkage/Prospect 360 projection paths; build safe source ingestion and deterministic event/fact/renewal reconciliation in synthetic/test-only draft scope, then feed a versioned current profile into SIGNAL SHADOW. Keep the no-send boundary and future user-facing interface unchanged unless a separately reviewed feature flag is required. Reuse canonical stores, avoid accidental identity merges and avoid asking again for materially known facts. Do not enable provider subscriptions, reclassify purchased list leads, reset STOP, contact customers or merge/deploy. Exit only on reproduced evidence of accurate profile enrichment, conflict preservation, replay safety, retention enforcement and smarter next-action decisions. **The Evidence Flywheel is the core mechanism beneath acquisition, Prospect 360, SIGNAL and producer attention.**
