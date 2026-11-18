# Archive scale design 0.6 — measured proposal, no cutover

Mandate: `CF-PRODUCER-WALKTHROUGH-ARCHIVE-SCALE-0.6`. Current archive selection and bounds are unchanged. This design is for future isolated engineering validation, not production activation.

## Evidence driving the design

Fifteen declared workloads ran in separate local Node 24 processes with a 384 MiB V8 heap ceiling, 45-second per-workload timeout and one repetition. `docs/walkthrough/scale-results.json` contains the full local measurements, source counts, phase timings and limitations. Workload shapes and payloads are deterministic; export/review request identities and wall-clock metadata are fresh. Timings are individual observations, not percentiles or service-level guarantees.

| Workload | Observed boundary | Retained state |
|---|---|---|
| 160-message conversation | Capacity warning | 160 originals retained |
| 200-message conversation plus one more | `archive_bound` | 200 heads/originals remain unchanged |
| Two-message thread with repeated edits | Page-receipt limit | 64 pages; 65 versions; 19,541 original bytes |
| 25-message batches repeatedly edited | Version limit | 400 versions in 16 pages |
| 25-message batches with 4,000-byte bodies | Original-byte limit | 225 versions; 961,060 bytes; next batch rejects atomically |
| Eight 20-message threads | Supported | 160 heads, eight threads |
| Ninth thread | Package bound and incomplete inspection | Accepted originals retained; SHADOW held |
| Twelve customers / 24 opportunities | Supported export/restore | Exact canonical dependencies preserved |
| Repeated policy observations | Source-summary bound | Seven revisions accepted; next rejects safely |
| 50 producer approvals | Supported export/restore | 50 approvals retained |
| 51st producer approval | Package bound / incomplete profile window | No approval silently discarded |
| Partial history then reopen/resume | Recovered requested range | No checkpoint advance at incomplete scan; actual history still unverified |
| Oversized untrusted package | Explicit rejection test only | No claim of valid ingestion at that size |

The 200-message projection issued **235 repository queries** while showing a bounded 20-message window. Eight threads issued **258**. This is consistent with the current reader verifying all current heads/originals before rendering the window. It is a concrete read-cost concern even though local runtimes are small.

Local projection times were approximately 2.6–28.7 ms across these workloads; export/restore phases were below 46 ms in the recorded run. Peak process RSS was 53–96 MiB, including ingestion, inspection and restore; this is not browser memory or Worker memory. Query counts cover the repository adapter during selected-customer projection only. Connector internals and package direct SQLite queries are **not counted**. Twelve-customer projection measures the selected customer, not a full workspace walk.

Original payload bytes, manifest payload bytes, serialized head payload and database file bytes are reported separately. Physical SQLite B-tree index size is unmeasured; serialized index metadata must not be presented as physical index size. No hosted D1/CPU, network object-store, retention or production scalability acceptance follows from these results.

## Options

| Option | Benefit | Limitation | Disposition |
|---|---|---|---|
| Retain current archive unchanged | Strong existing local semantics and accepted recovery | Small page/history/profile/package limits; read verification grows with retained heads | Keep active for this synthetic foundation |
| Increase constants | Small implementation diff | Does not address source-summary growth, read cost or reference migration; could hide failure modes | Do not implement here |
| Separate immutable originals/manifests from bounded inspection indexes | Allows bounded reads and reference-preserving growth | Requires new resolver, verified indexes, corruption handling and migration acceptance | Recommended next storage experiment after owner feedback |

No alternate store, new operational authority or active storage selector is implemented in 0.6.

## Proposed evidence boundary

Keep canonical customers, households, opportunities, local tasks, consent and communication ownership in their existing authorities. The archive stores evidence objects and indexes references to them; it never becomes an identity or messaging system.

An immutable object key binds synthetic tenant/workspace, provider, external resource identity, revision and legacy digest. Preserve the exact existing normalized JSON payload strings, original timestamp precision/timezones and the legacy digest algorithm. These are normalized simulated originals, not certified raw AgencyZoom HTTP responses. Do not silently canonicalize keys or reserialize old payloads in a way that changes referenced digests.

Message direction, author/import actor, edit and deletion-marker semantics stay distinct. Policy expiration, renewal-effective, producer-review and callback dates stay typed separately. A deleted marker preserves earlier observed versions and does not invent unobserved content. Policy replacements, conversions and missing records keep their relationship uncertainty.

A bounded index contains source pointers, heads, page manifests, typed date observations, per-term conflicts, coverage, capacity counts, sticky historical suppression references, stale-review dependencies and reconciliation receipts. Policy source summaries should eventually reference this index rather than append an unbounded observation array. A newer observation alone cannot resolve conflicting terms.

## Bounded reads and integrity

A future reader resolves the requested message window and exact reviewed fact references, rather than fetching every original on every read. Cursor scope must include tenant, exact conversation/opportunity relationship and index revision. Equal timestamps remain ambiguous; a stable display tie-breaker is not inferred chronology.

An index-verification receipt binds schema, tenant, source/index version and object digests. It is a local integrity result, not provider authenticity. Changes invalidate it. Ingestion verifies new immutable objects before publishing index references. A producer approval independently resolves and verifies its exact supporting object revision; a cached aggregate does not replace that proof.

Preserve a reverse dependency index from original revision to reviewed facts, corrections and SHADOW results. Missing or corrupt objects invalidate dependent conclusions and create review holds. Unknown verification state must not appear current. Bound the number of references inspected in one request and expose incomplete coverage when the limit is reached.

Requested-page ingestion, source-reported completeness and actual historical coverage remain separate. Background deep verification, if later authorized, must be bounded and cannot manufacture completeness. No scheduler is added now.

Historical suppression observations retain exact immutable support and cannot disappear because a visible window excludes STOP. Existing authoritative provider STOP/DNC is queried through existing semantics and remains separate. An unavailable dependency or uncertain ownership remains held; no index rebuild can infer consent or clear a hold.

## Migration unit and reference continuity

Use one customer's complete evidence dependency closure as a proposed migration unit: all linked opportunities, their customer-level and opportunity-scoped external resources, retained revisions/manifests, review/correction history, reconciliation receipts, historical suppression evidence and canonical/context dependency descriptors. Customer-level resources remain customer-scoped; an anchor is not semantic assignment to every opportunity.

Legacy references stay resolvable as the tuple of original provider identity, thread/message or policy identity, revision, digest and applicable opportunity. A resolver maps that tuple to the same immutable object; it does not reassign established external identity. Keep an explicit legacy-reference alias map when physical storage keys change. Alias conflicts fail closed.

The current package v1 is a bounded whole-workspace snapshot. It must not be silently reinterpreted as a partial incremental migration protocol. A future package version needs explicit shard manifests, dependency roots, coverage limits and reference-closure validation. Its checksum still would not prove provider authenticity.

## Future cutover and rollback acceptance

1. Obtain separate authorization for the chosen isolated storage experiment and any later hosted resources. Pin source schema, scope, canonical versions, checkpoints and reference inventory.
2. Copy immutable objects into a staged namespace without modifying the active archive. Account for staged bytes, including abandoned or incomplete copies. No deletion or automatic cleanup policy is authorized by this design.
3. Verify every migrated object and dependency; resolve every legacy approval, correction and reconciliation reference through both readers. Compare semantic Work/Prospect 360 and SHADOW results. Projection hashes may differ for legitimate metadata, but facts, conflicts, holds and ownership must agree.
4. For a future controlled cutover, quiesce ingestion/review writers under separately authorized maintenance, verify the source fence, copy any final delta and switch one versioned read selector atomically. If source/canonical versions changed, reject or repeat the bounded delta verification.
5. Retain the complete old archive and compatible resolver. Do not allow new post-cutover writes until rollback/reference parity is established. Rollback after new writes requires an explicitly tested compatibility journal or dual-reader/write strategy; it is not solved by pointing at an old snapshot.

Required future failure tests include object unavailable/corrupt, partial manifests, interrupted copy, stale fences, alias conflict, incomplete review closure, STOP outside the visible window, changed ownership, cross-tenant object keys, duplicate/replayed package shards and failure during selector switch. Every failure must retain originals and avoid current conclusions against unavailable evidence.

This phase performs none of those storage mutations. It recommends an experiment contract grounded in observed limits, while the existing offline archive continues to fail safely at its accepted bounds.
