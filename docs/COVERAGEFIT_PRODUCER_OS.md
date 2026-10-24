# CoverageFit Producer OS — canonical roadmap

Audit date: 2026-09-29. Mandate: COVERAGEFIT-PRODUCER-OS-1.0.
Baseline: CoverageFit main `5f47f2b7367110ca04ff03cc189983f136ab32fa`;
408finneas main `c66ab856b6993bd97931efa770193e8b1d2426d8`.
These are repository revisions, not proof of the deployed revision or enabled flags.

## North Star and boundaries

Who needs attention, why, what happened, what happens next, and what the system
is handling. Build beside the usable production system. Reuse current Work,
Import, Analytics and Tools until a replacement passes its migration gate.
TODAY / INBOX / PEOPLE / PIPELINE / AUTOMATIONS is the destination, not permission
to replace navigation with five unfinished screens.

408FARMERS acquires and contextualizes. CoverageFit owns relationship memory and
the operating loop. Signal allocates attention. The producer's sales methodology
and relationships drive conversion. Farmers retains rating, underwriting,
binding, policy administration, billing and claims. RingCentral supplies phone/SMS
transport; future email/calendar providers supply capabilities, not authoritative
business memory. AgencyZoom remains the current district automation owner until
an explicitly approved, single-family cutover.

No new customer-facing automation is activated by this increment. New families
must default OFF or SHADOW. SHADOW means a durable WOULD_SEND decision with zero
transport calls; it is not the same as having code in a branch.

## Evidence-backed architecture map

| Concept | Existing implementation | Decision |
|---|---|---|
| Contact / household | `cf_ucp_customers`, households, members, opportunity links; `server/universal-customer-profile.mjs` | Reuse. Candidate email/phone matches require explicit linking; do not silently merge shared phones. |
| Opportunity | `cf_solo_opportunities`, workspace/owner, contact JSON, source, products, deadline, stage/status | Reuse; no new parallel lead table. |
| Imported source identity | `cf_solo_sources`, original lead-key hash; `agencyzoom-raw.mjs`, `awl-normalization.mjs`, `agencyzoom-import.mjs` | Reuse strict normalization, provenance and dedupe. |
| Outside-pilot inventory | `district_raw_v2` source records | Preserve OTHER/manual hold; age eligibility is separate from record ingestion. |
| District enrollment | `district_pilot_v1`, deterministic assignment, CONTROL exclusion roster | Preserve assignment and exclusion. Latest approved window is **seven days**, not 48 hours. |
| Memory | RAW facts/provenance, Signal facts, UCP projections, continuation and distribution evidence | Reuse structurally; reconciliation across every channel remains a gate. |
| Tasks / audit | `cf_solo_tasks`, `cf_solo_activity`, unique workspace/request ID | Reuse for future due work and explainability. |
| Conversation | `sms_conversations` JSON store; `sms-live-conversations/` records | Reuse durable transport history; do not create a second transcript store merely for UI. |
| Provider identity | RingCentral webhook event keys, outbound registry, gateway idempotency keys | Reuse; audit retry ambiguity and delivery semantics before automation cutover. |
| Outbound transport | `sms-outbound-gateway.mjs`, `ringcentral-client.mjs` | Single gateway, permissions and registration; no second sender. |
| Inbound / recovery | `ringcentral-sms-connection-core.mjs`, `ringcentral-webhook-recovery-core.mjs` | Existing authenticated webhook, provider verification fallback, event and conversation locks, history recovery. |
| Ownership | `sms-ownership.mjs`, district SMS linkage, orchestration ownership | Preserve explicit provenance; shared business number never determines ownership. |
| Signal | `sms-signal-core.mjs`, service/API; Opportunity Priority projection and calibration | Preserve five actions, weights and population isolation. |
| Workspace | `producer-workspace.mjs`, existing Work UI, pending SMS, details, received time | Evolve. Current district transcript presentation is limited; not a complete relationship Inbox. |
| Quote-related data | Versioned quote **templates**, proposal/close evidence, Signal `last_quote`/quote-ready context | These do not establish the required current/historical opportunity QuoteSnapshot contract. Audit adapters before adding storage. |
| Attribution / economics | Migration 0014 and acquisition measurement, economics, effort/calibration | Reuse first/latest touch, outcome and effort records; unknown values remain unknown. |
| 408 intake | 408 `entry-presentation-proxy.mjs` → CoverageFit distribution journey and producer delivery | Canonical engine stays in CoverageFit; source/affinity context is not intent or quality. |

Migrations 0001–0019 were inspected as the existing schema surface. This increment
adds **no migration**. Do not reapply 0019. No production database was changed.
Remote Signal branches exist (`cf-signal-decision-1.0`, `cf-signal-sms-integration`,
`cf-sms-signal-os-v1`); they were not merged or treated as canonical main.

## Stage compatibility — do not silently rename

The approved Signal/AgencyZoom stages exist in `sms-signal-core.mjs`:
NEW, CONTACT_ATTEMPT, AWAITING_SIGNAL, ENGAGED, QUOTE_READY, QUOTE_SENT,
FUTURE_BIND, WON, CLOSED, STOP.

The existing Solo Desk also has a distinct phase model: inquiry, discovery,
quote_preparation, recommendation, decision, onboarding; its record status is
open/deferred/closed. This is an actual compatibility boundary, not evidence that
one model can overwrite the other. Keep both unchanged until an explicit adapter
and historical-data migration are tested. Automation progress must have its own
state rather than introduce stage synonyms.

## Foundation increment implemented here

The latest promotion helper can move previously imported age-held records into
the approved seven-day district pilot. The audit found that a zero-row source
compare-and-swap did not prevent subsequent audit and SMS ownership writes in its
D1 batch. Atomic batching alone does not make a zero-row update fail.

Fix:
- Preview fingerprint includes the entire source snapshot, so changed evidence
  invalidates approval even when lead identity and receipt time are unchanged.
- Every promotion attempt carries a unique operation ID within its provenance.
- Dependent audit/link writes require the exact promoted source snapshot from
  that attempt, within the same batch transaction.
- A lost compare-and-swap returns SKIPPED_CHANGED with no ownership, audit or
  priority side effects. Storage failure rolls back the whole batch.
- Preserve original opportunity/key, deterministic cohort, seven-day window,
  CONTROL isolation, no-send behavior and existing priority refresh rules.

A stale regression expecting the old 48-hour UI message now asserts the approved
seven-day outside-pilot result. No assertion was removed to conceal a defect.

The importer still intentionally refuses ambiguous combined exports. Valid rows
and supported original AWL files are not grounds to guess shifted PII columns.
The historical header/value and repeated-Vehicle bugs have existing sanitized
fixtures. Real customer CSVs are not committed.

## Producer OS capability status

Statuses below describe inspected code capabilities, not blanket production
certification. LIVE requires observed runtime evidence; none is newly claimed.

| Capability | Status | Remaining gate |
|---|---|---|
| Contact | EXISTS | Broader relationship reconciliation and multi-opportunity UX |
| Opportunity | EXISTS | Stage adapter and cross-channel identity certification |
| Conversation | PARTIAL | Complete producer-facing canonical chronological view |
| Message identity | PARTIAL | Provider delivery/retry ambiguity and all-channel coverage |
| Conversation Memory | EXISTS | Unified provenance/conflict presentation |
| Lead import | PARTIAL | This race fix deployment; unsupported ambiguous exports remain review-only |
| Source attribution | EXISTS | Hosted source-to-outcome completeness verification |
| Manual SMS | PARTIAL | Reviewed Signal send/gateway exist; general opportunity composer is not certified |
| SMS timeline | PARTIAL | Current limited transcript is not a full Inbox |
| Automation runtime | PARTIAL | Existing orchestration/retries are not a durable sales-family scheduler |
| Fresh automation | MISSING | CoverageFit equivalent in SHADOW; verify actual AZ timing first |
| Aged automation | PARTIAL | Existing recognition/legacy paths; no newly certified family cutover |
| QuoteSnapshot | MISSING | Reliable current version, stale/removed semantics and units |
| Dynamic messaging | PARTIAL | Existing deterministic messages; quote-aware authoritative context missing |
| AI drafts | DEFERRED | Structured dynamic facts and reviewed deterministic foundation first |
| Signal Producer Action | EXISTS | Preserve CALL / ASK_ONE_QUESTION / LATER / CLOSE / STOP |
| Signal System Action | PARTIAL | Locks/suppression exist; separate durable action contract not complete |
| Future Bind | PARTIAL | Structured future timing exists; months-long durable re-entry not certified |
| TODAY | PARTIAL | Reuse Work/attention and Shots Board; do not replace prematurely |
| Inbox | PARTIAL | Existing SMS/consultation surfaces; unified relationship view pending |
| People | PARTIAL | UCP exists; complete operating surface pending |
| Pipeline | PARTIAL | Two existing stage layers require compatibility mapping |
| Automations | PARTIAL | Operational controls exist; family-instance console pending |
| Analytics | EXISTS | Source economics/effort/outcomes exist; completeness and hosted checks remain |
| 408FARMERS handoff | EXISTS | Preserve canonical entry contracts and outstanding hosted gates |
| AgencyZoom dependency | EXISTS | Keep operational; optionality milestone is not reached |

## SMS ownership and migration model

Distinguish relationship owner (DISTRICT_SIGNAL, DISTRICT_CONTROL,
FIRST_PARTY_408, PRODUCER_OWNED, UNKNOWN) from **sales automation family owner**.
The existing relationship enum is not a substitute for a family cutover ledger.

- Inbound: RingCentral transports; CoverageFit webhook persists, deduplicates,
  resolves ownership and applies consent/Signal rules. Runtime subscription health
  was not verified in this session.
- Manual outbound: producer approval through the existing gateway for supported
  flows; RingCentral transports. General correspondence remains PARTIAL.
- District automated outbound: preserve AgencyZoom's existing operating ownership.
  Exact dashboard-enabled families/timing need operator evidence, not guesses.
- Existing first-party CoverageFit workflows: preserve current configured behavior;
  no runtime flags changed, no blanket claim that every workflow is enabled.
- CONTROL and unknown relationships stay held from Signal treatment. RAW age-held
  inventory remains manual unless the existing explicit promotion gate succeeds.
- STOP is prioritized. START restores permission without blindly restarting a
  workflow. A future scheduler must recheck consent, ownership and inbound revision
  at execution, not merely at enqueue time.

| Producer OS family | New CoverageFit migration state | Current ownership boundary |
|---|---|---|
| Fresh Lead (AZ-FRESH-01/02) | NOT IMPLEMENTED | AgencyZoom retained; recognition templates are not a scheduler |
| Contact Attempt | NOT IMPLEMENTED | Existing external ownership retained |
| Aged Recovery (Probe 1/2) | NOT IMPLEMENTED as new family runtime | Preserve existing AZ/legacy first-party boundaries |
| Engaged / Quote Ready | NOT IMPLEMENTED | Existing workflow unchanged |
| Quote Sent | NOT IMPLEMENTED | AZ follow-up recognition is not current QuoteSnapshot automation |
| Future Bind | NOT IMPLEMENTED as durable family | Existing future evidence and external follow-up retained |
| Homebuyer / Closing | NOT IMPLEMENTED as new family | Existing specialized intake/callback behavior retained |
| Customer Onboarding | NOT IMPLEMENTED | No cutover |
| Cross-Sell / Referral | NOT IMPLEMENTED | No cutover |

OBSERVE → SHADOW → one-family approved LIVE cutover → family-by-family expansion.
No family is READY FOR CUTOVER, SHADOW or newly LIVE from this change. Before LIVE,
record evidence that AgencyZoom disabled that exact family; one family has one
owner. Do not stop existing AgencyZoom operations merely to develop the adapter.

## Deterministic runtime and quote direction

Reuse gateway, permission checks, task store and audit. Build only necessary
TRIGGER → ELIGIBILITY → WAIT → CONDITION → ACTION → RE-EVALUATE primitives.
Persist instance/step identity, due time, mode, input revision, rendered message,
suppression reason, provider identity and disposition. Stable step identity must
survive retries; uncertain provider acceptance must not create a fresh send merely
because an attempt number increased. The current retry implementation uses
attempt-specific keys: investigate with provider-timeout fixtures before reuse
for sales cadence. This audit does not claim that duplicate sends were observed.

Inbound events must interrupt conflicting waits before fresh sends. Sender must
check the current consent/ownership/relationship revision. A future QuoteSnapshot
needs opportunity/version/current/stale status, monetary units and coverage
version. Never infer active prices or savings from transcript text or quote
**template** versions. Templates → structured dynamic messages → human-reviewed
AI drafts → explicitly approved constrained automation. AI supplies language,
not authoritative facts. System Action remains separate from Producer Action;
no sixth Decision 2 action is introduced.

## Milestones and next implementation slice

1. Accurate customer/opportunity records — PARTIAL; current increment hardens
   promotion consistency. Deploy/certify without bulk reenrollment.
2. Complete conversation memory — PARTIAL. Next: read-only relationship transcript
   projection using exact workspace/opportunity links, stable provider message IDs,
   explicit missing history/delivery state, and ambiguous-link holds. No phone-only
   merging, transport calls or implicit profile mutations in a read endpoint.
3. General manual SMS — PARTIAL; prove approved sends, duplicate/retry behavior,
   STOP/wrong-number suppression and multi-opportunity relationship selection.
4. One deterministic automation — DEFERRED until 1–3 pass; SHADOW first.
5. Reliable personalization — DEFERRED pending active quote semantics.
6. Reviewed AI writing — DEFERRED.
7. Signal orchestration — DEFERRED as a complete contract.
8. Producer day primarily in CoverageFit — PARTIAL; evolve current Work.
9. AgencyZoom optional — DEFERRED, not a near-term shutdown objective.
10. Business learning — PARTIAL; reuse source-to-bind economics, verify coverage.

Future tests must cover reply/send races, callback/renewal/closing changes,
quote version/removal/staleness, provider timeout, worker/scheduler retry,
manual pause/resume/cancel, opt-out/restart, unknown-number inbound, multiple
opportunities, family ownership and no double-send across two owners. The current
333-test suite does not certify unimplemented runtime features.

## Validation, rollout and rollback

Baseline full suite: 328 tests, 327 pass, 1 fail, 0 skip (stale 48-hour assertion).
After foundation fix: **333 tests, 333 pass, 0 fail, 0 skip**.
Command: `node --test --experimental-loader ./tests/json-loader.mjs tests/*.test.mjs`.
Five new real SQLite transaction tests: SIGNAL success/retry, CONTROL success/retry,
changed snapshot, lost compare-and-swap, transaction rollback. Existing full suite
covers RAW/Signal/ownership/distribution regressions. No customer SMS sent.

Implemented/tested on `producer-os-foundation`; not a declaration of deployment,
enablement, shadow traffic or runtime certification. No new services/endpoints,
UI, jobs, migrations, Cloudflare bindings or variables. Existing production remains
unchanged while this branch is reviewed. Do not use an actual lead solely to test
promotion. The race fix should land before relying on concurrent bulk promotion.

Manual configuration now: **NONE**. Normal release deployment verification is
still required after merge: check deployed commit, supported original-file preview,
seven-day messaging and a controlled internal promotion if one is available. Do
not fabricate receipt dates, reapply 0019, reset records, alter SMS flags, disable
AgencyZoom, activate Engineers or request secrets. Rollback code by reverting the
foundation fix commit; no data rollback or destructive migration is needed.

Outstanding evidence: deployed commit/config; external AZ templates and timing;
full delivery-state lifecycle; multi-channel identity; hosted receipt/Continue,
mobile and paid/QR gates from ENTRY readiness. Healthcare test waiver and Engineers
non-activation remain in effect. Preserve canonical public title Insurance Producer.
