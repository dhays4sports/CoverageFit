# COVERAGEFIT-PRODUCER-COMMAND-CENTER-EXPERIENCE-1.0

**Status:** PROPOSED — design and implementation review only; no runtime code, schema, feature flag, production release, external send, or CRM authority is approved by this document.  
**Date:** October 12, 2026  
**Primary repository:** dhays4sports/CoverageFit  
**Base:** PR #12 / Producer Action Quality integration branch; do not merge this stacked spec ahead of its safety dependencies.  
**Canonical authority:** COVERAGEFIT-NEAR-TERM-PRODUCER-ROADMAP-1.0.md / Master Roadmap 2.0 and COVERAGEFIT-CURRENT-STATE.md.  
**Scope:** Producer Today, Inbox, Review Queue, governed selected-SMS approval, Prospect 360 entry points, renewal return triggers, and scalable evidence/permission architecture.

## 0. Executive decision

**Design the producer's day, not a second CRM.** CoverageFit owns a unified producer attention and relationship-intelligence experience. SIGNAL interprets evidence and reconciles suggested action. AgencyZoom remains the district CRM/cadence authority until explicit approved family-by-family cutover. RingCentral is communication transport within its own consent, registration and purchased-list restrictions, not the authority for prospect identity or business state.

The primary jobs to be done:
1. In one glance, know who needs attention, why, what is due, and what next action is actually authorized.
2. Review multiple genuinely eligible drafts with minimal clicks; approve a selected, visibly reviewed set without converting that action into a marketing blast or bypassing per-recipient safety.
3. Preserve a continuously improving, source-attributed prospect record from original lead data, SMS, calls/transcripts, screenshots, documents, producer corrections and appointments.
4. Build a durable renewal-driven pipeline that brings prospects back at the right time without repetitive chasing.
5. Ingest high volumes of lower-cost leads as evidence/inventory while refusing unsupported SMS contact or invented permission.
6. Measure fewer producer minutes per useful conversation and more verified premium per productive hour, including exception cost.

**Success is economic leverage and trusted next actions—not number of messages sent, number of imported rows, or a feature count.**

## 1. What already exists and must be reused

Actual code audited October 12, 2026 on draft PR #12:
- server/producer-workspace.mjs: classified DISTRICT_SIGNAL / DISTRICT_CONTROL / WEB_DIRECT / OTHER Work list/detail, Attention sorting, commitment projection and Producer Action Quality; some GET reads update classifications/projections, so not logically read-only.
- assets/js/producer-workspace.mjs: existing Work, Import, Analytics, Tools navigation, attention and evidence rendering, detail panel and 15-second selected-thread polling.
- assets/js/producer-sms.mjs: a **single-conversation** pending draft, Edit, Approve & send, Decision 2 and manual AgencyZoom acknowledgement; there is no cohesive multi-select review queue.
- server/sms-signal-api.mjs: producer-authenticated, same-origin, guarded single-message approval, exact conversation revision check, cohort/ownership/STOP/opt-out/manual takeover checks, idempotency key tied to conversation revision, delivery-review state after ambiguous send.
- server/signal-copilot-* and related docs: default-off AI suggestion with producer review, stale-context and model-budget protections.
- UCP, cf_solo_opportunities, cf_solo_sources, cf_solo_tasks, SMS history, Opportunity Priority / FIV / NBA, Attention, commitments, acquisition measurement, source identity and provenance.

**Design constraint:** Adapt these primitives. Do not create new independent scores, another contact table, a second RingCentral sender, or a replacement AgencyZoom state machine. Draft PR #12's outstanding hosted Preview isolation/acceptance gate remains mandatory before enabling new action surfaces.

## 2. Experience architecture

Recommended primary navigation, introduced progressively:
- **Today:** producer obligations / highest-value next actions, deduplicated per relationship.
- **Inbox:** actual inbound and communication work, including the governed Review & Approve queue; same relationship context, not an unconnected inbox.
- **People / Prospect 360:** durable evidence-backed individual/household relationship view.
- **Pipeline:** stage, renewal, quote/future-bind, and outcome views; preserve existing AgencyZoom and Solo Desk stage mapping.
- **Operations:** existing Import, Analytics, Tools and campaign ownership diagnostics; do not hide operational exceptions.

**Migration rule:** First compose Today/Inbox panels over the existing Workspace; maintain current Work/Import/Analytics/Tools and manual provider paths behind feature flags. Do not switch default navigation until parity, mobile usability, and measurable value are demonstrated.

### 2.1 Desktop layout

Top horizontal strip: Today | Inbox | People | Pipeline | Operations, with count only when it represents current actionable work, never vanity notification totals.

Today layout:
- Header: next appointment and brief shift-ready summary (not a list of dashboards).
- Four compact counters: **Need me now**, **Reviewable replies**, **Renewals in active window**, **Delivery/identity exceptions**; count definitions displayed on demand.
- A single prioritized work list with columns/properties: prospect, why now, governed exact action, last meaningful evidence, known/uncertain renewal, due commitment, last interaction, contact permission/channel, one-tap open.
- Sort: Recommended / Due now / High intent / Renewal window / Newest. Filters: needs response, callback, quote/review, future bind, waiting, do-not-contact, delivery needs review, confirmed renewal / month-only / unknown. Suppressed/CONTROL excluded from actionable counts, available in explicitly labeled read-only/normal-process views.
- Right context drawer: 2–4 line summary, last interaction, known facts, next obligation, open conflicts, audit/source links, **one primary action** matching SIGNAL / Action Quality. No disembodied AI score or unexplained red urgency.

Inbox layout:
- Tabs: **Needs reply**, **Review & Approve**, **Delivery needs review**, **Waiting**, **All**.
- Three panes on desktop: narrow relationship list; conversation timeline / editable draft; right Prospect 360 mini-card and permitted next actions.
- Each conversation row: source badge, last inbound timestamp, channel and permission state, why it is here, next due time, draft eligibility. Distinguish customer inbound, system observed outbound, producer drafted, provider accepted, provider failed/unknown, suppressed, customer waiting.
- Unmatched/ambiguous phone conversations go to a separate reconciliation exception—not silently merged with a prospect because of phone similarity.
- Never show “send” as the available primary action for an unsupported population, ambiguous owner, STOP, unverified consent, wrong number or provider-delivery ambiguity.

### 2.2 Mobile experience

One-column, bottom reachable tabs; Today opens with highest priority cards and a primary Open action. Inbox uses a two-stage drill-in (list → conversation+context sheet); Review queue uses a sticky selection summary and a final accessible confirmation screen. 44px minimum touch target, visible keyboard focus, screen-reader labels, responsive 320px layout, no horizontal scroll for message review. Unsaved draft state preserved on navigation. No long multi-pane desktop form squeezed onto a phone.

## 3. Selected SMS approval is NOT bulk marketing

### Product distinction

**Approve Selected** means approving a small, visibly reviewed collection of existing, eligible **one-to-one** conversation drafts. It does **not** mean upload a purchased list and message everyone, and it does not create auto-send authority. Per-item consent and transport checks apply regardless of group selection.

RingCentral's SMS policies forbid purchased or third-party generated lead lists for SMS. Registered business campaigns and express/logged opt-in requirements apply to permitted automated/promotional messaging. Do not route around these provider restrictions, even with another sender identity or high-volume API. Legal and carrier/agency compliance review is an explicit later gate.

### 3.1 Review Queue card

Each candidate card must display:
- Prospect name and linked opportunity; relationship ownership and recognized sending identity.
- Source/consent badge: **eligible for this message class**, with expandable evidence; if uncertain, **blocked** and not selectable.
- Latest *relevant* incoming question, timestamp and source link; short conversation summary, relevant known facts and renewal timing.
- Editable **exact complete outgoing text**, clear sender/messaging campaign, reply/STOP handling and estimated segments/cost if known.
- Draft confidence/evidence limitations **without** making AI the send authority.
- Draft revision, last reviewed timestamp and a conspicuous “newer reply arrived” indicator.
- One-card Edit / Skip / Open profile / Approve & Send.

No auto-checking unfamiliar cards. Select-all may select only **currently eligible items visibly presented in the reviewed set**, never all filtered records across unviewed pages. The producer may deselect or edit individually.

### 3.2 Batch approval: five guarded transitions

**A. Candidate**: only governed existing pending replies enter the list. No bulk first-touch to imported third-party leads. Recheck ownership, channel, contact permission, valid sender/campaign, opt-out/wrong-number, latest inbound, manual takeover, existing automation owner, pending delivery review.

**B. Preview**: producer checks selected items and clicks “Review selected”. Server returns a *no-send* immutable review envelope for each: opportunity ID, conversation ID, current revision, canonical message hash, consent/ownership evidence versions, message class, sender, eligibility reason, expiry and an overall summary. Ineligible items are excluded with a visible reason.

**C. Human approval**: show exact text for every selected recipient in one final scrollable confirmation, along with eligible count, blocked/changed count, recipient identifiers masked as appropriate, segment/cost estimate and an explicit **Approve N individual messages** action. User must actually review the text; there is no approve-all-unseen, no approval from generic AI recommendation. Each line gets producer identity, time, original evidence, text hash and an audit record.

**D. Governed dispatch**: batch endpoint creates a durable, independently idempotent **per-recipient approval/outbox instruction**, not a client loop that calls single-send repeatedly. Re-evaluate all safety/ownership/channel rules **immediately before provider submission**. Reject changed message/revision, newer relevant inbound, paused ownership, STOP, invalid permissions, expired approvals, conflicting AgencyZoom active family. Respect per-sender provider campaign/rate/concurrency limits.

**E. Receipts**: mark each row individually as SENT/PROVIDER_ACCEPTED, BLOCKED_CHANGED, SKIPPED, SUPPRESSED, DELIVERY_REVIEW or FAILED_SAFE. The entire batch can partially complete safely. Ambiguous provider acceptance enters DELIVERY_REVIEW; never blindly retry it or change the idempotency key to force a duplicate. Provide a recoverable review trail and a concise status report. No inferred delivered/read state from successful API submission.

### 3.3 Contract boundary

Suggested future routes (design only; audit route names/auth helpers first):
- GET producer/review-queue?status=eligible|blocked|delivery_review&cursor=...
- POST producer/review-batches/preview (no sending)
- POST producer/review-batches/approve (creates bounded per-recipient intents only after exact reviewed snapshot approval)
- GET producer/review-batches/{id} (per-item status/receipts)

A possible per-item **review snapshot** contract has: opportunity_id, conversation_id, revision, draft_text_hash, evidence_context_hash, contact_permission_version, ownership_version, sender_campaign_id, approved_message_class, candidate_expires_at. Avoid placing full customer history in approval receipts. Server must hash **complete** final outgoing text and bind it to recipient, sender, campaign, and producer approval.

**Ownership:** the authoritative single-message SMS gateway remains the execution path (or a thin tested transactionally safer adapter around it). Do not create a second send implementation. If existing storage cannot provide durable compare-and-swap/uniqueness across workers and providers, do not implement batch sending by sequencing calls from the browser.

**Scope limit for first pilot:** max 10 reviewed conversations per batch; configurable later after actual delivery/retry evidence. A batch is one UI approval moment, but ALWAYS independent per-recipient authority and outcomes. Never use a selected batch for undifferentiated marketing blasts.

### 3.4 Failure mode matrix

| Event | Required behavior |
| --- | --- |
| New inbound arrives after selection | Mark draft stale, remove from send-eligible set, retain revised context |
| Opt-out, STOP or wrong number | Immediate permanent contact suppression for affected scope; no send |
| CONTROL / unknown owner / AgencyZoom conflicting family | No SIGNAL send; normal assigned/manual path remains |
| Producer takes over a conversation | No automatic/batch send; manual follow-up only |
| Recipient identity / sender changed | Invalidate approved envelope; require fresh deliberate review |
| Provider accepts then response times out | DELIVERY_REVIEW; reconcile provider message ID before retry |
| Mixed results in a batch | Per-item receipts and exceptions, no silent global “success” |
| Token/authorization expires mid-batch | Stop new authorizations; reconcile already accepted work; no duplicate submission |
| Duplicate button clicks / retries | One approval intent and at most one provider submission per eligible revision/idempotency key |
| A message requires a different registered campaign | Hold and route for manual resolution; no silent sender substitution |

## 4. Prospect 360 is the relationship evidence spine

Use the existing Universal Customer Profile and opportunity/source records as identity and acquisition foundation.

**Four logically separate layers:**
1. **Source event/evidence ledger:** immutable original import row/campaign/source identity, SMS/call message and provider IDs, uploaded document/screenshot refs, timestamps, extractor version, permissions, and source quality.
2. **Fact assertions:** claim + domain/key/value + provenance + observed_at + valid_from/to + precision/confidence + state PROPOSED / VERIFIED / DISPUTED / SUPERSEDED / STALE; explicit producer corrections and traceable conflicts.
3. **Durable relationship memory:** compact, bounded summary and open questions, objections, current shopping reason, last significant state change, confirmed commitments, renewal timing and channel preferences, each pointing to assertions; regenerate from facts instead of mutating historical evidence.
4. **Action projection:** Opportunity Priority for general allocation, Attention for time-sensitive demand, Commitments for actual obligations, NBA and SIGNAL Decision 2 for specific governed work, Producer Action Quality for deterministic precedence. **AI does not get a fifth independent authority.**

**Identity safety:** distinguish household / person / policy / opportunity; one individual may have multiple opportunities, one phone may be shared. No phone-only merging. Uncertain matches enter REVIEW_IDENTITY with an explanation; merge/split requires producer review and reversible audit.

**Evidence connectors:** preserve original lead CSV; RingCentral SMS and call transcript source identity, message timestamps, speaker/timing; document source and extraction status; screenshot source/record scope (explicitly selected by producer); email and manual notes when later authorized. Captured images/files must remain access controlled and have documented retention and external-model data boundary.

**Producer-facing profile sections:** Snapshot; Current coverage & carriers (reported vs verified); Intent and objections; Renewal & timing; Conversation timeline; Documents & screenshots; Open questions; Commitments; Permissions & suppression; Provenance/conflicts. The small context drawer reads this profile rather than re-implementing profile intelligence.

Do not persist all raw transcripts forever by default or pass unbounded PII to models. Define legal/agency-approved retention classes, access control, deletion and suppression tombstone policy before bulk accumulation.

## 5. Renewal Intelligence

A date alone is not a reliable sales trigger. Track:
- renewal_date, precision EXACT_DATE / MONTH_ONLY / UNKNOWN, timezone or date-only meaning, policy line and policy ID only when verified;
- source and confirmation state; who confirmed; observed_at; last_checked_at; supersession;
- shopping reason, permitted channel, contact preference, next confirmed callback and stage;
- mutually distinct dates: renewal, cancellation, new purchase, closing, future bind and follow-up.

**Default proposed windows for product testing** (configurable, not regulatory truth): 90 days “upcoming”, 45 days “prepare”, 30 days “active shopping”, 7 days “urgent only if corroborated”, zero additional contact unless permission exists. Do not send merely because a date passed a threshold. Normalize unknown/month-only to a bounded review task, not an invented exact day.

Return policy: fresh engagement and explicit proceed outrank distant renewal; future prospects sit in WAITING with their evidence retained. Expired/contradicted dates downgrade or request reconfirmation rather than recycling as confirmed next year.

Producer KPI: share of eligible leads with *usable, confirmed* renewal date and fraction of those that eventually become real quotes/binds. Do not optimize for filling blank renewal cells with guesses.

## 6. Bought-lead ingestion and permitted contact routing

Bulk low-cost leads are **acquisition data**, not blanket SMS permission. Reuse hardened RAW importer with:
- bounded asynchronous/resumable chunks and stable original-source dedupe;
- normalized insurance facts without protected/sensitive scoring;
- identity ambiguity and bad records moved into triaged exception queues;
- source attribution, list cost, freshness, per-row status and purchase constraints preserved;
- timing fields parsed into unverified assertions unless explicitly customer-confirmed;
- contact eligibility matrix per **source + sender + channel + message class + proof + expiration/opt-out + provider policy**;
- purchased/third-party lists **blocked from RingCentral SMS regardless of vendor “opted in” assertions**; route into reviewed, lawful alternatives (e.g. permitted calling under DNC rules, direct mail, consent-based re-engagement) only after compliance signoff.
- a path for first-party direct opt-in acquisition through approved 408FARMERS entry points. Recorded source and consent remain distinct from lead quality.

No silent bought-list -> first-text conversion, no buying leads merely to defeat provider restrictions, no autonomous texting to non-consented numbers. Before any campaigns activate, seek insurer/agency legal compliance review and verified RingCentral registration/use-case approval. The future Consent & Contact Authority Ledger is a non-negotiable prerequisite for autonomous sends.

## 7. Engineering plan: smallest valuable vertical slices

### Gate 0 — Finish already active Phase 2 safety and hosted acceptance

**Dependency:** PR #12 exact-head hosted cert and isolation; do not block design-only documentation. Verify preview vs production D1, synthetic provenance, SEND off and 9 cases PASS. This spec adds no deployment permission.

### Slice A — Today/Inbox read-only shell (no transport)

Implement existing API-based read model/views with same identity, Work priorities, dates and summaries. Preserve existing navigational destinations and deep links. Label all draft/send actions inactive; no new tables unless data contract evidence proves necessary.

**Exit:** Today/Inbox priorities match underlying Work/Attention, CONTROL and suppression stay out of actionable set, GETs cannot trigger messaging, keyboard+mobile UI approved, legacy feature flag off fallback succeeds, synthetic QA excluded.

### Slice B — Single-draft unified Review Queue

Add eligible/blocked/delivery_review queue projections from existing conversation/draft state, source-aware why-this-draft, one-at-a-time detail + edit + producer-approved send via existing server path. This builds user trust, measures queue workload, and precedes batching.

**Exit:** no hidden drafts, no CONTROL/STOP, stale reply removes eligibility, explicit send guard/receipt/recovery pass, provider isolated operator-controlled canary permitted and observed.

### Slice C — Multi-select/selected approval (no autonomous send)

Add preview envelope, producer confirmation, durable per-recipient outbox/unique idempotency records, safe dispatch/reconcile, partial-result UI, max 10 distinct reviewed eligible recipients. **Require a persistence/transaction audit first** to demonstrate unique approval identity and no duplicate provider submissions even after timeout. No browser fan-out sending.

**Exit:** 10 independently audited synthetic approvals, 1 stale/new inbound excluded, 1 STOP/CONTROL excluded, partial accept+timeout recovered without duplicate, one-click replay safe, per-recipient audit and no-contact proofs; operator-controlled live canary only after approvals.

### Slice D — Prospect 360 & Renewal Intelligence core

Use existing UCP/source/SIGNAL facts and task/calendar projections. Build governed evidence facts, conflicts/corrections, compact memory, renewal precision and return triggers. Support raw CSV + SMS first. Validate permissions and source provenance. Screenshots, documents, calls and email become later source adapters to the **same** contract, never a new memory system.

**Exit:** known answer persists across sessions; changed/contradictory renewal evidence visible; producer correction reversible; source refs queryable; no unsupported date confirmed; overdue reminders disappear after disposition; import exception time measured.

### Slice E — Cohort dogfood & economics

Small real, appropriately permissioned producer workflow with AgencyZoom as current campaign owner. Measure producer time per useful conversation, customer reply to reviewed send latency, quote/bind outcomes, renewal capture and correction, contact safety incidents, delivery_review exceptions, app switches and producer trust in suggested action.

**Exit:** observed baseline vs new process, no suppress/duplicate failures, reported gross and net time savings (including exception handling), referral/acquisition costs and premium/producer hour. If the UI doesn't save time, refine before automating.

### Slice F — Approved automation and acquisition scale (conditional)

Gate individual registered/permissioned campaign families OBSERVE → SHADOW → bounded approved LIVE only after consent/transport/agency policy is verified and evidence of savings exists. One owner per family, execution-time consent and suppression checks, sender/campaign compliance, pause/resume, receipts, schedules, frequency caps and safe rollback.

**Exit:** measured improvement and no loss of contact control, permission enforcement or delivery correctness. Do not interpret “purchased leads” as automated text targets.

**Parallel/nonblocking:** Windows Desktop Copilot, call intelligence, advanced document/screenshot extraction and Google Calendar write UI. Integration into shared evidence spine only after the relevant security/data/cross-channel gates. Do not make them prerequisites for Today/Inbox.

## 8. User acceptance scenarios

1. Producer opens Today and sees an explicit CALL request ahead of a generic high Priority score; a stale future renewal does not displace the call.
2. New unread inbound moves a pending selected SMS draft to STALE before it can be submitted.
3. Producer reviews 10 eligible messages, edits two, excludes one and approves exactly the remaining seven; the final preview shows each exact final text. No eighth recipient is contacted.
4. Within that batch, one contact opts out and one provider response times out: first is SUPPRESSED, second enters DELIVERY_REVIEW, others retain independent receipts; no blind resend.
5. CONTROL and unowned conversations may be searchable for authorized work but cannot enter SIGNAL batch send.
6. A renewal appears as MONTH_ONLY from import, EXACT_DATE from customer SMS, then corrected by producer after document review; all evidence and supersession remain traceable.
7. One person has both home and auto opportunities; one consolidated person snapshot, independent opportunity/timing/quote records.
8. A phone appears in multiple unrelated records; no automatic merge or disclosure of another prospect.
9. Returning from RingCentral/call context shows last promise and next task without forcing fresh discovery.
10. When AI or RingCentral is unavailable, the producer can still read context, work a call, capture a commitment and follow normal AgencyZoom manual process.
11. Purchased third-party list import succeeds as acquisition inventory with unknown/missing SMS consent, but zero rows become RingCentral marketing SMS eligible.
12. Mobile producer reviews an eligible draft, checks context, confirms and sees a truthful per-recipient delivery status without accidental repeated submission.

## 9. Data, API and audit contract outline (PROPOSED, no migrations yet)

Prefer extending existing opportunities, sources, UCP, tasks, conversations and current outbound gateway. Introduce new normalized durable tables **only when** a tested contract requires them:
- review_queue_projection (optional derived/cache): opportunity + exact active revision, message class, eligibility reasons and attention reference;
- producer_review_intent: producer/tenant, exact draft text hash, recipient/channel/sender and approval evidence, consent/ownership/source snapshot, expiry, status;
- dispatch_attempt/receipt: unique intent key, provider operation ID, idempotency key, provider acceptance vs delivery resolution, error-safe reason;
- consent/contact ledger: granted/withdrawn, source/legal entity, channel/use case, sender/campaign, evidence, timeline, retention;
- fact_assertions with source refs and correction/dispute history, if current source/UCP contracts cannot express required precision/conflicts.

Enforce scoped auth on all read/action routes; no long-lived global browser token expansion to multi-producer use. Producer auth hardening and per-user sessions are prerequisites for broad external write or district-wide scope. Strict Preview/Production D1 and secret isolation, no real-customer synthetic tests, no customer data in telemetry. Audit by exact source, revision and actor. Distinguish side-effect free preview from internal GET projections that write to D1.

## 10. Telemetry and economic proof

Primary: **producer minutes per useful conversation**, numerator includes triage, edits, exceptions, follow-ups and admin; denominator defined and locked before testing (not a received message, not a generated draft).

Secondary:
- messages requiring review per day; median and p90 review seconds per draft; average safe selected approvals per session;
- eligible→approved→accepted→confirmed statuses; % blocked before send for safety; ambiguous delivery count; duplicate-send count (target zero);
- inbound-to-first-meaningful-response lag (within staffed hours), quote-ready conversion, confirmed renewal date coverage, missed due commitments;
- lead import exception per 100 rows, paid lead cost per **qualified contactable** opportunity and permissioned first-party opt-in rate;
- quote/bind counts, verified written premium, and verified premium per productive producer hour;
- owner attention interruptions per day, time switching apps, and producer override/decline rate.

Recommended initial design goals (to validate, not claim as achieved): single draft review in <= 2 deliberate actions after opening context; 10 reviewed drafts can be submitted through one confirmation, with each outcome legible; no unread/changed source mistakenly sent; today's list explainability accepted in >= 90% of sampled cases; zero auto sends and zero duplicated submissions in prelaunch tests.

## 11. Controls and decision rights

- Proposal/document review is authorized. No feature flags, production/D1 schema, SMS/email, CRM changes, calendar invites, campaigns, live automation, or PR merges follow from approval of this document.
- Any external send needs separately authorized production-capable implementation, agency compliance checks, valid recipient/campaign/sender consent, and explicit per-recipient producer authority until later family approval.
- Explicit write permissions, separate regulated customer-data provider/model approvals, and scoped retention are hard gates.
- Never disable AgencyZoom district automations wholesale to activate CoverageFit. Do not let two systems claim the same campaign family's send ownership.
- Do not mark a review queue as “zero work” by silently hiding delivery_review, deferred and consent exceptions. Keep small, bounded exception counts visible.

## 12. Review decisions requested

Approve/adjust these four defaults *before implementation*, not before existing Phase 2 hosted certification:
1. **Producer UX:** Today + Inbox become prominent **inside existing CoverageFit**, with Prospect 360 shared context and Operations preserving the current Import/Analytics/Tools; no full rebuild.
2. **Approval UX:** Review Queue supports manual single-message review, then selected batch approvals up to **10 visibly reviewed eligible drafts**; no approve-all-unseen, no bulk first-touch to purchased lists, no client-side send fan-out.
3. **Relationship memory:** UCP/opportunity/source evidence is canonical; each fact has provenance, confidence/confirmation and correction path; renewal date precision is first-class.
4. **Automation path:** AgencyZoom coexistence and RingCentral policy remain in force; future independently permitted, registered consent-based messaging families start SHADOW and expand only on measured producer-time/premium evidence.

### Resume instruction for Work Mode

Read this proposed spec with the *latest* Master Roadmap 2.0, PR #12 exact head and deployed configuration. Do not treat a design PR as authorization to build or launch. Once approved, implement the smallest reviewable Slice A (read-only Today/Inbox) after Phase 2 certification; reconcile with concurrent branches before code changes. Draft PRs stay unmerged until approved; no provider or production action.

---
**Supporting provider policy checked October 12, 2026:** RingCentral SMS/MMS Content Policies (https://www.ringcentral.com/legal/sms-mms-content-policies.html), RingCentral Messaging Consent Management (https://developers.ringcentral.com/guide/messaging/sms/messaging-consent-management), RingCentral High Volume SMS (https://developers.ringcentral.com/guide/messaging/sms/high-volume). Provider policy is not legal advice; confirm agency/carrier and applicable regulations with counsel before campaign cutover.
