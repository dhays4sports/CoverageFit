# COVERAGEFIT-DESKTOP-COPILOT-INTEGRATION-READINESS-1.0

**Status:** Integration-readiness assessment; no Desktop Copilot integration enabled  
**Date:** 2026-10-08  
**CoverageFit branch audited:** `signal-copilot`  
**CoverageFit head at audit:** `da76c970c2051be867a426af01e26e681839390b`  
**Parallel Desktop branch observed:** `feature/coveragefit-desktop-copilot-1.0`  
**Desktop draft PR observed:** #10 — COVERAGEFIT-DESKTOP-COPILOT-1.0

## Purpose

Prepare CoverageFit to become a future governed intelligence provider to the separately developed Windows Desktop Copilot without:

- duplicating screenshot, desktop chat, thread, packaging, or Electron work in CoverageFit;
- moving insurance decision authority into the desktop application;
- prematurely exposing broad CRM data;
- adding write paths from screenshot interpretation into customer messaging, CRM state, or policy operations;
- interrupting Producer Action Quality, Attention, commitments, RingCentral, AgencyZoom, or acquisition work.

CoverageFit remains authoritative for governed insurance business state. Desktop Copilot remains a future read-only consumer until a later, separately certified write-authority mandate exists.

## Parallel-repository coordination audit

Open draft work observed at the time of this assessment:

- PR #7 `signal-copilot` — CoverageFit Producer Copilot / Attention / Producer Action Quality path.
- PR #10 `feature/coveragefit-desktop-copilot-1.0` — isolated Desktop Copilot application under `apps/desktop-copilot`.

PR #10 currently changes only the isolated desktop package, its workflow, and desktop-specific documentation. It does **not** modify Producer Workspace, Producer Action Quality, Attention, AgencyZoom import, RingCentral/SMS authority, or CoverageFit business-state modules.

The desktop gateway currently imports the existing constant-time bearer authorization helper but uses a **separate desktop-scoped token** and configured owner. It does not currently call CoverageFit CRM/Producer Work routes and explicitly rejects client-supplied verified lead links/governed actions.

This separation is appropriate. Do not merge or copy Desktop implementation into the `signal-copilot` branch.

## Architectural ownership boundary

### CoverageFit owns

- opportunity and lead records;
- verified opportunity/customer association;
- workspace ownership;
- Signal Decision 2;
- Attention;
- Opportunity Priority;
- confirmed/projection-safe commitments;
- NBA;
- Producer Action Quality;
- contact safety and suppression;
- source provenance;
- authorized producer operations;
- AgencyZoom / RingCentral / provider reconciliation;
- authoritative insurance business evidence.

### Desktop Copilot owns

- Windows screenshot capture;
- global shortcut / tray / floating desktop interaction;
- screenshot review and redaction UX;
- screenshot attachments;
- visual interpretation;
- desktop chat;
- persistent desktop conversation threads;
- thread routing/search/resumption;
- desktop-specific credentials, packaging and preferences.

Screenshot-derived interpretation is never authoritative CoverageFit business state merely because the model produced it.

## Existing backend interfaces potentially reusable

### 1. Producer Work

Current route:

`GET /api/solo-desk/producer-work`

Current value:

- workspace-scoped Producer Work inventory;
- Attention;
- Producer Action Quality list projection;
- current Signal Decision 2 summary;
- Opportunity Priority summary;
- population boundaries;
- exclusion of TEST/synthetic pilot fixtures;
- deterministic sorting.

Future Desktop suitability:

**Partial.** It can support a producer-facing work list, but it is a UI-oriented response rather than a stable Desktop integration contract.

### 2. Producer detail

Current route:

`GET /api/solo-desk/producer-detail?id=<opportunity_id>`

Current value:

- opportunity;
- workspace-scoped sources;
- customer profile;
- commitments;
- Attention;
- Producer Action Quality;
- contact safety;
- Signal state;
- Opportunity Priority;
- NBA;
- activity context.

Future Desktop suitability:

**Functionally rich but too broad as a final external contract.** It exposes more data than a screenshot copilot generally needs.

Important implementation nuance: this GET path is externally read-only, but underlying detail/classification logic may persist derived CoverageFit projections/classification state. Therefore it should not be advertised as a side-effect-free public read contract without a deliberate contract review.

### 3. Next Best Action

Current route:

`GET /api/solo-desk/next-best-action?id=<opportunity_id>`

Future Desktop suitability:

**Insufficient alone.** Desktop must consume the authoritative Producer Action Quality reconciliation rather than independently combining NBA with Attention/Signal/commitments.

### 4. Record/profile/activity routes

Existing Solo Desk read routes provide deeper record/profile/activity information.

Future Desktop suitability:

**Specialist/debug use only unless explicitly required.** Do not give Desktop broad record access merely because these routes exist.

## Authentication and authorization

Current Producer Workspace authorization:

- bearer token from `COVERAGEFIT_PRODUCER_ACCESS_TOKEN`;
- minimum configured length 24;
- constant-time token comparison;
- one configured producer/workspace identity;
- GET routes require valid bearer authorization;
- state-changing Solo Desk POST routes additionally require same-origin;
- browser Producer Workspace currently keeps its reusable access key in `sessionStorage`.

Assessment:

This is acceptable only for the existing bounded single-producer Preview/early-production workflow. It is **not** the desired long-term Desktop integration authentication model.

Do not provision the normal CoverageFit producer bearer credential directly into the Desktop application.

The Desktop branch's separate desktop-scoped gateway token is a good isolation boundary for its local thread service, but it is not yet a CoverageFit CRM authorization mechanism.

Future integration should use a separately scoped, revocable, least-privilege authorization path whose claims identify:

- producer/user;
- workspace;
- read-only capabilities;
- expiry/revocation state;
- permitted resource class.

Per-user/short-lived session work remains part of the broader CoverageFit security gate.

## Producer Action Quality contract

Canonical implementation:

`server/producer-action-quality.mjs`

Canonical architecture:

`docs/COVERAGEFIT-PRODUCER-ACTION-QUALITY-1.0.md`

Current authoritative precedence:

1. contact safety / suppression;
2. Signal STOP / CLOSE / LATER;
3. due or overdue confirmed commitment;
4. current Signal Decision 2;
5. upcoming confirmed commitment;
6. NBA.

Opportunity Priority supports ranking/reasoning but does not override current conversation authority.

Current output contains:

- `version`;
- `actionable`;
- `why_now`;
- `action`;
- `evidence`;
- explicit precedence metadata.

This is the correct future intelligence primitive for Desktop consumption.

Desktop must render this result, not duplicate the reconciliation algorithm.

### Current contract gap

Producer Work currently exposes the projection as `action_quality`, while Producer Detail exposes it as `actionQuality`.

That is acceptable for the current internal UI but should **not** become the external Desktop contract. A future integration contract should choose one stable versioned field name and preserve backwards compatibility for existing Producer Workspace consumers.

No change is required until the Desktop integration consumer is enabled.

## Verified lead / opportunity association

Existing governed association mechanisms include:

- workspace-scoped CoverageFit opportunity ID;
- explicit Universal Customer Profile opportunity links;
- district pilot source records;
- stable source lead keys/hashes;
- governed SMS conversation IDs linked to pilot/opportunity state;
- explicit profile link/split operations.

Important safeguards already present:

- no implicit identity merge by phone/name/email;
- RAW import refuses phone-only merge;
- existing opportunity/relationship conflicts are held for review;
- profile unification is producer-explicit rather than inferred.

Future Desktop rule:

A screenshot must never establish the authoritative opportunity association by itself.

The Desktop user may choose or confirm an opportunity, but CoverageFit must resolve and return the verified association by governed ID. Any screenshot OCR/model guess should be treated only as a candidate hint until CoverageFit verifies it.

## Evidence and source provenance

CoverageFit already preserves useful provenance:

- Solo Desk source records carry `kind`, `source_id`, `updated_at`, and structured summaries;
- SMS facts preserve evidence/provenance fields;
- Producer Action Quality evidence entries carry `kind`, explanatory text and `source_ref`;
- commitments preserve source references and confirmation state;
- Opportunity Priority and NBA identify their engines/source basis.

This is sufficient to support a future Desktop display such as:

- Verified CoverageFit fact;
- Signal state;
- confirmed commitment;
- producer-recorded task;
- AgencyZoom RAW evidence;
- derived CoverageFit recommendation.

Do not collapse these categories into one unqualified "AI context" block.

## Contact safety

Current CoverageFit enforcement includes:

- STOP;
- SMS consent opt-out;
- contact suppression;
- wrong-number facts;
- Signal compliance checks;
- CONTROL isolation;
- Producer Action Quality `DO_NOT_CONTACT` precedence.

Producer Detail exposes a current `contactSafety.suppressed` projection, and Producer Action Quality will be non-actionable where the governed safety state requires it.

### Current contract gap

The external read contract does not yet expose a single normalized, versioned contact-safety object with explicit reason codes and channel restrictions.

Before Desktop uses CoverageFit context to draft solicitation language, the integration contract should provide explicit safety state rather than requiring Desktop to infer restrictions from scattered fields.

Desktop must re-read current safety state before presenting any action that could lead to outreach. Cached screenshot-thread context is not enough.

## Context freshness and stale-state protection

CoverageFit already has strong stale-state machinery in the Signal Copilot path:

- Signal conversation `revision`;
- current inbound message ID;
- server-side context fingerprint over normalized context + source snapshots + inbound identity;
- stale suggestion rejection when fingerprint/revision changes;
- context-change checks before provider reasoning is accepted/sent.

This proves the architecture already has a model for freshness.

### Current integration gap

Producer Work/Producer Detail do not expose one unified context revision/fingerprint suitable for an external consumer.

Available individual freshness indicators include:

- opportunity `updated_at`;
- source `updated_at`;
- Signal `revision`;
- inbound message identity;
- engine/version fields.

A future Desktop context contract should expose an opaque CoverageFit-owned `context_revision` (or equivalent ETag/version token) representing the governed snapshot used to produce Producer Action Quality.

Desktop should:

1. store the revision beside cached context;
2. display when its CoverageFit context is stale/unknown;
3. re-fetch before presenting a current governed action;
4. never treat an old thread's action recommendation as current after the revision changes.

Do not expose internal hashes if an opaque version token is sufficient.

## Data minimization assessment

Existing `producer-detail` is intentionally rich for the CoverageFit Producer Workspace.

Desktop Copilot does not automatically need:

- every source summary;
- all profile state;
- every activity item;
- all internal scoring detail;
- unrelated documents.

Therefore the long-term integration should not simply mirror `producer-detail` wholesale.

Prefer a bounded read model containing only:

- verified opportunity identity/display context;
- Producer Action Quality;
- current contact safety;
- confirmed/current commitments;
- bounded known facts needed for the active task;
- provenance references;
- context revision;
- generated-at timestamp;
- contract version.

## Missing integration capabilities

No blocker requires implementation today, but these gaps must be closed before a real Desktop-to-CoverageFit connection:

1. **Dedicated least-privilege authentication**
   - current producer bearer is too broad/long-lived for Desktop distribution.
2. **Stable versioned Desktop read contract**
   - current Producer Work/Detail are UI contracts, not integration contracts.
3. **Unified context freshness token**
   - existing stale guards are internal to Signal Copilot.
4. **Normalized contact-safety object**
   - current fields are adequate for CoverageFit UI but should not be inferred by Desktop.
5. **Explicit minimized verified-context envelope**
   - avoid exposing full Producer Detail by default.
6. **Association confirmation contract**
   - Desktop-selected opportunity ID must be verified against authorized workspace before context is returned.
7. **External-consumer audit telemetry**
   - future Desktop context reads should be auditable without storing screenshot contents.
8. **Contract compatibility policy**
   - version changes must remain backwards compatible or be explicitly versioned.

These gaps are concrete integration requirements, not a reason to build speculative infrastructure now.

## Recommended eventual read model

Illustrative only; do not treat as a current endpoint:

```json
{
  "schema_version": "1.0",
  "generated_at": "...",
  "context_revision": "opaque...",
  "opportunity": {
    "id": "...",
    "display_name": "...",
    "products": "..."
  },
  "producer_action_quality": {
    "version": "COVERAGEFIT-PRODUCER-ACTION-QUALITY-1.0",
    "actionable": true,
    "why_now": {},
    "action": {},
    "evidence": []
  },
  "contact_safety": {
    "can_contact": false,
    "reason_codes": ["opt_out"]
  },
  "commitments": [],
  "verified_context": [],
  "provenance": []
}
```

This shape is a design target only. Do not create it until Desktop has a certified screenshot-to-chat flow and a concrete integration consumer.

## Security boundary for screenshot-derived information

The future integration must preserve four layers:

1. screenshot observation;
2. AI interpretation;
3. verified CoverageFit business evidence;
4. governed producer action.

Permitted future flow:

> Screenshot → AI observation → producer chooses/associates opportunity → CoverageFit returns verified read-only context → Desktop presents authoritative CoverageFit intelligence alongside clearly labeled visual interpretation.

Prohibited implicit flow:

> Screenshot → model guesses customer/fact → CRM fact → auto-message / stage change / policy action.

Any future write path requires a separate authorization design with:

- explicit producer approval;
- current context revision;
- contact-safety revalidation;
- idempotency;
- audit;
- provider reconciliation;
- stale-state rejection.

## Recommended sequencing

### Priority 1 — finish CoverageFit Producer Action Quality

Continue current roadmap without interruption:

- Preview certify ASK_ONE_QUESTION;
- Preview certify CALL;
- Preview certify due callback/appointment;
- Preview certify STOP/suppressed;
- verify list/detail exact-action consistency.

Desktop does not block this gate.

### Priority 2 — finish independent Desktop core certification

Desktop initiative should independently certify:

- native Windows capture;
- screenshot review/redaction;
- chat/thread persistence;
- restart/resumption;
- packaging;
- desktop-specific security.

No CoverageFit intelligence dependency is required.

### Priority 3 — define the first read-only integration use case

Only after both systems are stable, define one bounded use case, for example:

> Producer explicitly links a Desktop thread to an authorized CoverageFit opportunity and asks for current governed action context.

Do not start with automatic screenshot-to-lead matching.

### Priority 4 — design and certify a minimized versioned context contract

At that point:

- choose API/version naming;
- add scoped authorization;
- add context revision;
- normalize contact safety;
- return Producer Action Quality rather than duplicated logic;
- log authorized context reads;
- test identity mismatch, stale context and CONTROL.

### Priority 5 — connect Desktop

Desktop may then show CoverageFit intelligence next to screenshot analysis.

It remains read-only.

### Priority 6 — writes remain a later mandate

No Desktop-generated CRM change, outbound send, calendar action or policy operation should be introduced merely because read-only integration works.

## Current decision

**Do not add a new Desktop integration API now.**

The existing backend proves CoverageFit has the required source intelligence, provenance, association, safety, and stale-state primitives, but its current Producer Work/Detail routes are internal UI contracts with broader data exposure and weaker external-consumer auth/freshness semantics than the future Desktop integration should have.

The correct present work is:

- continue Producer Action Quality certification;
- keep Desktop implementation isolated in PR #10;
- preserve the current decision precedence;
- document the future read-only contract requirements;
- defer integration endpoint implementation until the Desktop flow and first consumer requirement are verified.
