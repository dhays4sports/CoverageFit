# RAW Lead Intake & Triage 1.0

**Document:** CF-RAW-LEAD-INTAKE-1.0  
**Status:** Active implementation contract  
**Date:** 2026-10-07  
**Repository:** dhays4sports/CoverageFit

## Objective

Turn a large, messy district lead pile into:

> **machine-safe imports + safe holds + duplicates + a very small exception queue**

The producer should not inspect every row.

This phase is ingestion/intelligence work. It does not expand contact permission, AgencyZoom write authority, autonomous sending or CRM replacement.

## Current safe ingestion contract

CoverageFit preserves:

- stable original lead identity;
- original received timestamp;
- source provenance;
- permitted insurance facts;
- source schema / normalization version;
- explicit operator corrections;
- dedupe evidence;
- SMS relationship identity when a valid mobile exists;
- pilot/treatment state separately from contact permission.

The importer intentionally refuses to guess when:

- stable identity conflicts;
- source columns cannot be aligned safely;
- two source records claim the same phone relationship ambiguously;
- a source collides with an existing opportunity;
- product/state/timestamp needs source confirmation;
- an unverified combined AWL schema would require column inference.

Sensitive/prohibited raw fields remain excluded from mapped evidence.

## Machine triage buckets

Every preview row receives one deterministic intake bucket.

### READY
Validated record. May be imported without row-by-row producer review.

### READY_NO_SMS
Validated record without an SMS-capable mobile. Preserve the opportunity/evidence; do not invent a phone or SMS permission.

### SAFE_HOLD
Valid record that is outside the current fresh-lead treatment window. Import evidence into governed inventory without fresh-lead treatment.

### DUPLICATE
Stable source identity already exists. Skip without producer attention unless a future reconciliation rule detects material source conflict.

### REVIEW_IDENTITY
Identity/ownership ambiguity, such as:
- contradictory duplicate source key;
- same phone on different lead identities;
- existing opportunity collision;
- pilot/test phase conflict;
- cohort/ownership conflict.

Requires human reconciliation. Do not auto-merge by phone.

### REVIEW_SCHEMA
Source structure is not safe to infer, including unverified combined schemas, malformed files or unresolved alignment.

### REVIEW_TIME
Original received timestamp/date is invalid, ambiguous or future-dated.

### REVIEW_FIELD
A bounded required field such as product/state/phone needs source confirmation or correction.

### REVIEW_OTHER
Fail-closed exception not covered by the categories above.

## Producer experience

Preview should lead with:

- number that can move forward without row review;
- duplicates;
- true exceptions;
- exception counts by category.

Only true exceptions are expanded by default.

Validated/held/duplicate rows are available in a disclosure for audit rather than occupying the primary producer attention surface.

Import continues to commit only rows whose existing import status is READY. Review rows remain unchanged and unimported. Duplicates remain skipped.

## CONTROL crunch-mode policy

Existing CONTROL records remain immutable historical evidence.

A default-off runtime flag:

`CF_DISTRICT_CONTROL_ENROLLMENT_PAUSED=1`

may be used during production crunch to stop assigning **new eligible inventory** to the operational CONTROL treatment.

When enabled:

- deterministic assignment is still calculated;
- a deterministic CONTROL assignment is retained as `assignment_cohort=CONTROL`;
- operational `cohort` becomes SIGNAL for the new eligible record;
- `cohort_override_reason=control_enrollment_paused` is persisted;
- historical CONTROL records are not relabeled;
- identity and cohort evidence remain auditable;
- no SMS is sent merely because of enrollment.

This is an operational allocation override, not evidence that Signal has won a causal experiment.

## Batch-size policy

Current synchronous safety limits remain:

- 1–20 files;
- maximum 100 lead rows per preview/import batch;
- 256 KB per file;
- 1 MB aggregate file payload.

Do not raise the row limit solely for convenience.

Before increasing it:

1. record preview latency for representative 100-row batches;
2. record import latency for representative 100-row batches;
3. quantify database/provider calls per row;
4. establish timeout/retry semantics;
5. verify partial failures remain explainable and idempotent;
6. choose either a measured higher synchronous limit or a chunked/background intake design.

The goal is high throughput, not a large single HTTP request.

## Combined-export policy

Externally combined AWL exports remain review-only unless their exact schema/alignment is proven.

Do not solve this by positional guessing.

Future support may add a specific verified combined schema adapter if real source samples establish deterministic alignment. Until then, original exports are the safest intake path.

## Next implementation slices

### Slice A — current
- deterministic machine triage;
- exceptions-first Import UI;
- aggregate triage counts;
- audited CONTROL pause capability.

### Slice B — implemented
- durable import-batch receipt;
- persistent exception queue keyed by batch/source-derived identity;
- explicit OPEN / DEFERRED / RESOLVED disposition for review items;
- exceptions store only bounded operational metadata, not raw file bodies or phone values;
- successful rows do not remain in the exception queue.

### Slice C — instrumentation implemented; hosted measurement pending
- preview returns `preview_duration_ms`;
- import receipts persist `prepare_duration_ms` and `import_duration_ms`;
- measure 100-row hosted preview/import latency;
- choose larger synchronous batches vs chunked intake;
- preserve idempotency across chunk retries.

### Slice D
- feed imported READY/SIGNAL records into read-only Attention;
- surface fresh inbound / explicit quote-call requests / due timing first;
- preserve AgencyZoom as CRM authority.

## Acceptance criteria

RAW-LEAD-INTAKE-1.0 is useful when:

- a mostly-clean 100-row batch requires attention only on true exceptions;
- valid rows import even when other rows fail;
- duplicates consume no producer attention;
- old but valid records safely enter governed inventory without treatment;
- identity collisions fail closed;
- no parser or score infers consent;
- no import sends SMS;
- CONTROL pause, when enabled, preserves original assignment evidence;
- every imported row can be traced to original source identity/provenance;
- a retry cannot create a duplicate opportunity/enrollment.

## Hosted recovery certification — 2026-10-07

The original 100-row synchronous Preview commit returned HTTP 503 after 30 TEST rows had already committed. Rehearsal status proved the partial state exactly: 30 present, 70 missing, next missing ordinal 30.

Recovery then proceeded in 10-row chunks. The first recovery chunk (ordinals 30–39) completed in 1,581 ms total with 933 ms preparation, 10 imported, 0 duplicates, 0 review exceptions and 0 SMS. Sequential chunks then advanced the durable status 40 → 50 → 60 → 70 → 80 → 90 → 100 without another 503. Final state: 100 TEST rows present, complete=true, next_missing=null.

Decision: 100-row one-shot writes are not an acceptable production primitive. The normal Import UI now uses resumable 10-row chunk commits. A transient chunk failure leaves the UI on that chunk; clicking Resume replays the same chunk, relying on stable source identity to dedupe any rows that committed before the failure.

Chunk completion now finalizes a durable batch receipt. True review exceptions are persisted per chunk; successful rows do not remain in the exception queue.
